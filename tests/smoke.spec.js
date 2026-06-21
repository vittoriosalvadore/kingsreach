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

  // Force a fall -> 'dead' beat, souls banked (no permadeath).
  const actAtFall = await page.evaluate(() => window.__KR.G.act);
  await page.evaluate(() => { window.__KR.G.hp = 0; window.__KR.step(0.016); });
  expect((await snapshot(page)).state).toBe('dead');
  const saved = await page.evaluate(() => JSON.parse(localStorage.getItem('kingsreach_save_v1')));
  expect(saved).toBeTruthy();
  expect(Number.isFinite(saved.souls)).toBe(true);

  // The curse denies death: rising returns you to the waystation with progress intact.
  await page.evaluate(() => window.__KR.reviveAtWaystation());
  const after = await page.evaluate(() => ({ state: window.__KR.G.state, act: window.__KR.G.act, hp: window.__KR.G.hp, maxHp: window.__KR.G.maxHp }));
  expect(after.state).toBe('town');
  expect(after.act).toBe(actAtFall);          // act/progress kept
  expect(after.hp).toBe(after.maxHp);          // healed at the waystation

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

test('town shops generate wares without errors', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);
  await page.evaluate(() => window.__KR.startGame());
  expect((await snapshot(page)).state).toBe('town');

  // Open every shop catalog — the weapon shop rolls one of each WEAPON_DEF,
  // which is the path that previously crashed on weapons with no name pool.
  for (const type of ['armor', 'weapon', 'trinket', 'potion']) {
    await page.evaluate(t => window.__KR.openShopCatalog(t), type);
    expect((await snapshot(page)).state).toBe('shop');
  }
  await page.evaluate(() => window.__KR.backToTown());
  expect((await snapshot(page)).state).toBe('town');

  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});

test('loot, potions, boss fight, and act transition run cleanly', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);
  await page.evaluate(() => window.__KR.startGame());

  // Loot generation (genGear -> present card).
  const loot = await page.evaluate(() => {
    window.__KR.openLoot();
    const G = window.__KR.G;
    return { state: G.state, has: !!G.pendingLoot, value: G.pendingLoot && G.pendingLoot.value };
  });
  expect(loot.state).toBe('loot');
  expect(loot.has).toBe(true);
  expect(Number.isFinite(loot.value)).toBe(true);

  // Potions: grant one and drink it.
  const potion = await page.evaluate(() => {
    const G = window.__KR.G;
    G.potions.push(window.__KR.POTIONS[0]);
    const before = G.potions.length;
    window.__KR.usePotion(0);
    return { before, after: G.potions.length, hp: G.hp };
  });
  expect(potion.after).toBe(potion.before - 1);
  expect(Number.isFinite(potion.hp)).toBe(true);

  // Boss fight.
  await page.evaluate(() => window.__KR.spawnEnemy('boss'));
  let g = await page.evaluate(() => {
    const G = window.__KR.G;
    return { state: G.state, boss: !!(G.enemy && G.enemy.boss), hp: G.enemy ? G.enemy.hp : null };
  });
  expect(g.state).toBe('combat');
  expect(g.boss).toBe(true);
  expect(g.hp).toBeGreaterThan(0);
  await step(page, 300);

  // Act-transition cutscene -> back to town at the next act.
  const actBefore = await page.evaluate(() => window.__KR.G.act);
  await page.evaluate(() => window.__KR.beginReveal());
  expect((await snapshot(page)).state).toBe('reveal');
  const landed = await page.evaluate(() => {
    for (let i = 0; i < 4000; i++) { window.__KR.step(0.016); if (window.__KR.G.state === 'town') return i; }
    return -1;
  });
  expect(landed).toBeGreaterThanOrEqual(0);
  g = await page.evaluate(() => ({ state: window.__KR.G.state, act: window.__KR.G.act }));
  expect(g.state).toBe('town');
  expect(g.act).toBe(actBefore + 1);

  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});

// Each themed biome: its signature foe + act boss use the expected behavior and
// run combat without errors. (Frostfen also exercises the Chill debuff.)
for (const b of [
  { name: 'Frostfen', behavior: 'frost' },
  { name: 'Astral Verge', behavior: 'blink' },
  { name: 'Bloodmoon Grove', behavior: 'leech' },
  { name: 'Gilded Sanctum', behavior: 'avarice' },
]) {
  test(`${b.name}: signature foe + act boss (${b.behavior}) run cleanly`, async ({ page }) => {
    const errors = collectErrors(page);
    await page.goto('/index.html');
    await waitForBoot(page);
    await page.evaluate(() => window.__KR.startGame());

    // Jump to this biome's act, then spawn its signature foe.
    const info = await page.evaluate((name) => {
      const KR = window.__KR; let act = -1;
      for (let a = 1; a <= 7; a++) { KR.G.act = a; if (KR.curBiome().name === name) { act = a; break; } }
      if (act < 0) return { act };
      KR.G.state = 'travel'; KR.spawnEnemy('normal');
      return { act, behavior: KR.G.enemy && KR.G.enemy.behavior };
    }, b.name);
    expect(info.act).toBeGreaterThan(0);
    expect(info.behavior).toBe(b.behavior);

    await page.evaluate(() => { for (let i = 0; i < 220; i++) window.__KR.step(0.016); });
    expect(Number.isFinite((await snapshot(page)).hp)).toBe(true);

    // The act boss builds + fights with the same signature behavior.
    await page.evaluate(() => { const KR = window.__KR; KR.G.hp = KR.G.maxHp; KR.spawnEnemy('boss'); });
    const boss = await page.evaluate(() => ({ isBoss: !!(window.__KR.G.enemy && window.__KR.G.enemy.boss),
      behavior: window.__KR.G.enemy && window.__KR.G.enemy.behavior }));
    expect(boss.isBoss).toBe(true);
    expect(boss.behavior).toBe(b.behavior);
    await page.evaluate(() => { for (let i = 0; i < 140; i++) window.__KR.step(0.016); });
    expect(Number.isFinite((await snapshot(page)).hp)).toBe(true);

    expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
  });
}


test('the pilgrimage persists across reloads', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);

  // Begin a run, advance the journey, and save it at the waystation.
  await page.evaluate(() => {
    const KR = window.__KR; KR.startGame();
    KR.G.act = 3; KR.G.gold = 137; KR.G.kills = 9; KR.G.potions.push(KR.POTIONS[0]);
    KR.persistJourney();
  });

  // Reload (new page load) — the saved pilgrimage must survive and restore intact.
  await page.reload();
  await waitForBoot(page);
  const saved = await page.evaluate(() => window.__KR.loadJourney());
  expect(saved).toBeTruthy();
  expect(saved.act).toBe(3);

  await page.evaluate(() => window.__KR.continueJourney());
  const g = await page.evaluate(() => ({ state: window.__KR.G.state, act: window.__KR.G.act,
    gold: window.__KR.G.gold, kills: window.__KR.G.kills, hp: window.__KR.G.hp }));
  expect(g.state).toBe('town');
  expect(g.act).toBe(3);
  expect(g.gold).toBe(137);
  expect(g.kills).toBe(9);
  expect(Number.isFinite(g.hp)).toBe(true);

  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});

test('Awakenings: Rimebrand freezes the foe, has a cooldown, and persists', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);
  await page.evaluate(() => window.__KR.startGame());

  // Grant the Frostfen power, enter combat with a foe mid-windup, and unleash it.
  const r = await page.evaluate(() => {
    const KR = window.__KR;
    KR.G.awakenings.push('rimebrand');
    KR.G.state = 'travel'; KR.spawnEnemy('normal');
    const e = KR.G.enemy; const hp0 = e.hp; e.windup = e.tel;   // foe is winding up an attack
    KR.onPower();
    return { active: !!KR.activePower(), windup: KR.G.enemy.windup, frozen: KR.G.enemy.frozenT,
      cd: KR.G.powerCd, dmg: hp0 - KR.G.enemy.hp };
  });
  expect(r.active).toBe(true);
  expect(r.windup).toBe(0);                 // the attack was cancelled
  expect(r.frozen).toBeGreaterThan(0);      // foe is frozen
  expect(r.cd).toBeGreaterThan(0);          // power went on cooldown
  expect(r.dmg).toBeGreaterThan(0);         // and it chipped the foe

  // A frozen foe runs its frames without error.
  await page.evaluate(() => { for (let i = 0; i < 120; i++) window.__KR.step(0.016); });
  expect(Number.isFinite((await snapshot(page)).hp)).toBe(true);

  // Awakenings persist across a reload.
  await page.evaluate(() => window.__KR.persistJourney());
  await page.reload(); await waitForBoot(page);
  const saved = await page.evaluate(() => window.__KR.loadJourney());
  expect(saved.awakenings).toContain('rimebrand');

  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});

test('a corrupt save never yields NaN stats', async ({ page }) => {
  const errors = collectErrors(page);
  await page.goto('/index.html');
  await waitForBoot(page);

  // Tamper with BOTH saves (meta + journey) with wrong types / junk, then reload.
  await page.evaluate(() => {
    localStorage.setItem('kingsreach_save_v1', JSON.stringify({
      souls: 'NaNNN', runs: -5, totalKills: {}, best: 'nope', upg: { hp: '9999', atk: [], potion: 99 } }));
    localStorage.setItem('kingsreach_journey_v1', JSON.stringify({
      v: 1, act: 'NaN', gold: [], kills: {}, weaponType: 'bogus',
      equip: { weapon: { wtype: 'nope', atk: 'x' }, armor: 42, trinket: { slot: 'trinket', crit: 'y' } }, potionIds: [1, 'heal', null] }));
  });
  await page.reload();
  await waitForBoot(page);

  // A corrupt journey must coerce to safe values, not brick continueJourney().
  await page.evaluate(() => window.__KR.continueJourney());
  let g = await snapshot(page);
  expect(g.state).toBe('town');
  expect(Number.isFinite(g.hp)).toBe(true);
  expect(Number.isFinite(g.maxHp)).toBe(true);
  expect(Number.isFinite(g.atk)).toBe(true);

  // And a fresh start is always clean.
  await page.evaluate(() => window.__KR.newPilgrimage());
  g = await snapshot(page);
  expect(g.state).toBe('town');
  expect(g.hp).toBeGreaterThan(0);
  expect(errors, 'no console/page errors:\n' + errors.join('\n')).toEqual([]);
});
