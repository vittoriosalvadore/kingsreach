// Persistent meta-progression: souls bank, records, and permanent upgrades,
// stored in localStorage. Depends only on clamp (helpers) and SOUL_UPG (data).
//
// loadMeta VALIDATES and clamps every field, because a corrupt / tampered /
// old-schema save must never yield NaN or out-of-range stats — NaN HP is never
// <= 0, which would make the player unkillable and brick the run.
import { clamp } from './helpers.js';
import { SOUL_UPG } from './data.js';

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
