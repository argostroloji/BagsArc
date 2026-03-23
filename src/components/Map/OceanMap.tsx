'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { useTokenStore } from '@/store/useTokenStore';
import { useTradeStore } from '@/store/useTradeStore';
import { useIslandPhysics } from '@/hooks/useIslandPhysics';
import IslandMarker from './IslandMarker';
import IslandPopup from './IslandPopup';
import GoldenNebula from './GoldenNebula';
import TradeVisualizer from './TradeVisualizer';
import { IslandData } from '@/types/token';

export default function OceanMap() {
  const { islands, loading, lastUpdated, startPolling, focusedIslandId, clearFocus } = useTokenStore();
  const { activeEffects, positionOffsets, startSimulation } = useTradeStore();

  const [selectedIsland, setSelectedIsland] = useState<IslandData | null>(null);
  const [viewOffset, setViewOffset] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const containerRef = useRef<HTMLDivElement>(null);

  // Spread factor for positioning
  const spreadFactor = 7;

  useEffect(() => {
    const cleanup = startPolling();
    return cleanup;
  }, [startPolling]);

  // Trade simülasyonunu başlat
  useEffect(() => {
    if (islands.length === 0) return;

    const cleanup = startSimulation(() =>
      islands.map((i) => ({
        id: i.id,
        symbol: i.symbol,
        x: i.x * spreadFactor,
        y: i.y * spreadFactor,
      }))
    );

    return cleanup;
  }, [islands, startSimulation, spreadFactor]);

  // Collision detection
  const collisionCorrections = useIslandPhysics(islands, positionOffsets, spreadFactor);

  // Center the map
  const centerOffset = useCallback(() => {
    if (!containerRef.current) return { x: 0, y: 0 };
    const rect = containerRef.current.getBoundingClientRect();
    return {
      x: rect.width / 2,
      y: rect.height / 2,
    };
  }, []);

  useEffect(() => {
    if (islands.length > 0 && viewOffset.x === 0 && viewOffset.y === 0) {
      const c = centerOffset();
      setViewOffset(c);
    }
  }, [islands, centerOffset, viewOffset.x, viewOffset.y]);

  // Focus on island from Rankings panel
  useEffect(() => {
    if (!focusedIslandId || !containerRef.current) return;

    const target = islands.find((i) => i.id === focusedIslandId);
    if (!target) return;

    const rect = containerRef.current.getBoundingClientRect();

    setViewOffset({
      x: rect.width / 2 - target.y * spreadFactor * 1.5,
      y: rect.height / 2 - target.x * spreadFactor * 1.5,
    });
    setZoom(1.5);
    clearFocus();
    setSelectedIsland(target);
  }, [focusedIslandId, islands, clearFocus, spreadFactor]);

  // Mouse drag handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest('.island-marker') || (e.target as HTMLElement).closest('.island-popup')) return;
    setIsDragging(true);
    setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setViewOffset({
      x: e.clientX - dragStart.x,
      y: e.clientY - dragStart.y,
    });
  };

  const handleMouseUp = () => setIsDragging(false);

  // Zoom handler
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? -0.1 : 0.1;
    setZoom((prev) => Math.min(3, Math.max(0.3, prev + delta)));
  };

  const handleIslandClick = (island: IslandData) => {
    setSelectedIsland(island);
  };

  // King
  const king = islands.find((i) => i.isKing) || null;

  // Ada konumlarını trade offset + collision düzeltmesiyle hesapla
  const getIslandPosition = (island: IslandData) => {
    const tradeOffset = positionOffsets[island.id] || { dx: 0, dy: 0 };
    const collisionFix = collisionCorrections[island.id] || { dx: 0, dy: 0 };

    return {
      x: island.x * spreadFactor + (tradeOffset.dx + collisionFix.dx) * spreadFactor,
      y: island.y * spreadFactor + (tradeOffset.dy + collisionFix.dy) * spreadFactor,
    };
  };

  return (
    <div
      ref={containerRef}
      className="ocean-map-container"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={handleMouseUp}
      onWheel={handleWheel}
    >
      {/* Animated Ocean Background */}
      <div className="ocean-bg">
        <div className="ocean-gradient" />
        <div className="ocean-grid" />
        <div className="ocean-waves" />
        <div className="ocean-particles" />
      </div>

      {/* Loading State */}
      <AnimatePresence>
        {loading && (
          <motion.div
            className="map-loading"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <div className="loading-spinner" />
            <p>Discovering islands...</p>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Islands Layer */}
      <div
        className="islands-layer"
        style={{
          transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`,
          cursor: isDragging ? 'grabbing' : 'grab',
          transition: isDragging ? 'none' : 'transform 0.4s ease-out',
        }}
      >
        {/* Golden Nebula at center */}
        <GoldenNebula king={king} />

        {/* Trade Shockwave Effects */}
        <TradeVisualizer effects={activeEffects} spreadFactor={spreadFactor} />

        {/* Islands with trade-based positioning */}
        {islands.map((island) => {
          const pos = getIslandPosition(island);
          return (
            <IslandMarker
              key={island.id}
              island={{
                ...island,
                x: pos.x,
                y: pos.y,
              }}
              onClick={handleIslandClick}
            />
          );
        })}
      </div>

      {/* Popup Overlay */}
      <AnimatePresence>
        {selectedIsland && (
          <div className="popup-overlay">
            <IslandPopup
              island={selectedIsland}
              onClose={() => setSelectedIsland(null)}
            />
          </div>
        )}
      </AnimatePresence>

      {/* HUD Elements */}
      <div className="map-hud">
        <div className="hud-item">
          <span className="hud-dot" />
          <span>{islands.length} Islands</span>
        </div>
        {lastUpdated && (
          <div className="hud-item">
            🔄 {new Date(lastUpdated).toLocaleTimeString()}
          </div>
        )}
        <div className="hud-item">
          Zoom: {(zoom * 100).toFixed(0)}%
        </div>
        {king && (
          <div className="hud-item hud-king">
            👑 King: {king.symbol}
          </div>
        )}
        <div className="hud-item hud-trades">
          ⚡ {activeEffects.length} Active
        </div>
      </div>

      {/* Zoom Controls */}
      <div className="zoom-controls">
        <button onClick={() => setZoom((z) => Math.min(3, z + 0.2))}>+</button>
        <button onClick={() => setZoom((z) => Math.max(0.3, z - 0.2))}>−</button>
        <button onClick={() => { setZoom(1); setViewOffset(centerOffset()); }}>⊙</button>
      </div>
    </div>
  );
}
