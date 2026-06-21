// Loot generation: rarity rolls, weapon/armour/jewellery item creation, and
// stat-display helpers. Pure logic over the data tables — depends only on
// helpers + data, no game state or Three.js.
import { clamp, rand, randi, pick, shuffle } from './helpers.js';
import { RAR, SLOTS, WEAPON_DEF } from './data.js';

function rollRarity(depth){
  const lux = clamp(depth/900,0,1);
  const weights = RAR.map(r=>r.w*(r.key==='common'?(1-lux*.6):(1+lux*1.4*RAR.indexOf(r))));
  let tot=weights.reduce((a,b)=>a+b,0), r=Math.random()*tot;
  for(let i=0;i<RAR.length;i++){ r-=weights[i]; if(r<=0) return RAR[i]; }
  return RAR[0];
}
const NAME = {
  weapon:{ pre:['Rusted','Ashen','Kings','Grave','Hollow','Wyrm','Iron','Bloodworn','Moonlit','Cinder'],
           sword:['Fang','Edge','Saber','Cleaver','Brand'], dagger:['Stinger','Kris','Shiv','Talon','Needle'],
           greatsword:['Reaver','Slab','Executioner','Wall','Sunderer'], spear:['Lance','Pike','Skewer','Impaler','Reach'],
           warhammer:['Crusher','Maul','Breaker','Anvil','Doom'], staff:['Branch','Scepter','Rod','Channel','Conduit'],
           wand:['Wand','Spark','Wisp','Splinter','Quill'], grimoire:['Tome','Codex','Grimoire','Folio','Testament'],
           axe:['Axe','Hatchet','Cleaver','Bardiche','Splitter'], saber:['Saber','Scimitar','Falchion','Sabre','Curve'],
           scythe:['Scythe','Reaper','Harvest','Crescent','War-Glaive'] },
};
function makeWeaponItem(wtype,rarKey,extra={}){
  const r=RAR.find(x=>x.key===rarKey)||RAR[0];
  const it={ slot:'weapon', wtype, rar:r, icon:WEAPON_DEF[wtype].icon,
    name:`${pick(NAME.weapon.pre)} ${pick(NAME.weapon[wtype]||[WEAPON_DEF[wtype].cls])}`,
    atk: extra.atk!=null?extra.atk:Math.round(rand(2,6)*r.mult), value:0 };
  it.value = Math.round((10+it.atk*3)*r.mult); return it;
}
// stat display metadata
const STAT_INFO = {
  atk:{lbl:'Attack',suf:''}, hp:{lbl:'Max Health',suf:''}, def:{lbl:'Defense',suf:''},
  speed:{lbl:'Swiftness',suf:'%'}, lifesteal:{lbl:'Lifesteal',suf:'%'}, crit:{lbl:'Critical',suf:'%'},
  regen:{lbl:'Health Regen',suf:'/s'}, spell:{lbl:'Spell Power',suf:''},
};
const GEAR_STATS=['atk','hp','def','speed','lifesteal','crit','regen','spell'];
function statRows(it){ return GEAR_STATS.filter(k=>it[k]).map(k=>[STAT_INFO[k].lbl,'+'+it[k]+STAT_INFO[k].suf]); }
function statShort(it){ const s=GEAR_STATS.filter(k=>it[k]).map(k=>'+'+it[k]+STAT_INFO[k].suf+' '+k.slice(0,4).toUpperCase()).join(' · '); return s||'—'; }
// equipment slots (armour pieces + jewellery)
function gearValue(it){ return Math.max(5,Math.round(8*it.rar.mult+(it.atk||0)*3+(it.hp||0)+(it.def||0)*4+(it.speed||0)*2+(it.lifesteal||0)*4+(it.crit||0)*3+(it.regen||0)*8+(it.spell||0)*3)); }
function makeGear(slot,r,scale=1){
  const cfg=SLOTS[slot]; const it={slot,rar:r,icon:cfg.icon,name:`${pick(cfg.names.pre)} ${pick(cfg.names.base)}`};
  let keys=Object.keys(cfg.stats);
  if(cfg.pick) keys=shuffle(keys).slice(0,randi(cfg.pick[0],cfg.pick[1]));
  for(const k of keys){ const v=Math.round(rand(cfg.stats[k][0],cfg.stats[k][1])*r.mult*(k==='hp'?scale:1)); if(v>0) it[k]=v; }
  if(!GEAR_STATS.some(k=>it[k])){ const k=keys[0]||'hp'; it[k]=Math.max(1,Math.round((cfg.stats[k]?cfg.stats[k][1]:4)*r.mult)); }
  it.value=gearValue(it); return it;
}
function makeArmorItem(r,scale){ return makeGear('armor',r,scale); }
function makeTrinketItem(r){ return makeGear('trinket',r,1); }
function genGear(depth,boost=0){
  let r=rollRarity(depth); if(boost){ const r2=rollRarity(depth); if(RAR.indexOf(r2)>RAR.indexOf(r)) r=r2; }
  const dscale=1+depth/400;
  const slot=pick(['weapon','weapon','weapon','armor','helmet','gloves','under','trinket','trinket','talisman']);
  if(slot==='weapon'){ const wtype=pick(Object.keys(WEAPON_DEF));
    const it=makeWeaponItem(wtype,r.key,{atk:Math.round(rand(2,6)*r.mult*dscale)}); it.cls=WEAPON_DEF[wtype].cls; return it; }
  return makeGear(slot,r,dscale);
}

export { rollRarity, makeWeaponItem, statRows, statShort, makeGear, genGear };
