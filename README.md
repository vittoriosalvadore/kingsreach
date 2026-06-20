# Kingsreach

A cursed-road RPG — a mobile-first, single-file browser roguelite built on [Three.js](https://threejs.org/).

Rest in a waystation, walk the haunted road, and descend act by act through cycling biomes
(Haunted Wood → Ruined Keep → Emberdeep). Fight telegraphed enemies with **Strike / Dodge /
Smite / Potion**, chain combos for critical hits, time **perfect dodges** for bullet-time, and
slay an **act boss** before each descent.

Progress is persistent: souls harvested from each run buy permanent upgrades at the **Soul Shrine**.

## Play

Open `index.html` in a browser, or visit the hosted page. The game is self-contained — no
internet needed once you have the files.

- **Tap** / Space — Strike
- **Swipe** / ← → — Dodge
- **✦** / F — Smite (when Focus is full)
- **🧪** / Q — Potion

Graphics quality (Low/Medium/High) and Brightness are adjustable on the title screen and in town;
choices are saved to your device.

## Tech

No build step — everything (geometry, textures, audio) is generated procedurally at runtime.
The dependencies (Three.js + opentype.js) are vendored locally in `./vendor`, so the game has
no external runtime dependencies; re-vendor with `scripts/vendor-libs.sh`.
