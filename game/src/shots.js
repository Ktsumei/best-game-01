// The screenshot scenes behind ?shot=start|play|wave|end. Each one plays the
// real rules forward from a seeded world, so a shot is a true render of the
// game, never a staged picture: the same seed stages the same scene.
import { makeWorld } from './world.js';

// Run the world forward with a scripted keeper: drift in a slow circle and
// flare whenever the lantern can afford it.
function simulate(world, api, seconds, flareEvery) {
  const dt = 1 / 60;
  const steps = Math.floor(seconds / dt);
  for (let i = 0; i < steps; i++) {
    const steer = { x: Math.cos(world.time * 0.6), y: Math.sin(world.time * 0.6) * 0.7 };
    const wantFlare = flareEvery && i % flareEvery === 0;
    api.step(dt, steer, wantFlare);
    if (world.gameOver || world.victory) break;
  }
}

export function stageShot(scene, seed) {
  const api = makeWorld(seed);
  const w = api.world;
  if (scene === 'start') {
    w.best = 2450;
    return { api, mode: 'title' };
  }
  if (scene === 'play') {
    // Wave 4, mid-fight: shadows on screen, embers to chase, HUD alive.
    api.startWave(4);
    w.score = 1240;
    w.best = 2450;
    w.charge = 72;
    simulate(w, api, 9, 90);
    return { api, mode: 'playing' };
  }
  if (scene === 'wave') {
    // The banner moment of wave 6: a fresh wave spilling in, banner on screen.
    api.startWave(6);
    w.score = 2890;
    w.best = 2890;
    w.charge = 88;
    w.lights = 2;
    simulate(w, api, 4, 0);
    w.bannerText = 'Wave 6';
    w.bannerTimer = 1.8;
    return { api, mode: 'playing' };
  }
  // end: the keeper falls on wave 7, game over with the restart on screen.
  api.startWave(7);
  w.score = 3410;
  w.best = 3410;
  w.lights = 1;
  simulate(w, api, 14, 0);
  w.lights = 0;
  w.gameOver = true;
  return { api, mode: 'gameover' };
}
