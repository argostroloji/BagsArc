'use client';

import { motion } from 'framer-motion';
import { IslandData } from '@/types/token';

interface GoldenNebulaProps {
  king: IslandData | null;
}

export default function GoldenNebula({ king }: GoldenNebulaProps) {
  return (
    <div className="golden-nebula-container">
      {/* Outermost ambient glow */}
      <motion.div
        className="nebula-ambient"
        animate={{
          scale: [1, 1.15, 1],
          opacity: [0.15, 0.25, 0.15],
        }}
        transition={{
          duration: 8,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Outer ring 3 */}
      <motion.div
        className="nebula-ring nebula-ring-3"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.05, 1],
        }}
        transition={{
          rotate: { duration: 40, repeat: Infinity, ease: 'linear' },
          scale: { duration: 6, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Outer ring 2 */}
      <motion.div
        className="nebula-ring nebula-ring-2"
        animate={{
          rotate: [360, 0],
          scale: [1, 1.08, 1],
        }}
        transition={{
          rotate: { duration: 30, repeat: Infinity, ease: 'linear' },
          scale: { duration: 5, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Inner ring 1 */}
      <motion.div
        className="nebula-ring nebula-ring-1"
        animate={{
          rotate: [0, 360],
          scale: [1, 1.1, 1],
        }}
        transition={{
          rotate: { duration: 20, repeat: Infinity, ease: 'linear' },
          scale: { duration: 4, repeat: Infinity, ease: 'easeInOut' },
        }}
      />

      {/* Core glow */}
      <motion.div
        className="nebula-core"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.8, 1, 0.8],
        }}
        transition={{
          duration: 3,
          repeat: Infinity,
          ease: 'easeInOut',
        }}
      />

      {/* Crown icon for the King */}
      {king && (
        <motion.div
          className="nebula-crown-label"
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <span className="crown-emoji">👑</span>
          <span className="crown-text">{king.symbol}</span>
        </motion.div>
      )}
    </div>
  );
}
