import { useEffect, useRef, useCallback } from 'react';
import { IslandData } from '@/types/token';

/**
 * useIslandPhysics — Ada Fiziği Hook'u
 * 
 * Collision Detection: Adalar birbirinin içine geçmez.
 * Position offset'leri trade store'dan alır ve çarpışma sonrası düzeltme yapar.
 */

interface PhysicsIsland {
  id: string;
  baseX: number;
  baseY: number;
  offsetDx: number;
  offsetDy: number;
  radius: number; // island scale bazlı
}

interface CollisionResult {
  [tokenId: string]: { dx: number; dy: number };
}

export function useIslandPhysics(
  islands: IslandData[],
  positionOffsets: Record<string, { dx: number; dy: number }>,
  spreadFactor: number
): CollisionResult {
  const correctionRef = useRef<CollisionResult>({});

  const computeCollisions = useCallback(() => {
    if (islands.length === 0) return {};

    // Ada verilerini fizik formatına çevir
    const bodies: PhysicsIsland[] = islands.map((island) => {
      const offset = positionOffsets[island.id] || { dx: 0, dy: 0 };
      const radius = (20 + island.scale * 30) / spreadFactor; // piksel→birim

      return {
        id: island.id,
        baseX: island.x + offset.dx,
        baseY: island.y + offset.dy,
        offsetDx: 0,
        offsetDy: 0,
        radius,
      };
    });

    // Basit O(n²) çarpışma kontrolü — 50 ada için yeterli
    const iterations = 3; // Birkaç iterasyon daha iyi ayrışma sağlar

    for (let iter = 0; iter < iterations; iter++) {
      for (let i = 0; i < bodies.length; i++) {
        for (let j = i + 1; j < bodies.length; j++) {
          const a = bodies[i];
          const b = bodies[j];

          const ax = a.baseX + a.offsetDx;
          const ay = a.baseY + a.offsetDy;
          const bx = b.baseX + b.offsetDx;
          const by = b.baseY + b.offsetDy;

          const dx = bx - ax;
          const dy = by - ay;
          const dist = Math.sqrt(dx * dx + dy * dy) || 0.01;
          const minDist = (a.radius + b.radius) * 1.2; // %20 boşluk

          if (dist < minDist) {
            // Çarpışma! — Birbirinden it
            const overlap = (minDist - dist) / 2;
            const nx = dx / dist;
            const ny = dy / dist;

            a.offsetDx -= nx * overlap * 0.5;
            a.offsetDy -= ny * overlap * 0.5;
            b.offsetDx += nx * overlap * 0.5;
            b.offsetDy += ny * overlap * 0.5;
          }
        }
      }
    }

    // Sonuçları topla
    const result: CollisionResult = {};
    for (const body of bodies) {
      if (Math.abs(body.offsetDx) > 0.01 || Math.abs(body.offsetDy) > 0.01) {
        result[body.id] = { dx: body.offsetDx, dy: body.offsetDy };
      }
    }

    return result;
  }, [islands, positionOffsets, spreadFactor]);

  useEffect(() => {
    correctionRef.current = computeCollisions();
  }, [computeCollisions]);

  return correctionRef.current;
}
