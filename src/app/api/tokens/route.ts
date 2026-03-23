import { NextResponse } from 'next/server';

/**
 * Server-side API proxy
 * 1. Bags.fm → gerçek token isimleri, logolar, mint adresleri
 * 2. DexScreener → gerçek market cap, price, volume, 24h change
 */

const BAGS_API_BASE = 'https://public-api-v2.bags.fm/api/v1';
const DEXSCREENER_API = 'https://api.dexscreener.com/tokens/v1/solana';

export const dynamic = 'force-dynamic';

interface BagsRawToken {
  name?: string;
  symbol?: string;
  image?: string;
  tokenMint?: string;
  status?: string;
}

interface DexScreenerPair {
  baseToken?: { address?: string; name?: string; symbol?: string };
  priceUsd?: string;
  fdv?: number;
  marketCap?: number;
  volume?: { h24?: number };
  priceChange?: { h24?: number };
  liquidity?: { usd?: number };
  url?: string;
  info?: { imageUrl?: string };
}

// Bags.fm Resmi Uygulamaları (Yüksek Market Cap'li popüler tokenlar)
const TOP_APP_MINTS = [
  'CMx7yon2cLzHcXqgHsKJhuU3MmME6noWLQk2rAycBAGS', // $NYAN
  'ESBCnCXtEZDmX8QnHU6qMZXd9mvjSAZVoYaLKKADBAGS', // $BTH
  '7pskt3A1Zsjhngazam7vHWjWHnfgiRump916Xj7ABAGS', // $GAS
  'CxWPdDBqxVo3fnTMRTvNuSrd4gkp78udSrFvkVDBAGS', // $RALPH
  'EkJuyYyD3to61CHVPJn6wHb7xANxvqApnVJ4o2SdBAGS', // $PEPE
  'G1DXVVmqJs8Ei79QbK41dpgk2WtXSGqLtx9of7o8BAGS', // $MRBEAST
  '9mAnyxAq8JQieHT7Lc47PVQbTK7ZVaaog8LwAbFzBAGS', // $WATER
  'Gj4TowizfdkRJNsTgBEkj2WpBZZmGE7o9nN8q6RhBAGS', // $LORIA
  '8116V1BW9zaXUM6pVhWVaAduKrLcEBi3RGXedKTrBAGS', // $GSD
  'AWc8uws9nh7pYjFQ8FzxavmP8WTUPwmQZAvK2yAPBAGS', // $ZHC
  'DEffWzJyaFRNyA4ogUox631hfHuv3KLeCcpBh2ipBAGS', // $X1XHLOL
  'J948jWGHJsf13FWuZxWdajRuBXxPpgLy1hMCzisvBAGS', // $NPM
  '4gfNpwo8LQtcgGrNmgWhuwfFhttgZ8Qb6QXN4Yz8BAGS', // $EVA
];

export async function GET() {
  const apiKey = process.env.BAGS_API_KEY || process.env.NEXT_PUBLIC_BAGS_API_KEY;

  if (!apiKey) {
    return NextResponse.json({ error: 'API key not configured', fallback: true });
  }

  try {
    // ──────────────────────────────────
    // 1) Bags.fm'den token listesini çek
    // ──────────────────────────────────
    const bagsRes = await fetch(`${BAGS_API_BASE}/token-launch/feed`, {
      headers: { 'Content-Type': 'application/json', 'x-api-key': apiKey },
    });

    if (!bagsRes.ok) {
      console.warn(`[BagsAPI] Feed returned ${bagsRes.status}`);
      return NextResponse.json({ error: `API returned ${bagsRes.status}`, fallback: true });
    }

    const bagsData = await bagsRes.json();
    let rawTokens: BagsRawToken[] = [];

    if (bagsData.success && Array.isArray(bagsData.response)) {
      rawTokens = bagsData.response;
    } else if (Array.isArray(bagsData)) {
      rawTokens = bagsData;
    }

    if (rawTokens.length === 0) {
      return NextResponse.json({ error: 'No tokens from Bags', fallback: true });
    }

    // Duplicate kaldır
    const seenMints = new Set<string>();
    const seenNames = new Set<string>();
    const uniqueTokens = rawTokens.filter((t) => {
      const mint = t.tokenMint || '';
      const nameKey = `${(t.name || '').toLowerCase()}::${(t.symbol || '').toLowerCase()}`;
      if (!mint || seenMints.has(mint) || seenNames.has(nameKey)) return false;
      seenMints.add(mint);
      seenNames.add(nameKey);
      return true;
    });

    // Resmi Top App'leri zorunlu olarak listeye ekle (isimleri DexScreener'dan veya mock olarak eklenecek)
    // DexScreener isim/symbol sağlayacaktır, biz metadata olarak basit bir yapı oluşturabiliriz.
    const topAppsTokens = TOP_APP_MINTS.map(mint => ({
      tokenMint: mint,
      name: 'Bags App', 
      symbol: 'APP',
      hasMarketData: false // Dex'ten dolacak
    }) as BagsRawToken);

    // Birleştir ve top 100-150 tanesini al
    const mergedTokens = [...topAppsTokens, ...uniqueTokens];
    const topTokens = mergedTokens.slice(0, 150);
    const mintAddresses = topTokens.map((t) => t.tokenMint!);

    // ──────────────────────────────────
    // 2) DexScreener'dan market verileri
    // ──────────────────────────────────
    let dexData: Record<string, DexScreenerPair> = {};

    try {
      // DexScreener max 30 address per request, split into batches
      const batches: string[][] = [];
      for (let i = 0; i < mintAddresses.length; i += 30) {
        batches.push(mintAddresses.slice(i, i + 30));
      }

      for (const batch of batches) {
        const dexRes = await fetch(`${DEXSCREENER_API}/${batch.join(',')}`, {
          headers: { 'Accept': 'application/json' },
        });

        if (dexRes.ok) {
          const pairs: DexScreenerPair[] = await dexRes.json();
          if (Array.isArray(pairs)) {
            for (const pair of pairs) {
              const addr = pair.baseToken?.address;
              if (addr && !dexData[addr]) {
                dexData[addr] = pair; // İlk pair'i kullan (en yüksek likidite)
              }
            }
          }
        }
      }

      console.log(`[DexScreener] ${Object.keys(dexData).length}/${mintAddresses.length} token market verisi bulundu`);
    } catch (dexErr) {
      console.warn('[DexScreener] Market verileri alınamadı:', dexErr);
    }

    // ──────────────────────────────────
    // 3) Birleştir: Bags metadata + DexScreener market
    // ──────────────────────────────────
    const enrichedTokens = topTokens.map((token) => {
      const mint = token.tokenMint!;
      const dex = dexData[mint];

      return {
        tokenMint: mint,
        name: dex?.baseToken?.name || token.name || 'Unknown',
        symbol: dex?.baseToken?.symbol || token.symbol || '???',
        image: dex?.info?.imageUrl || token.image || '',
        status: token.status || '',
        // DexScreener market verileri
        price: dex ? parseFloat(dex.priceUsd || '0') : 0,
        marketCap: dex ? (dex.marketCap || dex.fdv || 0) : 0,
        volume24h: dex?.volume?.h24 || 0,
        priceChange24h: dex?.priceChange?.h24 || 0,
        liquidity: dex?.liquidity?.usd || 0,
        hasMarketData: !!dex,
      };
    });

    // Market verisi olanları öne al, MC'ye göre sırala
    const sorted = enrichedTokens.sort((a, b) => {
      // Market verisi olmayanları sona at
      if (a.hasMarketData && !b.hasMarketData) return -1;
      if (!a.hasMarketData && b.hasMarketData) return 1;
      return b.marketCap - a.marketCap;
    });

    return NextResponse.json({ tokens: sorted.slice(0, 25), source: 'bags+dexscreener' });
  } catch (err) {
    console.error('[API] Proxy error:', err);
    return NextResponse.json({
      error: err instanceof Error ? err.message : 'Proxy error',
      fallback: true,
    });
  }
}
