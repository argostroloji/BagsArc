'use client';

import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from '@/store/useTokenStore';

interface OracleMessage {
  id: string;
  text: string;
  timestamp: number;
  isFallback?: boolean;
}

function TypewriterText({ text, speed = 30 }: { text: string; speed?: number }) {
  const [displayed, setDisplayed] = useState('');
  const [done, setDone] = useState(false);

  useEffect(() => {
    setDisplayed('');
    setDone(false);
    let i = 0;
    const interval = setInterval(() => {
      i++;
      setDisplayed(text.slice(0, i));
      if (i >= text.length) {
        clearInterval(interval);
        setDone(true);
      }
    }, speed);
    return () => clearInterval(interval);
  }, [text, speed]);

  return (
    <span>
      {displayed}
      {!done && <span className="oracle-cursor">|</span>}
    </span>
  );
}

export default function OraclePanel() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<OracleMessage[]>([
    {
      id: 'oracle-init',
      text: '🔮 The Oracle awakens... Scanning island movements across the Archipelago...',
      timestamp: Date.now(),
    },
  ]);
  const [isLoading, setIsLoading] = useState(false);
  const [pulse, setPulse] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const { islands } = useTokenStore();

  const scrollToBottom = useCallback(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, []);

  useEffect(() => {
    scrollToBottom();
  }, [messages, scrollToBottom]);

  // Build token summary for Gemini
  const buildTokenSummary = useCallback(() => {
    if (islands.length === 0) return '';

    return islands
      .slice(0, 25)
      .map((island, i) => {
        const changeDir = island.priceChange24h >= 0 ? '📈' : '📉';
        return `#${i + 1} $${island.symbol} (${island.name}) — MC: $${(island.marketCap / 1000).toFixed(1)}K, 24h: ${changeDir} ${island.priceChange24h.toFixed(1)}%, Vol: $${(island.volume24h / 1000).toFixed(1)}K`;
      })
      .join('\n');
  }, [islands]);

  // Fetch oracle message
  const fetchOracleMessage = useCallback(async () => {
    if (isLoading || islands.length === 0) return;

    const summary = buildTokenSummary();
    if (!summary) return;

    setIsLoading(true);

    try {
      const res = await fetch('/api/oracle', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tokenSummary: summary }),
      });

      if (res.ok) {
        const data = await res.json();
        const newMsg: OracleMessage = {
          id: `oracle-${Date.now()}`,
          text: data.message,
          timestamp: data.timestamp,
          isFallback: data.isFallback,
        };
        setMessages((prev) => [...prev.slice(-19), newMsg]); // Keep last 20
        setPulse(true);
        setTimeout(() => setPulse(false), 1500);
      }
    } catch (err) {
      console.warn('[Oracle] Fetch error:', err);
    } finally {
      setIsLoading(false);
    }
  }, [isLoading, islands, buildTokenSummary]);

  // Auto-fetch every 45 seconds
  useEffect(() => {
    if (!isOpen) return;

    // Fetch immediately on open if only initial message
    if (messages.length <= 1 && islands.length > 0) {
      fetchOracleMessage();
    }

    const interval = setInterval(fetchOracleMessage, 120_000); // 2 minutes
    return () => clearInterval(interval);
  }, [isOpen, fetchOracleMessage, messages.length, islands.length]);

  const formatTime = (ts: number) => {
    const d = new Date(ts);
    return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  };

  return (
    <>
      {/* Toggle Button */}
      <motion.button
        className="oracle-toggle-btn"
        onClick={() => setIsOpen(!isOpen)}
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
      >
        <span className="oracle-toggle-icon">{isOpen ? '✕' : '🔮'}</span>
        {!isOpen && messages.length > 1 && (
          <span className="oracle-badge">{messages.length - 1}</span>
        )}
      </motion.button>

      {/* Oracle Panel */}
      <AnimatePresence>
        {isOpen && (
          <motion.div
            className={`oracle-panel ${pulse ? 'oracle-pulse' : ''}`}
            initial={{ x: 400, opacity: 0 }}
            animate={{ x: 0, opacity: 1 }}
            exit={{ x: 400, opacity: 0 }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
          >
            {/* Header */}
            <div className="oracle-header">
              <div className="oracle-header-info">
                <span className="oracle-header-eye">🔮</span>
                <h3>LIVE ORACLE FEED</h3>
              </div>
              <div className="oracle-status">
                {isLoading ? (
                  <span className="oracle-loading">⟳ channeling...</span>
                ) : (
                  <span className="oracle-live">
                    <span className="oracle-live-dot" />
                    LIVE
                  </span>
                )}
              </div>
            </div>

            {/* Messages */}
            <div className="oracle-messages">
              {messages.map((msg, i) => (
                <motion.div
                  key={msg.id}
                  className={`oracle-message ${msg.isFallback ? 'oracle-message-fallback' : ''}`}
                  initial={{ opacity: 0, y: 15 }}
                  animate={{ opacity: 1, y: 0 }}
                  transition={{ duration: 0.3 }}
                >
                  <div className="oracle-msg-header">
                    <span className="oracle-msg-sender">
                      {msg.isFallback ? '⚡ System' : '🔮 The Oracle'}
                    </span>
                    <span className="oracle-msg-time">{formatTime(msg.timestamp)}</span>
                  </div>
                  <p className="oracle-msg-text">
                    {i === messages.length - 1 ? (
                      <TypewriterText text={msg.text} speed={25} />
                    ) : (
                      msg.text
                    )}
                  </p>
                </motion.div>
              ))}
              <div ref={messagesEndRef} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
