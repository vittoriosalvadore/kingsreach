// Persistent meta-progression: souls bank, records, and permanent upgrades,
// stored in localStorage. Depends only on clamp (helpers) and SOUL_UPG (data).
//
// loadMeta VALIDATES and clamps every field, because a corrupt / tampered /
// old-schema save must never yield NaN or out-of-range stats — NaN HP is never
// <= 0, which would make the player unkillable and brick the run.
import { clamp } from './helpers.js';
import { SOUL_UPG, WEAPON_DEF, SLOTS } from './data.js';

export const SAVE_KEY = 'kingsreach_save_v1';
export const META_DEFAULT = { souls:0, totalKills:0, runs:0, best:{depth:0,act:1,kills:0}, upg:{hp:0,atk:0,potion:0,gold:0} };
const _clone = o => JSON.parse(JSON.stringify(o));
const _int = (v,def,mn,mx)=>{ v=Math.floor(Number(v)); return Number.isFinite(v)?clamp(v,mn,mx):def; };

export function loadMeta(){ const m=_clone(META_DEFAULT);
  try{ const s=JSON.parse(localStorage.getItem(SAVE_KEY)); if(s&&typeof s==='object'){
    m.souls=_int(s.souls,0,0,1e9); m.totalKills=_int(s.totalKills,0,0,1e9); m.runs=_int(s.runs,0,0,1e9);
    if(s.best&&typeof s.best==='object'){ m.best.depth=_int(s.best.depth,0,0,1e9); m.best.act=_int(s.best.act,1,1,9999); m.best.kills=_int(s.best.kills,0,0,1e9); }
    for(const u of SOUL_UPG){ m.upg[u.key]=_int(s.upg&&s.upg[u.key],0,0,u.max); }
  } }catch(e){}
  return m; }

// The live meta object. Mutate its fields (META.souls += …) and call saveMeta();
// it's never reassigned, so importers share this instance.
export const META = loadMeta();
export function saveMeta(){ try{ localStorage.setItem(SAVE_KEY, JSON.stringify(META)); }catch(e){} }

// ---- journey save (the persistent pilgrimage: act, gold, gear, potions) ----
// Validated like loadMeta: a corrupt/tampered journey must never brick the game,
// so every field is coerced and equipment is rebuilt from a known-good shape.
export const JOURNEY_KEY = 'kingsreach_journey_v1';
const _num = (v,def)=>{ v=Number(v); return Number.isFinite(v)?v:def; };
const _str = (v,def)=> typeof v==='string'?v:def;
const _STAT_KEYS = ['atk','def','hp','speed','lifesteal','crit','regen','spell','value'];
function _sanRar(r){ return (r&&typeof r==='object')
  ? {key:_str(r.key,'common'),name:_str(r.name,'Common'),col:_str(r.col,'#9a9a9a'),mult:_num(r.mult,1)}
  : {key:'common',name:'Common',col:'#9a9a9a',mult:1}; }
function _sanItem(it, slot){
  const weapon = slot==='weapon';
  if(!it || typeof it!=='object') return weapon ? {slot:'weapon',wtype:'sword',rar:_sanRar(),icon:'⚔',name:'Worn Sword',atk:0,value:0} : null;
  const o = { slot, rar:_sanRar(it.rar), icon:_str(it.icon, weapon?'⚔':'◈'), name:_str(it.name, weapon?'Worn Sword':'Relic') };
  for(const k of _STAT_KEYS){ if(it[k]!=null) o[k]=_num(it[k],0); }
  if(weapon){ o.wtype = WEAPON_DEF[it.wtype]?it.wtype:'sword'; if(o.atk==null) o.atk=0; }
  return o;
}
export function saveJourney(j){ try{ localStorage.setItem(JOURNEY_KEY, JSON.stringify(j)); }catch(e){} }
export function clearJourney(){ try{ localStorage.removeItem(JOURNEY_KEY); }catch(e){} }
export function loadJourney(){
  try{ const s=JSON.parse(localStorage.getItem(JOURNEY_KEY)); if(!s || typeof s!=='object' || s.v!==1) return null;
    const eq={ weapon:_sanItem(s.equip&&s.equip.weapon,'weapon') };
    for(const slot of ['armor','helmet','gloves','under','trinket','talisman']){
      const it=_sanItem(s.equip&&s.equip[slot], slot); eq[slot]= (it && SLOTS[slot]) ? it : null;
    }
    return {
      v:1, act:_int(s.act,1,1,9999), gold:_int(s.gold,0,0,1e9), kills:_int(s.kills,0,0,1e9),
      awardKills:_int(s.awardKills,0,0,1e9), awardDepth:_num(s.awardDepth,0),
      weaponType: WEAPON_DEF[s.weaponType]?s.weaponType:'sword', equip:eq,
      potionIds: Array.isArray(s.potionIds) ? s.potionIds.filter(x=>typeof x==='string').slice(0,12) : [],
      awakenings: Array.isArray(s.awakenings) ? s.awakenings.filter(x=>typeof x==='string').slice(0,16) : [],
    };
  }catch(e){ return null; }
}
