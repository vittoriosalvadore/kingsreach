// Procedural Web Audio — every sound is synthesized, no audio files. Fully
// self-contained (Web Audio API only): nothing here reads game state or the
// scene, so the module has no imports. The rest of the game calls these.

let AC=null,wind=null;
export function audioStart(){ if(AC)return; try{ AC=new (window.AudioContext||window.webkitAudioContext)();
  const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.5;
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420;
  const g=AC.createGain(); g.gain.value=.05; src.connect(f); f.connect(g); g.connect(AC.destination); src.start(); wind=g;
}catch(e){} }
function tone(type,f0,f1,t0,dur,vol){ if(!AC)return; const t=AC.currentTime+t0; const o=AC.createOscillator(),g=AC.createGain();o.connect(g);g.connect(AC.destination);
  o.type=type; o.frequency.setValueAtTime(f0,t); o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(.001,t+dur); o.start(t); o.stop(t+dur+.02); }
// ---- music: structured ~1-minute songs (intro → repeated hook → bridge →
// resolve) that loop, not endless 1-bar patterns. A single engine plays one
// song at a time (so the tracks are mutually exclusive). All synthesized,
// Megabonk-style chiptune, kept below SFX volume. ----
function softNote(f,dur,vol){ if(!AC)return; const t=AC.currentTime; const o=AC.createOscillator(),g=AC.createGain();
  o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(AC.destination);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.05); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  o.start(t); o.stop(t+dur+0.05); }
// ---- drum & synth voices shared by every song ----
function kick(t,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.11);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+0.18); }
function hat(t,vol,dur){ if(!AC)return; const buf=AC.createBuffer(1,(AC.sampleRate*dur)|0,AC.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1); const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000; const g=AC.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); s.stop(t+dur+0.02); }
function snare(t,vol){ if(!AC)return; const buf=AC.createBuffer(1,(AC.sampleRate*0.18)|0,AC.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1); const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1900; f.Q.value=0.7; const g=AC.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.17);
  s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); s.stop(t+0.2); }
function seqNote(type,f,t,dur,vol,detune){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t); if(detune)o.detune.value=detune;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.02); }
const NOTE=n=>110*Math.pow(2,n/12);   // semitone offset from A2
// ---- arrangement helpers: build a full ~1-minute timeline from short motifs ----
const seqc=(...p)=>[].concat(...p);                            // concatenate sections into one timeline
const rep=(a,n)=>{ let o=[]; for(let i=0;i<n;i++) o=o.concat(a); return o; };   // repeat a section (the hook)

// ---- the single song engine: one track at a time; arrangements loop (~1 min) ----
let songTimer=null, songStep=0, curSong=null;
function playSong(id,song){ if(!AC || curSong===id) return; if(songTimer) clearInterval(songTimer);
  curSong=id; songStep=0;
  songTimer=setInterval(()=>{ song.voice(AC.currentTime+0.02, songStep%song.len, songStep); songStep++; }, song.ms); }
function stopSong(id){ if(curSong!==id) return; if(songTimer){ clearInterval(songTimer); songTimer=null; } curSong=null; }
// stop whatever song is playing (handy on title/death/state resets)
export function stopAllMusic(){ if(songTimer){ clearInterval(songTimer); songTimer=null; } curSong=null; }

// ===== Waystation — warm A-minor town theme: gentle, but catchy, with a hook & resolve =====
const T_INTRO  =[null,0,null,3, null,5,null,7, null,5,null,3, 0,null,null,null];
const T_HOOK   =[0,3,5,7, 5,3,5,null, 7,10,12,10, 7,5,3,null];        // the catchy hook
const T_HOOKB  =[0,3,5,7, 5,3,5,null, 7,10,12,15, 14,12,10,null];     // hook lifted higher
const T_BRIDGE =[12,12,10,7, 10,10,7,5, 7,7,5,3, 5,3,0,null];         // reflective descent
const T_RESOLVE=[7,5,3,0, 5,3,0,-2, 0,0,3,0, 0,null,null,null];       // cadence home (i–V–i)
const T_LEAD=seqc(T_INTRO,T_HOOK,T_HOOKB,T_HOOK,T_BRIDGE,T_HOOK,T_HOOKB,T_HOOK,T_BRIDGE,T_HOOK,T_HOOKB,T_RESOLVE);   // ~58s @300ms
const T_BASS=[0,null,null,null, -4,null,null,null, -7,null,null,null, -5,null,null,null];   // Am – F – Dm – E
const TOWN={ ms:300, len:T_LEAD.length, voice(t,s){
  if(s%4===0) kick(t,0.16);                                   // gentle heartbeat groove
  if(s%4===2) hat(t,0.03,0.025);
  const m=T_LEAD[s]; if(m!=null){ softNote(NOTE(12+m),0.46,0.06); if(s%4===0) softNote(NOTE(24+m),0.5,0.016); }   // lead + soft shimmer
  const b=T_BASS[s%16]; if(b!=null) softNote(NOTE(b),0.95,0.05);
} };

// ===== The Road — driving battle theme: fast, big repeated hook + a resolve =====
const R_INTRO  =[0,null,0,null, 7,null,7,null, 0,null,7,null, 10,null,12,null];
const R_HOOK   =[0,7,12,7, 0,7,10,7, -2,5,10,5, 3,7,10,12];           // the hook
const R_HOOKB  =[12,19,24,19, 12,19,22,19, 10,17,22,17, 15,19,22,24]; // octave-up payoff
const R_BRIDGE =[-2,3,7,3, -4,0,5,0, -5,2,7,2, 3,7,10,14];           // tension build
const R_RESOLVE=[12,10,7,5, 3,5,7,3, 0,3,5,0, 0,null,0,null];        // descend & land on the tonic
const R_LEAD=seqc(R_INTRO, rep(R_HOOK,4), rep(R_HOOKB,2), rep(R_HOOK,2), R_BRIDGE,R_BRIDGE,
  rep(R_HOOK,4), rep(R_HOOKB,4), rep(R_HOOK,3), R_BRIDGE,R_BRIDGE, rep(R_HOOK,4), R_HOOKB, R_RESOLVE);   // ~58s @120ms
const R_BASS=[0,0,7,7, 0,0,5,5, -2,-2,3,3, 3,3,7,7];
const BATTLE={ ms:120, len:R_LEAD.length, voice(t,s){
  if(s%4===0) kick(t,0.5);
  if(s===6||s%8===4) snare(t,0.15);
  hat(t, s%2?0.05:0.03, 0.03);
  seqNote('triangle', NOTE(R_BASS[s%16]-12), t, 0.11, 0.14);
  const a=R_LEAD[s]; if(a!=null) seqNote('square', NOTE(a+12), t, 0.13, 0.05, 6);
  if(s===R_LEAD.length-1) seqNote('sawtooth', NOTE(0), t, 0.5, 0.06);   // turnaround sweep into the loop
} };

// ===== The Guardian — heavy & tense boss theme: a dread hook + a resolve =====
const BO_INTRO  =[0,null,null,null, 1,null,null,null, 0,null,null,null, -1,null,null,null];
const BO_HOOK   =[0,null,3,0, -1,null,3,5, 7,null,5,3, 1,3,1,null];
const BO_HOOKB  =[12,null,13,12, 11,null,13,15, 17,null,15,13, 12,13,12,null];
const BO_BRIDGE =[0,1,0,1, 3,4,3,4, 5,6,5,6, 7,8,7,1];
const BO_RESOLVE=[7,5,3,1, 5,3,1,0, 1,0,1,0, 0,null,null,null];
const BO_LEAD=seqc(BO_INTRO, rep(BO_HOOK,3), BO_BRIDGE, rep(BO_HOOK,2), rep(BO_HOOKB,2), BO_BRIDGE,
  rep(BO_HOOK,3), rep(BO_HOOKB,2), BO_BRIDGE, rep(BO_HOOK,3), rep(BO_HOOKB,2), BO_BRIDGE, rep(BO_HOOK,3), BO_HOOKB, BO_RESOLVE);   // ~56s @130ms
const BO_BASS=[0,0,0,1, 0,0,0,-1, 0,0,3,3, 1,1,0,0];
const BOSS={ ms:130, len:BO_LEAD.length, voice(t,s){
  if(s%2===0) kick(t,0.55);
  if(s%8===4) snare(t,0.2);
  hat(t, s%4===2?0.04:0.02, 0.025);
  seqNote('sawtooth', NOTE(BO_BASS[s%16]-24), t, 0.14, 0.13);
  seqNote('sawtooth', NOTE(BO_BASS[s%16]-12), t, 0.12, 0.05, 4);
  const m=BO_LEAD[s]; if(m!=null) seqNote('square', NOTE(m+12), t, 0.16, 0.055, -8);
  if(s%32===0) seqNote('sine', NOTE(-24), t, 0.6, 0.09);     // ominous toll
} };

// ===== Pilgrim's Lament — slow, melodic & melancholy: a yearning hook + a resolve =====
const L_INTRO  =[null,null,12,null, null,null,10,null, null,null,7,null, null,null,null,null];
const L_HOOK   =[12,null,10,12, 15,null,14,15, 17,null,15,12, 10,null,12,null];
const L_HOOKB  =[12,null,15,17, 19,null,17,15, 14,null,12,10, 12,null,10,null];
const L_BRIDGE =[7,null,10,12, 10,null,7,5, 7,null,5,3, 5,null,3,null];
const L_RESOLVE=[12,10,9,7, 5,7,5,3, 2,3,2,0, 0,null,null,null];
const L_LEAD=seqc(L_INTRO, L_HOOK, L_HOOKB, L_HOOK, L_BRIDGE, L_HOOK, L_HOOKB, L_HOOK, L_BRIDGE,
  L_HOOK, L_HOOKB, L_HOOK, L_BRIDGE, L_HOOK, L_HOOKB, L_RESOLVE);   // ~54s @210ms
const L_BASS=[0,null,null,null, -4,null,null,null, -7,null,null,null, -5,null,null,null];
const LAMENT={ ms:210, len:L_LEAD.length, voice(t,s){
  if(s%4===0) kick(t,0.3);
  if(s%8===4) snare(t,0.09);
  seqNote('triangle', NOTE(L_BASS[s%16]-12), t, 0.32, 0.11);
  const m=L_LEAD[s]; if(m!=null){ seqNote('triangle', NOTE(m), t, 0.34, 0.085); seqNote('sine', NOTE(m+12), t, 0.34, 0.028); }
} };

// ---- public controls (same names the game + jukebox already call) ----
export function startTownMusic(){ playSong('town', TOWN); }
export function stopTownMusic(){ stopSong('town'); }
export function startBattleMusic(){ playSong('battle', BATTLE); }
export function stopBattleMusic(){ stopSong('battle'); }
export function startBossMusic(){ playSong('boss', BOSS); }
export function stopBossMusic(){ stopSong('boss'); }
export function startLamentMusic(){ playSong('lament', LAMENT); }
export function stopLamentMusic(){ stopSong('lament'); }
// ---- per-shop ambience (forge, bubbling, chimes, scrapes) ----
let shopTimer=null;
export function startShopAmbience(type){ stopShopAmbience(); if(!AC) return; let s=0;
  shopTimer=setInterval(()=>{
    if(type==='armor'){ if(s%2===0){ tone('square',180,80,0,.12,.16); tone('triangle',900,520,0,.07,.07); } }       // hammer on anvil
    else if(type==='weapon'){ if(s%3===0) tone('sawtooth',320,140,0,.2,.09); }                                       // whetstone scrape
    else if(type==='trinket'){ if(s%2===0) tone('triangle',1180+(s%4)*140,1700,0,.4,.05); }                          // soft chimes
    else if(type==='potion'){ tone('sine',200+Math.random()*340,140,0,.16,.07); }                                    // bubbling
    s++;
  }, 820); }
export function stopShopAmbience(){ if(shopTimer){ clearInterval(shopTimer); shopTimer=null; } }
export function audio(kind){ if(!AC)return;
  if(kind==='strike') tone('sawtooth',420,120,0,.18,.16);
  else if(kind==='hit') tone('square',180,70,0,.14,.2);
  else if(kind==='clang'){ tone('square',520,300,0,.12,.18); tone('triangle',1200,600,0,.1,.1); }
  else if(kind==='hurt') tone('sawtooth',140,60,0,.25,.22);
  else if(kind==='dodge') tone('sine',700,1100,0,.12,.08);
  else if(kind==='smite'){ tone('sawtooth',300,90,0,.3,.22); tone('triangle',900,1600,0,.18,.12); }
  else if(kind==='jab') tone('square',300,160,0,.07,.12);
  else if(kind==='slam'){ tone('sawtooth',120,40,0,.35,.26); tone('square',200,60,0,.12,.14); }
  else if(kind==='cast') tone('sine',300,900,0,.3,.12);
  else if(kind==='whoosh') tone('sawtooth',600,140,0,.22,.16);
  else if(kind==='hex'){ tone('sine',500,180,0,.4,.14); tone('sine',505,185,0,.4,.1); }
  else if(kind==='heal'){ tone('triangle',440,660,0,.2,.12); tone('triangle',660,880,.1,.2,.1); }
  else if(kind==='potion'){ tone('sine',500,900,0,.15,.12); tone('sine',700,1200,.08,.16,.1); }
  else if(kind==='edeath') tone('sawtooth',260,50,0,.4,.2);
  else if(kind==='die') tone('sawtooth',220,40,0,1,.25);
  else if(kind==='reveal'||kind==='townbell'){ [0,.1,.2].forEach((dt,i)=>tone('triangle',440+i*150,440+i*150,dt,.5,.1)); }
  else if(kind==='loot'){ [0,.08,.16].forEach((dt,i)=>tone('triangle',520+i*180,520+i*180,dt,.2,.12)); }
  else if(kind==='crit'){ tone('square',900,300,0,.1,.14); tone('sawtooth',520,120,0,.18,.16); tone('triangle',1500,800,0,.12,.1); }
  else if(kind==='heartbeat'){ tone('sine',92,54,0,.16,.18); tone('sine',82,48,.2,.16,.14); }
  else if(kind==='perfect'){ tone('sine',700,1400,0,.18,.12); tone('triangle',1000,2050,.04,.16,.08); }
  else if(kind==='boss'){ tone('sawtooth',70,40,0,1.2,.3); tone('square',150,60,0,.6,.16); tone('sine',300,120,.2,.8,.1); }
}
