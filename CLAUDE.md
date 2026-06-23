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
  `easeOut`, `easeIn`, `ROMAN`, `toRoman`, `shade` (hex→shaded `rgb()` string for the pixel art).
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
- **`src/audio.js`** — all procedural Web Audio: `audio(kind)` SFX, `audioStart`, `startShopAmbience`/
  `stopShopAmbience`, and the **music engine**. Music is a single-track engine (`playSong`/`stopSong`,
  one `setInterval` — starting a song auto-stops the previous, so tracks are mutually exclusive) plus
  a shared synth + orchestral voice palette (`kick`/`hat`/`snare`/`tom`/`sub`/`pluck`/`psaw`/`pad`/
  `bell`/`seqNote`/`softNote` plus `strings`/`brass`/`timp`/`pizz`/`choir`/`flute`/`harp`, pitched via
  `NOTE(n)`; arrange with `seqc`/`rep`). Every track is built by the shared
  `makeSong({ms,bars,chords,bass,lead,mode,arp,leadV,orch,bassline,fills,harmony,reverb,...})` helper:
  the bed (pad + chord-tone arpeggio + bass) is built **only from the current chord's notes** so it
  stays coherent (never "random"), while a hand-written foreground `lead` array carries the melody.
  Leads are arranged **A-A-B-A** (a main hook + a contrasting B-phrase answer, both over the same
  cycling chords) instead of pure repetition. Chords are triads, but appending a 4th tone makes them
  7th chords (`pad`/arp read `c[3]` when present — used for the cozy/sad tracks). Combat tracks carry
  a moving `bassline` (16-step offsets from the bar root) + phrase-end drum `fills`; all music routes
  through a shared convolution `reverb` whose depth is set per track (chill wetter, combat drier;
  `ASTRAL` pins `reverb:0` to stay dry). **Each track is deliberately distinct** — its own chord
  progression (reuse notes, never copy another track's progression), its own `leadV` lead instrument
  (e.g. `choir`/`bell`/`saw`/`brass`/`strings`/`pluck`/`flute`/`psaw`/`soft`), its own `arp` motor,
  and its own `orch` accent flavor (`'strings'`/`'brass'`/`'choir'`/`'timpani'`/`'harp'`/`'flute'`,
  fired only at each 4-bar phrase start — a touch, not a full orchestra). Combat tracks use
  `mode:'drive'`/`'march'` (synthwave); chill tracks `'soft'`/`'calm'`. `ASTRAL` is the loved
  atmospheric one — leave it as-is (it uses the legacy `orch:true` blend, kept working by a fallback
  branch in the accent block). Tracks `MENU`, `TOWN`, `BATTLE`, `BOSS`, `LAMENT`, `FOREST`, `MORNING`,
  `EMBER`, `ASTRAL`, each `{ms,len,voice(t,s)}`, exported as `start*Music`/`stop*Music`. `musicSelfTest()` runs every song's `voice` across a full loop (used by the smoke
  test to catch runtime errors). The game wires these in `index.html`: the title shows the in-game
  **Jukebox** (audition any track) and combat picks a per-biome road theme via `roadMusic()`; boss
  fights use `BOSS`. A call-graph leaf — nothing here reads game state or the scene, so it has zero imports.
- **`src/scene.js`** — the Three.js foundation: the live quality/brightness config (`Q`, `B` —
  their `.key` field tracks the current preset), `renderer`, `scene`, `camera`, `weaponScene`/
  `weaponCam`, the lights (`hemi`, `sun`, `accentLight`, `enemyKey`/`enemyRim`, `townLight`/
  `townFill`, `wkey`), the procedural `sky`/`skyUniforms`, `gameEl`/`canvas`, `bootAA`, `RETRO_W`.
  Imports only THREE + leaf modules (`helpers`, `data`); creates the GL objects on load. Also hosts
  the shared `mat()` material factory and `csshex` colour helper used by props/sprites/enemies/
  viewmodels/interiors. The big reconfig functions (`applyQuality`/`applyBright`) stay in `index.html`
  and mutate the imported `Q`/`B` via `Object.assign` (so don't reintroduce a separate `QKEY`/`BKEY`
  — use `Q.key`/`B.key`).
- **`src/textures.js`** — `TEX`, the shared procedural canvas textures (grunge/cloth/scale/bark/
  stone/metal/char/ember/wisp/wood/glow/mist/skin/hair) generated once and reused by every
  material, sprite, and FX. Imports THREE + `renderer` (for max anisotropy) only.
- **`src/fx.js`** — scene effects: ambient `motes`, the spark/ash particle pool (`burst`/`updateFX`),
  ground `shock`wave, the enemy attack `updateTelegraph`, ambient `weather` (+ the live `WX` config),
  drifting `mist`, and the weapon `slashArc`. Imports the scene/state/texture foundations + helpers/
  data. The combat/loop code calls `burst`/`shock`/the `update*` functions.
- **`src/gear.js`** — loot generation: `rollRarity`, `makeWeaponItem`, `makeGear`, `genGear`, and the
  stat-display helpers (`statShort`/`statRows`). Pure logic over the data tables — imports only
  `helpers` + `data` (`RAR`/`SLOTS`/`WEAPON_DEF`).
- **`src/props.js`** — the hand-drawn 16-bit prop billboards (trees/rocks/mushrooms/pillars/walls/
  torches/spires/bones/braziers/lava) and the per-biome builders (`PROP_FN`). Pure canvas/THREE
  drawing — imports only THREE + helpers. Exports `PROP_FN` (used by `generateAhead`) and `PX`, the
  pixel-plot helper reused by the enemy/villager sprites. The world streamer (`generateAhead`/
  `buildLandmark`/`PROP_POOL`) stays in `index.html` since it needs `mat`/`curBiome`.
- **`src/villagers.js`** — the recolorable hand-pixel villager figure builders (the `drawVillager*`
  archetypes, `villagerSprite`, `VILLAGER_PAL`, `CROWD_POOL`, `buildNpcFig` for shop NPCs). Pure
  drawing: THREE + `mat` (scene) + `TEX` (textures) + `PX` (props) + helpers. The town-construction
  code that *places* them (`townCrowdFig`, the `buildTownVillage` IIFE) stays in `index.html`
  because it wires into `townGroup`/`townHouse`/`townCrowd`.

- **`src/icons.js`** — hand-coded pixel-art **UI icons** rendered as crisp inline SVG, so the DOM
  menus match the 16-bit look instead of using OS emoji (which differ per device). Each icon is a
  char-grid + palette (same format as the canvas HUD `_blit` icons). `uiIcon(name, px)` returns an
  `<svg>` string for use in `innerHTML`; `PXI` is the registry; `ALIAS` maps semantic names. Data
  tables store an icon **name** (e.g. `icon:'anvil'`) and render sites call `uiIcon(...)`. Item icons
  are special-cased in `index.html` (`itemIconHTML`): weapons reuse their actual pixel sprite
  (`weaponIconURL`), gear uses a slot glyph (`SLOT_ICON`). Pure & dependency-free.

`scripts/check-syntax.mjs` checks these modules too; the service worker precaches them. When
extracting more, keep modules at the leaf (no imports from siblings, or only from `helpers`) to
avoid circular imports — most of the remaining code is tightly coupled to the shared mutable `G`.

## Adding biome content

Acts cycle through the 7 `BIOMES` (a shuffled order; act 1 is always biome 0). To give a biome
its own identity:

- **Enemy:** add an entry to `ENEMY_TYPES` (`src/data.js`) with `biome:<index in BIOMES>` —
  `pickEnemyType` filters the roster by the current biome index, falling back to the whole roster
  if none match. New attack patterns are a new entry in the `BEHAVIOR` dispatch table in
  `index.html` (signature `(e,g,dt,tz)`; drive `e.windup`/`e.atkT`, call `enemyHit`/FX). Player
  debuffs follow the `applyHex`/`applyChill` model (check `G.iframes` → `perfectDodge` first).
- **Sprite:** `t.shape` is switched in two places in `index.html` (the 2.5D billboard draw and
  `buildEnemyMesh`); alias a new shape onto an existing branch for a quick recolor, or add a branch.
- **Boss:** add to `BOSS_TYPES` keyed by **biome name** (`bossType` prefers name → prop → forest).
- **Props:** add a `PROP_FN.<key>` builder in `src/props.js` and a `buildLandmark` branch in
  `index.html`, then point the biome's `prop` field at the new key.

Frostfen is the worked example (Frostbound Revenant + `frost` behavior + Chill debuff + Hoarfrost
Warden boss + ice props). The smoke suite forces the Frostfen act to exercise it.

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

- **Direction:** the game is pivoting from roguelite to a **persistent action-RPG** — a grim
  pilgrimage down the cursed road to break the dead kings' curse. No permadeath: a fatal blow
  sends `die()` → the death overlay → `reviveAtWaystation()`, which heals and returns you to town
  with act/gear/gold intact (you only lose the leg's ground). Biome order is a **fixed narrative
  route** (`rollBiomeOrder` → `[0,1,2,3,5,4,6]`), not shuffled. The pilgrimage **persists to disk**
  (`meta.js`: `saveJourney`/`loadJourney`/`clearJourney`, key `kingsreach_journey_v1`, validated like
  `loadMeta`): `enterTown`/`equipItem` save a `journeySnapshot()` (act/gold/gear/potions), and the
  title shows **CONTINUE** when a save exists (`continueJourney`) vs **NEW PILGRIMAGE** (`newPilgrimage`,
  which clears it).
- **Narrative (grim & solemn):** you are a nameless pilgrim charged by the last living King to break
  the curse; the road wakes powers in you (diegetic frame for Smite/souls). Voice lives in: the title
  intro, the `NPCS[].lines` + the Grey Herald's charge lore (`talkNPC`), a per-biome `beat` line on
  each `BIOMES` entry shown in the reveal cutscene (`revealSub`), and a guardian intro `flashLog` on
  boss spawn. Keep in-game copy English; keep the voice grim/Souls-like when extending it.
- **Awakenings (signature powers):** slaying a biome's guardian grants that land's power (`BIOMES[].awaken`
  → an id in the `POWERS` table in `index.html`; granted in `killEnemy`, stored in `G.awakenings`,
  persisted in the journey). Active powers fire via `onPower()` (the ❄ POWER button / key **R**) on a
  `G.powerCd` cooldown. Frostfen's **Rimebrand** is the worked example: freezes the foe (`e.frozenT`,
  honoured by an early-return in `updateEnemy`), cancels its windup, and chips frost damage. To add
  one: set `awaken:'<id>'` on the biome and add a `POWERS.<id>` entry with `{name,icon,cd,use()}`.
- **Lesser awakenings (minor passives):** the Forgotten Shrine sometimes wakes a small *permanent*
  passive in you (`LESSER_AWAKENINGS` in `index.html` — e.g. +crit, +regen, +lifesteal), distinct from
  the guardians' active powers. Stored as ids in `G.passives`; `applyPassives()` recomputes `G.passBonus`
  (in `state.js`) which `recalc` folds into the derived stats; persisted with the journey
  (`journeySnapshot`/`loadJourney`). `openShrine` rolls ~55% a lesser-awakening choice vs an old stat
  `SHRINES` bargain. Add one: append to `LESSER_AWAKENINGS` with `{id,name,icon,stat:{...},desc}`.
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
- **`localStorage` keys:** `kingsreach_save_v1` (meta save), `kingsreach_journey_v1` (the persistent
  pilgrimage), `kr_quality`, `kr_bright`. Bump the key suffix and keep the matching validation
  (`loadMeta` / `loadJourney`) in sync if you change either schema.
- **No external state** beyond `localStorage`; the game is fully client-side and offline-capable
  once the CDN scripts are cached.

## Git workflow

Develop on the designated feature branch, commit with descriptive messages, and push with
`git push -u origin <branch>`. Commit messages in this repo follow a terse, descriptive style
(e.g. "Fix: town/shop panels were opaque walls hiding the 3D scene"). Do not create pull
requests unless explicitly asked.
