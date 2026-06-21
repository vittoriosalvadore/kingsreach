# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

Kingsreach is a mobile-first, **single-file** browser roguelite RPG built on Three.js. The
entire game — geometry, textures, audio, UI, and game logic — lives in `index.html`. There is
**no build step or bundler for the game** (the only `package.json`/`node_modules` is the test
harness under `tests/`). The runtime dependencies are Three.js (v0.169.0) and opentype.js
(v1.3.4); they are **vendored locally in `./vendor`** (loaded via the importmap), so the game is
fully self-contained and runs offline. To re-vendor (e.g. to bump versions) run
`scripts/vendor-libs.sh` on a machine with internet.

## Running & checking

- **Run locally:** `python3 serve.py` serves the directory on `http://0.0.0.0:8000` with
  aggressive no-cache headers (so edits to `index.html` show up on reload). Then open the page
  in a browser. Opening `index.html` directly via `file://` also works.
- **Syntax-check before committing:** Run `node scripts/check-syntax.mjs` — it extracts the
  inline `<script type="module">` from `index.html` and runs `node --check` on it (error line
  numbers match `index.html` directly). A broken `index.html` silently fails to boot in the
  browser, so this is the cheap first safety net. Runs in CI on every push/PR that touches
  `index.html` (`.github/workflows/syntax-check.yml`). The temp artifact (`__check.mjs`) it
  writes is gitignored — never commit it.
- **Headless smoke test:** `cd tests && npm ci && npx playwright install chromium && npm test`
  boots the real game in headless Chromium and drives it through the core loop (title → town →
  road → combat → death) plus the corrupt-save hardening, asserting no console/page errors and
  no NaN stats. This is the deeper net — it catches "silently fails to boot / throws mid-loop"
  regressions a syntax check can't. The suite (`tests/smoke.spec.js`) is pinned to a specific
  Playwright version and runs in CI (`.github/workflows/smoke.yml`). It uses WebGL, so it needs
  a real browser (jsdom won't do), and the page must be served over http (ES modules don't load
  over `file://`) — Playwright's `webServer` config starts `python3 serve.py` automatically.
- **The `window.__KR` debug API** (defined at the very end of the module) is what the smoke test
  and manual debugging hook into: `G` (live game state), `step(dt)` to advance one frame, plus
  direct handles to most lifecycle functions (`startGame`, `enterTown`, `takeTheRoad`,
  `startFight`, `spawnEnemy`, `beginReveal`, etc.) and data tables (`ENEMY_TYPES`, `WEAPON_DEF`,
  `BIOMES`, `POTIONS`). Use it from the devtools console to jump into states without playing
  through. If you add a new state-transition function worth testing, export it here.

## Extracted modules (`src/`)

Modularization is in progress. The pure, dependency-free pieces have been pulled out of
`index.html` into ES modules under `src/`, imported at the top of the inline `<script type="module">`:

- **`src/helpers.js`** — `$`, `clamp`, `lerp`, `rand`, `randi`, `pick`, `chance`, `shuffle`,
  `easeOut`, `easeIn`, `ROMAN`, `toRoman`.
- **`src/data.js`** — pure data tables with no game-state/Three.js deps: `QPRESETS`, `BPRESETS`,
  `SOUL_UPG`, `BIOMES`, `TOD`, `SEASON`, `ENEMY_TYPES`, `BOSS_TYPES`, `WEAPON_DEF`, `RAR`, `SLOTS`.
  The behavior that reads these (`makeGear`, `pickEnemyType`, `applyQuality`, …) stays in `index.html`.
- **`src/state.js`** — the shared mutable run state `G` (exported as a live object binding, so every
  module shares the same instance), the run-balance constants (`ACT_NODES`, `FORK_CHANCE`,
  `ELITE_BASE`, `POTION_CAP`), `EQUIP_SLOTS`, and `recalc`/`tickBuffs`. Depends only on `data.js`
  (`WEAPON_DEF`), so no circular imports.
- **`src/meta.js`** — persistent meta-progression: `META` (live binding), `loadMeta` (with the
  corrupt-save validation that clamps every field — keep it when changing the schema), `saveMeta`,
  `SAVE_KEY`, `META_DEFAULT`. Depends only on `helpers.js` (`clamp`) and `data.js` (`SOUL_UPG`).
- **`src/audio.js`** — all procedural Web Audio: `audio(kind)`, `audioStart`, `startTownMusic`/
  `stopTownMusic`, `startShopAmbience`/`stopShopAmbience`. A call-graph leaf — nothing here reads
  game state or the scene, so it has zero imports.
- **`src/scene.js`** — the Three.js foundation: the live quality/brightness config (`Q`, `B` —
  their `.key` field tracks the current preset), `renderer`, `scene`, `camera`, `weaponScene`/
  `weaponCam`, the lights (`hemi`, `sun`, `accentLight`, `enemyKey`/`enemyRim`, `townLight`/
  `townFill`, `wkey`), the procedural `sky`/`skyUniforms`, `gameEl`/`canvas`, `bootAA`, `RETRO_W`.
  Imports only THREE + leaf modules (`helpers`, `data`); creates the GL objects on load. The big
  reconfig functions (`applyQuality`/`applyBright`) stay in `index.html` and mutate the imported
  `Q`/`B` via `Object.assign` (so don't reintroduce a separate `QKEY`/`BKEY` — use `Q.key`/`B.key`).
- **`src/textures.js`** — `TEX`, the shared procedural canvas textures (grunge/cloth/scale/bark/
  stone/metal/char/ember/wisp/wood/glow/mist/skin/hair) generated once and reused by every
  material, sprite, and FX. Imports THREE + `renderer` (for max anisotropy) only.

`scripts/check-syntax.mjs` checks these modules too; the service worker precaches them. When
extracting more, keep modules at the leaf (no imports from siblings, or only from `helpers`) to
avoid circular imports — most of the remaining code is tightly coupled to the shared mutable `G`.

## Code layout inside `index.html`

The file is `<head>` (CSS in `:root` custom props + the DOM overlays) followed by one
`<script type="module">`. It imports the `src/` modules above, then continues with the game.
The script is divided by full-width banner comments — search for `// ===` to jump between
sections. Major sections, in order:

- **helpers / data** — now imported from `src/` (see above).
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
