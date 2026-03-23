export interface BagsToken {
  id: string;
  name: string;
  symbol: string;
  price: number;
  marketCap: number;
  volume24h: number;
  logoUrl: string;
  contractAddress: string;
  priceChange24h: number;
}

export interface IslandData extends BagsToken {
  x: number;
  y: number;
  scale: number;
  glowIntensity: number;
  rank: number;
  isKing: boolean;
  hypeScore: number;
}

export interface TradeEvent {
  id: string;
  tokenId: string;
  tokenSymbol: string;
  type: 'buy' | 'sell';
  amountUsd: number;
  timestamp: number;
}

export interface TradeEffect {
  id: string;
  tokenId: string;
  type: 'buy' | 'sell';
  amountUsd: number;
  x: number;
  y: number;
  timestamp: number;
}

export interface ChatMessage {
  id: string;
  nickname: string;
  text: string;
  timestamp: number;
  color: string;
}
