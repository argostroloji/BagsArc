'use client';

import { useState } from 'react';

import { motion } from 'framer-motion';
import { useTokenStore } from '@/store/useTokenStore';
import { useTradeStore } from '@/store/useTradeStore';
import { getTokenColor } from '@/services/BagsApiService';

export default function HypeRankings() {
  const { islands, focusIsland } = useTokenStore();
  const { battleTokenIds } = useTradeStore();
  const [searchQuery, setSearchQuery] = useState('');

  const formatMC = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(1)}K`;
    return `$${n.toFixed(0)}`;
  };

  const formatVol = (n: number) => {
    if (n >= 1_000_000) return `${(n / 1_000_000).toFixed(1)}M`;
    if (n >= 1_000) return `${(n / 1_000).toFixed(1)}K`;
    return `${n.toFixed(0)}`;
  };

  return (
    <motion.div
      className="hype-rankings"
      initial={{ x: -400, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1], delay: 0.3 }}
    >
      {/* Panel Header */}
      <div className="rankings-header">
        <div className="rankings-header-left">
          <span className="rankings-icon">🏆</span>
          <h3>Hype Rankings</h3>
        </div>
        <span className="rankings-count">{islands.length} tokens</span>
      </div>

      {/* NEW SEARCH BAR */}
      <div className="rankings-search-container" style={{ padding: '0 16px 12px 16px' }}>
        <input 
          type="text" 
          placeholder="Search tokens..." 
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="search-input"
          style={{
            width: '100%',
            padding: '8px 12px',
            borderRadius: '8px',
            backgroundColor: 'rgba(0, 0, 0, 0.4)',
            border: '1px solid rgba(255, 255, 255, 0.1)',
            color: '#fff',
            outline: 'none',
            fontSize: '14px',
            transition: 'border-color 0.2s',
          }}
          onFocus={(e) => e.target.style.borderColor = 'rgba(0, 240, 255, 0.5)'}
          onBlur={(e) => e.target.style.borderColor = 'rgba(255, 255, 255, 0.1)'}
        />
      </div>

      {/* Token List */}
      <div className="rankings-list">
        {islands
          .filter(i => 
            i.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
            i.symbol.toLowerCase().includes(searchQuery.toLowerCase())
          )
          .map((island) => {
          const color = getTokenColor(island.symbol);
          const isKing = island.isKing;
          const isBattling = battleTokenIds.has(island.id);

          return (
            <motion.div
              key={island.id}
              className={`rankings-item ${isKing ? 'rankings-item-king' : ''} ${isBattling ? 'rankings-item-battle' : ''}`}
              onClick={() => focusIsland(island.id)}
              whileHover={{ x: 6, backgroundColor: 'rgba(0, 240, 255, 0.06)' }}
              whileTap={{ scale: 0.98 }}
              transition={{ duration: 0.15 }}
              layout
            >
              {/* Rank */}
              <div className={`rankings-rank ${isKing ? 'rank-king' : ''}`}>
                {isKing ? '👑' : `#${island.rank}`}
              </div>

              {/* Battle icon */}
              {isBattling && (
                <span className="battle-icon">⚔️</span>
              )}

              {/* Token Info */}
              <div className="rankings-token-info">
                {island.logoUrl ? (
                  <img src={island.logoUrl} alt={island.symbol} className="rankings-logo" />
                ) : (
                  <div
                    className="rankings-logo-placeholder"
                    style={{ background: `${color}33`, borderColor: `${color}66` }}
                  >
                    <span style={{ color }}>{island.symbol.slice(0, 2)}</span>
                  </div>
                )}
                <div className="rankings-names">
                  <span className="rankings-name">{island.name}</span>
                  <span className="rankings-symbol" style={{ color }}>
                    ${island.symbol}
                  </span>
                </div>
              </div>

              {/* Market Cap + Volume */}
              <div className="rankings-data">
                <span className="rankings-mc">{formatMC(island.marketCap)}</span>
                <span className="rankings-vol">
                  Vol: {formatVol(island.volume24h)}
                </span>
              </div>

              {/* Hype bar */}
              <div className="rankings-hype-bar-bg">
                <motion.div
                  className="rankings-hype-bar"
                  initial={{ width: 0 }}
                  animate={{ width: `${island.hypeScore * 100}%` }}
                  transition={{ duration: 0.8, delay: island.rank * 0.02 }}
                  style={{ background: `linear-gradient(90deg, ${color}88, ${color})` }}
                />
              </div>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}
