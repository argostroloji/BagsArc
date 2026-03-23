'use client';

import { IslandData } from '@/types/token';
import { getTokenColor } from '@/services/BagsApiService';
import { motion } from 'framer-motion';

interface IslandMarkerProps {
  island: IslandData;
  onClick: (island: IslandData) => void;
}

export default function IslandMarker({ island, onClick }: IslandMarkerProps) {
  const color = getTokenColor(island.symbol);
  const isKing = island.isKing;

  // Size: king is bigger, others scale by market cap
  const baseSize = isKing ? 70 : 40;
  const size = baseSize + island.scale * (isKing ? 50 : 55);

  // Glow intensity — king has max glow, others based on volume
  const glowSpread = isKing ? 50 : 10 + island.glowIntensity * 30;
  const animDuration = isKing ? 2 : 4 - island.glowIntensity * 2.5;

  // Hype power-up: extra glow for high volume tokens (hypeScore > 0.6)
  const isPoweredUp = island.hypeScore > 0.6;

  // King uses gold color
  const kingColor = '#ffd700';
  const displayColor = isKing ? kingColor : color;

  return (
    <motion.div
      className={`island-marker ${isKing ? 'island-king' : ''} ${isPoweredUp ? 'island-powered-up' : ''}`}
      animate={{
        y: [0, -8, 0, 4, 0],
        rotate: [0, 1, -1, 0.5, 0],
      }}
      transition={{
        duration: animDuration,
        repeat: Infinity,
        ease: 'easeInOut',
      }}
      whileHover={{
        scale: 1.3,
        zIndex: 100,
        transition: { duration: 0.2 },
      }}
      onClick={() => onClick(island)}
      style={{
        width: size,
        height: size,
        '--island-color': displayColor,
        '--glow-spread': `${glowSpread}px`,
        left: `${island.y}px`,
        top: `${island.x}px`,
        zIndex: isKing ? 60 : 20,
      } as React.CSSProperties}
    >
      {/* King golden halo */}
      {isKing && (
        <motion.div
          className="king-halo"
          animate={{
            rotate: [0, 360],
            scale: [1, 1.1, 1],
          }}
          transition={{
            rotate: { duration: 10, repeat: Infinity, ease: 'linear' },
            scale: { duration: 2, repeat: Infinity, ease: 'easeInOut' },
          }}
        />
      )}

      {/* King crown */}
      {isKing && (
        <motion.div
          className="king-crown"
          animate={{
            y: [0, -3, 0],
            rotate: [0, 2, -2, 0],
          }}
          transition={{
            duration: 2,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
        >
          👑
        </motion.div>
      )}

      {/* Power-up glow layer */}
      {isPoweredUp && (
        <motion.div
          className="hype-power-up-ring"
          animate={{
            scale: [1, 1.4, 1],
            opacity: [0.6, 0.2, 0.6],
          }}
          transition={{
            duration: 1.5,
            repeat: Infinity,
            ease: 'easeInOut',
          }}
          style={{
            borderColor: `${color}88`,
            boxShadow: `0 0 20px ${color}44`,
          }}
        />
      )}

      {/* Outer glow ring */}
      <div
        className="island-glow-ring"
        style={{
          boxShadow: `
            0 0 ${glowSpread}px ${displayColor}88,
            0 0 ${glowSpread * 2}px ${displayColor}44,
            0 0 ${glowSpread * 3}px ${displayColor}22,
            inset 0 0 ${glowSpread}px ${displayColor}33
          `,
          borderColor: `${displayColor}88`,
        }}
      />

      {/* Inner island body */}
      <div
        className="island-body"
        style={{
          background: isKing
            ? `radial-gradient(circle at 40% 40%, ${kingColor}ee, ${kingColor}66 50%, ${color}44 80%, transparent 100%)`
            : `radial-gradient(circle at 40% 40%, ${color}cc, ${color}44 60%, transparent 80%)`,
          boxShadow: `0 0 ${glowSpread / 2}px ${displayColor}66`,
        }}
      >
        {island.logoUrl ? (
          <img src={island.logoUrl} alt={island.symbol} className="island-logo" />
        ) : (
          <span className="island-symbol" style={isKing ? { color: '#1a1a2e', fontWeight: 900 } : {}}>
            {island.symbol}
          </span>
        )}
      </div>

      {/* Label */}
      <div className="island-label" style={{ color: displayColor }}>
        <span className="island-label-name">{island.symbol}</span>
        <span className="island-label-rank">
          {isKing ? '👑 KING' : `#${island.rank}`}
        </span>
      </div>

      {/* Water ripple effect */}
      <motion.div
        className="island-ripple"
        animate={{
          scale: [1, 1.8, 2.5],
          opacity: [0.4, 0.15, 0],
        }}
        transition={{
          duration: animDuration * 1.5,
          repeat: Infinity,
          ease: 'easeOut',
        }}
        style={{
          borderColor: `${displayColor}44`,
        }}
      />
    </motion.div>
  );
}
