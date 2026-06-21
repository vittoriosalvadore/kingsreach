// Scene FX: ambient motes, spark/ash particle bursts, ground shockwave, the
// enemy attack telegraph, ambient weather, drifting mist, and the weapon slash
// arc. Depends on the scene + state + texture foundations (and helpers/data).
import * as THREE from 'three';
import { rand, clamp, lerp, easeOut } from './helpers.js';
import { BIOMES } from './data.js';
import { G } from './state.js';
import { Q, scene, weaponScene } from './scene.js';
import { TEX } from './textures.js';

// live weather config, mutated each frame by the main loop
const WX = { col:0xc2b8a4, mode:'fall', speed:1, sway:0.4, dens:1, size:0.13 };

// ============================================================ motes
const MOTE_N = 90;
const moteGeo = new THREE.BufferGeometry();
const motePos = new Float32Array(MOTE_N*3);
for(let i=0;i<MOTE_N;i++){ motePos[i*3]=rand(-20,20); motePos[i*3+1]=rand(.4,9); motePos[i*3+2]=rand(-30,6); }
moteGeo.setAttribute('position',new THREE.BufferAttribute(motePos,3));
const moteMat = new THREE.PointsMaterial({color:BIOMES[0].accent,size:.22,map:TEX.glow,transparent:true,opacity:.8,depthWrite:false,blending:THREE.AdditiveBlending,fog:true});
const motes = new THREE.Points(moteGeo,moteMat); scene.add(motes);

// ============================================================ particle FX (sparks / ash / embers)
const FX_N = 320;
const fxGeo = new THREE.BufferGeometry();
const fxPos = new Float32Array(FX_N*3);
const fxCol = new Float32Array(FX_N*3);
for(let i=0;i<FX_N;i++){ fxPos[i*3+1]=-9999; }
fxGeo.setAttribute('position',new THREE.BufferAttribute(fxPos,3).setUsage(THREE.DynamicDrawUsage));
fxGeo.setAttribute('color',new THREE.BufferAttribute(fxCol,3).setUsage(THREE.DynamicDrawUsage));
const fxMat = new THREE.PointsMaterial({size:.26,map:TEX.glow,vertexColors:true,transparent:true,opacity:1,depthWrite:false,blending:THREE.AdditiveBlending,fog:false});
const fxPoints = new THREE.Points(fxGeo,fxMat); fxPoints.frustumCulled=false; scene.add(fxPoints);
const fxParts = new Array(FX_N).fill(null); let fxHead=0; const _fxc=new THREE.Color();
function burst(x,y,z,opts={}){
  const n=Math.round((opts.n||14)*Q.fx); if(n<=0) return;
  const spd=opts.spd||4.5, grav=opts.grav??10, life=opts.life||.55, spread=opts.spread||1, up=!!opts.up;
  _fxc.set(opts.color??0xffe6a0);
  for(let k=0;k<n;k++){
    const i=fxHead; fxHead=(fxHead+1)%FX_N;
    const a=Math.random()*6.283, el=up?(0.4+Math.random()*0.8):rand(-1,1), sp=spd*(0.4+Math.random()*0.95);
    fxParts[i]={x,y,z, vx:Math.cos(a)*sp*spread, vy:el*sp+(up?spd*.5:0), vz:Math.sin(a)*sp*spread,
      life, max:life, grav, r:_fxc.r, g:_fxc.g, b:_fxc.b};
    fxPos[i*3]=x;fxPos[i*3+1]=y;fxPos[i*3+2]=z;
    fxCol[i*3]=_fxc.r;fxCol[i*3+1]=_fxc.g;fxCol[i*3+2]=_fxc.b;
  }
  fxGeo.attributes.position.needsUpdate=true; fxGeo.attributes.color.needsUpdate=true;
}
function updateFX(dt){
  let any=false;
  for(let i=0;i<FX_N;i++){ const p=fxParts[i]; if(!p) continue; any=true;
    p.life-=dt;
    if(p.life<=0){ fxParts[i]=null; fxPos[i*3+1]=-9999; fxCol[i*3]=fxCol[i*3+1]=fxCol[i*3+2]=0; continue; }
    p.vy-=p.grav*dt; p.x+=p.vx*dt; p.y+=p.vy*dt; p.z+=p.vz*dt;
    if(p.y<0.03){ p.y=0.03; p.vy*=-0.32; p.vx*=0.55; p.vz*=0.55; }
    const f=p.life/p.max;
    fxPos[i*3]=p.x;fxPos[i*3+1]=p.y;fxPos[i*3+2]=p.z;
    fxCol[i*3]=p.r*f;fxCol[i*3+1]=p.g*f;fxCol[i*3+2]=p.b*f;
  }
  if(any){ fxGeo.attributes.position.needsUpdate=true; fxGeo.attributes.color.needsUpdate=true; }
}

// ============================================================ expanding ground shockwave
const shockMat = new THREE.MeshBasicMaterial({color:0xffe6a0,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const shockRing = new THREE.Mesh(new THREE.RingGeometry(0.55,0.85,40),shockMat);
shockRing.rotation.x=-Math.PI/2; shockRing.position.y=0.06; shockRing.visible=false; scene.add(shockRing);
let shockT=0; const SHOCK_DUR=0.55; let shockMax=5;
function shock(x,z,color,size){ if(!Q.shock) return; shockRing.position.set(x,0.06,z); shockMat.color.set(color??0xffe6a0); shockT=SHOCK_DUR; shockMax=size||5; shockRing.visible=true; }
function updateShock(dt){ if(shockT>0){ shockT-=dt; const k=1-shockT/SHOCK_DUR; const sc=0.55+easeOut(k)*shockMax;
    shockRing.scale.set(sc,sc,sc); shockMat.opacity=(1-k)*0.75; if(shockT<=0)shockRing.visible=false; } }

// ============================================================ attack telegraph (danger ring at the player's feet during enemy wind-up)
const telMat = new THREE.MeshBasicMaterial({color:0xff3b30,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const telRing = new THREE.Mesh(new THREE.RingGeometry(0.78,1.02,40),telMat); telRing.rotation.x=-Math.PI/2; telRing.position.y=0.05; telRing.visible=false; scene.add(telRing);
function updateTelegraph(){
  const e=G.enemy; let danger=0, melee=true;
  if(e && !e.dead && G.state==='combat'){
    if(e.windup>0){ danger=clamp(1-e.windup/e.tel,0,1); melee=!(e.behavior==='ranged'); }
    else if(e.charging>0){ danger=1; }
  }
  if(danger>0 && melee){ telRing.visible=true; telRing.position.set(G.x,0.05,G.z-0.6);
    const sc=lerp(2.5,1.0,danger); telRing.scale.set(sc,sc,sc); telMat.opacity=0.2+danger*0.55;
    telMat.color.setHex(danger>0.86?0xffd29a:0xff3b30);
  } else telRing.visible=false;
}

// ============================================================ ambient weather (falling ash / dust / spores)
const WEATHER_N = 140;
const wGeo = new THREE.BufferGeometry();
const wPos = new Float32Array(WEATHER_N*3);
const wVel = new Float32Array(WEATHER_N);
for(let i=0;i<WEATHER_N;i++){ wPos[i*3]=rand(-22,22); wPos[i*3+1]=rand(0,16); wPos[i*3+2]=rand(-34,8); wVel[i]=rand(.6,2.2); }
wGeo.setAttribute('position',new THREE.BufferAttribute(wPos,3).setUsage(THREE.DynamicDrawUsage));
const wMat = new THREE.PointsMaterial({color:0xc2b8a4,size:.13,map:TEX.glow,transparent:true,opacity:.5,depthWrite:false,blending:THREE.AdditiveBlending,fog:true});
const weather = new THREE.Points(wGeo,wMat); weather.frustumCulled=false; scene.add(weather);
function updateWeather(dt){ if(!weather.visible) return; const lat=Math.sin(performance.now()*.0004)*0.5*WX.sway, sp=WX.speed;
  for(let i=0;i<WEATHER_N;i++){ let x=wPos[i*3], y=wPos[i*3+1], z=wPos[i*3+2]; const vi=wVel[i];
    if(WX.mode==='rise'){            // embers / star-motes / gilt ash climbing toward the sky
      y += vi*dt*1.7*sp; x += lat*dt + Math.sin(y*.6+i)*dt*0.5*WX.sway;
      if(y>16){ y=rand(0,2); x=rand(-22,22); z=rand(-34,8); }
    } else if(WX.mode==='drift'){    // suspended pollen / frost / gold dust — hangs, swims sideways
      y -= vi*dt*0.4*sp; x += lat*dt*2.4 + Math.sin(y*.5+i)*dt*0.6*WX.sway;
      if(y<0){ y=16; x=rand(-22,22); z=rand(-34,8); } else if(x>26){ x=-26; } else if(x<-26){ x=26; }
    } else {                          // fall — snow / ash / fat blood-drips
      y -= vi*dt*1.7*sp; x += lat*dt + Math.sin(y*.6+i)*dt*0.3*WX.sway;
      if(y<0){ y=16; x=rand(-22,22); z=rand(-34,8); }
    }
    wPos[i*3]=x; wPos[i*3+1]=y; wPos[i*3+2]=z; }
  wGeo.attributes.position.needsUpdate=true; weather.position.set(G.x,0,G.z);
}

// ============================================================ drifting ground mist (volumetric-ish atmosphere)
const mistMat = new THREE.MeshBasicMaterial({map:TEX.mist,color:0x9fb0a8,transparent:true,opacity:.2,depthWrite:false,blending:THREE.NormalBlending,fog:true});
const mistPlanes=[];
for(let i=0;i<2;i++){ const p=new THREE.Mesh(new THREE.PlaneGeometry(70,70),mistMat); p.rotation.x=-Math.PI/2; p.position.y=0.25+i*0.45; p.renderOrder=2; mistPlanes.push(p); scene.add(p); }
function updateMist(dt){ if(!mistPlanes[0].visible) return;
  if(mistMat.map){ mistMat.map.offset.x+=dt*0.012; mistMat.map.offset.y-=dt*0.006; }
  for(let i=0;i<mistPlanes.length;i++){ mistPlanes[i].position.set(G.x, 0.25+i*0.45, G.z-16); }
}

// ============================================================ swing slash arc (weapon scene)
const slashMat = new THREE.MeshBasicMaterial({color:0xfff0c8,transparent:true,opacity:0,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,fog:false});
const slashArc = new THREE.Mesh(new THREE.RingGeometry(0.42,0.6,28,1,Math.PI*0.12,Math.PI*0.78),slashMat);
slashArc.position.set(0,-0.08,-1.0); weaponScene.add(slashArc);

export { MOTE_N, moteGeo, moteMat, motes, burst, updateFX, shock, updateShock, updateTelegraph,
  WEATHER_N, wGeo, wPos, wMat, weather, updateWeather, mistMat, mistPlanes, updateMist,
  slashMat, slashArc, WX };
