// The night itself: the keeper, the shadows, the embers and the waves. One
// job: the rules of Emberlight, stepped forward in fixed 1/60 s ticks.
import { VIEW_W, VIEW_H, PLAYER, LANTERN, ENEMY, PICKUP, WAVES, FINAL_WAVE } from './config.js';
import { makeRandom, pickInRange, edgePoint } from './random.js';

export function makeWorld(seed) {
  const rand = makeRandom(seed);
  const world = {
    time: 0,
    score: 0,
    best: 0,
    wave: 1,
    waveState: 'spawning', // spawning | fighting | banner | done
    spawnQueue: [],
    spawnTimer: 0,
    emberTimer: 0,
    lights: PLAYER.lights,
    charge: LANTERN.startCharge,
    flareCooldown: 0,
    invulnerable: 0,
    shake: 0,
    bannerText: '',
    bannerTimer: 0,
    victory: false,
    gameOver: false,
    player: { x: VIEW_W / 2, y: VIEW_H / 2, vx: 0, vy: 0, radius: PLAYER.radius, faceX: 1, faceY: 0 },
    enemies: [],
    bolts: [],
    pickups: [],
    particles: [],
    floaters: [], // rising score text
    events: [], // one-shot sounds the loop plays: pickup, flare, hit, wave, heart
  };

  function startWave(n) {
    const def = WAVES[n - 1];
    world.wave = n;
    world.waveState = 'spawning';
    world.spawnQueue = [];
    for (let i = 0; i < def.wisps; i++) world.spawnQueue.push('wisp');
    for (let i = 0; i < def.spitters; i++) world.spawnQueue.push('spitter');
    for (let i = 0; i < def.brutes; i++) world.spawnQueue.push('brute');
    // Shuffle the queue so kinds arrive mixed.
    for (let i = world.spawnQueue.length - 1; i > 0; i--) {
      const j = Math.floor(rand() * (i + 1));
      [world.spawnQueue[i], world.spawnQueue[j]] = [world.spawnQueue[j], world.spawnQueue[i]];
    }
    world.spawnTimer = 0.4;
    world.bannerText = n === 1 ? 'Night falls — Wave 1' : `Wave ${n}`;
    world.bannerTimer = 2.0;
    world.events.push('wave');
  }

  function spawnEnemy(kind) {
    const p = edgePoint(rand, VIEW_W, VIEW_H, 40);
    const def = ENEMY[kind];
    world.enemies.push({
      kind,
      x: p.x,
      y: p.y,
      radius: def.radius,
      hp: def.hp,
      speed: def.speed * pickInRange(rand, 0.9, 1.15),
      shotTimer: pickInRange(rand, 1, ENEMY.spitter.shotSeconds),
      wobble: rand() * Math.PI * 2,
    });
  }

  function spawnEmber(x, y) {
    world.pickups.push({ kind: 'ember', x, y, radius: PICKUP.emberRadius, born: world.time });
  }

  function burst(x, y, color, n, speed) {
    for (let i = 0; i < n; i++) {
      const a = rand() * Math.PI * 2;
      const s = pickInRange(rand, speed * 0.3, speed);
      world.particles.push({
        x, y, vx: Math.cos(a) * s, vy: Math.sin(a) * s,
        life: pickInRange(rand, 0.3, 0.7), maxLife: 0.7, color, size: pickInRange(rand, 2, 5),
      });
    }
  }

  function addFloater(x, y, text, color) {
    world.floaters.push({ x, y, text, color, life: 1.0 });
  }

  function hurtPlayer() {
    if (world.invulnerable > 0 || world.gameOver) return;
    world.lights -= 1;
    world.invulnerable = PLAYER.invulnerableSeconds;
    world.shake = 14;
    world.charge = Math.max(0, world.charge - 15);
    world.events.push('hit');
    burst(world.player.x, world.player.y, '#ff5d73', 18, 220);
    if (world.lights <= 0) {
      world.gameOver = true;
      world.events.push('gameover');
    }
  }

  // A flare burst: a ring of light that burns every shadow it touches and
  // shoves the rest back. Costs lantern charge; the keeper's only weapon.
  function flare() {
    if (world.flareCooldown > 0 || world.charge < PLAYER.flareCost || world.gameOver) return false;
    world.charge -= PLAYER.flareCost;
    world.flareCooldown = PLAYER.flareCooldownSeconds;
    world.shake = Math.max(world.shake, 6);
    world.events.push('flare');
    const p = world.player;
    burst(p.x, p.y, '#ffd166', 26, 320);
    for (const e of world.enemies) {
      const d = Math.hypot(e.x - p.x, e.y - p.y);
      if (d < PLAYER.flareRadius + e.radius) {
        e.hp -= PLAYER.flareDamage;
        const push = 260;
        const nx = (e.x - p.x) / (d || 1);
        const ny = (e.y - p.y) / (d || 1);
        e.x += nx * push * 0.12;
        e.y += ny * push * 0.12;
        burst(e.x, e.y, '#ffe9a8', 8, 160);
      }
    }
    return true;
  }

  function killEnemy(e, index) {
    world.score += ENEMY[e.kind].score;
    addFloater(e.x, e.y, `+${ENEMY[e.kind].score}`, '#ffd166');
    burst(e.x, e.y, '#b9a5ff', 16, 200);
    if (rand() < 0.55) spawnEmber(e.x, e.y);
    world.enemies.splice(index, 1);
  }

  function step(dt, steer, wantFlare) {
    world.time += dt;
    if (world.gameOver || world.victory) {
      updateParticles(dt);
      return;
    }
    if (world.flareCooldown > 0) world.flareCooldown -= dt;
    if (world.invulnerable > 0) world.invulnerable -= dt;
    if (world.bannerTimer > 0) world.bannerTimer -= dt;
    if (world.shake > 0) world.shake = Math.max(0, world.shake - dt * 30);

    // The keeper moves.
    const p = world.player;
    p.vx = steer.x * PLAYER.speed;
    p.vy = steer.y * PLAYER.speed;
    p.x = Math.min(VIEW_W - p.radius, Math.max(p.radius, p.x + p.vx * dt));
    p.y = Math.min(VIEW_H - p.radius, Math.max(p.radius, p.y + p.vy * dt));
    if (steer.x !== 0 || steer.y !== 0) {
      const len = Math.hypot(steer.x, steer.y) || 1;
      p.faceX = steer.x / len;
      p.faceY = steer.y / len;
    }
    if (wantFlare) flare();

    // Spawning.
    if (world.waveState === 'spawning') {
      world.spawnTimer -= dt;
      if (world.spawnTimer <= 0) {
        if (world.spawnQueue.length > 0) {
          spawnEnemy(world.spawnQueue.shift());
          world.spawnTimer = 0.55;
        } else {
          world.waveState = 'fighting';
        }
      }
    }

    // Ambient embers drift in while a wave runs.
    world.emberTimer -= dt;
    if (world.emberTimer <= 0 && world.waveState !== 'banner') {
      world.emberTimer = PICKUP.emberEverySeconds;
      spawnEmber(pickInRange(rand, 60, VIEW_W - 60), pickInRange(rand, 60, VIEW_H - 60));
    }

    // Shadows drift toward the keeper; spitters keep their distance and shoot.
    for (const e of world.enemies) {
      const dx = p.x - e.x;
      const dy = p.y - e.y;
      const d = Math.hypot(dx, dy) || 1;
      const nx = dx / d;
      const ny = dy / d;
      e.wobble += dt * 2;
      const wob = Math.sin(e.wobble) * 18;
      if (e.kind === 'spitter' && d < 260) {
        e.x -= nx * e.speed * 0.5 * dt;
        e.y -= ny * e.speed * 0.5 * dt;
        e.shotTimer -= dt;
        if (e.shotTimer <= 0) {
          e.shotTimer = ENEMY.spitter.shotSeconds * pickInRange(rand, 0.85, 1.2);
          world.bolts.push({ x: e.x, y: e.y, vx: nx * ENEMY.boltSpeed, vy: ny * ENEMY.boltSpeed, radius: ENEMY.boltRadius });
        }
      } else {
        e.x += (nx * e.speed + -ny * wob * 0.2) * dt;
        e.y += (ny * e.speed + nx * wob * 0.2) * dt;
      }
    }

    // Dark bolts fly straight.
    for (let i = world.bolts.length - 1; i >= 0; i--) {
      const b = world.bolts[i];
      b.x += b.vx * dt;
      b.y += b.vy * dt;
      if (b.x < -20 || b.x > VIEW_W + 20 || b.y < -20 || b.y > VIEW_H + 20) world.bolts.splice(i, 1);
    }

    // Flare kills.
    for (let i = world.enemies.length - 1; i >= 0; i--) {
      if (world.enemies[i].hp <= 0) killEnemy(world.enemies[i], i);
    }

    // Touching a shadow, or a bolt, costs a light.
    for (const e of world.enemies) {
      if (Math.hypot(e.x - p.x, e.y - p.y) < e.radius + p.radius - 4) hurtPlayer();
    }
    for (let i = world.bolts.length - 1; i >= 0; i--) {
      const b = world.bolts[i];
      if (Math.hypot(b.x - p.x, b.y - p.y) < b.radius + p.radius - 2) {
        world.bolts.splice(i, 1);
        hurtPlayer();
      }
    }

    // Pickups: embers feed the lantern, hearts mend a light, crystals flare.
    for (let i = world.pickups.length - 1; i >= 0; i--) {
      const pk = world.pickups[i];
      if (Math.hypot(pk.x - p.x, pk.y - p.y) < pk.radius + p.radius) {
        if (pk.kind === 'ember') {
          world.charge = Math.min(LANTERN.maxCharge, world.charge + LANTERN.emberCharge);
          world.score += LANTERN.emberScore;
          world.events.push('pickup');
          burst(pk.x, pk.y, '#ffb347', 8, 120);
        } else if (pk.kind === 'heart') {
          world.lights = Math.min(PLAYER.lights, world.lights + 1);
          world.events.push('heart');
          addFloater(pk.x, pk.y, '+1 light', '#ff6b81');
        } else if (pk.kind === 'crystal') {
          world.charge = LANTERN.maxCharge;
          world.events.push('flare');
          burst(pk.x, pk.y, '#7fe7ff', 24, 260);
          for (let j = world.enemies.length - 1; j >= 0; j--) {
            world.enemies[j].hp -= 1;
            if (world.enemies[j].hp <= 0) killEnemy(world.enemies[j], j);
          }
        }
        world.pickups.splice(i, 1);
      }
    }

    // Wave cleared: bonus, banner, and either the dawn or the next wave.
    if (world.waveState === 'fighting' && world.enemies.length === 0 && world.spawnQueue.length === 0) {
      world.waveState = 'banner';
      world.score += 100;
      if (world.wave % PICKUP.heartEveryWaves === 0) {
        world.pickups.push({ kind: 'heart', x: VIEW_W / 2, y: VIEW_H / 2 - 60, radius: PICKUP.heartRadius, born: world.time });
      }
      if (world.wave >= FINAL_WAVE) {
        world.victory = true;
        world.events.push('victory');
        world.score += 500;
      } else {
        world.bannerText = `Wave ${world.wave} cleared  +100`;
        world.bannerTimer = 2.2;
      }
    }
    if (world.waveState === 'banner' && world.bannerTimer <= 0 && !world.victory) {
      startWave(world.wave + 1);
    }

    updateParticles(dt);
  }

  function updateParticles(dt) {
    for (let i = world.particles.length - 1; i >= 0; i--) {
      const pt = world.particles[i];
      pt.x += pt.vx * dt;
      pt.y += pt.vy * dt;
      pt.vx *= 0.96;
      pt.vy *= 0.96;
      pt.life -= dt;
      if (pt.life <= 0) world.particles.splice(i, 1);
    }
    for (let i = world.floaters.length - 1; i >= 0; i--) {
      const f = world.floaters[i];
      f.y -= 34 * dt;
      f.life -= dt;
      if (f.life <= 0) world.floaters.splice(i, 1);
    }
  }

  function reset(seed) {
    const fresh = makeWorld(seed);
    for (const k of Object.keys(world)) world[k] = fresh[k];
    startWave(1);
  }

  startWave(1);
  return { world, step, flare, reset, startWave, spawnEmber, burst };
}
