// Procedural Web Audio — every sound is synthesized, no audio files. Fully
// self-contained (Web Audio API only): nothing here reads game state or the
// scene, so the module has no imports. The rest of the game calls these.

let AC=null,wind=null,musicBus=null;
// All music voices route through a swappable "music bus" gain so a stop/switch can
// fade the bus to silence in ~0.12s — cutting notes that are still ringing (long
// pads/sub) instead of letting them bleed over the next track. SFX bypass this.
function musOut(){ return musicBus || (AC && AC.destination); }
function _fadeBus(b){ if(!b||!AC) return; try{ const n=AC.currentTime; b.gain.cancelScheduledValues(n); b.gain.setValueAtTime(b.gain.value,n); b.gain.linearRampToValueAtTime(0.0001,n+0.12); setTimeout(()=>{ try{ b.disconnect(); }catch(e){} }, 500); }catch(e){} }
function _newBus(){ if(!AC) return; _fadeBus(musicBus); musicBus=AC.createGain(); musicBus.gain.value=1; musicBus.connect(AC.destination); }
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
// energetic chiptune/synthwave, kept below SFX volume. ----
function softNote(f,dur,vol){ if(!AC)return; const t=AC.currentTime; const o=AC.createOscillator(),g=AC.createGain();
  o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(musOut());
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.05); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  o.start(t); o.stop(t+dur+0.05); }
// ---- drum & synth voices shared by every song ----
function kick(t,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain();
  o.type='sine'; o.frequency.setValueAtTime(150,t); o.frequency.exponentialRampToValueAtTime(45,t+0.11);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.16);
  o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+0.18); }
function hat(t,vol,dur){ if(!AC)return; const buf=AC.createBuffer(1,(AC.sampleRate*dur)|0,AC.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1); const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='highpass'; f.frequency.value=7000; const g=AC.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur);
  s.connect(f); f.connect(g); g.connect(musOut()); s.start(t); s.stop(t+dur+0.02); }
function snare(t,vol){ if(!AC)return; const buf=AC.createBuffer(1,(AC.sampleRate*0.18)|0,AC.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1); const s=AC.createBufferSource(); s.buffer=buf;
  const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=1900; f.Q.value=0.7; const g=AC.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.17);
  s.connect(f); f.connect(g); g.connect(musOut()); s.start(t); s.stop(t+0.2); }
function seqNote(type,f,t,dur,vol,detune){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain();
  o.type=type; o.frequency.setValueAtTime(f,t); if(detune)o.detune.value=detune;
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.012); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+dur+0.02); }
const NOTE=n=>110*Math.pow(2,n/12);   // semitone offset from A2
// ---- expanded synth palette (all schedule at the given time t; richer voices) ----
function env(g,t,a,d,vol){ g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+a); g.gain.exponentialRampToValueAtTime(0.0006,t+d); }
function psaw(f,t,dur,vol,spread){ if(!AC)return; const g=AC.createGain(); g.connect(musOut()); env(g,t,0.012,dur,vol);   // thick detuned "supersaw" — big OOMPH
  const det=spread||14; for(const c of [-det,0,det]){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.setValueAtTime(f,t); o.detune.value=c; o.connect(g); o.start(t); o.stop(t+dur+0.03); } }
function pluck(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='square'; o.frequency.setValueAtTime(f,t);   // percussive chiptune pluck
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0006,t+dur); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+dur+0.02); }
function sub(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,t);   // pure sine sub-bass for low-end power
  env(g,t,0.01,dur,vol); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+dur+0.03); }
function pad(f,t,dur,vol){ if(!AC)return; const g=AC.createGain(); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1500; lp.connect(musOut()); g.connect(lp);   // warm slow pad
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+dur*0.4); g.gain.linearRampToValueAtTime(0.0006,t+dur);
  for(const c of [0,7]){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=f*Math.pow(2,c/12); o.detune.value=(c?6:-6); o.connect(g); o.start(t); o.stop(t+dur+0.05); }
  const o2=AC.createOscillator(); o2.type='triangle'; o2.frequency.value=f; o2.connect(g); o2.start(t); o2.stop(t+dur+0.05); }
function bell(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),m=AC.createOscillator(),mg=AC.createGain(),g=AC.createGain();   // FM bell/chime (calm shimmer)
  o.type='sine'; o.frequency.value=f; m.type='sine'; m.frequency.value=f*2.01; mg.gain.value=f*1.2; m.connect(mg); mg.connect(o.frequency);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0005,t+dur); o.connect(g); g.connect(musOut()); o.start(t); m.start(t); o.stop(t+dur+0.05); m.stop(t+dur+0.05); }
function tom(t,f,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(Math.max(40,f*0.5),t+0.18);   // pitched tom (boss fills)
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.2); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+0.22); }
function noiseHit(t,vol,dur,freq){ if(!AC)return; const b=AC.createBuffer(1,(AC.sampleRate*dur)|0,AC.sampleRate); const d=b.getChannelData(0); for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1);   // filtered noise (crash / riser)
  const s=AC.createBufferSource(); s.buffer=b; const f=AC.createBiquadFilter(); f.type='bandpass'; f.frequency.value=freq||1200; f.Q.value=0.6; const g=AC.createGain();
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+dur); s.connect(f); f.connect(g); g.connect(musOut()); s.start(t); s.stop(t+dur+0.02); }
// ---- arrangement helpers: build a full ~1-minute timeline from short motifs ----
const seqc=(...p)=>[].concat(...p);                            // concatenate sections into one timeline
const rep=(a,n)=>{ let o=[]; for(let i=0;i<n;i++) o=o.concat(a); return o; };   // repeat a section (the hook)

// ---- the single song engine: one track at a time; arrangements loop (~1 min) ----
let songTimer=null, songStep=0, curSong=null;
function playSong(id,song){ if(!AC || curSong===id) return; if(songTimer) clearInterval(songTimer);
  _newBus();   // fresh bus; the old one (with any ringing notes) fades out independently
  curSong=id; songStep=0;
  songTimer=setInterval(()=>{ song.voice(AC.currentTime+0.02, songStep%song.len, songStep); songStep++; }, song.ms); }
function stopSong(id){ if(curSong!==id) return; if(songTimer){ clearInterval(songTimer); songTimer=null; } _fadeBus(musicBus); musicBus=null; curSong=null; }
// stop whatever song is playing (handy on title/death/state resets) — fades the bus so nothing rings on
export function stopAllMusic(){ if(songTimer){ clearInterval(songTimer); songTimer=null; } _fadeBus(musicBus); musicBus=null; curSong=null; }

// ============================================================================
//  SONGS — a shared synthwave builder keeps every track COHERENT: the bed
//  (pad + chord-tone arpeggio + bass) is built only from the CURRENT chord's
//  notes, so it can never sound "random"; a hand-written foreground LEAD carries
//  a clear, memorable melody on top (octave-lifted in the 2nd half for an arc).
//  ASTRAL Drift (below) stays hand-authored — it was the one that already worked.
// ============================================================================
const R16=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
function makeSong(o){
  const len=o.bars*16, ch=o.chords, bass=o.bass, lead=o.lead, barSec=o.ms*16/1000, ld=o.ms/1000*1.7, half=o.bars/2;
  return { ms:o.ms, len, voice(t,s){
    const bar=(s/16)|0, step=s%16, beat=step%4;
    const c=ch[bar%ch.length], br=bass[bar%bass.length], tones=[c[0],c[1],c[2],c[0]+12];
    // harmonic bed — a sustained triad each bar
    if(step===0){ pad(NOTE(c[0]),t,barSec*1.05,0.045); pad(NOTE(c[1]),t,barSec*1.05,0.032); pad(NOTE(c[2]),t,barSec*1.05,0.028); }
    // bass + drums by mode
    if(o.mode==='drive'){
      if(beat===0){ sub(NOTE(br),t,0.16,0.14); kick(t,0.5); }
      if(step===6||step===14) sub(NOTE(br+12),t,0.12,0.09);   // synthwave octave push
      if(step===4||step===12) snare(t,0.16);
      if(step%4===2) hat(t,0.045,0.03); else if(step%2===1) hat(t,0.02,0.018);
    } else if(o.mode==='march'){
      if(step===0||step===8) sub(NOTE(br),t,0.5,0.15);
      if(step%4===0) kick(t, step===0?0.55:0.5);
      if(step===8) snare(t,0.2);
      if(step%2===0) hat(t, step%4===0?0.045:0.03, 0.025);
    } else if(o.mode==='soft'){
      if(step===0) sub(NOTE(br),t,0.5,0.12); if(step===8) sub(NOTE(br+12),t,0.4,0.09);
      if(step===0) kick(t,0.34); if(step===8) kick(t,0.26);
      if(step%4===2) hat(t,0.03,0.025);
    } else { // 'calm' — minimal, ambient
      if(step===0) sub(NOTE(br),t,barSec*0.9,0.12);
      if(o.softKick && step===0 && bar%2===0) kick(t,0.22);
    }
    // chord-tone arpeggio motor (consonant by construction)
    if(o.arp==='drive16') seqNote('sawtooth', NOTE(tones[step%4]+12), t, o.ms/1000*0.9, 0.04, 8);
    else if(o.arp==='pluck16') seqNote('square', NOTE(tones[step%4]+12), t, o.ms/1000*0.85, 0.045, 4);
    else if(o.arp==='gentle8'){ if(step%2===0) pluck(NOTE(tones[(step>>1)%4]+12), t, 0.18, 0.05); }
    else if(o.arp==='bell8'){ if(step%2===0) bell(NOTE(tones[(step>>1)%4]+12), t, 0.5, 0.035); }
    else if(o.arp==='bell4'){ if(step%4===0) bell(NOTE(tones[(step>>2)%4]+12), t, 0.9, 0.04); }
    // foreground memorable lead (octave-lifted in the 2nd half)
    let l=lead[s];
    if(l!=null){
      if(o.lift && bar>=half) l=l+12;
      if(o.leadV==='psaw') psaw(NOTE(l),t,ld,0.07,12);
      else if(o.leadV==='square') seqNote('square',NOTE(l),t,ld,0.075,5);
      else if(o.leadV==='bell') bell(NOTE(l),t,Math.max(0.45,ld),0.06);
      else softNote(NOTE(l),Math.max(0.45,ld),0.075);
      if(o.harmony!=null) softNote(NOTE(l+o.harmony),Math.max(0.4,ld),0.04);
      if(o.shimmer && beat===0) bell(NOTE(l+12),t,0.4,0.02);
    }
  } };
}

// ===== MENU — calm, beautiful title theme (Am–F–C–G; hopeful-but-grim) =====
const A_MENU=[
  19,null,null,null, 24,null,null,null, 22,null,19,null, null,null,null,null,
  20,null,null,null, 24,null,null,null, 22,null,null,null, 20,null,null,null,
  19,null,null,null, 22,null,null,null, 27,null,26,null, 22,null,null,null,
  17,null,null,null, 22,null,null,null, 26,null,24,null, 22,null,null,null];
const MENU = makeSong({ ms:300, bars:12, mode:'calm', softKick:true, arp:'bell8', leadV:'soft', lift:true,
  chords:[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]], bass:[-12,-16,-9,-14],
  lead: seqc(rep(R16,4), rep(A_MENU,2)) });

// ===== TOWN — Waystation: warm, cozy, gentle groove + a clear hook (C–G–Am–F) =====
const A_TOWN=[
  22,null,19,null, 22,null,27,null, 26,null,22,null, 19,null,null,null,
  17,null,22,null, 26,null,29,null, 26,null,22,null, 17,null,null,null,
  27,null,24,null, 19,null,24,null, 27,null,26,null, 24,null,null,null,
  24,null,20,null, 15,null,20,null, 24,null,22,null, 20,null,null,null];
const TOWN = makeSong({ ms:150, bars:24, mode:'soft', arp:'gentle8', leadV:'bell', shimmer:true, lift:true,
  chords:[[3,7,10],[-2,2,5],[0,3,7],[-4,0,3]], bass:[-9,-14,-12,-16],
  lead: seqc(rep(R16,4), rep(A_TOWN,5)) });

// ===== BATTLE — "The Road": driving synthwave banger (Am–F–C–G) =====
const A_BATTLE=[
  19,null,null,null, 24,null,22,null, 19,null,null,null, 15,null,null,null,
  20,null,null,null, 24,null,null,null, 22,null,20,null, 15,null,null,null,
  22,null,null,null, 19,null,22,null, 27,null,26,null, 22,null,null,null,
  26,null,24,null, 22,null,null,null, 17,null,null,null, 19,null,null,null];
const BATTLE = makeSong({ ms:116, bars:32, mode:'drive', arp:'drive16', leadV:'psaw', shimmer:true, lift:true,
  chords:[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]], bass:[-12,-16,-9,-14],
  lead: seqc(rep(R16,4), rep(A_BATTLE,6), rep(R16,4)) });

// ===== BOSS — "The Guardian": dark, badass synthwave (Dm–Bb–C–A, harmonic-minor V) =====
const A_BOSS=[
  17,null,null,null, 24,null,20,null, 17,null,null,null, 19,null,null,null,
  17,null,null,null, 20,null,null,null, 17,null,13,null, 8,null,null,null,
  19,null,null,null, 22,null,19,null, 15,null,null,null, 10,null,null,null,
  19,null,null,null, 16,null,19,null, 24,null,16,null, 19,null,null,null];
const BOSS = makeSong({ ms:125, bars:28, mode:'march', arp:'pluck16', leadV:'psaw', lift:true,
  chords:[[5,8,12],[1,5,8],[3,7,10],[0,4,7]], bass:[-7,-11,-9,-12],
  lead: seqc(rep(R16,4), rep(A_BOSS,6)) });

// ===== LAMENT — "Pilgrim's Lament": slow, beautiful & sad (Am–F–C–E), with harmony =====
const A_LAMENT=[
  24,null,null,null, 27,null,26,null, 24,null,null,null, 19,null,null,null,
  24,null,null,null, 27,null,null,null, 24,null,22,null, 20,null,null,null,
  22,null,null,null, 19,null,22,null, 27,null,null,null, 26,null,null,null,
  26,null,null,null, 23,null,null,null, 19,null,20,null, 19,null,null,null];
const LAMENT = makeSong({ ms:220, bars:16, mode:'calm', softKick:false, arp:'bell4', leadV:'soft', harmony:-3,
  chords:[[0,3,7],[-4,0,3],[3,7,10],[-5,-1,2]], bass:[-12,-16,-9,-17],
  lead: rep(A_LAMENT,4) });

// ===== FOREST — "Forest Hunt": mid-tempo synthwave woodland prowl (Dm–C–G–Dm) =====
const A_FOREST=[
  17,null,20,null, 24,null,20,null, 17,null,19,null, 20,null,null,null,
  19,null,22,null, 27,null,22,null, 19,null,17,null, 15,null,null,null,
  17,null,22,null, 26,null,22,null, 17,null,19,null, 17,null,null,null,
  20,null,19,null, 17,null,12,null, 17,null,20,null, 24,null,null,null];
const FOREST = makeSong({ ms:132, bars:28, mode:'drive', arp:'pluck16', leadV:'square', lift:true,
  chords:[[5,8,12],[3,7,10],[-2,2,5],[5,8,12]], bass:[-7,-9,-14,-7],
  lead: seqc(rep(R16,4), rep(A_FOREST,6)) });

// ===== MORNING — "Gilded Dawn": bright, cheerful, chill-pop (C–Am–F–G) =====
// A clear, repeated rhythmic cell (note · quick up-down · note) over I–vi–IV–V,
// mostly stepwise so it's singable; arp thinned to 8ths so the hook stays on top.
const A_MORNING=[
  22,null,null,null, 27,null,26,null, 27,null,null,null, 31,null,null,null,
  24,null,null,null, 27,null,26,null, 24,null,null,null, 19,null,null,null,
  24,null,null,null, 27,null,29,null, 27,null,null,null, 24,null,null,null,
  22,null,null,null, 26,null,29,null, 26,null,null,null, 22,null,null,null];
const MORNING = makeSong({ ms:132, bars:28, mode:'soft', arp:'gentle8', leadV:'square', shimmer:true, lift:true,
  chords:[[3,7,10],[0,3,7],[-4,0,3],[-2,2,5]], bass:[-9,-12,-16,-14],
  lead: rep(A_MORNING,7) });

// ===== EMBER — "Ember March": molten driving synthwave (Am–F–G–Bb, Phrygian bite) =====
const A_EMBER=[
  24,null,null,null, 22,null,20,null, 19,null,null,null, 12,null,null,null,
  24,null,null,null, 20,null,null,null, 19,null,20,null, 12,null,null,null,
  22,null,null,null, 17,null,22,null, 26,null,null,null, 29,null,null,null,
  25,null,24,null, 20,null,null,null, 13,null,12,null, null,null,null,null];
const EMBER = makeSong({ ms:112, bars:32, mode:'drive', arp:'drive16', leadV:'psaw', lift:true,
  chords:[[0,3,7],[-4,0,3],[-2,2,5],[1,5,8]], bass:[-12,-16,-14,-11],
  lead: seqc(rep(R16,4), rep(A_EMBER,6), rep(R16,4)) });

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
