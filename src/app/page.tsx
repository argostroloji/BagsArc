'use client';

import dynamic from 'next/dynamic';
import { motion } from 'framer-motion';
import { useTokenStore } from '@/store/useTokenStore';
import { useState, useEffect } from 'react';

const OceanMap = dynamic(() => import('@/components/Map/OceanMap'), { ssr: false });
const OraclePanel = dynamic(() => import('@/components/Oracle/OraclePanel'), { ssr: false });
const HypeRankings = dynamic(() => import('@/components/Rankings/HypeRankings'), { ssr: false });

// 30 gün sonrası: 23 Mart 2026 + 30 gün = 22 Nisan 2026
const COUNTDOWN_TARGET = new Date('2026-04-22T20:11:37+03:00').getTime();

function useCountdown(targetTime: number) {
  const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const update = () => {
      const now = Date.now();
      const diff = Math.max(0, targetTime - now);
      setTimeLeft({
        days: Math.floor(diff / (1000 * 60 * 60 * 24)),
        hours: Math.floor((diff / (1000 * 60 * 60)) % 24),
        minutes: Math.floor((diff / (1000 * 60)) % 60),
        seconds: Math.floor((diff / 1000) % 60),
      });
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [targetTime]);

  return timeLeft;
}

export default function Home() {
  const { islands, lastUpdated } = useTokenStore();
  const king = islands.find((i) => i.isKing);
  const countdown = useCountdown(COUNTDOWN_TARGET);

  return (
    <div className="app-container">
      {/* Header */}
      <motion.header
        className="app-header"
        initial={{ y: -60, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Left: Logo + Title */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <img
            src="/logo.png"
            alt="Bags Archipelago"
            style={{
              width: '48px',
              height: '48px',
              borderRadius: '50%',
              border: '2px solid rgba(0, 240, 255, 0.3)',
              boxShadow: '0 0 16px rgba(0, 255, 136, 0.4)',
              objectFit: 'cover',
            }}
          />
          <div>
            <h1 className="header-title">Bags Archipelago</h1>
            <p className="header-subtitle">King of the Hill</p>
          </div>
        </div>

        {/* Center: Countdown Timer */}
        <motion.div
          className="countdown-container"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.6, delay: 0.5 }}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            background: 'linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(0, 240, 255, 0.1))',
            border: '1px solid rgba(139, 92, 246, 0.3)',
            borderRadius: '14px',
            padding: '8px 20px',
            backdropFilter: 'blur(12px)',
            position: 'absolute',
            left: '50%',
            transform: 'translateX(-50%)',
          }}
        >
          <span style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', marginRight: '8px', fontFamily: 'Rajdhani, sans-serif', letterSpacing: '1px' }}>
            🎁 Reward
          </span>
          {[
            { val: countdown.days, label: 'D' },
            { val: countdown.hours, label: 'H' },
            { val: countdown.minutes, label: 'M' },
            { val: countdown.seconds, label: 'S' },
          ].map((unit, i) => (
            <div key={unit.label} style={{ display: 'flex', alignItems: 'center', gap: '2px' }}>
              {i > 0 && <span style={{ color: 'rgba(0,240,255,0.5)', fontSize: '18px', fontWeight: 700, marginRight: '2px' }}>:</span>}
              <div style={{
                background: 'rgba(0, 0, 0, 0.5)',
                borderRadius: '8px',
                padding: '4px 8px',
                minWidth: '40px',
                textAlign: 'center',
                border: '1px solid rgba(0, 240, 255, 0.15)',
              }}>
                <span style={{
                  fontFamily: 'Orbitron, monospace',
                  fontSize: '18px',
                  fontWeight: 700,
                  color: '#00f0ff',
                  textShadow: '0 0 10px rgba(0, 240, 255, 0.5)',
                }}>
                  {String(unit.val).padStart(2, '0')}
                </span>
                <span style={{
                  fontSize: '9px',
                  color: 'rgba(255,255,255,0.4)',
                  display: 'block',
                  fontFamily: 'Rajdhani, sans-serif',
                  letterSpacing: '1px',
                }}>
                  {unit.label}
                </span>
              </div>
            </div>
          ))}
        </motion.div>

        {/* Right: Badges */}
        <div className="header-right">
          {king && (
            <div className="header-badge header-badge-king">
              👑 {king.symbol}
            </div>
          )}
          <div className="header-badge">
            <span className="dot" />
            {islands.length} Islands
          </div>
          {lastUpdated && (
            <div className="header-badge">
              🔄 {new Date(lastUpdated).toLocaleTimeString()}
            </div>
          )}
        </div>
      </motion.header>

      {/* Hype Rankings Panel (left) */}
      <HypeRankings />

      {/* Ocean Map (main area) */}
      <OceanMap />

      {/* AI Oracle (right) */}
      <OraclePanel />
    </div>
  );
}
