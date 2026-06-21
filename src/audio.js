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
// ---- expanded synth palette (all schedule at the given time t; richer voices) ----
function env(g,t,a,d,vol){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+a); g.gain.exponentialRampToValueAtTime(0.0006,t+d); }
function psaw(f,t,dur,vol,spread){ if(!AC)return; const g=AC.createGain(); g.connect(AC.destination); env(g,t,0.012,dur,vol);   // thick detuned "supersaw" — big OOMPH
  const det=spread||14; for(const c of [-det,0,det]){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(f,t); o.detune.value=c; o.connect(g); o.start(t); o.stop(t+dur+0.03); } }
function pluck(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='square'; o.frequency.setValueAtTime(f,t);   // percussive chiptune pluck
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0006,t+dur); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.02); }
function sub(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,t);   // pure sine sub-bass for low-end power
  env(g,t,0.01,dur,vol); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+dur+0.03); }
function pad(f,t,dur,vol){ if(!AC)return; const g=AC.createGain(); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1500; lp.connect(AC.destination); g.connect(lp);   // warm slow pad
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+dur*0.4); g.gain.linearRampToValueAtTime(0.0006,t+dur);
  for(const c of [0,7]){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=f*Math.pow(2,c/12); o.detune.value=(c?6:-6); o.connect(g); o.start(t); o.stop(t+dur+0.05); }
  const o2=AC.createOscillator(); o2.type='triangle'; o2.frequency.value=f; o2.connect(g); o2.start(t); o2.stop(t+dur+0.05); }
function bell(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),m=AC.createOscillator(),mg=AC.createGain(),g=AC.createGain();   // FM bell/chime (calm shimmer)
  o.type='sine'; o.frequency.value=f; m.type='sine'; m.frequency.value=f*2.01; mg.gain.value=f*1.2; m.connect(mg); mg.connect(o.frequency);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0005,t+dur); o.connect(g); g.connect(AC.destination); o.start(t); m.start(t); o.stop(t+dur+0.05); m.stop(t+dur+0.05); }
function tom(t,f,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(Math.max(40,f*0.5),t+0.18);   // pitched tom (boss fills)
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); o.connect(g); g.connect(AC.destination); o.start(t); o.stop(t+0.22); }
function noiseHit(t,vol,dur,freq){ if(!AC)return; const b=AC.createBuffer(1,(AC.sampleRate*dur)|0,AC.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);   // filtered noise (crash / riser)
  const s=AC.createBufferSource(); s.buffer=b; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq||1200; f.Q.value=0.6; const g=AC.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur); s.connect(f); f.connect(g); g.connect(AC.destination); s.start(t); s.stop(t+dur+0.02); }
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

// ============================================================================
//  SONGS — each is an IIFE so its motif locals stay private (no cross-song name
//  collisions); each returns a { ms, len, voice(t,s) } for the engine above.
// ============================================================================

// ===== MENU — title theme (A Dorian; calm, hopeful-but-grim) =====
const MENU = (() => {
  const B_AM=[24,null,null,28, null,31,null,null, 36,null,28,null, null,24,null,null];
  const B_C =[27,null,null,31, null,34,null,null, 39,null,31,null, null,27,null,null];
  const B_DM6=[29,null,null,33, null,36,null,null, 41,null,33,null, null,29,null,null];
  const B_EM=[31,null,null,35, null,38,null,null, 43,null,35,null, null,31,null,null];
  const B_R=[null,null,null,null, null,null,null,null, null,null,null,null, null,null,null,null];
  const P_AM=[12,null,16,null, 19,null,16,null, 12,null,16,null, 19,null,24,null];
  const P_C =[15,null,19,null, 22,null,19,null, 15,null,19,null, 22,null,27,null];
  const P_DM6=[17,null,21,null, 24,null,21,null, 17,null,21,null, 24,null,29,null];
  const P_EM=[19,null,23,null, 26,null,23,null, 19,null,23,null, 26,null,31,null];
  const P_R=B_R;
  const L_HA=[null,null,24,null, 28,null,null,null, 27,null,null,24, null,null,null,null];
  const L_HB=[null,null,22,null, 24,null,null,null, 21,null,null,19, null,null,null,null];
  const L_BR=[null,null,27,null, 31,null,null,null, 34,null,null,31, null,null,27,null];
  const L_D6=[null,null,29,null, 33,null,null,null, 36,null,null,33, null,null,29,null];
  const L_R=B_R;
  const CH={ AM:[-12,0,7], C:[-9,3,10], DM6:[-7,5,12], EM:[-5,7,14] };
  const CHORDS=['AM','AM','C','EM','AM','C','DM6','EM','AM','AM'];
  const BELL=seqc(B_R,B_AM,B_C,B_EM,B_AM,B_C,B_DM6,B_EM,B_AM,B_AM);
  const PLK=seqc(P_R,P_AM,P_C,P_EM,P_AM,P_C,P_DM6,P_EM,P_AM,P_R);
  const LEAD=seqc(L_R,L_HA,L_HB,L_HA,L_HB,L_BR,L_D6,L_HB,L_HA,L_R);
  const SONG={ ms:355, len:164, voice(t,s){
    const bar=(s/16)|0, step=s%16, ch=CHORDS[bar]||'AM', cv=CH[ch], subR=cv[0], padR=cv[1], pad5=cv[2];
    if(step===0){ pad(NOTE(padR+12),t,3.4,0.045); pad(NOTE(pad5+12),t,3.4,0.034); sub(NOTE(subR),t,3.0,0.13); }
    if(step===8) pad(NOTE(padR+19),t,2.0,0.03);
    if(step===0 && bar%2===0) kick(t,0.40);
    if(step===0 && bar%2===1) kick(t,0.22);
    if(step===0 && bar===5) snare(t,0.10);
    if(step===6||step===14) hat(t,0.028,0.03);
    const b=BELL[s%BELL.length]; if(b!=null) bell(NOTE(b),t,1.1,(step===0||step===8)?0.055:0.038);
    const p=PLK[s%PLK.length]; if(p!=null) pluck(NOTE(p),t,0.18,0.05);
    const l=LEAD[s%LEAD.length]; if(l!=null){ const inB=(bar===5||bar===6); psaw(NOTE(l),t,0.30,inB?0.06:0.05,inB?14:11); }
    if(bar===9 && step===0){ bell(NOTE(24),t,2.4,0.05); bell(NOTE(26),t,2.4,0.04); bell(NOTE(31),t,2.4,0.04); pad(NOTE(12),t,4.0,0.05); sub(NOTE(-12),t,3.6,0.12); }
  } };
  return SONG;
})();

// ===== TOWN — Waystation (safe-hub): warm A-minor, groove + bass + hook, more OOMPH =====
const TOWN = (() => {
  const _=null;
  const HOOK=[24,_,27,_,31,_,29,_,27,_,_,_,26,_,_,_, 24,_,_,_,31,_,32,_,31,_,29,_,27,_,_,_, 29,_,31,_,34,_,31,_,29,_,27,_,26,_,_,_, 24,_,26,_,27,_,26,_,24,_,_,_,_,_,_,_];
  const HOOKB=[27,_,31,_,36,_,34,_,31,_,_,_,29,_,_,_, 27,_,_,_,34,_,36,_,34,_,31,_,29,_,_,_, 31,_,34,_,38,_,36,_,34,_,31,_,29,_,_,_, 27,_,29,_,31,_,29,_,27,_,_,_,_,_,_,_];
  const COUNTER=[_,_,_,_,_,_,_,_,_,_,12,_,_,_,15,_, _,_,19,_,_,_,_,_,_,_,_,_,_,_,17,15, _,_,_,_,_,_,_,_,_,_,_,_,_,_,14,12, _,_,_,_,_,_,_,_,_,_,12,_,15,_,14,12];
  const BRIDGE=[17,_,_,_,19,_,_,_,17,_,_,_,15,_,_,_, 14,_,_,_,12,_,_,_,14,_,_,_,15,_,_,_, 17,_,_,_,15,_,_,_,14,_,_,_,12,_,_,_, 12,_,_,_,_,_,14,_,_,_,_,_,_,_,_,_];
  const BASS_A=[0,_,_,_,0,_,_,_,2,_,_,_,0,_,-5,_, -4,_,_,_,-4,_,_,_,-2,_,_,_,-4,_,-9,_, -9,_,_,_,-9,_,_,_,-7,_,_,_,-9,_,-2,_, -2,_,_,_,-2,_,_,_,0,_,_,_,-2,_,-7,_];
  const PADROOT=[12,8,15,10], PADTHIRD=[15,12,19,14];
  const SHIM=new Set([0,4,32,36,64,68]), SWELL=new Set([48,112,176]);
  const LEAD=seqc(HOOK,HOOK,HOOKB,BRIDGE);
  const CM=seqc(BRIDGE.map(()=>_),COUNTER,COUNTER,COUNTER);
  const SONG={ ms:232, len:256, voice(t,s){
    const bar=(s>>4)&3, sec=(s/64)|0, inBar=s&15;
    if(inBar%4===0) kick(t, inBar===0?0.5:0.4);
    if(inBar%4===2) hat(t,0.035,0.03);
    if((sec===1||sec===2)&&inBar===8) snare(t,0.12);
    if(inBar===14&&(sec===1||sec===2)) tom(t,NOTE(2),0.14);
    const bv=BASS_A[s%64]; if(bv!=null) sub(NOTE(bv),t,0.20, sec===3?0.11:0.14);
    if(inBar===0){ pad(NOTE(PADROOT[bar]),t,1.7,0.045); pad(NOTE(PADTHIRD[bar]),t,1.7,0.035); }
    const n=LEAD[s];
    if(n!=null){
      if(sec===3){ softNote(NOTE(n),0.18,0.06); }
      else { const mv=sec===0?0.04:(sec===2?0.055:0.05); bell(NOTE(n),t,0.20,mv); if(SHIM.has(s%64)&&sec>=1) bell(NOTE(n+12),t,0.16,0.025); }
    }
    const c=CM[s]; if(c!=null&&sec>=1) pluck(NOTE(c),t,0.16,0.06);
    if(SWELL.has(s)) psaw(NOTE(PADROOT[bar]),t,0.8,0.05,12);
    if(s===240){ pad(NOTE(7),t,1.6,0.05); psaw(NOTE(7),t,0.9,0.05,12); bell(NOTE(31),t,0.22,0.05); }
    if(s===248){ pad(NOTE(0),t,2.0,0.055); pad(NOTE(3),t,2.0,0.04); psaw(NOTE(12),t,1.0,0.05,12); bell(NOTE(24),t,0.3,0.055); bell(NOTE(36),t,0.26,0.022); kick(t,0.5); }
  } };
  return SONG;
})();

// ===== BATTLE — "The Road": 144 BPM A-minor banger, relentless 16th bass motor =====
const BATTLE = (() => {
  const M_i  = [0,12, 7,0,  3,12, 7,3,   0,12, 7,0,  3,7, 2,1];
  const M_VI = [-4,8, 3,-4, 0,8,  3,0,  -4,8, 3,-4,  0,3, -1,-2];
  const M_VII= [-2,10,5,-2, 1,10, 5,1,  -2,10,5,-2,  1,5, 0,-1];
  const M_v  = [-5,7, 2,-5, 0,7,  2,0,  -5,7, 2,-5,  0,2, -1,1];
  const BASSLOOP = [...M_i, ...M_VI, ...M_VII, ...M_v];
  const SUBROOT = [-12, -16, -14, -17];
  const HK = [
    0,null,3,null,  7,null,3,0,   null,7,null,8,  7,null,5,null,
    3,null,5,7,     null,8,null,7, 5,null,3,null,  2,null,3,null,
    0,null,1,null,  3,null,1,0,    null,5,null,3,  2,null,0,null,
    7,null,10,null, 12,null,10,8,  null,7,null,8,  null,8,null,null ];
  const STABROOT = [0, 8, 10, 7];
  const OST = [0,7,12,7, 3,7,10,7, 0,7,12,7, 2,5,7,2];
  const SOFT = [
    0,null,null,null,  3,null,2,null,  null,null,0,null, null,null,null,null,
    -2,null,null,null, 1,null,0,null,  null,null,-5,null, null,null,7,null ];
  const PADROOT = [0, 8, 10, 7];
  const SEC = [];
  const push = (v,n)=>{ for(let i=0;i<n;i++) SEC.push(v); };
  push(0,4); push(1,8); push(2,4); push(3,8); push(1,4); push(2,2); push(4,4);  // 34 bars
  const SONG = { ms:104, len:544, voice(t,s){
    const bar=(s/16)|0, step=s%16, sec=SEC[bar]||0, inBar4=bar%4, beat=step%4, lastBarOfPhrase=inBar4===3, harm=bar%4;
    if (sec !== 4) { if (beat === 0) kick(t, sec === 0 ? 0.30 + bar*0.06 : 0.5); if (sec >= 1 && step === 14) kick(t, 0.42); }
    else { if (step === 0 || step === 8) kick(t, 0.52); }
    if (sec >= 1 && sec !== 4) { if (step % 4 === 2) hat(t, 0.05, 0.03); else if (step % 2 === 1) hat(t, 0.03, 0.022); if (lastBarOfPhrase && step >= 12) hat(t, 0.045, 0.02); }
    else if (sec === 0 && bar >= 1) { if (step % 4 === 2) hat(t, 0.025 + bar*0.006, 0.025); }
    else if (sec === 4) { if (step % 4 === 2) hat(t, 0.03, 0.03); }
    if (sec >= 1 && sec !== 4) { if (step === 4 || step === 12) snare(t, 0.17); if (step === 13) snare(t, 0.06); }
    else if (sec === 4) { if (step === 8) snare(t, 0.18); }
    if (lastBarOfPhrase && (bar === 11 || bar === 19 || bar === 27 || bar === 29)) {
      if (step === 10) tom(t, NOTE(7), 0.18); if (step === 12) tom(t, NOTE(3), 0.18); if (step === 14) tom(t, NOTE(0), 0.2); }
    if (sec !== 4) {
      const bn = BASSLOOP[(s % 64)];
      const accent = (beat === 0) ? 0.075 : (step % 2 ? 0.05 : 0.06);
      pluck(NOTE(bn - 12), t, 0.085, accent);
      if (beat === 0) sub(NOTE(SUBROOT[harm]), t, 0.14, sec === 0 ? 0.10 : 0.14);
    } else {
      if (step === 0) sub(NOTE(SUBROOT[harm]), t, 0.4, 0.13);
      if (bar === 33 && step === 8)  pluck(NOTE(11), t, 0.18, 0.07);
      if (bar === 33 && step === 12) pluck(NOTE(12), t, 0.22, 0.07);
    }
    if (step === 0) pad(NOTE(PADROOT[harm] - 12), t, 0.62, sec === 4 ? 0.05 : (sec===0?0.05:0.04));
    if (sec === 0) { const sn = SOFT[(s % 32)]; if (sn != null) softNote(NOTE(12 + sn), 0.34, 0.06); }
    if (sec === 2) { const on = OST[step]; seqNote('square', NOTE(12 + on), t, 0.09, 0.05, 6); if (step % 8 === 0) seqNote('triangle', NOTE(24), t, 0.12, 0.03, 0); }
    if (sec === 1) { const hn = HK[(s % 64)]; if (hn != null) psaw(NOTE(12 + hn), t, 0.09, 0.055, 13); if (lastBarOfPhrase && step === 14) bell(NOTE(24), t, 0.4, 0.04); }
    if (sec === 3) { const hn = HK[(s % 64)]; if (hn != null) psaw(NOTE(24 + hn), t, 0.09, 0.05, 16);
      if (beat === 0 || step === 8) { const r = STABROOT[harm]; psaw(NOTE(12 + r), t, 0.16, 0.045, 16); }
      if (lastBarOfPhrase && (step === 8 || step === 14)) bell(NOTE(31), t, 0.45, 0.045); }
    if (sec === 4) { if (bar === 32 && step === 0) bell(NOTE(12), t, 0.7, 0.05); if (bar === 33 && step === 12) bell(NOTE(24), t, 0.8, 0.05); }
  } };
  return SONG;
})();

// ===== BOSS — "The Guardian": 140 BPM D Phrygian, one deliberate riff, badass =====
const BOSS = (() => {
  const D = 2, Eb = 3, F = 5, G = 7, A = 9, Bb = 10, D2 = 14, Eb2 = 15, A2 = 21;
  const DSUB = -22;
  const RIFF = [D, D, Eb, D, A, null, Bb, D];                 // the signature riff (8 eighths)
  const ANS  = [null, A, Bb, A, F, null, Eb, D, null, F, G, F, Eb, null, D, null]; // pluck answer
  const HIGH = [D2, null, Eb2, D2, A2, null, D2, Eb2];        // octave-up return layer
  const SONG = { ms:107, len:512, voice(t,s){
    const bar = Math.floor(s/16), b = s%16, beat = b%4, eighth = Math.floor((s%16)/2);
    const intro = bar<4, hookA = bar>=4&&bar<12, heavy = bar>=12&&bar<20, ret = bar>=20&&bar<28, resolve = bar>=28;
    if (!intro) { if (b===0) sub(NOTE(DSUB), t, heavy?0.34:0.22, heavy?0.15:0.14); else if (b===8 && !heavy) sub(NOTE(DSUB), t, 0.18, 0.12); }
    else { if (b===0) sub(NOTE(DSUB), t, 0.9, 0.12); }
    if (intro) { if (b===0 && (bar===2||bar===3)) softNote(NOTE(A), 0.6, 0.05); }
    else if (heavy) {
      if (beat===0 && (b===0||b===8)) kick(t, b===0?0.55:0.46);
      if (b===8) snare(t, 0.2);
      if (b%2===0) hat(t, b%4===0?0.05:0.035, 0.025);
      if (b===15) sub(NOTE(DSUB), t, 0.12, 0.13);
    } else {
      if (beat===0) kick(t, b===0?0.55:0.46);
      if (b===15) kick(t, 0.4);
      if (b===4||b===12) snare(t, 0.2);
      if (beat===2) hat(t, 0.05, 0.03);
      if (ret && beat===0 && b!==0) hat(t, 0.03, 0.02);
    }
    if ((bar%2===1) && b>=13) { if (b===13) tom(t, NOTE(D2), 0.16); if (b===14) tom(t, NOTE(A), 0.16); if (b===15) tom(t, NOTE(F), 0.18); }
    if (hookA || ret) {
      const n = RIFF[eighth]; if (n!==null && b%2===0) psaw(NOTE(n-12), t, 0.16, ret?0.30:0.26, 14);
      if (ret) { const h = HIGH[eighth]; if (h!==null && b%2===0) psaw(NOTE(h), t, 0.14, 0.16, 12); }
    }
    if ((bar>=8 && bar<12) || ret) { const a = ANS[b]; if (a!==null) pluck(NOTE(a), t, 0.09, ret?0.18:0.16); }
    if (heavy) {
      if (b===0||b===6||b===8||b===14) { const sv = b===0?0.28:0.22; psaw(NOTE(D), t, 0.18, sv, 16); psaw(NOTE(A), t, 0.18, sv*0.85, 16); }
      if (b===0) pad(NOTE(D-12), t, 0.85, 0.05);
      if (b===8) pad(NOTE(F-12), t, 0.42, 0.04);
    }
    if (b===0) {
      if (intro && (bar===0||bar===2)) bell(NOTE(D2), t, 0.6, 0.05);
      if (bar===4||bar===20) bell(NOTE(D2), t, 0.5, 0.045);
      if (bar===12) bell(NOTE(Eb2), t, 0.5, 0.045);
    }
    if (resolve) {
      if (bar<31 && (b===0||b===8)) psaw(NOTE(b===0?F:G), t, 0.16, 0.24, 14);
      if (bar===31 && b===0) { psaw(NOTE(D), t, 0.5, 0.32, 16); psaw(NOTE(A), t, 0.5, 0.26, 16); sub(NOTE(DSUB), t, 0.5, 0.16); bell(NOTE(D2), t, 0.7, 0.05); kick(t, 0.55); }
    }
  } };
  return SONG;
})();

// ===== LAMENT — "Pilgrim's Lament": slow A-minor, melody enriched with pad/harmony/bell =====
const LAMENT = (() => {
  const N = (n) => 110 * Math.pow(2, n / 12);
  const HI = 24, _ = null;
  const LEAD = [];
  { const pA=[12,_,15,_,17,_,19,_,_,_,17,_,15,_,_,_]; const pB=[15,_,12,_,10,_,8,_,_,_,7,_,_,_,_,_];
    const pC=[12,_,15,_,17,_,15,_,12,_,10,_,_,_,_,_]; const pD=[19,_,17,_,15,_,12,_,_,_,10,_,_,_,_,_];
    const pE=[12,_,10,_,8,_,7,_,_,_,5,_,3,_,0,_]; const r16=[_,_,_,_,_,_,_,_,_,_,_,_,_,_,_,_];
    const blocks=[r16,r16,pA,pB,pA,pB,pC,pD,pA,pB,pA,pB,pE,r16,r16,r16];
    for (const bk of blocks) for (const v of bk) LEAD.push(v);
    while (LEAD.length < 264) LEAD.push(_); }
  const HARM = LEAD.map((v,i)=>{ const blk=Math.floor(i/16); const live=(blk===4||blk===5||blk===10||blk===11); if(!live||v===null) return null; return v-4; });
  const ROOTS = [0,0,0,-2, 0,-2,3,-2, 0,-2,0,-2, 0,0,0,0];
  const CHORD = (blk)=>{ switch(blk%4){ case 0: return [12,15,19]; case 1: return [8,12,15]; case 2: return [15,19,22]; default: return [10,14,17]; } };
  const SONG = { ms:220, len:264, voice(t,s){
    const beat=(s%2===0), bar1=(s%8===0), blk=Math.floor(s/16), inBar=s%16;
    if (bar1 && blk>=1) kick(t, 0.30);
    if (inBar===0){ const r=ROOTS[blk%ROOTS.length]; sub(N(r-12),t,1.9,0.13); pad(N(r),t,3.4,0.05); pad(N(r+7),t,3.4,0.035); }
    if (beat && blk>=2 && blk!==13 && blk!==14){ const ch=CHORD(blk); const idx=(s/2)%4; if(idx<3) bell(N(ch[idx]-12),t,1.2,0.045+idx*0.004); }
    if ((blk===9||blk===11) && inBar===12) bell(N(19-12),t,0.9,0.05);
    if ((blk===9||blk===11) && inBar===14) bell(N(15-12),t,1.1,0.045);
    const lv=LEAD[s]; if (lv!==null) softNote(N(lv+HI-12),0.95,0.085);
    const hv=HARM[s]; if (hv!==null) softNote(N(hv+HI-12),0.9,0.05);
    if (s===208){ const r=0; sub(N(r-12),t,4.2,0.12); pad(N(r),t,6.0,0.055); pad(N(r+3),t,6.0,0.035); pad(N(r+7),t,6.0,0.03); bell(N(r+12),t,2.2,0.04); }
  } };
  return SONG;
})();

// ===== FOREST — "Forest Hunt": 104 BPM D Dorian woodland prowl (forest/grove biomes) =====
const FOREST = (() => {
  const N = (n) => 110 * Math.pow(2, n / 12);
  const D2=N(-19), A1=N(-24), G1=N(-26), C2=N(-21);
  const D4=N(17), E4=N(19), F4=N(20), G4=N(22), A4=N(24);
  const D5=N(29), A5=N(36);
  const HOOK = [ D4,null,F4,G4,  A4,null,G4,F4,  E4,null,G4,F4,  D4,null,E4,null ];
  const WALK = [ D2,D2,A1,A1,  C2,C2,A1,A1,  D2,D2,A1,A1,  G1,G1,A1,A1 ];
  const SONG = { ms:145, len:400, voice(t,s){
    const bar=(s/16)|0, k=s%16;
    const intro=bar<4, groove=bar>=4&&bar<12, bridge=bar>=12&&bar<16, resolve=bar>=16&&bar<24, drone=bar>=24;
    if (s%16===0){ const pv=bridge?0.20:(intro?0.13:0.16); pad(D2*2,t,2.4,pv); if(bridge||resolve) pad(N(-5)*2,t,2.4,0.12); }
    if (intro){ const MOTIF=[D4,null,null,A4, null,F4,null,null, E4,null,null,G4, null,null,null,null]; if(MOTIF[k]) softNote(MOTIF[k],0.55,0.10); if(k===0 && bar%2===1) bell(D5,t,0.9,0.10); return; }
    if (drone){ if(k===0){ sub(D2,t,1.6,0.13); pad(D5,t,2.0,0.07); } if(k===8) bell(A5,t,1.0,0.06); return; }
    const drums = groove||bridge||resolve;
    if (drums){ if(k===0||k===8) kick(t,0.5); if((k===6)&&(bar%2===0)) kick(t,0.4); if(!bridge&&(k===4||k===12)) snare(t,0.16); const off=(k%2===1); hat(t, off?0.05:0.03, 0.03); if((bar===11||bar===23)&&k>=12) tom(t, D2*(1+(k-12)*0.12), 0.16); }
    if (groove||resolve){ sub(WALK[k],t,0.16,0.14); } else if (bridge && k%4===0){ sub(D2,t,0.55,0.12); }
    if (groove){ const f=HOOK[k]; if(f){ pluck(f,t,0.12,0.13); seqNote('triangle', f*2, t, 0.13, 0.09, 5); } }
    if (bridge){ const FRAG=[D4,null,null,null, null,null,F4,null, null,null,null,null, E4,null,null,null]; if(FRAG[k]){ pluck(FRAG[k],t,0.18,0.10); seqNote('triangle', FRAG[k]*2, t, 0.2, 0.06, 5); } if(k===0) bell(A5,t,1.1,0.07); }
    if (resolve){ const f=HOOK[k]; if(f){ const up=f*Math.pow(2,4/12); pluck(up,t,0.12,0.12); seqNote('triangle', up*2, t, 0.13, 0.08, 5); if(k%4===0) psaw(up,t,0.5,0.07,6); } if(k===0 && bar%2===1) bell(D5,t,0.8,0.06); }
  } };
  return SONG;
})();

// ===== MORNING — "Morning Bonk": 132 BPM F Lydian, bright & bouncy (the quirky one) =====
const MORNING = (() => {
  const N = (n) => 110 * Math.pow(2, n / 12);
  const A3=N(12), B3=N(14), C4=N(15), D4=N(17), E4=N(19);
  const F4=N(20), G4=N(22), A4=N(24), B4=N(26), C5=N(27), D5=N(29), E5=N(31), F5=N(32);
  const C2=N(-9), F2=N(-4), G2=N(-2), D2=N(-7);
  const _=null;
  const hookA=[F4,_,G4,_, A4,_,B4,_, A4,_,G4,F4, A4,_,_,_];
  const hookB=[C5,_,B4,_, A4,_,G4,_, A4,B4,C5,_, A4,_,_,_];
  const hookC=[F4,_,G4,_, A4,B4,C5,_, D5,_,C5,B4, A4,_,_,_];
  const hookD=[C5,_,A4,_, G4,_,F4,_, G4,A4,B4,_, A4,_,_,_];
  const belA=[_,_,_,_, _,_,_,F5, _,_,_,_, C5,_,E5,_];
  const belB=[_,_,_,_, _,_,_,D5, _,_,_,_, F5,_,A4,_];
  const belC=[_,_,_,_, _,_,_,A4, _,_,_,_, E5,_,C5,_];
  const belD=[_,_,_,_, _,_,_,C5, _,_,_,_, F5,_,_,_];
  const stabPat=[_,_,1,_, _,_,1,_, _,_,1,_, _,_,1,_];
  const SONG = { ms:114, len:504, voice(t,s){
    const bar=Math.floor(s/16), b=s%16, swing=(b%2===1)?0.012:0, T=t+swing;
    const intro=s<64, hook1=s>=64&&s<192, hook2=s>=192&&s<320, bridge=s>=320&&s<384, resolve=s>=384;
    const phrase=bar%4, lead=[hookA,hookB,hookC,hookD][phrase], bellSeq=[belA,belB,belC,belD][phrase];
    if (!intro){ if(b%4===0) kick(T,0.5); if(b===4||b===12) snare(T,0.16); if(b===14) snare(T,0.06); const off=(b%4===2); hat(T, off?0.05:0.022, off?0.035:0.022); if(b===15 && !bridge) tom(T, 520+(phrase%2)*70, 0.16); }
    else { if(bar>=2 && b%4===2) hat(T,0.025,0.03); if(bar===3 && b===15) tom(T,480,0.14); }
    if (!intro){ let root=F2, oct=N(8); if(bridge){ root=D2; oct=N(-7+12); } else if(phrase===1){ root=C2; oct=N(3); } else if(phrase===2){ root=G2; oct=N(-2+12); } if(b===0||b===8) sub(root,T,0.14,0.14); else if(b===4||b===12) sub(oct,T,0.12,0.12); }
    if (intro){ const slow=[F4,_,_,_, A4,_,_,_, B4,_,_,_, G4,_,_,_][b]; if(slow) softNote(slow,0.5,0.16); if(b===14 && bar%2===1) bell(C5,T,0.5,0.10); if(b===0) pad(F5,T,1.2,0.05); }
    if (hook1||hook2){ const ln=lead[b]; if(ln) pluck(ln,T,0.10,0.17); const bn=bellSeq[b]; if(bn) bell(bn,T,0.18,0.11); if(stabPat[b]){ const stabF=(phrase===1)?E4:(phrase===2)?D4:N(24); psaw(stabF,T,0.05,0.10,12); } if(hook2 && b===0) pad(C5,T,0.9,0.045); }
    if (bridge){ const uho=[ D4,_,F4,_, A4,_,F4,_, D4,_,_,_, C4,_,_,_, D4,_,F4,_, A4,_,C5,_, D5,_,C5,_, A4,_,_,_, N(-7+12),_,_,_, _,_,_,_, _,_,_,_, _,_,_,_, E4,_,_,_, F4,_,_,_, G4,_,A4,_, _,_,_,_ ][s-320]; if(uho) pluck(uho,T,0.11,0.15); if(s===320) bell(D4,T,0.6,0.10); if(bar===23 && (b===2||b===6||b===10)) psaw(C5,T,0.05,0.09,12); }
    if (resolve){ const rbar=bar-24, rb=b; const rlead=[hookA,hookC,hookA,hookC][rbar%4][rb]; if(rlead){ pluck(rlead,T,0.10,0.17); if(rb%4===0||rb===6) bell(rlead*1.26,T,0.18,0.10); } if(stabPat[rb]) psaw(C5,T,0.05,0.11,14);
      if(rbar>=6){ if(rb===2) tom(T,360,0.16); if(rb===4) tom(T,440,0.16); if(rb===6) tom(T,520,0.17); if(rb===8) tom(T,620,0.18); if(rb===12){ psaw(F4,T,0.06,0.13,16); sub(F2,T,0.16,0.15); seqNote('triangle',F5,T,0.14,0.10); bell(C5,T,0.5,0.10); } }
      if(rbar<6 && rb===14) seqNote('triangle', (rbar%2)?A4:C5, T, 0.13, 0.085); }
  } };
  return SONG;
})();

// ===== EMBER — "Ember March": ~150 BPM A Phrygian-dominant molten pound (Emberdeep) =====
const EMBER = (() => {
  const A=0, Bb=1, Cs=4, D=5, E=7, F=8, G=10, _=null;
  const inIntro = s => s < 128, inHook = s => s>=128&&s<256, inBreak = s => s>=256&&s<384, inRetn = s => s>=384&&s<512, inResv = s => s>=512;
  const RIFF = [Cs,_,_,_, Bb,_,_,A,  _,_,Cs,_, Bb,_,A,_];
  const ANSW = [_,_,E,_,  _,D,_,_,  G,_,_,D,  _,Cs,_,_];
  const SPARK= [_,_,_,_,  _,_,_,_,  _,_,_,_,  E,_,_,_];
  const SONG = { ms:100, len:560, voice(t,s){
    const k=s&1, q=s%4, b=s%16, bar=(s>>4);
    if (inIntro(s)){ if(b===0) tom(t,55,0.16); if(b===8) tom(t,49,0.13); if(s>=96 && q===0) kick(t,0.4); if(s>=96 && (s%8)===4) hat(t,0.03,0.02); }
    else if (inBreak(s)){ if((s%8)===0) kick(t, q===0?0.55:0.5); if((s%16)===8) snare(t,0.18); if(b===14) tom(t,70,0.16); if(b===15) tom(t,58,0.18); if((bar%2)===1 && (s%16)>=12) hat(t,0.025,0.02); }
    else { if(q===0) kick(t,(b===0?0.55:0.48)); if(b===6||b===14) kick(t,0.34); if((s%8)===4) snare(t,0.17); if(k===1) hat(t, q===2?0.045:0.03, 0.02); if((bar%4)===3){ if(b===12) tom(t,90,0.14); if(b===13) tom(t,76,0.15); if(b===14) tom(t,64,0.16); if(b===15) tom(t,54,0.18); } }
    if (inIntro(s)){ if(b===0) sub(NOTE(A-12),t,1.5,0.13); if(s>=96 && b===8) sub(NOTE(A-12),t,1.4,0.13); }
    else if (inBreak(s)){ if((s%16)===0) sub(NOTE(A-12),t,1.5,0.15); if((s%16)===8) sub(NOTE(F-12),t,0.7,0.13); }
    else { if(q===0) sub(NOTE(A-12),t,0.22,0.15); if(b===6) sub(NOTE(Bb-12),t,0.18,0.12); if(b===14) sub(NOTE(G-24),t,0.18,0.12); if(inResv(s) && (s%16)===0) sub(NOTE(A-12),t,0.5,0.16); }
    if (inHook(s)){ const r=RIFF[b]; if(r!==null) psaw(NOTE(r),t,0.085,0.10,12); const a=ANSW[b]; if(a!==null) pluck(NOTE(a+12),t,0.07,0.06); }
    else if (inRetn(s)){ const r=RIFF[b]; if(r!==null){ psaw(NOTE(r),t,0.085,0.10,14); psaw(NOTE(r+12),t,0.08,0.07,16); } const a=ANSW[b]; if(a!==null) pluck(NOTE(a+12),t,0.07,0.06); }
    if (inBreak(s)){ if((s%16)===0){ psaw(NOTE(A),t,0.6,0.10,16); psaw(NOTE(E),t,0.6,0.08,16); } if((s%16)===8){ psaw(NOTE(F),t,0.5,0.10,16); psaw(NOTE(Cs+8),t,0.5,0.08,16); } if((s%32)===0) pad(NOTE(A),t,3.2,0.05); if((s%32)===16) pad(NOTE(F),t,1.6,0.045); }
    if (inResv(s)){ if(s>=512 && s<=519){ const fillF=[120,104,90,78,68,60,54,48][s-512]; tom(t,fillF,0.12+(s-512)*0.008); } if(s===520||s===536){ psaw(NOTE(A),t,0.7,0.11,14); psaw(NOTE(E),t,0.7,0.09,14); } if(s===552){ psaw(NOTE(A),t,0.9,0.12,16); psaw(NOTE(E),t,0.9,0.09,16); } if((s%4)===0) kick(t,0.5); if((s%8)===4) snare(t,0.16); }
    if (inIntro(s)){ if(s===16) softNote(NOTE(E+12),0.6,0.05); if(s===48) softNote(NOTE(F+12),0.6,0.05); if(s===80) softNote(NOTE(Cs+12),0.6,0.05); }
    else if (!inBreak(s)){ const sp=SPARK[b]; if(sp!==null) bell(NOTE(sp+24),t,0.18,0.04); if(b===4 && (bar%2)===1) seqNote('triangle',NOTE(F+24),t,0.12,0.04,6); }
    else { if((s%32)===24) bell(NOTE(A+24),t,0.3,0.035); }
  } };
  return SONG;
})();

// ===== ASTRAL — "Astral Drift": ~120 BPM eerie cosmic drift (Astral Verge) =====
const ASTRAL = (() => {
  const N = { A2:-12, C3:-9, D3:-7, Eb3:-6, E3:-5, G3:-3, A3:0, B3:2, C4:3, D4:5, Eb4:6, E4:7, F4:8, G4:10, A4:12, B4:14, C5:15, D5:17, Eb5:18, E5:19 };
  const PAD_ROOTS = [N.A2, N.F4-12, N.D3, N.E3];
  const PAD_VOICE = [ [N.A3,N.C4,N.E4], [N.F4-12, N.A3, N.C4], [N.D3, N.F4-12, N.A3], [N.E3, N.G3, N.B3] ];
  const ARP_UP   = [N.A3,N.C4,N.E4,N.A4, N.B4,N.A4,N.E4,N.C4];
  const ARP_DRIFT= [N.C4,N.E4,N.G4,N.B4, N.A4,N.G4,N.E4,N.D4];
  const ARP_WT   = [N.C4,N.D4,N.E4,N.Eb4+1, N.G4,N.A4,N.B4,N.A4];
  const MOTIF = [N.E4,null,null,null, N.D4,null,null,N.C4, null,null,N.B3,null, N.A3,null,null,null, N.Eb4,null,null,null, N.E4,null,null,null, null,null,N.C4,null, N.B3,null,null,null];
  const STARS = [N.A4,null,null,N.E4, null,null,N.C5,null, null,N.B4,null,null, N.E5,null,null,null];
  const SONG = { ms:150, len:384, voice(t,s){
    const bar=(s>>2)&3, region=(s>>5)&3;
    if(s%16===0){ const ch=PAD_VOICE[region]; pad(NOTE(PAD_ROOTS[region]),t,5.2,0.05); pad(NOTE(ch[0]),t,5.0,0.035); pad(NOTE(ch[1]),t,4.8,0.03); pad(NOTE(ch[2]),t,4.6,0.028); }
    if(s%32===0) sub(NOTE(PAD_ROOTS[region]-12),t,3.4,0.13);
    if(s>=64){ if(s%8===0) kick(t,0.40); if(s%8===4) kick(t,0.34); if(s%4===2) hat(t,0.035,0.03); if(s%16===6||s%16===14) hat(t,0.025,0.025); if(s%32===24) snare(t,0.12); }
    if(s<96){ const st=STARS[s%16]; if(st!=null) bell(NOTE(st),t,1.1,0.05); if(s%24===12) bell(NOTE(N.A4+12),t,1.4,0.035); }
    if(s>=96 && s<288){ const inBridge=(s>=192 && s<224); const shape=inBridge?ARP_WT:((bar&1)?ARP_DRIFT:ARP_UP); const an=shape[s%8];
      if(an!=null){ seqNote('sine',NOTE(an),t,0.13,0.055,4); seqNote('sine',NOTE(an+12),t,0.12,0.022,-7); if(s%4===0) bell(NOTE(an+12),t,0.9,0.04); }
      const m=MOTIF[s%32]; if(m!=null) psaw(NOTE(m),t,0.42,0.05,12); }
    if(s>=288){ const RES=[N.A3,null,N.C4,null, N.E4,null,null,null, N.A4,null,N.G4,null, N.E4,null,null,null, N.C4,null,null,null, N.B3,null,null,null, N.A3,null,null,null, N.Eb4,null,null,null]; const r=RES[s%32];
      if(r!=null){ seqNote('sine',NOTE(r),t,0.14,0.05,3); bell(NOTE(r+12),t,1.0,0.035); }
      if(s===383){ bell(NOTE(N.Eb5),t,2.0,0.04); seqNote('sine',NOTE(N.B4),t,0.5,0.03,6); } }
  } };
  return SONG;
})();

// ---- public controls (one engine; same names the game + jukebox already call) ----
export function startMenuMusic(){ playSong('menu', MENU); }
export function stopMenuMusic(){ stopSong('menu'); }
export function startTownMusic(){ playSong('town', TOWN); }
export function stopTownMusic(){ stopSong('town'); }
export function startBattleMusic(){ playSong('battle', BATTLE); }
export function stopBattleMusic(){ stopSong('battle'); }
export function startBossMusic(){ playSong('boss', BOSS); }
export function stopBossMusic(){ stopSong('boss'); }
export function startLamentMusic(){ playSong('lament', LAMENT); }
export function stopLamentMusic(){ stopSong('lament'); }
export function startForestMusic(){ playSong('forest', FOREST); }
export function stopForestMusic(){ stopSong('forest'); }
export function startMorningMusic(){ playSong('morning', MORNING); }
export function stopMorningMusic(){ stopSong('morning'); }
export function startEmberMusic(){ playSong('ember', EMBER); }
export function stopEmberMusic(){ stopSong('ember'); }
export function startAstralMusic(){ playSong('astral', ASTRAL); }
export function stopAstralMusic(){ stopSong('astral'); }
// ---- dev self-test: run every song's voice across a full loop; report any error ----
export function musicSelfTest(){
  const songs={menu:MENU,town:TOWN,battle:BATTLE,boss:BOSS,lament:LAMENT,forest:FOREST,morning:MORNING,ember:EMBER,astral:ASTRAL};
  const errors=[], durations={}; const t=AC?AC.currentTime:0;
  for(const k in songs){ const s=songs[k]; durations[k]=+(s.len*s.ms/1000).toFixed(1);
    try{ for(let i=0;i<s.len;i++) s.voice(t, i%s.len, i); }catch(e){ errors.push(k+': '+((e&&e.message)||e)); } }
  return { ok:errors.length===0, errors, durations };
}
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
