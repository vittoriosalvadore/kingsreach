// Pure data tables (no game-state or Three.js dependencies). Behavior that
// reads these (recalc, makeGear, pickEnemyType, applyQuality, ...) stays in
// index.html and imports them. Extracted as part of modularizing the single file.

// ---- graphics quality presets ----
export const QPRESETS = {
  low:    { key:'low',    label:'Low',    pixel:1.0, aa:false, motes:30, props:0.5,  fx:0.45, slash:false, shock:true, fog:0.008, dist:110, bloom:false },
  medium: { key:'medium', label:'Medium', pixel:1.5, aa:true,  motes:45, props:0.85, fx:0.6, slash:true,  shock:true, fog:0.005, dist:150, bloom:false },
  high:   { key:'high',   label:'High',   pixel:2.0, aa:true,  motes:90, props:1.0,  fx:1.0, slash:true,  shock:true, fog:0.003, dist:190, bloom:false },
};

// ---- brightness presets ----
export const BPRESETS = {
  dim:    { key:'dim',    label:'Dim',    exp:1.15, grade:1.0  },
  normal: { key:'normal', label:'Normal', exp:1.5,  grade:0.7  },
  bright: { key:'bright', label:'Bright', exp:1.95, grade:0.42 },
};

// ---- permanent soul-shrine upgrades ----
export const SOUL_UPG = [
  {key:'hp',     icon:'❤', name:'Vitality',    desc:'+15 max health each run',            max:8, cost:l=>20+l*18},
  {key:'atk',    icon:'⚔', name:'Might',        desc:'+2 attack each run',                 max:8, cost:l=>24+l*20},
  {key:'potion', icon:'🧪', name:'Provisioner',  desc:'Begin each run with +1 healing draught', max:3, cost:l=>45+l*45},
  {key:'gold',   icon:'◈', name:'Coffers',      desc:'Begin each run with +25 gold',       max:6, cost:l=>18+l*16},
];

// ---- biomes (cycled by act) ----
export const BIOMES = [
  { name:'Haunted Wood',
    fog:0x0c1712, sky:[0x0a1420,0x1a2c2e,0x101a16], hemiSky:0x4a6b6a, hemiGround:0x0a140e,
    sun:0x9fb6c9, sunInt:0.55, ground:'#1a241c', groundDark:'#0d140f',
    accent:0x6cf09a, prop:'forest', wx:{col:0x6cf09a,mode:'drift',speed:0.5,sway:1.0,dens:0.8,size:0.12}, rumor:'The mist eats sound out there. Step soft.', beat:'Here the first king fell, and the mist took his name.' },
  { name:'Ruined Keep',
    fog:0x141320, sky:[0x10101e,0x24222e,0x16141c], hemiSky:0x5a5a78, hemiGround:0x14121a,
    sun:0xbfc4e0, sunInt:0.5, ground:'#22222a', groundDark:'#121119',
    accent:0xffa64d, prop:'castle', wx:{col:0xd9b24a,mode:'rise',speed:0.5,sway:0.8,dens:0.7,size:0.12}, rumor:'The dead kings still hold their hall. Mind the big one with the slab-blade.', beat:'The Barrow Lord still keeps his hall, and will not yield the gate.' },
  { name:'Emberdeep',
    fog:0x1a0c08, sky:[0x180704,0x3a140a,0x220a06], hemiSky:0x6b3320, hemiGround:0x1a0805,
    sun:0xff7a3c, sunInt:0.7, ground:'#241410', groundDark:'#140805',
    accent:0xff5a2a, prop:'dungeon', wx:{col:0xff7a2a,mode:'rise',speed:1.25,sway:1.4,dens:1.4,size:0.17}, rumor:'Down where it burns, some things wear stone for skin. Steel wont bite. Break their guard.', beat:'Below, a king burns yet, and wears the fire for a crown.' },
  { name:'Frostfen',
    fog:0x16242e, sky:[0x0e2236,0x36586e,0x1a2e3a], hemiSky:0x9fc8e0, hemiGround:0x20303a,
    sun:0xdfeeff, sunInt:0.85, ground:'#2a3a44', groundDark:'#16242c',
    accent:0x8fe0ff, prop:'frostfen', wx:{col:0xbfe8ff,mode:'drift',speed:0.6,sway:0.7,dens:1.0,size:0.14}, awaken:'rimebrand', rumor:'The cold keeps the dead fresh. They do not rot. They wait.', beat:'The cold king does not rot. He waits, and counts the fallen.' },
  { name:'Astral Verge',
    fog:0x140a22, sky:[0x0a061a,0x2a1448,0x140a26], hemiSky:0x9a6ad0, hemiGround:0x1a1030,
    sun:0xd8b0ff, sunInt:0.8, ground:'#241836', groundDark:'#120a1e',
    accent:0xc070ff, prop:'astral', wx:{col:0xc9a8ff,mode:'rise',speed:0.7,sway:0.6,dens:1.0,size:0.14}, awaken:'wraithstep', rumor:'The sky is wrong here. Stars fall upward. Do not follow them.', beat:'A king reached past the sky here. Something reached back.' },
  { name:'Bloodmoon Grove',
    fog:0x200c0e, sky:[0x1a0608,0x4a1418,0x260a0c], hemiSky:0xc05a52, hemiGround:0x200a0a,
    sun:0xff9a86, sunInt:0.78, ground:'#2e1614', groundDark:'#180a0a',
    accent:0xff4d5e, prop:'bloodmoon', wx:{col:0xff2e44,mode:'fall',speed:0.5,sway:0.15,dens:0.9,size:0.18}, awaken:'blooddraught', rumor:'Under the red moon the trees drink deep. Spill no blood you can spare.', beat:'Under the red moon a king drinks what the living spill.' },
  { name:'Gilded Sanctum',
    fog:0x1c1810, sky:[0x161009,0x3e3018,0x201808], hemiSky:0xd8c080, hemiGround:0x241c10,
    sun:0xffe6a8, sunInt:0.9, ground:'#33291a', groundDark:'#1c160d',
    accent:0xffcf5a, prop:'castle', wx:{col:0xffcf5a,mode:'drift',speed:0.45,sway:0.7,dens:1.1,size:0.13}, rumor:'Gold buried the faithful here, and greed dug them back up.', beat:'Greed crowned the last king twice: in gold, and in grave-dirt.' },
];

// ---- time-of-day (town) ----
export const TOD = [
  {name:'Dawn',   sky:[0x46506e,0xc88a5a,0x4a3a4a], amb:1.05, sun:0xffcf9a, sunI:0.55, lant:1.2,  fog:0x4a4250},
  {name:'Midday', sky:[0x5a86c0,0xacc2d2,0x76869a], amb:1.55, sun:0xffffe6, sunI:0.95, lant:0.7,  fog:0x9aaab6},
  {name:'Dusk',   sky:[0x3a2c50,0xc06a38,0x2e2438], amb:1.0,  sun:0xff844a, sunI:0.5,  lant:1.35, fog:0x4e3c40},
  {name:'Night',  sky:[0x0a1020,0x1c2740,0x0a0e18], amb:0.5,  sun:0x7a8ab0, sunI:0.22, lant:1.7,  fog:0x10141f},
];

// ---- seasons (town weather) ----
export const SEASON = [
  {name:'Spring', wcol:0xffc6dc, fall:0.7,  snow:false},
  {name:'Summer', wcol:0xffe2a8, fall:0.35, snow:false},
  {name:'Autumn', wcol:0xd87a2e, fall:1.0,  snow:false},
  {name:'Winter', wcol:0xeaf2ff, fall:0.9,  snow:true},
];

// ---- enemy roster ----
export const ENEMY_TYPES = [
  {id:'wretch',  name:'Wretch',       tag:'lunges',           shape:'humanoid', biome:0, behavior:'lunge',  hpM:1.0, dmgM:1.0, tel:0.55, col:0x14241a},
  {id:'thornling',name:'Thornling',   tag:'3-hit flurry',     shape:'spindle',  biome:0, behavior:'flurry', hpM:0.8, dmgM:0.5, tel:0.42, col:0x12281a, hits:3, gap:0.2},
  {id:'wraith',  name:'Pale Wraith',  tag:'ranged hex-bolt',  shape:'float',    biome:1, behavior:'ranged', hpM:0.9, dmgM:1.0, tel:0.7,  col:0x20202c, standZ:5.5},
  {id:'knight',  name:'Barrow Knight',tag:'heavy overhead',   shape:'knight',   biome:1, behavior:'heavy',  hpM:1.7, dmgM:2.2, tel:1.2,  col:0x24242e, recovery:0.7},
  {id:'caster',  name:'Bone Caster',  tag:'hexes & heals',    shape:'caster',   biome:1, behavior:'hexer',  hpM:1.1, dmgM:0.6, tel:1.3,  col:0x2a2638},
  {id:'fiend',   name:'Ember Fiend',  tag:'charging rush',    shape:'beast',    biome:2, behavior:'charger',hpM:1.0, dmgM:1.3, tel:0.6,  col:0x2a100a, standZ:6.5},
  {id:'hulk',    name:'Cinder Hulk',  tag:'armored · Smite it',shape:'hulk',    biome:2, behavior:'armored',hpM:2.1, dmgM:1.5, tel:0.9,  col:0x2a1810, armored:true, recovery:0.6},
  {id:'wisp',    name:'Wisp Swarm',   tag:'fast triple-jab',  shape:'wisp',     biome:2, behavior:'flurry', hpM:0.6, dmgM:0.42,tel:0.3,  col:0x3a1a0a, hits:3, gap:0.14},
  // biome 3 — Frostfen: "the cold keeps the dead fresh; they wait"
  {id:'revenant',name:'Frostbound Revenant', tag:'frost burst · dodge the chill', shape:'revenant', biome:3, behavior:'frost', hpM:1.5, dmgM:1.35, tel:1.05, col:0x1c3340, standZ:4.6},
  // biome 4 — Astral Verge: "stars fall upward; do not follow them"
  {id:'acolyte', name:'Star-Eaten Acolyte', tag:'blinks — it strikes from nowhere', shape:'float', biome:4, behavior:'blink', hpM:1.1, dmgM:1.25, tel:0.78, col:0x2a1442, standZ:5.0},
  // biome 5 — Bloodmoon Grove: "the trees drink deep; spill no blood you can spare"
  {id:'sanguine', name:'Sanguine Thrall', tag:'drinks your blood to heal — end it fast', shape:'beast', biome:5, behavior:'leech', hpM:1.3, dmgM:1.2, tel:0.82, col:0x3a0a12, standZ:6.0},
];

// ---- act bosses ----
// bossType() prefers a biome-NAME key (so each biome can have its own boss),
// then falls back to the biome PROP key, then forest.
export const BOSS_TYPES = {
  forest:  {id:'bossF', name:'The Hollow King',   tag:'ACT BOSS', shape:'knight', behavior:'heavy',   hpM:1.0, dmgM:1.0, tel:1.05, col:0x12231a, recovery:0.55},
  castle:  {id:'bossC', name:'The Barrow Lord',   tag:'ACT BOSS', shape:'hulk',   behavior:'heavy',   hpM:1.1, dmgM:1.05,tel:0.95, col:0x24242e, recovery:0.5},
  dungeon: {id:'bossD', name:'The Cinder Tyrant', tag:'ACT BOSS', shape:'hulk',   behavior:'charger', hpM:1.2, dmgM:1.1, tel:0.85, col:0x2a1810, recovery:0.5, standZ:6.5},
  Frostfen:{id:'bossFr',name:'The Hoarfrost Warden', tag:'ACT BOSS · frost', shape:'knight', behavior:'frost', hpM:1.15, dmgM:1.0, tel:1.1, col:0x244355, recovery:0.5},
  'Astral Verge':{id:'bossAv',name:'The Verge Warden', tag:'ACT BOSS · blink', shape:'caster', behavior:'blink', hpM:1.1, dmgM:1.05, tel:0.85, col:0x3a1a5e},
  'Bloodmoon Grove':{id:'bossBm',name:'The Crimson Warden', tag:'ACT BOSS · leech', shape:'hulk', behavior:'leech', hpM:1.2, dmgM:1.05, tel:0.9, col:0x4a0a14, recovery:0.45},
};

// ---- weapon definitions ----
export const WEAPON_DEF = {
  sword:{ icon:'⚔', cls:'Warrior', atk:[8,14], speed:1.0, color:0xc8ccd6 },
  dagger:{ icon:'🗡', cls:'Rogue', atk:[4,8], speed:1.7, color:0xb9c2c8 },
  greatsword:{ icon:'⚔', cls:'Sentinel', atk:[15,24], speed:0.62, color:0xbcc0cc },
  spear:{ icon:'🔱', cls:'Lancer', atk:[7,12], speed:1.25, color:0xc2c6ce },
  warhammer:{ icon:'🔨', cls:'Breaker', atk:[16,26], speed:0.55, color:0x9a8a72 },
  staff:{ icon:'✦', cls:'Mage', atk:[10,18], speed:0.8, color:0x6a4a2a, spell:'bolt' },
  wand:{ icon:'🪄', cls:'Sorcerer', atk:[6,11], speed:1.45, color:0x7a5aa0, spell:'missile' },
  grimoire:{ icon:'📖', cls:'Warlock', atk:[11,18], speed:0.9, color:0x3a2a4a, spell:'nova' },
  axe:{ icon:'🪓', cls:'Reaver', atk:[12,20], speed:0.74, color:0xb8bcc6 },
  saber:{ icon:'⚔', cls:'Duelist', atk:[6,10], speed:1.5, color:0xcad0da },
  scythe:{ icon:'☠', cls:'Reaper', atk:[9,15], speed:1.05, color:0xc0c4cc },
};

// ---- loot rarities ----
export const RAR = [
  {key:'common',  name:'Common',   col:'#9a9a9a', mult:1.0, w:50},
  {key:'uncommon',name:'Uncommon', col:'#5fb368', mult:1.5, w:30},
  {key:'rare',    name:'Rare',     col:'#5a8fd6', mult:2.2, w:14},
  {key:'epic',    name:'Epic',     col:'#a86fd4', mult:3.4, w:6},
];

// ---- equipment slots (stat ranges + name pools) ----
export const SLOTS = {
  armor:    {icon:'🛡', label:'Chestplate', shop:'smith', stats:{hp:[8,22],def:[2,5]}, names:{pre:['Ragged','Plated','Bone','Gilded','Warden','Dragon','Riven'],base:['Plate','Cuirass','Hauberk','Mail','Brigandine']}},
  helmet:   {icon:'⛑', label:'Helm',       shop:'smith', stats:{hp:[4,12],def:[1,4],crit:[0,4]}, names:{pre:['Dented','Horned','Crowned','Visored','Grim','Sallet'],base:['Helm','Greathelm','Casque','Barbute','Coif']}},
  gloves:   {icon:'🧤', label:'Gauntlets',  shop:'smith', stats:{atk:[1,4],speed:[2,8],crit:[1,5]}, names:{pre:['Worn','Spiked','Nimble','Iron','Reaver','Deft'],base:['Gauntlets','Gloves','Grips','Bracers','Fists']}},
  under:    {icon:'🧥', label:'Gambeson',   shop:'smith', stats:{hp:[10,26],regen:[0,2],def:[0,2]}, names:{pre:['Quilted','Padded','Woven','Blessed','Waxed'],base:['Gambeson','Tunic','Underlayer','Jerkin','Wrap']}},
  trinket:  {icon:'◈', label:'Trinket',    shop:'jewel', pick:[1,3], stats:{atk:[2,5],hp:[6,16],speed:[4,12],lifesteal:[2,6],def:[1,3],crit:[1,4]}, names:{pre:['Cracked','Whispering','Lucky','Cursed','Ancient','Ember','Frost'],base:['Ring','Charm','Sigil','Amulet','Idol','Token']}},
  talisman: {icon:'☯', label:'Talisman',   shop:'jewel', pick:[1,2], stats:{crit:[2,7],regen:[1,3],spell:[3,9],lifesteal:[2,6],hp:[6,18]}, names:{pre:['Runed','Eldritch','Sacred','Forbidden','Astral','Witch','Hexed'],base:['Talisman','Ward','Rune','Fetish','Glyph','Phylactery']}},
};
