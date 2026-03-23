import { BagsToken } from '@/types/token';

/**
 * Bags.fm API Service
 * Server-side proxy'den (/api/tokens) gerçek token isimlerini ve logolarını çeker.
 * Market verileri: API'de marketCap/price yoksa simüle eder.
 * Fallback: mock data.
 */

// ────────────────────────────────────────────────
// Ana fetch fonksiyonu
// ────────────────────────────────────────────────

export async function fetchTopTokens(): Promise<BagsToken[]> {
  // Server-side proxy: Bags.fm isimleri + DexScreener market verileri
  try {
    const res = await fetch('/api/tokens', { cache: 'no-store' });
    if (res.ok) {
      const data = await res.json();

      if (data.tokens && Array.isArray(data.tokens) && data.tokens.length > 0) {
        console.log(`[BagsAPI] ${data.tokens.length} token yüklendi (${data.source})`);

        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const tokens: BagsToken[] = data.tokens.map((raw: any) => ({
          id: raw.tokenMint || raw.mint || raw.address || `t-${Math.random()}`,
          name: raw.name || 'Unknown',
          symbol: raw.symbol || '???',
          price: Number(raw.price || 0),
          marketCap: Number(raw.marketCap || 0),
          volume24h: Number(raw.volume24h || 0),
          logoUrl: raw.image || raw.logo || '',
          contractAddress: raw.tokenMint || raw.mint || '',
          priceChange24h: Number(raw.priceChange24h || 0),
        }));

        // Market verisi olmayanları da dahil et (sıralama server'da yapıldı)
        return tokens;
      }
    }
  } catch (err) {
    console.warn('[BagsAPI] Proxy hatası:', err);
  }

  // Fallback: Mock tokens
  console.log('[BagsAPI] Mock data kullanılıyor');
  return generateMockTokens();
}


// ────────────────────────────────────────────────
// Mock Data (Fallback)
// ────────────────────────────────────────────────

const MOCK_NAMES = [
  ['Solaris', 'SOL'], ['Nebula Token', 'NBLA'], ['Quantum Flux', 'QFLX'],
  ['Dark Matter', 'DRKM'], ['Nova Chain', 'NOVA'], ['Photon Coin', 'PHTN'],
  ['Eclipse Fund', 'ECLP'], ['Stellar Drift', 'STLD'], ['Void Protocol', 'VOID'],
  ['Plasma Net', 'PLSM'], ['Cosmic Yield', 'CSMC'], ['Warp Finance', 'WARP'],
  ['Orbit X', 'ORBT'], ['Quasar Swap', 'QSAR'], ['Meteor Vault', 'MTVL'],
  ['Pulsar Token', 'PLSR'], ['Astro Dex', 'ASTX'], ['Zenith Pay', 'ZNTH'],
  ['Horizon Beta', 'HRZN'], ['Infinity Loop', 'INFL'], ['Radiant Core', 'RDNT'],
  ['Nexus Prime', 'NXSP'], ['Vertex Labs', 'VTXL'], ['Prism Finance', 'PRSM'],
  ['Cypher Net', 'CYPH'], ['Ion Protocol', 'ION'], ['Flux Dynamics', 'FLXD'],
  ['Aether Chain', 'AETH'], ['Vector DAO', 'VCTR'], ['Synth Swap', 'SNTH'],
  ['Chrono Token', 'CHRN'], ['Binary Star', 'BNRY'], ['Helix Protocol', 'HELX'],
  ['Omega Labs', 'OMGL'], ['Delta Wave', 'DLTW'], ['Sigma Vault', 'SGMV'],
  ['Axiom Core', 'AXMC'], ['Tidal Finance', 'TDLF'], ['Spark Network', 'SPRK'],
  ['Lunar Bridge', 'LNRB'], ['Cobalt Chain', 'CBLT'], ['Neon Drift', 'NEON'],
  ['Arcane Token', 'ARCN'], ['Echo Protocol', 'ECHO'], ['Shard Finance', 'SHRD'],
  ['Drift Protocol', 'DRFT'], ['Phantom Yield', 'PHTM'], ['Storm Chain', 'STRM'],
  ['Cipher Labs', 'CPHR'], ['Genesis Block', 'GBLK'],
];

const NEON_COLORS = [
  '#00f0ff', '#ff00ff', '#00ff88', '#ff6600', '#8b5cf6',
  '#f43f5e', '#10b981', '#f59e0b', '#3b82f6', '#ec4899',
];

function generateMockTokens(): BagsToken[] {
  return MOCK_NAMES.map(([name, symbol], i) => {
    const marketCap = Math.round(50_000_000 * Math.pow(0.88, i) + Math.random() * 1_000_000);
    const price = +(Math.random() * 10).toFixed(6);
    const volume24h = Math.round(marketCap * (0.02 + Math.random() * 0.15));
    const priceChange = +(Math.random() * 40 - 20).toFixed(2);

    return {
      id: `mock-${i}-${symbol.toLowerCase()}`,
      name,
      symbol,
      price,
      marketCap,
      volume24h,
      logoUrl: '',
      contractAddress: `mock${symbol}${i}xxxxxxxxxxxxxxxxxxxxxxxxxxxx`.slice(0, 44),
      priceChange24h: priceChange,
    };
  });
}

/**
 * Generate a deterministic neon color from a string
 */
export function getTokenColor(symbol: string): string {
  let hash = 0;
  for (let i = 0; i < symbol.length; i++) {
    hash = symbol.charCodeAt(i) + ((hash << 5) - hash);
  }
  return NEON_COLORS[Math.abs(hash) % NEON_COLORS.length];
}
