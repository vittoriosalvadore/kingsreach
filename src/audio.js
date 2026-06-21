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
// ---- gentle village music (soft pentatonic loop while in town) ----
let musicTimer=null, musicStep=0;
const MEL=[0,3,5,7, 5,3,0,null, 7,10,7,5, 3,5,3,null];
const BASS=[0,7,3,7];
function softNote(f,dur,vol){ if(!AC)return; const t=AC.currentTime; const o=AC.createOscillator(),g=AC.createGain();
  o.type='triangle'; o.frequency.value=f; o.connect(g); g.connect(AC.destination);
  g.gain.setValueAtTime(0.0001,t); g.gain.linearRampToValueAtTime(vol,t+0.05); g.gain.exponentialRampToValueAtTime(0.0006,t+dur);
  o.start(t); o.stop(t+dur+0.05); }
export function startTownMusic(){ if(musicTimer||!AC) return; musicStep=0;
  musicTimer=setInterval(()=>{ const root=220;
    const m=MEL[musicStep%MEL.length]; if(m!=null) softNote(root*Math.pow(2,m/12),0.95,0.05);
    if(musicStep%4===0){ const b=BASS[Math.floor(musicStep/4)%BASS.length]; softNote((root/2)*Math.pow(2,b/12),1.9,0.045); }
    musicStep++;
  }, 560); }
export function stopTownMusic(){ if(musicTimer){ clearInterval(musicTimer); musicTimer=null; } }
// ---- driving battle / boss music (Megabonk-style chiptune: kick+bass pulse,
//      arpeggiated lead, catchy looping hook). All synthesized; kept below SFX. ----
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
// battle: A natural-minor groove, 16-step loop (~150 BPM at 0.1s/step)
let battleTimer=null, battleStep=0;
const B_ARP=[0,7,12,15, 0,7,12,19, -2,5,10,14, 3,10,15,17];   // climbing minor arp hook
const B_BASS=[0,0,7,7, 0,0,5,5, -2,-2,3,3, 3,3,7,10];
export function startBattleMusic(){ if(battleTimer||!AC) return; stopTownMusic(); stopBossMusic(); stopLamentMusic(); battleStep=0;
  battleTimer=setInterval(()=>{ const t=AC.currentTime+0.02, s=battleStep%16;
    if(s%4===0) kick(t,0.5);                                   // four-on-the-floor pulse
    if(s===6||s%8===4) snare(t,0.16);                          // backbeat snare
    hat(t, s%2?0.05:0.03, 0.03);                               // driving offbeat hats
    seqNote('triangle', NOTE(B_BASS[s]-12), t, 0.11, 0.14);    // punchy bassline
    const a=B_ARP[s]; seqNote('square', NOTE(a+12), t, 0.13, 0.05, 6);   // arp lead (slightly detuned)
    if(s===15) seqNote('sawtooth', NOTE(0), t, 0.4, 0.05);     // turnaround sweep
    battleStep++;
  }, 100); }
export function stopBattleMusic(){ if(battleTimer){ clearInterval(battleTimer); battleTimer=null; } }
// boss: heavier & tenser — slower (~128 BPM), minor-second bite, growling saw bass
let bossTimer=null, bossStep=0;
const BO_LEAD=[0,null,3,0, -1,null,3,5, 7,null,5,3, 1,3,1,null];   // tense, sparse phrase
const BO_BASS=[0,0,0,1, 0,0,0,-1, 0,0,3,3, 1,1,0,0];
export function startBossMusic(){ if(bossTimer||!AC) return; stopTownMusic(); stopBattleMusic(); stopLamentMusic(); bossStep=0;
  bossTimer=setInterval(()=>{ const t=AC.currentTime+0.02, s=bossStep%16;
    if(s%2===0) kick(t,0.55);                                  // relentless heavy kick
    if(s%8===4) snare(t,0.2);                                  // half-time snare
    hat(t, s%4===2?0.04:0.02, 0.025);
    seqNote('sawtooth', NOTE(BO_BASS[s]-24), t, 0.14, 0.13);   // growling sub bass
    seqNote('sawtooth', NOTE(BO_BASS[s]-12), t, 0.12, 0.05, 4);// dirty layered bass
    const m=BO_LEAD[s]; if(m!=null) seqNote('square', NOTE(m+12), t, 0.16, 0.055, -8);   // ominous lead
    if(s===0||s===8) seqNote('sine', NOTE(-24), t, 0.5, 0.09); // toll on the downbeat
    bossStep++;
  }, 117); }
export function stopBossMusic(){ if(bossTimer){ clearInterval(bossTimer); bossTimer=null; } }
// lament: a slow, melodic & melancholy pilgrim's march (~100 BPM) — a different mood
// from the driving battle and the dread boss: warm bass, soft pulse, a yearning lead.
let lamentTimer=null, lamentStep=0;
const L_LEAD=[12,null,10,12, 15,null,14,15, 17,null,15,12, 10,12,null,null];   // a yearning minor line
const L_BASS=[0,0,0,0, 5,5,5,5, 3,3,3,3, 7,5,7,10];
export function startLamentMusic(){ if(lamentTimer||!AC) return; stopTownMusic(); stopBattleMusic(); stopBossMusic(); lamentStep=0;
  lamentTimer=setInterval(()=>{ const t=AC.currentTime+0.02, s=lamentStep%16;
    if(s%4===0) kick(t,0.32);                                  // soft marching pulse
    if(s%8===4) snare(t,0.09);                                 // gentle backbeat
    seqNote('triangle', NOTE(L_BASS[s]-12), t, 0.26, 0.11);    // warm bass
    const m=L_LEAD[s]; if(m!=null){ seqNote('triangle', NOTE(m), t, 0.30, 0.085);   // melodic lead
      seqNote('sine', NOTE(m+12), t, 0.30, 0.028); }                                // soft octave shimmer
    lamentStep++;
  }, 150); }
export function stopLamentMusic(){ if(lamentTimer){ clearInterval(lamentTimer); lamentTimer=null; } }
// stop every music loop (handy on title/death/state resets)
export function stopAllMusic(){ stopTownMusic(); stopBattleMusic(); stopBossMusic(); stopLamentMusic(); }
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
