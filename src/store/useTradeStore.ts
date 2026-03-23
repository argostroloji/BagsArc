import { create } from 'zustand';
import { TradeEvent, TradeEffect } from '@/types/token';

/**
 * Trade Store — Trade olayı simülasyonu ve efekt yönetimi
 * 
 * Gerçek Bags API bağlandığında, simülatör yerine gerçek WebSocket/polling
 * kullanılabilir. Store yapısı aynı kalır.
 */

interface PositionOffset {
  dx: number;
  dy: number;
}

interface TradeStore {
  // Son 60 saniyedeki trade'ler
  recentTrades: TradeEvent[];
  // Ekranda gösterilecek aktif efektler
  activeEffects: TradeEffect[];
  // Trade nedeniyle oluşan konum kaydırmaları
  positionOffsets: Record<string, PositionOffset>;
  // Son 60s'de trade olan token ID'leri
  battleTokenIds: Set<string>;
  // Actions
  addTrade: (trade: TradeEvent, islandX: number, islandY: number) => void;
  removeEffect: (id: string) => void;
  cleanOldTrades: () => void;
  startSimulation: (getIslands: () => { id: string; symbol: string; x: number; y: number }[]) => () => void;
}

export const useTradeStore = create<TradeStore>((set, get) => ({
  recentTrades: [],
  activeEffects: [],
  positionOffsets: {},
  battleTokenIds: new Set(),

  addTrade: (trade: TradeEvent, islandX: number, islandY: number) => {
    const state = get();

    // Konum ofseti hesapla: Buy → merkeze doğru, Sell → dışarı
    const currentOffset = state.positionOffsets[trade.tokenId] || { dx: 0, dy: 0 };
    const dist = Math.sqrt(islandX * islandX + islandY * islandY) || 1;
    
    // Hareket miktarı: trade büyüklüğüne göre 0.3-2.0 birim
    const moveAmount = Math.min(2.0, 0.3 + (trade.amountUsd / 50000) * 1.5);
    
    // Merkeze doğru birim vektör
    const ux = -islandX / dist;
    const uy = -islandY / dist;

    const direction = trade.type === 'buy' ? 1 : -1;
    
    const newOffset: PositionOffset = {
      dx: currentOffset.dx + ux * moveAmount * direction,
      dy: currentOffset.dy + uy * moveAmount * direction,
    };

    // Efekt oluştur
    const effect: TradeEffect = {
      id: trade.id,
      tokenId: trade.tokenId,
      type: trade.type,
      amountUsd: trade.amountUsd,
      x: islandX,
      y: islandY,
      timestamp: trade.timestamp,
    };

    // battleTokenIds güncelle
    const newBattle = new Set(state.battleTokenIds);
    newBattle.add(trade.tokenId);

    set({
      recentTrades: [...state.recentTrades, trade],
      activeEffects: [...state.activeEffects, effect],
      positionOffsets: { ...state.positionOffsets, [trade.tokenId]: newOffset },
      battleTokenIds: newBattle,
    });

    // Efekti 2 saniye sonra kaldır
    setTimeout(() => {
      get().removeEffect(trade.id);
    }, 2000);
  },

  removeEffect: (id: string) => {
    set((state) => ({
      activeEffects: state.activeEffects.filter((e) => e.id !== id),
    }));
  },

  cleanOldTrades: () => {
    const now = Date.now();
    const cutoff = now - 60_000; // 60 saniye

    set((state) => {
      const recentTrades = state.recentTrades.filter((t) => t.timestamp > cutoff);
      const activeTokenIds = new Set(recentTrades.map((t) => t.tokenId));

      // Artık savaşmayanların offsetlerini yavaşça sıfırla (damping)
      const newOffsets = { ...state.positionOffsets };
      for (const tokenId of Object.keys(newOffsets)) {
        if (!activeTokenIds.has(tokenId)) {
          newOffsets[tokenId] = {
            dx: newOffsets[tokenId].dx * 0.92,
            dy: newOffsets[tokenId].dy * 0.92,
          };
          // Çok küçükse sil
          if (Math.abs(newOffsets[tokenId].dx) < 0.05 && Math.abs(newOffsets[tokenId].dy) < 0.05) {
            delete newOffsets[tokenId];
          }
        }
      }

      return {
        recentTrades,
        battleTokenIds: activeTokenIds,
        positionOffsets: newOffsets,
      };
    });
  },

  startSimulation: (getIslands) => {
    // Trade simülatörü: 2-5 saniyede bir rastgele trade üret
    const generateTrade = () => {
      const islands = getIslands();
      if (islands.length === 0) return;

      const idx = Math.floor(Math.random() * islands.length);
      const island = islands[idx];
      
      const isBuy = Math.random() > 0.4; // %60 buy, %40 sell
      // Büyük balina alımları nadir ama muhteşem
      const isWhale = Math.random() < 0.08;
      const baseAmount = isWhale
        ? 10000 + Math.random() * 90000  // $10K-$100K balina
        : 100 + Math.random() * 5000;     // $100-$5K normal

      const trade: TradeEvent = {
        id: `trade-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
        tokenId: island.id,
        tokenSymbol: island.symbol,
        type: isBuy ? 'buy' : 'sell',
        amountUsd: Math.round(baseAmount),
        timestamp: Date.now(),
      };

      get().addTrade(trade, island.x, island.y);
    };

    // Ana simülasyon döngüsü
    const scheduleNext = () => {
      const delay = 1500 + Math.random() * 3500; // 1.5-5 saniye
      return setTimeout(() => {
        generateTrade();
        timerId = scheduleNext();
      }, delay);
    };

    let timerId = scheduleNext();

    // Eski trade'leri temizle (her 5 saniye)
    const cleanupInterval = setInterval(() => {
      get().cleanOldTrades();
    }, 5000);

    // Temizleme fonksiyonu döndür
    return () => {
      clearTimeout(timerId);
      clearInterval(cleanupInterval);
    };
  },
}));
