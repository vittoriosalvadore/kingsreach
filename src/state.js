// Shared mutable run state + derived-stat recompute.
//
// `G` is the single global the whole game reads and mutates. It's exported as a
// live object binding, so every module that imports it shares the same instance
// (mutations are visible everywhere). Depends only on the pure WEAPON_DEF table,
// so there are no circular imports.
import { WEAPON_DEF } from './data.js';

export const G = {
  state:'title',
  z:0, x:0, depth:0, kills:0, gold:0, hp:100, baseHp:100,
  act:1, actNodes:0, firstNode:true, nodeAt:9, lootBoost:0, focus:0, revealT:0,
  permAtk:0, permHp:0, permDef:0, permSpeed:0,
  equip:{ weapon:{wtype:'sword',atk:0}, armor:null, helmet:null, gloves:null, under:null, trinket:null, talisman:null },
  maxHp:100, atk:10, def:0, speed:1.0, lifesteal:0, crit:0, regen:0, spellPow:0, weaponType:'sword',
  enemy:null, eGrp:null, event:null,
  strikeCd:0, dodgeCd:0, iframes:0, dodgeX:0, swingT:0, swinging:false, _hitDone:false,
  hurtT:0, bob:0, camKick:0, pendingLoot:null,
  lastWasFork:false, townNPC:null, townT:0, firstTown:true, shopType:null,
  potions:[], tempBuffs:[], atkDebuffT:0, atkDebuffMul:0.65,
  hitStop:0, combo:0, comboT:0, fovKick:0, slowmo:0, perfCd:0, bossFight:false, chillT:0,
  awakenings:[], powerCd:0,
  // lesser awakenings — minor permanent passives earned at shrines. `passBonus` is
  // recomputed from `passives` by applyPassives() (in index.html) and folded into recalc.
  passives:[], passBonus:{atk:0,hp:0,def:0,speed:0,crit:0,regen:0,lifesteal:0,spell:0},
};

// run-structure / balance constants
export const ACT_NODES = 7;
export const FORK_CHANCE = 0.34;
export const ELITE_BASE = 0.16;
export const POTION_CAP = 4;
export const EQUIP_SLOTS = ['weapon','armor','helmet','gloves','under','trinket','talisman'];

// Recompute derived stats (atk/maxHp/def/speed/...) from equipment + permanent +
// temp buffs. Call after any change to G.equip, G.tempBuffs, or perm stats.
export function recalc(){
  const w=G.equip.weapon; G.weaponType=w.wtype; const wd=WEAPON_DEF[w.wtype]||WEAPON_DEF.sword;
  const pb=G.passBonus||{};   // lesser-awakening passive bonuses
  let atk=Math.round((wd.atk[0]+wd.atk[1])/2)+G.permAtk+(pb.atk||0);
  let def=G.permDef+(pb.def||0), hp=(pb.hp||0), spdPct=G.permSpeed+(pb.speed||0), life=(pb.lifesteal||0), crit=(pb.crit||0), regen=(pb.regen||0), spell=(pb.spell||0);
  for(const k of EQUIP_SLOTS){ const it=G.equip[k]; if(!it) continue;
    atk+=it.atk||0; def+=it.def||0; hp+=it.hp||0; spdPct+=it.speed||0; life+=it.lifesteal||0; crit+=it.crit||0; regen+=it.regen||0; spell+=it.spell||0; }
  let spd=wd.speed*(1+spdPct/100);
  for(const buf of G.tempBuffs){ if(buf.stat==='atk') atk+=buf.amt; else if(buf.stat==='def') def+=buf.amt; else if(buf.stat==='speed') spd*=(1+buf.amt/100); }
  if(G.atkDebuffT>0) atk=atk*G.atkDebuffMul;
  G.atk=Math.max(1,Math.round(atk));
  G.maxHp=Math.max(20, G.baseHp + hp + G.permHp);
  G.def=Math.max(0,Math.round(def));
  G.speed=spd; G.lifesteal=life; G.crit=crit; G.regen=regen; G.spellPow=spell;
  G.hp=Math.min(G.hp,G.maxHp);
}

export function tickBuffs(dt){
  let changed=false;
  for(let i=G.tempBuffs.length-1;i>=0;i--){ G.tempBuffs[i].t-=dt; if(G.tempBuffs[i].t<=0){ G.tempBuffs.splice(i,1); changed=true; } }
  if(G.atkDebuffT>0){ G.atkDebuffT-=dt; if(G.atkDebuffT<=0) changed=true; }
  if(changed) recalc();
}
