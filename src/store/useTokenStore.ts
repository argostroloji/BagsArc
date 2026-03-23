import { create } from 'zustand';
import { IslandData } from '@/types/token';
import { fetchTopTokens, getTokenColor } from '@/services/BagsApiService';
import { generateHypeGravityCoordinates, normalize } from '@/utils/spiralLayout';

interface TokenStore {
  islands: IslandData[];
  loading: boolean;
  error: string | null;
  lastUpdated: number | null;
  focusedIslandId: string | null;
  fetchTokens: () => Promise<void>;
  startPolling: () => () => void;
  focusIsland: (id: string) => void;
  clearFocus: () => void;
}

export const useTokenStore = create<TokenStore>((set, get) => ({
  islands: [],
  loading: false,
  error: null,
  lastUpdated: null,
  focusedIslandId: null,

  fetchTokens: async () => {
    set({ loading: get().islands.length === 0 });

    try {
      const tokens = await fetchTopTokens();

      // Sort by market cap descending
      const sorted = [...tokens].sort((a, b) => b.marketCap - a.marketCap);

      // Generate Hype Gravity coordinates (chaotic scatter, MC proximity)
      const symbols = sorted.map((t) => t.symbol);
      const coords = generateHypeGravityCoordinates(sorted.length, symbols);

      // Calculate min/max for normalization
      const marketCaps = sorted.map((t) => t.marketCap);
      const volumes = sorted.map((t) => t.volume24h);
      const minMC = Math.min(...marketCaps);
      const maxMC = Math.max(...marketCaps);
      const minVol = Math.min(...volumes);
      const maxVol = Math.max(...volumes);

      // Map tokens to islands with King of the Hill mechanics
      const islands: IslandData[] = sorted.map((token, i) => {
        const rank = i + 1;
        const isKing = rank === 1;
        const hypeScore = normalize(token.volume24h, minVol, maxVol, 0.0, 1.0);

        return {
          ...token,
          x: coords[i].x,
          y: coords[i].y,
          scale: normalize(token.marketCap, minMC, maxMC, 0.4, 1.0),
          glowIntensity: normalize(token.volume24h, minVol, maxVol, 0.2, 1.0),
          rank,
          isKing,
          hypeScore,
        };
      });

      set({
        islands,
        loading: false,
        error: null,
        lastUpdated: Date.now(),
      });
    } catch (err) {
      set({
        error: err instanceof Error ? err.message : 'Failed to fetch tokens',
        loading: false,
      });
    }
  },

  startPolling: () => {
    get().fetchTokens();
    const interval = setInterval(() => {
      get().fetchTokens();
    }, 60_000);
    return () => clearInterval(interval);
  },

  focusIsland: (id: string) => {
    set({ focusedIslandId: id });
  },

  clearFocus: () => {
    set({ focusedIslandId: null });
  },
}));
