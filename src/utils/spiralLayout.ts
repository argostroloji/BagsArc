/**
 * Hype Gravity Layout Algorithm
 * 
 * "King of the Hill" positioning:
 * - Each island gets a RANDOM angle (chaotic scatter)
 * - Distance from center is INVERSELY proportional to Market Cap rank
 * - Rank #1 = center (the King), Rank #50 = outer edge
 * - Uses seeded randomness per-symbol for stable but chaotic positions
 */

interface GravityPoint {
  x: number;
  y: number;
}

/**
 * Simple seeded PRNG from a string (hash-based)
 * Ensures same symbol always gets the same random angle
 */
function seededRandom(seed: string): number {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    const char = seed.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit int
  }
  // Normalize to 0-1
  return Math.abs(Math.sin(hash * 9301 + 49297) % 1);
}

/**
 * Generate chaotic positions where rank determines proximity to center.
 * 
 * @param count - Number of islands
 * @param symbols - Symbol strings used to seed random angles
 * @param maxRadius - Maximum distance from center for the outermost island
 */
export function generateHypeGravityCoordinates(
  count: number,
  symbols: string[],
  maxRadius: number = 70
): GravityPoint[] {
  const points: GravityPoint[] = [];
  const minRadius = 0; // King sits right at center

  for (let i = 0; i < count; i++) {
    if (i === 0) {
      // Rank #1 — THE KING — sits at center with tiny offset for visual flair
      const seed1 = seededRandom(symbols[0] + '_kx');
      const seed2 = seededRandom(symbols[0] + '_ky');
      points.push({
        x: (seed1 - 0.5) * 3, // Tiny jitter ±1.5
        y: (seed2 - 0.5) * 3,
      });
      continue;
    }

    // Distance: linearly interpolated from center to edge based on rank
    // Use a sqrt curve so top ranks cluster tighter near center
    const rankRatio = i / (count - 1); // 0 to 1
    const distanceCurve = Math.sqrt(rankRatio); // sqrt bunches top ranks closer
    const baseDistance = minRadius + distanceCurve * maxRadius;

    // Add some per-symbol random jitter to distance (±20%)
    const distJitter = seededRandom(symbols[i] + '_dist');
    const distance = baseDistance * (0.85 + distJitter * 0.3);

    // Random angle per symbol (full 360°)
    const angle = seededRandom(symbols[i] + '_angle') * Math.PI * 2;

    // Additional angular jitter for more chaos
    const angleJitter = (seededRandom(symbols[i] + '_aj') - 0.5) * 0.6;

    const finalAngle = angle + angleJitter;

    points.push({
      x: distance * Math.sin(finalAngle),
      y: distance * Math.cos(finalAngle),
    });
  }

  return points;
}

/**
 * Normalize a value from [min, max] to [outMin, outMax]
 */
export function normalize(
  value: number,
  min: number,
  max: number,
  outMin: number,
  outMax: number
): number {
  if (max === min) return (outMin + outMax) / 2;
  return outMin + ((value - min) / (max - min)) * (outMax - outMin);
}
