// Keyboard and mouse input. Held keys steer the keeper; one-shot presses
// (start, flare, pause, restart, mute) are consumed once by the game loop.
export const ACTION_START = 1;
export const ACTION_FLARE = 2;
export const ACTION_PAUSE = 4;
export const ACTION_RESTART = 8;
export const ACTION_MUTE = 16;

export function makeInput(canvas) {
  const keys = new Set();
  let pressed = 0;
  let mouseX = 0;
  let mouseY = 0;
  let mouseDown = false;

  function keyName(e) {
    return e.key.length === 1 ? e.key.toLowerCase() : e.key;
  }

  window.addEventListener('keydown', (e) => {
    const k = keyName(e);
    if (['arrowup', 'arrowdown', 'arrowleft', 'arrowright', ' '].includes(k)) e.preventDefault();
    if (e.repeat) return;
    keys.add(k);
    if (k === 'enter' || k === ' ') pressed |= ACTION_START;
    if (k === ' ' || k === 'f') pressed |= ACTION_FLARE;
    if (k === 'p' || k === 'escape') pressed |= ACTION_PAUSE;
    if (k === 'r') pressed |= ACTION_RESTART;
    if (k === 'm') pressed |= ACTION_MUTE;
  });
  window.addEventListener('keyup', (e) => keys.delete(keyName(e)));
  window.addEventListener('blur', () => keys.clear());

  canvas.addEventListener('mousemove', (e) => {
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
  });
  canvas.addEventListener('mousedown', (e) => {
    mouseDown = true;
    pressed |= ACTION_FLARE;
    const r = canvas.getBoundingClientRect();
    mouseX = ((e.clientX - r.left) / r.width) * canvas.width;
    mouseY = ((e.clientY - r.top) / r.height) * canvas.height;
    e.preventDefault();
  });
  window.addEventListener('mouseup', () => { mouseDown = false; });

  return {
    // Normalised steering direction from WASD or arrow keys.
    steer() {
      let x = 0;
      let y = 0;
      if (keys.has('a') || keys.has('arrowleft')) x -= 1;
      if (keys.has('d') || keys.has('arrowright')) x += 1;
      if (keys.has('w') || keys.has('arrowup')) y -= 1;
      if (keys.has('s') || keys.has('arrowdown')) y += 1;
      if (x !== 0 && y !== 0) {
        const inv = 1 / Math.hypot(x, y);
        x *= inv;
        y *= inv;
      }
      return { x, y };
    },
    mouse() { return { x: mouseX, y: mouseY, down: mouseDown }; },
    // One-shot presses since the last call; reading clears them.
    takePressed() {
      const p = pressed;
      pressed = 0;
      return p;
    },
    // Scripted steering for staged screenshots: drive the keeper in a slow
    // circle so the scene reads as play in progress.
    scriptedSteer(time) {
      return { x: Math.cos(time * 0.6), y: Math.sin(time * 0.6) * 0.7 };
    },
  };
}
