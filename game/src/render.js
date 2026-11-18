// Everything the player sees: the night, the keeper, the shadows and every
// screen, drawn on one canvas. One job: turn a world into a picture.
import { VIEW_W, VIEW_H, PLAYER, LANTERN, PALETTE, FINAL_WAVE } from './config.js';

function roundRect(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function glowCircle(ctx, x, y, radius, color, core) {
  ctx.save();
  ctx.shadowColor = color;
  ctx.shadowBlur = 22;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.arc(x, y, radius, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  ctx.fillStyle = core;
  ctx.beginPath();
  ctx.arc(x, y, radius * 0.45, 0, Math.PI * 2);
  ctx.fill();
  ctx.restore();
}

function drawBackground(ctx, time, stars) {
  const g = ctx.createLinearGradient(0, 0, 0, VIEW_H);
  g.addColorStop(0, PALETTE.skyTop);
  g.addColorStop(1, PALETTE.skyBottom);
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  ctx.fillStyle = PALETTE.star;
  for (const s of stars) {
    ctx.globalAlpha = 0.25 + 0.55 * Math.abs(Math.sin(time * s.twinkle + s.phase));
    ctx.fillRect(s.x, s.y, s.size, s.size);
  }
  ctx.globalAlpha = 1;
  // Distant hills the lantern light never reaches.
  ctx.fillStyle = PALETTE.ground;
  ctx.beginPath();
  ctx.moveTo(0, VIEW_H);
  ctx.lineTo(0, VIEW_H - 90);
  for (let x = 0; x <= VIEW_W; x += 80) {
    ctx.lineTo(x, VIEW_H - 90 - Math.sin(x * 0.004 + 1.7) * 34);
  }
  ctx.lineTo(VIEW_W, VIEW_H);
  ctx.closePath();
  ctx.fill();
}

function drawPlayer(ctx, w) {
  const p = w.player;
  const blink = w.invulnerable > 0 && Math.floor(w.time * 12) % 2 === 0;
  ctx.save();
  if (blink) ctx.globalAlpha = 0.35;
  // Lantern glow around the keeper.
  const glow = ctx.createRadialGradient(p.x, p.y, 8, p.x, p.y, 120);
  glow.addColorStop(0, 'rgba(255, 209, 102, 0.28)');
  glow.addColorStop(1, 'rgba(255, 209, 102, 0)');
  ctx.fillStyle = glow;
  ctx.beginPath();
  ctx.arc(p.x, p.y, 120, 0, Math.PI * 2);
  ctx.fill();
  // The keeper: a hooded figure, drawn as a warm lantern with a face.
  ctx.shadowColor = PALETTE.player;
  ctx.shadowBlur = 18;
  ctx.fillStyle = '#3a2b12';
  ctx.beginPath();
  ctx.arc(p.x, p.y, p.radius + 3, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;
  glowCircle(ctx, p.x, p.y - 2, 9, PALETTE.player, PALETTE.playerCore);
  // Facing tick.
  ctx.strokeStyle = PALETTE.playerCore;
  ctx.lineWidth = 3;
  ctx.beginPath();
  ctx.moveTo(p.x, p.y);
  ctx.lineTo(p.x + p.faceX * (p.radius + 8), p.y + p.faceY * (p.radius + 8));
  ctx.stroke();
  // Flare ring while the burst is fresh.
  if (w.flareCooldown > PLAYER.flareCooldownSeconds - 0.25) {
    const t = (PLAYER.flareCooldownSeconds - w.flareCooldown) / 0.25;
    ctx.strokeStyle = `rgba(255, 233, 168, ${0.9 * (1 - t)})`;
    ctx.lineWidth = 5;
    ctx.beginPath();
    ctx.arc(p.x, p.y, PLAYER.flareRadius * (0.4 + 0.6 * t), 0, Math.PI * 2);
    ctx.stroke();
  }
  ctx.restore();
}

function drawEnemies(ctx, w) {
  for (const e of w.enemies) {
    ctx.save();
    const pulse = 1 + 0.08 * Math.sin(w.time * 5 + e.wobble);
    if (e.kind === 'wisp') {
      glowCircle(ctx, e.x, e.y, e.radius * pulse, PALETTE.wisp, '#d9ccff');
      ctx.fillStyle = '#241a4d';
      ctx.beginPath();
      ctx.arc(e.x - 5, e.y - 2, 2.5, 0, Math.PI * 2);
      ctx.arc(e.x + 5, e.y - 2, 2.5, 0, Math.PI * 2);
      ctx.fill();
    } else if (e.kind === 'spitter') {
      glowCircle(ctx, e.x, e.y, e.radius * pulse, PALETTE.spitter, '#e8b6ff');
      ctx.strokeStyle = '#e8b6ff';
      ctx.lineWidth = 2;
      for (let i = 0; i < 5; i++) {
        const a = (i / 5) * Math.PI * 2 + w.time;
        ctx.beginPath();
        ctx.moveTo(e.x + Math.cos(a) * e.radius, e.y + Math.sin(a) * e.radius);
        ctx.lineTo(e.x + Math.cos(a) * (e.radius + 7), e.y + Math.sin(a) * (e.radius + 7));
        ctx.stroke();
      }
    } else {
      ctx.shadowColor = PALETTE.brute;
      ctx.shadowBlur = 20;
      ctx.fillStyle = PALETTE.brute;
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * pulse, 0, Math.PI * 2);
      ctx.fill();
      ctx.shadowBlur = 0;
      ctx.fillStyle = '#2a1650';
      ctx.beginPath();
      ctx.arc(e.x, e.y, e.radius * 0.55, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = '#ff5d73';
      ctx.fillRect(e.x - 10, e.y - 3, 20, 4);
    }
    // Health pips for tougher shadows.
    if (e.hp > 1) {
      ctx.fillStyle = '#f5eeda';
      ctx.font = 'bold 11px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(`♥${e.hp}`, e.x, e.y - e.radius - 6);
    }
    ctx.restore();
  }
  ctx.fillStyle = PALETTE.bolt;
  for (const b of w.bolts) {
    ctx.save();
    ctx.shadowColor = PALETTE.bolt;
    ctx.shadowBlur = 12;
    ctx.beginPath();
    ctx.arc(b.x, b.y, b.radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }
}

function drawPickups(ctx, w) {
  for (const pk of w.pickups) {
    const bob = Math.sin(w.time * 3 + pk.x) * 3;
    if (pk.kind === 'ember') {
      glowCircle(ctx, pk.x, pk.y + bob, pk.radius, PALETTE.ember, PALETTE.emberCore);
    } else if (pk.kind === 'heart') {
      ctx.save();
      ctx.shadowColor = PALETTE.heart;
      ctx.shadowBlur = 14;
      ctx.fillStyle = PALETTE.heart;
      ctx.font = '20px sans-serif';
      ctx.textAlign = 'center';
      ctx.textBaseline = 'middle';
      ctx.fillText('♥', pk.x, pk.y + bob);
      ctx.restore();
    } else {
      glowCircle(ctx, pk.x, pk.y + bob, pk.radius, PALETTE.crystal, '#eafcff');
      ctx.strokeStyle = '#eafcff';
      ctx.lineWidth = 2;
      ctx.beginPath();
      ctx.arc(pk.x, pk.y + bob, pk.radius + 5, 0, Math.PI * 2);
      ctx.stroke();
    }
  }
}

function drawParticles(ctx, w) {
  for (const pt of w.particles) {
    ctx.globalAlpha = Math.max(0, pt.life / pt.maxLife);
    ctx.fillStyle = pt.color;
    ctx.beginPath();
    ctx.arc(pt.x, pt.y, pt.size, 0, Math.PI * 2);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
  ctx.font = 'bold 15px sans-serif';
  ctx.textAlign = 'center';
  for (const f of w.floaters) {
    ctx.globalAlpha = Math.max(0, f.life);
    ctx.fillStyle = f.color;
    ctx.fillText(f.text, f.x, f.y);
  }
  ctx.globalAlpha = 1;
}

function drawHud(ctx, w) {
  // Top bar.
  ctx.fillStyle = 'rgba(8, 10, 28, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, 54);
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 22px sans-serif';
  ctx.textAlign = 'left';
  ctx.textBaseline = 'middle';
  ctx.fillText(`SCORE ${w.score}`, 20, 28);
  ctx.textAlign = 'center';
  ctx.fillText(`WAVE ${Math.min(w.wave, FINAL_WAVE)} / ${FINAL_WAVE}`, VIEW_W / 2, 28);
  ctx.textAlign = 'right';
  ctx.fillText(`BEST ${Math.max(w.best, w.score)}`, VIEW_W - 20, 28);
  // Lights (hearts) under the score.
  ctx.textAlign = 'left';
  ctx.font = '20px sans-serif';
  let hearts = '';
  for (let i = 0; i < w.lights; i++) hearts += '♥ ';
  ctx.fillStyle = PALETTE.heart;
  ctx.fillText(hearts || '—', 20, 74);
  // Lantern charge bar.
  const barW = 220;
  const barX = VIEW_W - barW - 20;
  const barY = 66;
  ctx.fillStyle = 'rgba(8, 10, 28, 0.72)';
  roundRect(ctx, barX - 6, barY - 6, barW + 12, 26, 8);
  ctx.fill();
  ctx.fillStyle = '#2c2350';
  roundRect(ctx, barX, barY, barW, 14, 7);
  ctx.fill();
  const frac = w.charge / LANTERN.maxCharge;
  ctx.fillStyle = frac < 0.25 ? PALETTE.danger : PALETTE.ember;
  if (frac > 0) {
    roundRect(ctx, barX, barY, Math.max(8, barW * frac), 14, 7);
    ctx.fill();
  }
  ctx.fillStyle = PALETTE.text;
  ctx.font = 'bold 12px sans-serif';
  ctx.textAlign = 'left';
  ctx.fillText('LANTERN', barX, barY + 30);
  ctx.textAlign = 'right';
  ctx.fillText(w.flareCooldown > 0 ? 'FLARE…' : 'FLARE READY', VIEW_W - 20, barY + 30);
}

function centreText(ctx, text, y, font, color) {
  ctx.font = font;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.fillText(text, VIEW_W / 2, y);
}

function panel(ctx, y, h) {
  ctx.fillStyle = 'rgba(8, 10, 28, 0.78)';
  roundRect(ctx, VIEW_W / 2 - 360, y, 720, h, 16);
  ctx.fill();
  ctx.strokeStyle = 'rgba(255, 209, 102, 0.5)';
  ctx.lineWidth = 2;
  roundRect(ctx, VIEW_W / 2 - 360, y, 720, h, 16);
  ctx.stroke();
}

export function renderTitle(ctx, w, stars) {
  drawBackground(ctx, w.time, stars);
  glowCircle(ctx, VIEW_W / 2, 155, 46, PALETTE.player, PALETTE.playerCore);
  centreText(ctx, 'EMBERLIGHT', 250, 'bold 64px sans-serif', PALETTE.banner);
  centreText(ctx, 'Keeper of the Last Lantern', 305, '28px sans-serif', PALETTE.text);
  panel(ctx, 350, 150);
  centreText(ctx, 'The night sends its shadows. Your lantern is the only light left.', 388, '19px sans-serif', PALETTE.text);
  centreText(ctx, 'Collect embers to feed the flame — flare to burn the dark back.', 420, '19px sans-serif', PALETTE.text);
  centreText(ctx, 'Survive all 10 waves and bring the dawn.', 452, '19px sans-serif', PALETTE.text);
  centreText(ctx, 'WASD / ARROWS move   •   SPACE or CLICK flare   •   P pause   •   M mute', 540, 'bold 20px sans-serif', PALETTE.muted);
  centreText(ctx, 'Press ENTER or CLICK to begin', 585, 'bold 24px sans-serif', PALETTE.banner);
  if (w.best > 0) centreText(ctx, `Best score: ${w.best}`, 630, '20px sans-serif', PALETTE.muted);
}

export function renderPause(ctx) {
  ctx.fillStyle = 'rgba(5, 6, 18, 0.66)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  centreText(ctx, 'PAUSED', 330, 'bold 56px sans-serif', PALETTE.text);
  centreText(ctx, 'Press P or ESC to keep playing', 400, '22px sans-serif', PALETTE.muted);
}

export function renderGameOver(ctx, w) {
  ctx.fillStyle = 'rgba(10, 4, 16, 0.72)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 190, 300);
  centreText(ctx, 'THE LIGHT GOES OUT', 250, 'bold 48px sans-serif', PALETTE.danger);
  centreText(ctx, `The shadows take the night on wave ${w.wave}.`, 315, '22px sans-serif', PALETTE.text);
  centreText(ctx, `Score: ${w.score}    •    Best: ${Math.max(w.best, w.score)}`, 360, 'bold 24px sans-serif', PALETTE.text);
  centreText(ctx, 'Press R or ENTER to light the lantern again', 420, '22px sans-serif', PALETTE.banner);
  centreText(ctx, 'WASD move  •  SPACE / CLICK flare  •  collect embers, mind the spitters', 462, '18px sans-serif', PALETTE.muted);
}

export function renderVictory(ctx, w) {
  ctx.fillStyle = 'rgba(20, 14, 4, 0.6)';
  ctx.fillRect(0, 0, VIEW_W, VIEW_H);
  panel(ctx, 190, 300);
  centreText(ctx, 'DAWN BREAKS — YOU WIN', 250, 'bold 46px sans-serif', PALETTE.banner);
  centreText(ctx, 'Ten waves of night, and your lantern never went out.', 315, '22px sans-serif', PALETTE.text);
  centreText(ctx, `Score: ${w.score}    •    Best: ${Math.max(w.best, w.score)}`, 360, 'bold 24px sans-serif', PALETTE.text);
  centreText(ctx, 'Press R or ENTER to play again', 420, '22px sans-serif', PALETTE.banner);
  centreText(ctx, 'Emberlight — Keeper of the Last Lantern', 462, '18px sans-serif', PALETTE.muted);
}

export function renderWorld(ctx, w, stars) {
  ctx.save();
  if (w.shake > 0) {
    ctx.translate((Math.random() - 0.5) * w.shake, (Math.random() - 0.5) * w.shake);
  }
  drawBackground(ctx, w.time, stars);
  drawPickups(ctx, w);
  drawEnemies(ctx, w);
  drawPlayer(ctx, w);
  drawParticles(ctx, w);
  ctx.restore();
  drawHud(ctx, w);
  if (w.bannerTimer > 0 && w.bannerText) {
    ctx.save();
    ctx.globalAlpha = Math.min(1, w.bannerTimer);
    centreText(ctx, w.bannerText, 130, 'bold 40px sans-serif', PALETTE.banner);
    ctx.restore();
  }
}
