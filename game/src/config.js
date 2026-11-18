// Emberlight — game tuning, palette and wave table. One job: every number the
// rest of the game reads, so balance lives in one place.
export const VIEW_W = 1280;
export const VIEW_H = 720;

export const PLAYER = {
  radius: 16,
  speed: 270, // px per second
  lights: 3, // hits the keeper can take before the dark wins
  invulnerableSeconds: 1.6,
  flareRadius: 150,
  flareCooldownSeconds: 1.1,
  flareCost: 22, // lantern charge spent per flare burst
  flareDamage: 1,
};

export const LANTERN = {
  maxCharge: 100,
  emberCharge: 14, // charge gained per ember collected
  emberScore: 10,
  startCharge: 60,
};

export const SCORE = {
  wisp: 25,
  spitter: 40,
  brute: 80,
  waveClearBonus: 100,
};

// Waves 1..10. count is how many shadows the wave spawns; kinds unlock as the
// night deepens. Clearing wave 10 breaks the dawn and wins the game.
export const WAVES = [
  { wisps: 5, spitters: 0, brutes: 0 },
  { wisps: 8, spitters: 0, brutes: 0 },
  { wisps: 9, spitters: 2, brutes: 0 },
  { wisps: 11, spitters: 3, brutes: 0 },
  { wisps: 12, spitters: 3, brutes: 1 },
  { wisps: 13, spitters: 4, brutes: 1 },
  { wisps: 14, spitters: 5, brutes: 2 },
  { wisps: 15, spitters: 6, brutes: 2 },
  { wisps: 16, spitters: 7, brutes: 3 },
  { wisps: 18, spitters: 8, brutes: 3 },
];
export const FINAL_WAVE = WAVES.length;

export const ENEMY = {
  wisp: { radius: 15, speed: 95, hp: 1, score: SCORE.wisp },
  spitter: { radius: 17, speed: 70, hp: 2, score: SCORE.spitter, shotSeconds: 2.6 },
  brute: { radius: 26, speed: 48, hp: 3, score: SCORE.brute },
  boltSpeed: 190,
  boltRadius: 6,
};

export const PICKUP = {
  emberRadius: 9,
  heartRadius: 12,
  crystalRadius: 13,
  emberEverySeconds: 2.4, // ambient embers drift in while a wave runs
  heartEveryWaves: 3, // a heart appears after every third cleared wave
};

// Night palette: deep indigo dark, warm amber light. Everything the game draws
// comes from these, so the scene reads as one place.
export const PALETTE = {
  skyTop: '#0b1026',
  skyBottom: '#1a1440',
  ground: '#12172e',
  star: '#cdd7ff',
  ember: '#ffb347',
  emberCore: '#ffe9a8',
  heart: '#ff6b81',
  crystal: '#7fe7ff',
  wisp: '#8f7bff',
  spitter: '#c05cff',
  brute: '#5a3fd4',
  bolt: '#b388ff',
  player: '#ffd166',
  playerCore: '#fff3c4',
  text: '#f5eeda',
  muted: '#9a94c7',
  banner: '#ffd166',
  danger: '#ff5d73',
};
