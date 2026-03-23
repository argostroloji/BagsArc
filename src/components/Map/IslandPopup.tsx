'use client';

import { useEffect, useRef } from 'react';
import { IslandData } from '@/types/token';
import { getTokenColor } from '@/services/BagsApiService';
import { motion } from 'framer-motion';

interface IslandPopupProps {
  island: IslandData;
  onClose: () => void;
}

export default function IslandPopup({ island, onClose }: IslandPopupProps) {
  const popupRef = useRef<HTMLDivElement>(null);
  const color = getTokenColor(island.symbol);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (popupRef.current && !popupRef.current.contains(e.target as Node)) {
        onClose();
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [onClose]);

  const formatNumber = (n: number) => {
    if (n >= 1_000_000) return `$${(n / 1_000_000).toFixed(2)}M`;
    if (n >= 1_000) return `$${(n / 1_000).toFixed(2)}K`;
    return `$${n.toFixed(2)}`;
  };

  const tradeUrl = `https://bags.fm/${island.contractAddress}`;

  return (
    <motion.div
      ref={popupRef}
      initial={{ opacity: 0, scale: 0.8, y: 20 }}
      animate={{ opacity: 1, scale: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.8, y: 20 }}
      transition={{ type: 'spring', damping: 20, stiffness: 300 }}
      className="island-popup"
      style={{ '--island-color': color } as React.CSSProperties}
    >
      {/* Header */}
      <div className="popup-header">
        <div className="popup-rank">#{island.rank}</div>
        <div className="popup-token-info">
          {island.logoUrl ? (
            <img src={island.logoUrl} alt={island.name} className="popup-logo" />
          ) : (
            <div className="popup-logo-placeholder" style={{ background: color }}>
              {island.symbol.slice(0, 2)}
            </div>
          )}
          <div>
            <h3 className="popup-name">{island.name}</h3>
            <span className="popup-symbol">${island.symbol}</span>
          </div>
        </div>
        <button onClick={onClose} className="popup-close">✕</button>
      </div>

      {/* Stats Grid */}
      <div className="popup-stats">
        <div className="popup-stat">
          <span className="popup-stat-label">Price</span>
          <span className="popup-stat-value">${island.price.toFixed(6)}</span>
        </div>
        <div className="popup-stat">
          <span className="popup-stat-label">Market Cap</span>
          <span className="popup-stat-value">{formatNumber(island.marketCap)}</span>
        </div>
        <div className="popup-stat">
          <span className="popup-stat-label">24h Volume</span>
          <span className="popup-stat-value">{formatNumber(island.volume24h)}</span>
        </div>
        <div className="popup-stat">
          <span className="popup-stat-label">24h Change</span>
          <span
            className="popup-stat-value"
            style={{ color: island.priceChange24h >= 0 ? '#00ff88' : '#ff4466' }}
          >
            {island.priceChange24h >= 0 ? '+' : ''}{island.priceChange24h}%
          </span>
        </div>
      </div>

      {/* Trade Button */}
      <a
        href={tradeUrl}
        target="_blank"
        rel="noopener noreferrer"
        className="popup-trade-btn"
        style={{ background: `linear-gradient(135deg, ${color}44, ${color}88)`, borderColor: color }}
      >
        ⚡ Trade on Bags.fm
      </a>
    </motion.div>
  );
}
