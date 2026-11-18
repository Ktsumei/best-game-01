// Emberlight — entry point. Owns the state machine (title, playing, paused,
// game over, victory), the fixed-step loop, and the ?shot= screenshot scenes.
// ?seed=N fixes the night's random draws; ?shot=start|play|wave|end stages
// that scene instead of running the loop, paints it, and sets
// window.__shotReady for a screenshot.
import { VIEW_W, VIEW_H } from './config.js';
import { makeWorld } from './world.js';
import { makeInput, ACTION_START, ACTION_FLARE, ACTION_PAUSE, ACTION_RESTART, ACTION_MUTE } from './input.js';
import { makeAudio } from './audio.js';
import { renderWorld, renderTitle, renderPause, renderGameOver, renderVictory } from './render.js';
import { stageShot } from './shots.js';

const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d');
canvas.width = VIEW_W;
canvas.height = VIEW_H;

const params = new URLSearchParams(window.location.search);
const seed = Number(params.get('seed') || 7);
const shot = params.get('shot');

// A fixed sky of stars, drawn from the same seed every run.
const stars = [];
{
  let a = seed * 2654435761 >>> 0;
  const next = () => {
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
  for (let i = 0; i < 90; i++) {
    stars.push({ x: next() * VIEW_W, y: next() * (VIEW_H - 120), size: next() < 0.85 ? 2 : 3, twinkle: 0.5 + next() * 1.5, phase: next() * Math.PI * 2 });
  }
}

const input = makeInput(canvas);
const audio = makeAudio();
const api = makeWorld(seed);
const world = api.world;
world.best = Number(window.localStorage.getItem('emberlight-best') || 0);

let mode = 'title'; // title | playing | paused | gameover | victory
let last = performance.now();
let acc = 0;
const STEP = 1 / 60;

function saveBest() {
  if (world.score > world.best) {
    world.best = world.score;
    window.localStorage.setItem('emberlight-best', String(world.best));
  }
}

function playEvents() {
  for (const e of world.events.splice(0)) {
    if (e === 'pickup') audio.pickup();
    else if (e === 'flare') audio.flare();
    else if (e === 'hit') audio.hit();
    else if (e === 'wave') audio.wave();
    else if (e === 'heart') audio.heart();
    else if (e === 'victory') audio.victory();
    else if (e === 'gameover') audio.gameOver();
  }
}

function startGame() {
  audio.unlock();
  api.reset(seed);
  world.best = Number(window.localStorage.getItem('emberlight-best') || 0);
  mode = 'playing';
}

function frame(now) {
  const pressed = input.takePressed();
  if (pressed & ACTION_MUTE) audio.toggleMute();
  if (mode === 'title' && (pressed & ACTION_START)) startGame();
  else if (mode === 'playing' && (pressed & ACTION_PAUSE)) mode = 'paused';
  else if (mode === 'paused' && (pressed & ACTION_PAUSE)) mode = 'playing';
  else if ((mode === 'gameover' || mode === 'victory') && (pressed & (ACTION_RESTART | ACTION_START))) startGame();

  // Clicking the title or an end screen starts the game too.
  if ((pressed & ACTION_START) && (mode === 'title' || mode === 'gameover' || mode === 'victory')) {
    if (mode !== 'playing') startGame();
  }

  let dt = (now - last) / 1000;
  last = now;
  if (dt > 0.25) dt = 0.25;
  if (mode === 'playing') {
    acc += dt;
    while (acc >= STEP) {
      const steer = input.steer();
      const wantFlare = (pressed & ACTION_FLARE) !== 0 || input.mouse().down;
      api.step(STEP, steer, wantFlare);
      acc -= STEP;
      if (world.gameOver || world.victory) {
        saveBest();
        mode = world.victory ? 'victory' : 'gameover';
        break;
      }
    }
    playEvents();
  }

  if (mode === 'title') renderTitle(ctx, world, stars);
  else if (mode === 'paused') { renderWorld(ctx, world, stars); renderPause(ctx); }
  else if (mode === 'gameover') { renderWorld(ctx, world, stars); renderGameOver(ctx, world); }
  else if (mode === 'victory') { renderWorld(ctx, world, stars); renderVictory(ctx, world); }
  else renderWorld(ctx, world, stars);

  requestAnimationFrame(frame);
}

if (shot) {
  // Screenshot mode: stage the scene, paint it once, signal readiness.
  const staged = stageShot(shot, seed);
  const stagedWorld = staged.api.world;
  stagedWorld.best = Math.max(stagedWorld.best, stagedWorld.score);
  if (staged.mode === 'title') renderTitle(ctx, stagedWorld, stars);
  else if (staged.mode === 'gameover') { renderWorld(ctx, stagedWorld, stars); renderGameOver(ctx, stagedWorld); }
  else renderWorld(ctx, stagedWorld, stars);
  window.__shotReady = true;
} else {
  requestAnimationFrame(frame);
}
