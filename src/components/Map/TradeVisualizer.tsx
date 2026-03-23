'use client';

import { motion, AnimatePresence } from 'framer-motion';
import { TradeEffect } from '@/types/token';
import { getTokenColor } from '@/services/BagsApiService';

interface TradeVisualizerProps {
  effects: TradeEffect[];
  spreadFactor: number;
}

export default function TradeVisualizer({ effects, spreadFactor }: TradeVisualizerProps) {
  return (
    <>
      <AnimatePresence>
        {effects.map((effect) => {
          const isBuy = effect.type === 'buy';
          
          // Patlama büyüklüğü: trade miktarına göre
          const isWhale = effect.amountUsd > 20000;
          const isMega = effect.amountUsd > 50000;
          const baseSize = isMega ? 300 : isWhale ? 180 : 60 + (effect.amountUsd / 5000) * 80;
          
          const color = isBuy ? '#00ff88' : '#ff4466';
          const secondaryColor = isBuy ? '#00f0ff' : '#ff6600';

          return (
            <motion.div
              key={effect.id}
              className={`trade-shockwave ${isBuy ? 'shockwave-buy' : 'shockwave-sell'} ${isWhale ? 'shockwave-whale' : ''}`}
              initial={{
                scale: 0.2,
                opacity: 0.9,
                x: effect.y * spreadFactor - baseSize / 2,
                y: effect.x * spreadFactor - baseSize / 2,
              }}
              animate={{
                scale: [0.2, 1, 1.5],
                opacity: [0.9, 0.4, 0],
              }}
              exit={{ opacity: 0 }}
              transition={{
                duration: isMega ? 2.5 : isWhale ? 2 : 1.5,
                ease: 'easeOut',
              }}
              style={{
                width: baseSize,
                height: baseSize,
                position: 'absolute',
                borderRadius: '50%',
                border: `2px solid ${color}88`,
                boxShadow: `
                  0 0 ${isWhale ? 40 : 15}px ${color}44,
                  0 0 ${isWhale ? 80 : 30}px ${color}22,
                  inset 0 0 ${isWhale ? 30 : 10}px ${secondaryColor}22
                `,
                background: `radial-gradient(circle, ${color}15 0%, ${color}08 40%, transparent 70%)`,
                pointerEvents: 'none' as const,
                zIndex: isWhale ? 45 : 15,
              }}
            />
          );
        })}
      </AnimatePresence>

      {/* Trade amount labels for big trades */}
      <AnimatePresence>
        {effects
          .filter((e) => e.amountUsd > 5000)
          .map((effect) => {
            const isBuy = effect.type === 'buy';
            const color = isBuy ? '#00ff88' : '#ff4466';
            const label = isBuy ? '+' : '-';
            const formatted = effect.amountUsd >= 1000
              ? `${label}$${(effect.amountUsd / 1000).toFixed(1)}K`
              : `${label}$${effect.amountUsd}`;

            return (
              <motion.div
                key={`label-${effect.id}`}
                className="trade-amount-label"
                initial={{
                  opacity: 1,
                  y: effect.x * spreadFactor - 30,
                  x: effect.y * spreadFactor - 25,
                  scale: 0.5,
                }}
                animate={{
                  opacity: 0,
                  y: effect.x * spreadFactor - 60,
                  scale: 1,
                }}
                exit={{ opacity: 0 }}
                transition={{ duration: 2, ease: 'easeOut' }}
                style={{
                  position: 'absolute',
                  color,
                  fontFamily: "'Orbitron', monospace",
                  fontSize: effect.amountUsd > 20000 ? '0.85rem' : '0.65rem',
                  fontWeight: 700,
                  letterSpacing: '1px',
                  textShadow: `0 0 10px ${color}88`,
                  pointerEvents: 'none' as const,
                  zIndex: 50,
                  whiteSpace: 'nowrap' as const,
                }}
              >
                {formatted}
              </motion.div>
            );
          })}
      </AnimatePresence>
    </>
  );
}
