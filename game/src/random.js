// Seeded random numbers (mulberry32). The game takes one generator per run so
// a screenshot scene replays the same night every time it is staged.
export function makeRandom(seed) {
  let a = seed >>> 0;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function pickInRange(rand, min, max) {
  return min + rand() * (max - min);
}

export function pickInt(rand, min, max) {
  return Math.floor(pickInRange(rand, min, max + 1));
}

// A point on a random edge of the arena, just outside the view, where new
// shadows slip in from the dark.
export function edgePoint(rand, w, h, margin) {
  const side = Math.floor(rand() * 4);
  if (side === 0) return { x: pickInRange(rand, 0, w), y: -margin };
  if (side === 1) return { x: w + margin, y: pickInRange(rand, 0, h) };
  if (side === 2) return { x: pickInRange(rand, 0, w), y: h + margin };
  return { x: -margin, y: pickInRange(rand, 0, h) };
}
