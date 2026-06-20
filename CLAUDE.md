# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kingsreach is a mobile-first, **single-file** browser roguelite RPG built on Three.js. The
entire game — geometry, textures, audio, UI, and game logic — lives in `index.html`. There is
**no build step, no bundler, no package.json, and no `node_modules`**. The only runtime
dependencies are Three.js (v0.169.0) and opentype.js (v1.3.4), both loaded from CDN, so the
game needs internet access to run.

## Running & checking

- **Run locally:** `python3 serve.py` serves the directory on `http://0.0.0.0:8000` with
  aggressive no-cache headers (so edits to `index.html` show up on reload). Then open the page
  in a browser. Opening `index.html` directly via `file://` also works.
- **Syntax-check before committing:** there is no test suite. Run `node scripts/check-syntax.mjs`
  — it extracts the inline `<script type="module">` from `index.html` and runs `node --check` on
  it (error line numbers match `index.html` directly). A broken `index.html` silently fails to
  boot in the browser, so this is the cheap safety net. The same check runs in CI on every push
  /PR that touches `index.html` (`.github/workflows/syntax-check.yml`). The temp artifact
  (`__check.mjs`) it writes is gitignored — never commit it.
- **Smoke-test in-browser:** the game exposes a debug API on `window.__KR` (defined at the very
  end of the module). It includes `G` (live game state), `step(dt)` to advance one frame, and
  direct handles to most lifecycle functions (`startGame`, `enterTown`, `startFight`,
  `spawnEnemy`, `beginReveal`, etc.) plus data tables (`ENEMY_TYPES`, `WEAPON_DEF`, `BIOMES`,
  `POTIONS`). Use it from the devtools console to jump into states without playing through.

## Code layout inside `index.html`

The file is `<head>` (CSS in `:root` custom props + the DOM overlays) followed by one
`<script type="module">` (starts ~line 446). The script is divided by full-width banner
comments — search for `// ===` to jump between sections. Major sections, in order:

- **helpers** — `$`, `clamp`, `lerp`, `rand`, `pick`, `chance`, etc. Used everywhere.
- **graphics quality / brightness** — `QPRESETS` (low/medium/high) and `BPRESETS`. `Q` is the
  live quality object; quality gates particle counts, fog, draw distance, AA, bloom, slash FX.
- **persistent meta-progression** — `META` (souls bank, records, permanent `SOUL_UPG`
  upgrades), persisted to `localStorage`. `loadMeta()` **validates and clamps every field**
  because a corrupt/tampered save must never produce `NaN` stats (NaN HP is never `<= 0`, which
  would make the player unkillable). Preserve this validation when touching the schema.
- **biomes** — `BIOMES` table (sky/fog/sun/accent/weather per biome). Acts cycle through a
  shuffled biome order (`rollBiomeOrder`, `biomeForAct`).
- **renderer/scene/bloom** — Three.js setup. Bloom is High-tier only and degrades gracefully if
  the addon fails to load (`bloomReady`).
- **procedural assets** — ground/path, props, canvas-generated material textures (built once and
  shared), motes, particle FX, shockwaves, telegraphs, weather, mist, damage numbers. Almost
  everything visual is generated at runtime; there are no asset files.
- **pixel-art layer** — hand-authored bitmap font (5x7 glyphs compiled into a real font via
  opentype.js), pixel HUD chrome, recolorable villager billboards, 2.5D enemy sprites, weapon
  viewmodels. The game deliberately renders the 3D world at low (16-bit) resolution for a retro
  look.
- **game state** — `G`, the single mutable global holding all run state (position, hp, act,
  equipment, combat timers, combo, buffs, etc.). `recalc()` recomputes derived stats
  (`G.atk`, `G.maxHp`, `G.def`, `G.speed`...) from equipment + permanent + temp buffs; **call it
  after any change to `G.equip`, `G.tempBuffs`, or perm stats.**
- **gear generation / potions / HUD / input** — loot rolling, potion defs, HUD rendering,
  pointer/keyboard/swipe input.
- **combat** — strike/dodge/smite resolution, enemy AI, projectiles, perfect-dodge bullet-time,
  combos, crits, act bosses.
- **the crossroads / town hub / biome-reveal cutscene** — node graph between fights, the
  waystation hub (shops, inn, soul shrine), and the act-transition cutscene.
- **overlays/lifecycle** — `startGame`, `die`, and `show`/`hide`/`hideAllOverlays` for the DOM
  overlay panels (title, death, loot, fork, shop, catalog, event, dialogue, town, soul, gear).
- **audio** — procedural Web Audio (no audio files).
- **loop / boot** — `frame` → `update(dt)` → `render()`, then the boot sequence at the bottom.

## Architecture notes & conventions

- **State machine:** `G.state` is the single source of truth for what mode the game is in:
  `title`, `town`, `interior` (shop), `travel`, `combat`, `reveal` (act cutscene), `dead`. The
  `update` loop and camera behavior branch on it. Transitions go through the lifecycle functions
  (`enterTown`, `takeTheRoad`, `arriveAtNode`, `startFight`, `beginReveal`/`endReveal`, `die`).
- **The world scrolls, the player doesn't:** on the road, `G.z` decreases and the ground/path
  meshes and textures are repositioned/offset around the camera; `generateAhead()` streams props
  into a recycled `PROP_POOL` and disposes them behind the camera.
- **Performance is load-bearing.** This targets mobile. The codebase goes out of its way to
  avoid per-frame allocations (note the shared scratch `THREE.Color` `_lc` reused across all
  per-frame tint lerps to avoid GC stutter). When editing the `update` loop, do not allocate
  objects/arrays/colors per frame — reuse scratch objects and pools. Respect the `Q.*` quality
  gates rather than always rendering full fidelity.
- **Everything is procedural & shared.** Textures and geometry are generated once and reused.
  Dispose Three.js resources you remove from the scene (see `disposeProp`).
- **`localStorage` keys:** `kingsreach_save_v1` (meta save), `kr_quality`, `kr_bright`. Bump the
  save key suffix and keep `loadMeta` validation in sync if you change the meta schema.
- **No external state** beyond `localStorage`; the game is fully client-side and offline-capable
  once the CDN scripts are cached.

## Git workflow

Develop on the designated feature branch, commit with descriptive messages, and push with
`git push -u origin <branch>`. Commit messages in this repo follow a terse, descriptive style
(e.g. "Fix: town/shop panels were opaque walls hiding the 3D scene"). Do not create pull
requests unless explicitly asked.
