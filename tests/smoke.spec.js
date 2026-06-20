// Headless smoke tests for Kingsreach.
//
// The game exposes a debug API on `window.__KR` (game state `G`, a `step(dt)`
// that runs one update+render frame, and the lifecycle functions). These tests
// drive the real state machine through it and assert the game boots, advances,
// and never produces uncaught errors or NaN stats — the failure modes that
// silently brick a build-less single-file game.
const { test, expect } = require('@playwright/test');

// Capture console.error + uncaught page errors for the whole page lifetime.
function collectErrors(page) {
  const errors = [];
  page.on('console', m => { if (m.type() === 'error') errors.push('console.error: ' + m.text()); });
  page.on('pageerror', e => errors.push('pageerror: ' + (e.stack || e.message)));
  return errors;
}

const waitForBoot = page =>
  page.waitForFunction(() => !!(window.__KR && window.__KR.G), null, { timeout: 30_000 });

// A flat, serializable view of the live game state.
const snapshot = page => page.evaluate(() => {
  const G = window.__KR.G;
  return {
    state: G.state, hp: G.hp, maxHp: G.maxHp, atk: G.atk, def: G.def,
    gold: G.gold, depth: G.depth, hasEnemy: !!G.enemy, enemyHp: G.enemy ? G.enemy.hp : null,
  };
});

const step = (page, n) => page.evaluate(frames => {
  for (let i = 0; i < frames; i++) window.__KR.step(0.016);
}, n);

test('boots, walks the road into combat, and dies cleanly', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);

  // Title screen.
  expect((await snapshot(page)).state).toBe('title');

  // Start a run -> the waystation town. Stats must be finite and positive.
  await page.evaluate(() => window.__KR.startGame());
  let g = await snapshot(page);
  expect(g.state).toBe('town');
  for (const v of [g.hp, g.maxHp, g.atk, g.def, g.gold]) expect(Number.isFinite(v)).toBe(true);
  expect(g.hp).toBeGreaterThan(0);
  expect(g.maxHp).toBeGreaterThan(0);
  expect(g.atk).toBeGreaterThan(0);

  // Take the road -> travel.
  await page.evaluate(() => window.__KR.takeTheRoad());
  expect((await snapshot(page)).state).toBe('travel');

  // Step the loop; the first node deterministically starts a fight.
  const framesToCombat = await page.evaluate(() => {
    for (let i = 0; i < 3000; i++) { window.__KR.step(0.016); if (window.__KR.G.state === 'combat') return i; }
    return -1;
  });
  expect(framesToCombat).toBeGreaterThanOrEqual(0);
  g = await snapshot(page);
  expect(g.state).toBe('combat');
  expect(g.hasEnemy).toBe(true);
  expect(g.enemyHp).toBeGreaterThan(0);

  // Run a stretch of combat frames (enemy AI, telegraphs, projectiles).
  await step(page, 600);
  expect(Number.isFinite((await snapshot(page)).hp)).toBe(true);

  // Force death -> clean transition + persisted, valid meta-progression.
  await page.evaluate(() => { window.__KR.G.hp = 0; window.__KR.step(0.016); });
  expect((await snapshot(page)).state).toBe('dead');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kingsreach_save_v1')));
  expect(saved).toBeTruthy();
  expect(Number.isFinite(saved.runs)).toBe(true);
  expect(saved.runs).toBeGreaterThanOrEqual(1);
  expect(Number.isFinite(saved.souls)).toBe(true);

  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});

test('every weapon and quality preset applies without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);

  await page.evaluate(() => {
    for (const key of Object.keys(window.__KR.WEAPON_DEF)) { window.__KR.setWeapon(key); window.__KR.recalc(); }
    for (const q of ['low', 'medium', 'high']) window.__KR.applyQuality(q);
  });
  expect(Number.isFinite((await snapshot(page)).atk)).toBe(true);
  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});

test('a corrupt save never yields NaN stats', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);

  // Tamper with the save (wrong types, out-of-range, junk) and reload.
  await page.evaluate(() => localStorage.setItem('kingsreach_save_v1', JSON.stringify({
    souls: 'NaNNN', runs: -5, totalKills: {}, best: 'nope', upg: { hp: '9999', atk: [], potion: 99 },
  })));
  await page.reload();
  await waitForBoot(page);

  await page.evaluate(() => window.__KR.startGame());
  const g = await snapshot(page);
  expect(g.state).toBe('town');
  expect(Number.isFinite(g.hp)).toBe(true);
  expect(Number.isFinite(g.maxHp)).toBe(true);
  expect(g.hp).toBeGreaterThan(0);
  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});
