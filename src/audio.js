// Procedural Web Audio — every sound is synthesized, no audio files. Fully
// self-contained (Web Audio API only): nothing here reads game state or the
// scene, so the module has no imports. The rest of the game calls these.

let AC=null,wind=null,musicBus=null,revConv=null,revGain=null;
// All music voices route through a swappable "music bus" gain so a stop/switch can
// fade the bus to silence in ~0.12s — cutting notes that are still ringing (long
// pads/sub) instead of letting them bleed over the next track. SFX bypass this.
// The bus also feeds a shared convolution reverb (a generated impulse) at a level
// set per-track (chill = wetter, combat = drier), to give the music space & glue.
function musOut(){ return musicBus || (AC && AC.destination); }
function _fadeBus(b){ if(!b||!AC) return; try{ const n=AC.currentTime; b.gain.cancelScheduledValues(n); b.gain.setValueAtTime(b.gain.value,n); b.gain.linearRampToValueAtTime(0.0001,n+0.12); setTimeout(()=>{ try{ b.disconnect(); }catch(e){} }, 500); }catch(e){} }
function _newBus(){ if(!AC) return; _fadeBus(musicBus); musicBus=AC.createGain(); musicBus.gain.value=1; musicBus.connect(AC.destination); if(revConv) musicBus.connect(revConv); }
function _makeIR(seconds,decay){ const len=(AC.sampleRate*seconds)|0; const b=AC.createBuffer(2,len,AC.sampleRate);   // exp-decay noise impulse → a soft hall
  for(let ch=0;ch<2;ch++){ const d=b.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,decay); } return b; }
export function audioStart(){ if(AC)return; try{ AC=new (window.AudioContext||window.webkitAudioContext)();
  const buf=AC.createBuffer(1,AC.sampleRate*2,AC.sampleRate); const d=buf.getChannelData(0);
  for(let i=0;i<d.length;i++)d[i]=(Math.random()*2-1)*.5;
  const src=AC.createBufferSource(); src.buffer=buf; src.loop=true;
  const f=AC.createBiquadFilter(); f.type='lowpass'; f.frequency.value=420;
  const g=AC.createGain(); g.gain.value=.05; src.connect(f); f.connect(g); g.connect(AC.destination); src.start(); wind=g;
  try{ revConv=AC.createConvolver(); revConv.buffer=_makeIR(1.9,2.6); revGain=AC.createGain(); revGain.gain.value=0; revConv.connect(revGain); revGain.connect(AC.destination); }catch(e){ revConv=null; }
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
// ---- orchestral voices (synthesized: bowed strings, horns, timpani, pizzicato) ----
function strings(f,t,dur,vol){ if(!AC)return; const g=AC.createGain(); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=2300; lp.connect(musOut()); g.connect(lp);   // bowed string ensemble
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.14); g.gain.setValueAtTime(vol,t+Math.max(0.16,dur*0.7)); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  for(const c of [-8,0,9]){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=c; o.connect(g); o.start(t); o.stop(t+dur+0.06); } }
function brass(f,t,dur,vol){ if(!AC)return; const g=AC.createGain(); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=3200; lp.connect(musOut()); g.connect(lp);   // horn/brass swell
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.08); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  for(const c of [-5,6]){ const o=AC.createOscillator(); o.type='sawtooth'; o.frequency.value=f; o.detune.value=c; o.connect(g); o.start(t); o.stop(t+dur+0.05); } }
function timp(t,f,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='triangle'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(Math.max(30,f*0.7),t+0.24);   // timpani
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.001,t+0.45); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+0.5); }
function pizz(f,t,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='triangle'; o.frequency.setValueAtTime(f,t);   // pizzicato string
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0005,t+0.14); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+0.16); }
function choir(f,t,dur,vol){ if(!AC)return; const g=AC.createGain(); const lp=AC.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=1400; lp.connect(musOut()); g.connect(lp);   // breathy "aah" vowel pad
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+Math.min(0.3,dur*0.4)); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  for(const c of [-7,0,5]){ const o=AC.createOscillator(); o.type='triangle'; o.frequency.value=f; o.detune.value=c; o.connect(g); o.start(t); o.stop(t+dur+0.05); }
  const o2=AC.createOscillator(); o2.type='sawtooth'; o2.frequency.value=f; o2.detune.value=3; const g2=AC.createGain(); g2.gain.value=0.4; o2.connect(g2); g2.connect(g); o2.start(t); o2.stop(t+dur+0.05); }
function flute(f,t,dur,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,t);   // soft breathy flute (sine + faint triangle body)
  const o2=AC.createOscillator(),g2=AC.createGain(); o2.type='triangle'; o2.frequency.value=f; g2.gain.value=0.18; o2.connect(g2); g2.connect(musOut());
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.06); g.gain.setValueAtTime(vol,t+dur*0.6); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+dur+0.05); o2.start(t); o2.stop(t+dur+0.05); }
function harp(f,t,vol){ if(!AC)return; const o=AC.createOscillator(),g=AC.createGain(); o.type='triangle'; o.frequency.setValueAtTime(f,t);   // bright plucked harp (with a shimmer octave)
  const o2=AC.createOscillator(),g2=AC.createGain(); o2.type='sine'; o2.frequency.value=f*2; g2.gain.setValueAtTime(vol*0.3,t); g2.gain.exponentialRampToValueAtTime(0.0005,t+0.3); o2.connect(g2); g2.connect(musOut()); o2.start(t); o2.stop(t+0.42);
  g.gain.setValueAtTime(vol,t); g.gain.exponentialRampToValueAtTime(0.0005,t+0.5); o.connect(g); g.connect(musOut()); o.start(t); o.stop(t+0.52); }
// ---- arrangement helpers: build a full ~1-minute timeline from short motifs ----
const seqc=(...p)=>[].concat(...p);                            // concatenate sections into one timeline
const rep=(a,n)=>{ let o=[]; for(let i=0;i<n;i++) o=o.concat(a); return o; };   // repeat a section (the hook)

// ---- the single song engine: one track at a time; arrangements loop (~1 min) ----
let songTimer=null, songStep=0, curSong=null;
function playSong(id,song){ if(!AC || curSong===id) return; if(songTimer) clearInterval(songTimer);
  _newBus();   // fresh bus; the old one (with any ringing notes) fades out independently
  if(revGain) revGain.gain.value = (song.reverb!=null ? song.reverb : 0.14);   // per-track reverb depth
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
//  Every track (combat = drive/march, chill = soft/calm) is built this way.
// ============================================================================
const R16=[null,null,null,null,null,null,null,null,null,null,null,null,null,null,null,null];
function makeSong(o){
  const len=o.bars*16, ch=o.chords, bass=o.bass, lead=o.lead, barSec=o.ms*16/1000, ld=o.ms/1000*1.7, half=o.bars/2;
  return { ms:o.ms, len, reverb:o.reverb, voice(t,s){
    const bar=(s/16)|0, step=s%16, beat=step%4;
    const c=ch[bar%ch.length], br=bass[bar%bass.length], tones=[c[0],c[1],c[2], c.length>3?c[3]:c[0]+12];
    // harmonic bed — a sustained chord each bar (4th tone = 7th/colour when the chord has one)
    if(step===0){ pad(NOTE(c[0]),t,barSec*1.05,0.045); pad(NOTE(c[1]),t,barSec*1.05,0.032); pad(NOTE(c[2]),t,barSec*1.05,0.028); if(c.length>3) pad(NOTE(c[3]),t,barSec*1.05,0.02); }
    // drums by mode (bass handled separately so a track can carry a moving bassline)
    if(o.mode==='drive'){
      if(beat===0) kick(t,0.5);
      if(step===4||step===12) snare(t,0.16);
      if(step%4===2) hat(t,0.045,0.03); else if(step%2===1) hat(t,0.02,0.018);
    } else if(o.mode==='march'){
      if(step%4===0) kick(t, step===0?0.55:0.5);
      if(step===8) snare(t,0.2);
      if(step%2===0) hat(t, step%4===0?0.045:0.03, 0.025);
    } else if(o.mode==='soft'){
      if(step===0) kick(t,0.34); if(step===8) kick(t,0.26);
      if(step%4===2) hat(t,0.03,0.025);
    } else if(o.softKick && step===0 && bar%2===0) kick(t,0.22);   // 'calm'
    // bass — a per-track moving bassline if given, else the original per-mode root
    if(o.bassline){ const bo=o.bassline[step]; if(bo!=null) sub(NOTE(br+bo), t, o.bassDur||0.15, 0.12); }
    else if(o.mode==='drive'){ if(beat===0) sub(NOTE(br),t,0.16,0.14); if(step===6||step===14) sub(NOTE(br+12),t,0.12,0.09); }
    else if(o.mode==='march'){ if(step===0||step===8) sub(NOTE(br),t,0.5,0.15); }
    else if(o.mode==='soft'){ if(step===0) sub(NOTE(br),t,0.5,0.12); if(step===8) sub(NOTE(br+12),t,0.4,0.09); }
    else if(step===0) sub(NOTE(br),t,barSec*0.9,0.12);   // calm
    // drum fill at the end of each 4-bar phrase (combat life)
    if(o.fills && bar%4===3){ if(step===10) tom(t,NOTE(br+7),0.16); if(step===13) tom(t,NOTE(br+12),0.17); if(step===15) snare(t,0.22); }
    // light orchestral accents — only at each 4-bar phrase start (a touch, not a full
    // orchestra). `o.orch` is a FLAVOR string so every track gets a different colour.
    if(o.orch && bar%4===0 && step===0){
      const fl=o.orch;
      if(fl==='strings'){ strings(NOTE(c[0]),t,barSec*1.6,0.03); strings(NOTE(c[2]+12),t,barSec*1.6,0.022); timp(t,NOTE(br),0.1); }
      else if(fl==='brass'){ brass(NOTE(c[0]),t,barSec*0.7,0.04); brass(NOTE(c[2]),t,barSec*0.7,0.03); timp(t,NOTE(br),0.18); }
      else if(fl==='choir'){ choir(NOTE(c[0]+12),t,barSec*1.7,0.045); choir(NOTE(c[2]+12),t,barSec*1.7,0.03); }
      else if(fl==='timpani'){ timp(t,NOTE(br),0.2); timp(t+barSec*0.5,NOTE(br),0.12); strings(NOTE(c[0]),t,barSec*1.4,0.02); }
      else if(fl==='harp'){ for(let i=0;i<3;i++) harp(NOTE(c[i]+12),t+i*0.09,0.05); }
      else if(fl==='flute'){ flute(NOTE(c[2]+12),t,barSec*0.9,0.05); strings(NOTE(c[0]),t,barSec*1.5,0.018); }
      else { // legacy light blend (kept so ASTRAL's loved mix stays identical)
        const heavy=(o.mode==='drive'||o.mode==='march');
        timp(t, NOTE(br), heavy?0.18:0.11);
        strings(NOTE(c[0]),t,barSec*1.6,0.024); strings(NOTE(c[2]+12),t,barSec*1.6,0.018);
        const bv=heavy?0.038:0.026; brass(NOTE(c[0]),t,barSec*0.8,bv); brass(NOTE(c[2]),t,barSec*0.8,bv*0.8);
      }
    }
    // chord-tone arpeggio motor (the original synth voice — unchanged)
    if(o.arp==='drive16') seqNote('sawtooth', NOTE(tones[step%4]+12), t, o.ms/1000*0.9, 0.04, 8);
    else if(o.arp==='pluck16') seqNote('square', NOTE(tones[step%4]+12), t, o.ms/1000*0.85, 0.045, 4);
    else if(o.arp==='gentle8'){ if(step%2===0) pluck(NOTE(tones[(step>>1)%4]+12), t, 0.18, 0.05); }
    else if(o.arp==='bell8'){ if(step%2===0) bell(NOTE(tones[(step>>1)%4]+12), t, 0.5, 0.035); }
    else if(o.arp==='bell4'){ if(step%4===0) bell(NOTE(tones[(step>>2)%4]+12), t, 0.9, 0.04); }
    else if(o.arp==='harp8'){ if(step%2===0) harp(NOTE(tones[(step>>1)%4]+12), t, 0.04); }
    else if(o.arp==='tri8'){ if(step%2===0) seqNote('triangle', NOTE(tones[(step>>1)%4]+12), t, o.ms/1000*0.7, 0.035, 3); }
    // foreground memorable lead (octave-lifted in the 2nd half)
    let l=lead[s];
    if(l!=null){
      if(o.lift && bar>=half) l=l+12;
      if(o.leadV==='psaw') psaw(NOTE(l),t,ld,0.07,12);
      else if(o.leadV==='saw') seqNote('sawtooth',NOTE(l),t,ld,0.06,7);
      else if(o.leadV==='square') seqNote('square',NOTE(l),t,ld,0.075,5);
      else if(o.leadV==='tri') seqNote('triangle',NOTE(l),t,ld,0.09,4);
      else if(o.leadV==='bell') bell(NOTE(l),t,Math.max(0.45,ld),0.06);
      else if(o.leadV==='brass') brass(NOTE(l),t,Math.max(0.3,ld),0.05);
      else if(o.leadV==='strings') strings(NOTE(l),t,Math.max(0.5,ld),0.05);
      else if(o.leadV==='flute') flute(NOTE(l),t,Math.max(0.4,ld),0.085);
      else if(o.leadV==='choir') choir(NOTE(l),t,Math.max(0.5,ld),0.06);
      else if(o.leadV==='pluck') pluck(NOTE(l),t,Math.max(0.3,ld),0.08);
      else if(o.leadV==='harp') harp(NOTE(l),t,0.09);
      else softNote(NOTE(l),Math.max(0.45,ld),0.075);
      if(o.harmony!=null) softNote(NOTE(l+o.harmony),Math.max(0.4,ld),0.04);
      if(o.shimmer && beat===0) bell(NOTE(l+12),t,0.4,0.02);
    }
  } };
}

// ===== MENU — calm, beautiful title theme (Am–F–C–G; hopeful-but-grim) =====
// A-phrase (the hook) twice, a higher B-phrase answer, then the hook again (AABA).
const A_MENU=[
  19,null,null,null, 24,null,22,null, 19,null,null,null, 24,null,null,null,
  20,null,null,null, 24,null,27,null, 24,null,null,null, 20,null,null,null,
  19,null,null,null, 22,null,27,null, 26,null,22,null, 19,null,null,null,
  22,null,null,null, 26,null,24,null, 22,null,19,null, 17,null,null,null];
const B_MENU=[
  24,null,null,null, 27,null,31,null, 27,null,24,null, 19,null,null,null,
  24,null,null,null, 27,null,24,null, 20,null,null,null, 24,null,null,null,
  31,null,null,null, 34,null,31,null, 27,null,null,null, 31,null,null,null,
  26,null,null,null, 29,null,26,null, 22,null,24,null, 22,null,null,null];
const MENU = makeSong({ ms:300, bars:20, reverb:0.26, orch:'strings', mode:'calm', softKick:true, arp:'harp8', leadV:'choir',
  chords:[[0,3,7],[-4,0,3],[3,7,10],[-2,2,5]], bass:[-12,-16,-9,-14],
  lead: seqc(rep(R16,4), A_MENU, A_MENU, B_MENU, A_MENU) });

// ===== TOWN — Waystation: warm, cozy, gentle groove + a clear hook (Cmaj7–G7–Am7–Em7) =====
// Jazzy 7th chords give the cozy warmth; bell hook (A) answered by a playful B.
const A_TOWN=[
  15,null,19,null, 22,null,19,null, 24,null,22,null, 19,null,null,null,
  22,null,26,null, 29,null,26,null, 22,null,19,null, 22,null,null,null,
  24,null,27,null, 31,null,27,null, 24,null,19,null, 24,null,null,null,
  26,null,22,null, 19,null,22,null, 26,null,19,null, 19,null,null,null];
const B_TOWN=[
  19,null,22,null, 26,null,22,null, 27,null,null,null, 31,null,null,null,
  29,null,26,null, 22,null,26,null, 20,null,null,null, 22,null,null,null,
  24,null,27,null, 31,null,27,null, 24,null,19,null, 22,null,null,null,
  26,null,22,null, 19,null,22,null, 26,null,29,null, 31,null,null,null];
const TOWN = makeSong({ ms:150, bars:20, reverb:0.22, orch:'flute', mode:'soft', arp:'gentle8', leadV:'bell', shimmer:true,
  chords:[[3,7,10,14],[-2,2,5,8],[0,3,7,10],[7,10,14,17]], bass:[-9,-14,-12,-5],
  lead: seqc(rep(R16,4), A_TOWN, A_TOWN, B_TOWN, A_TOWN) });

// ===== BATTLE — "The Road": driving synthwave, clear anthemic hook (Am–G–F–E) =====
// Octave-bounce bassline + phrase-end fills; A hook answered by a syncopated B.
const A_BATTLE=[
  24,null,null,null, 27,null,24,null, 19,null,null,null, 24,null,null,null,
  22,null,null,null, 26,null,22,null, 29,null,null,null, 26,null,null,null,
  20,null,null,null, 24,null,20,null, 27,null,null,null, 24,null,null,null,
  26,null,null,null, 23,null,19,null, 23,null,null,null, 19,null,null,null];
const B_BATTLE=[
  31,null,null,27, null,24,null,null, 27,null,31,null, 24,null,null,null,
  29,null,null,26, null,22,null,null, 26,null,29,null, 22,null,null,null,
  27,null,null,24, null,20,null,null, 24,null,27,null, 20,null,null,null,
  26,null,null,23, null,19,null,null, 23,null,26,null, 31,null,null,null];
const BB_BASS=[0,null,0,12, 0,null,7,null, 0,null,0,12, 7,null,12,null];
const BATTLE = makeSong({ ms:116, bars:24, reverb:0.12, orch:'brass', mode:'drive', arp:'drive16', leadV:'saw', shimmer:true,
  bassline:BB_BASS, bassDur:0.13, fills:true,
  chords:[[0,3,7],[-2,2,5],[-4,0,3],[7,11,14]], bass:[-12,-14,-16,-5],
  lead: seqc(rep(R16,4), A_BATTLE, A_BATTLE, B_BATTLE, A_BATTLE, rep(R16,4)) });

// ===== BOSS — "The Guardian": dark, badass, menacing riff (Dm7–Bbmaj7–C7–A7) =====
// 7th chords for tension; low-root march bassline + timpani fills; A riff + climbing B.
const A_BOSS=[
  17,null,null,null, 24,null,20,null, 17,null,null,null, 19,null,null,null,
  17,null,null,null, 20,null,17,null, 13,null,null,null, 8,null,null,null,
  19,null,null,null, 22,null,19,null, 15,null,null,null, 10,null,null,null,
  24,null,null,null, 19,null,16,null, 19,null,null,null, 24,null,null,null];
const B_BOSS=[
  29,null,null,null, 24,null,20,null, 17,null,null,null, 24,null,null,null,
  25,null,null,null, 24,null,20,null, 17,null,null,null, 13,null,null,null,
  27,null,null,null, 25,null,22,null, 19,null,null,null, 27,null,null,null,
  28,null,null,null, 24,null,31,null, 28,null,24,null, 19,null,null,null];
const BS_BASS=[0,null,null,null, 0,null,7,null, 0,null,null,null, 0,7,null,null];
const BOSS = makeSong({ ms:125, bars:20, reverb:0.16, orch:'timpani', mode:'march', arp:'tri8', leadV:'brass',
  bassline:BS_BASS, bassDur:0.4, fills:true,
  chords:[[5,8,12,15],[1,5,8,12],[3,7,10,13],[0,4,7,10]], bass:[-7,-11,-9,-12],
  lead: seqc(rep(R16,4), A_BOSS, A_BOSS, B_BOSS, A_BOSS) });

// ===== LAMENT — "Pilgrim's Lament": slow, beautiful & sad (Am7–Fmaj7–Cmaj7–E7) =====
// Minor-7th colour deepens the melancholy; A sigh answered by a descending B.
const A_LAMENT=[
  24,null,null,null, 27,null,26,null, 24,null,null,null, 19,null,null,null,
  24,null,null,null, 27,null,null,null, 24,null,22,null, 20,null,null,null,
  22,null,null,null, 19,null,22,null, 27,null,null,null, 26,null,null,null,
  26,null,null,null, 23,null,null,null, 19,null,20,null, 19,null,null,null];
const B_LAMENT=[
  31,null,null,null, 27,null,null,null, 24,null,null,null, 22,null,null,null,
  24,null,null,null, 20,null,null,null, 24,null,null,null, 27,null,null,null,
  26,null,null,null, 22,null,null,null, 19,null,null,null, 22,null,null,null,
  23,null,null,null, 19,null,null,null, 23,null,20,null, 19,null,null,null];
const LAMENT = makeSong({ ms:220, bars:16, reverb:0.32, orch:'choir', mode:'calm', softKick:false, arp:'bell4', leadV:'strings', harmony:-3,
  chords:[[0,3,7,10],[-4,0,3,7],[3,7,10,14],[-5,-1,2,5]], bass:[-12,-16,-9,-17],
  lead: seqc(A_LAMENT, A_LAMENT, B_LAMENT, A_LAMENT) });

// ===== FOREST — "Forest Hunt": mid-tempo synthwave prowl, circling hook (Dm–C–G–Dm) =====
// Prowling bassline + fills; octave-doubled pluck (harmony:-12) thickens the thin lead.
const A_FOREST=[
  17,null,null,null, 20,null,24,null, 20,null,null,null, 17,null,null,null,
  19,null,null,null, 22,null,27,null, 22,null,null,null, 19,null,null,null,
  17,null,null,null, 22,null,26,null, 29,null,null,null, 26,null,null,null,
  24,null,null,null, 20,null,17,null, 12,null,null,null, 17,null,null,null];
const B_FOREST=[
  29,null,24,null, 20,null,24,null, 29,null,null,null, 32,null,null,null,
  27,null,22,null, 19,null,22,null, 27,null,null,null, 31,null,null,null,
  26,null,22,null, 29,null,26,null, 22,null,null,null, 26,null,null,null,
  24,null,20,null, 17,null,20,null, 24,null,29,null, 24,null,null,null];
const FR_BASS=[0,null,null,7, 0,null,12,null, 0,null,null,7, 5,null,7,null];
const FOREST = makeSong({ ms:132, bars:20, reverb:0.14, orch:'harp', mode:'drive', arp:'pluck16', leadV:'pluck', harmony:-12,
  bassline:FR_BASS, bassDur:0.13, fills:true,
  chords:[[5,8,12],[3,7,10],[-2,2,5],[5,8,12]], bass:[-7,-9,-14,-7],
  lead: seqc(rep(R16,4), A_FOREST, A_FOREST, B_FOREST, A_FOREST) });

// ===== MORNING — "Gilded Dawn": bright, cheerful, chill-pop (Fmaj7–Dm7–Bbmaj7–C7) =====
// Singable stepwise flute cell (A) with a skipping higher B; gentle 7th-chord warmth.
const A_MORNING=[
  24,null,27,null, 24,null,20,null, 24,null,null,null, 27,null,null,null,
  24,null,20,null, 17,null,20,null, 24,null,null,null, 20,null,null,null,
  20,null,17,null, 13,null,17,null, 20,null,null,null, 25,null,null,null,
  22,null,19,null, 15,null,19,null, 22,null,null,null, 24,null,null,null];
const B_MORNING=[
  27,null,31,null, 27,null,24,null, 27,null,null,null, 31,null,null,null,
  29,null,27,null, 24,null,27,null, 29,null,null,null, 24,null,null,null,
  25,null,24,null, 20,null,24,null, 25,null,null,null, 29,null,null,null,
  27,null,25,null, 22,null,19,null, 22,null,27,null, 31,null,null,null];
const MORNING = makeSong({ ms:132, bars:16, reverb:0.2, orch:'harp', mode:'soft', arp:'harp8', leadV:'flute', shimmer:true,
  chords:[[-4,0,3,7],[5,8,12,15],[1,5,8,12],[3,7,10,13]], bass:[-16,-7,-11,-9],
  lead: seqc(A_MORNING, A_MORNING, B_MORNING, A_MORNING) });

// ===== EMBER — "Ember March": molten driving synthwave, descending hook (Am–F–G–Bb) =====
// Gritty 16th-pulsing bassline + fills; A hook answered by a syncopated descending B.
const A_EMBER=[
  24,null,null,null, 22,null,19,null, 24,null,null,null, 27,null,null,null,
  24,null,null,null, 20,null,19,null, 20,null,null,null, 24,null,null,null,
  22,null,null,null, 29,null,26,null, 22,null,null,null, 17,null,null,null,
  25,null,null,null, 24,null,20,null, 17,null,null,null, 13,null,null,null];
const B_EMBER=[
  31,null,null,27, null,24,null,null, 27,null,24,null, 19,null,null,null,
  27,null,null,24, null,20,null,null, 24,null,20,null, 24,null,null,null,
  29,null,null,26, null,22,null,null, 26,null,22,null, 26,null,null,null,
  32,null,null,29, null,25,null,null, 29,null,25,null, 20,null,null,null];
const EM_BASS=[0,0,null,0, 12,null,0,null, 0,0,null,0, 7,null,12,12];
const EMBER = makeSong({ ms:112, bars:24, reverb:0.12, orch:'brass', mode:'drive', arp:'drive16', leadV:'psaw',
  bassline:EM_BASS, bassDur:0.11, fills:true,
  chords:[[0,3,7],[-4,0,3],[-2,2,5],[1,5,8]], bass:[-12,-16,-14,-11],
  lead: seqc(rep(R16,4), A_EMBER, A_EMBER, B_EMBER, A_EMBER, rep(R16,4)) });

// ===== ASTRAL — "Astral Drift": eerie, cosmic, floating (Am–F–Dm–E) with a clear arching hook =====
const A_ASTRAL=[
  24,null,null,null, 27,null,31,null, 27,null,null,null, 24,null,null,null,
  24,null,null,null, 27,null,32,null, 27,null,null,null, 24,null,null,null,
  24,null,null,null, 29,null,32,null, 29,null,null,null, 24,null,null,null,
  26,null,null,null, 31,null,35,null, 31,null,null,null, 26,null,null,null];
const ASTRAL = makeSong({ ms:150, bars:24, reverb:0, orch:true, mode:'calm', softKick:true, arp:'bell8', leadV:'soft', shimmer:true, lift:true,
  chords:[[0,3,7],[-4,0,3],[5,8,12],[7,11,14]], bass:[-12,-16,-7,-5],
  lead: seqc(rep(R16,4), rep(A_ASTRAL,5)) });

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
