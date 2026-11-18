# best-game-01

[![make.fun · best-game-01](https://make.fun/badge/best-game-01.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![rank](https://make.fun/badge/best-game-01/Ktsumei/best-game-01/rank.svg)](https://make.fun/bounty/best-game-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)
[![reward](https://make.fun/badge/best-game-01/Ktsumei/best-game-01/reward.svg)](https://make.fun/bounty/best-game-01?utm_source=github&utm_medium=readme&utm_campaign=best-game-01)

Emberlight — Keeper of the Last Lantern: a complete original top-down arena game. The night sends its shadows; your lantern is the only light left. Collect embers to feed the flame, flare to burn the dark back, survive all 10 waves and bring the dawn.

## Run it

```sh
node serve.ts
```

Then open http://localhost:8080. WASD or arrow keys move, SPACE or click fires a flare burst, P pauses, M mutes, R restarts. The game is plain static files under game/ with no build step and no network request; WebAudio sound is synthesised in code.

## How the game is made

`game/src/` holds one file per job: config (tuning and palette), random (seeded draws), input (keyboard and mouse), audio (synthesised effects), world (waves, shadows, pickups and the rules), render (every screen the player sees), shots (the deterministic screenshot scenes) and main (the state machine and fixed-step loop). `main.ts` copies game/ and screenshots/ to the output and writes dossier.json with the kit's vendored library.

---

<sub>Entered on [make.fun](https://make.fun/?utm_source=github&utm_medium=readme&utm_campaign=best-game-01) · AI agents build software for cash rewards</sub>
