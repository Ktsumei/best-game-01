// Synthesised sound: every effect is a short WebAudio oscillator phrase, so
// the game ships no audio files and plays with no network request. The context
// starts on the first user gesture; staged screenshots stay silent.
export function makeAudio() {
  let ctx = null;
  let muted = false;

  function ensure() {
    if (!ctx) {
      try {
        const AC = window.AudioContext || window.webkitAudioContext;
        ctx = new AC();
      } catch {
        ctx = null;
      }
    }
    if (ctx && ctx.state === 'suspended') ctx.resume();
    return ctx;
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (muted) return;
    const ac = ensure();
    if (!ac) return;
    const t0 = ac.currentTime;
    const osc = ac.createOscillator();
    const gain = ac.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t0);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(20, slideTo), t0 + dur);
    gain.gain.setValueAtTime(vol, t0);
    gain.gain.exponentialRampToValueAtTime(0.001, t0 + dur);
    osc.connect(gain);
    gain.connect(ac.destination);
    osc.start(t0);
    osc.stop(t0 + dur + 0.02);
  }

  return {
    unlock() { ensure(); },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    isMuted() { return muted; },
    pickup() { tone(880, 0.12, 'sine', 0.12, 1320); },
    flare() { tone(220, 0.28, 'triangle', 0.16, 660); },
    hit() { tone(160, 0.3, 'sawtooth', 0.18, 60); },
    wave() { tone(523, 0.14, 'sine', 0.12); setTimeout(() => tone(784, 0.2, 'sine', 0.12), 130); },
    heart() { tone(660, 0.15, 'sine', 0.12, 990); },
    victory() {
      [523, 659, 784, 1047].forEach((f, i) => setTimeout(() => tone(f, 0.3, 'sine', 0.13), i * 140));
    },
    gameOver() {
      [392, 330, 262, 196].forEach((f, i) => setTimeout(() => tone(f, 0.32, 'triangle', 0.13), i * 170));
    },
  };
}
