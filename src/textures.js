// Shared procedural textures, generated once on a <canvas> and reused across
// all materials (props, sprites, FX, ground). Depends only on THREE + the
// renderer (for max anisotropy); no game state, so no circular imports.
import * as THREE from 'three';
import { renderer } from './scene.js';

const _aniso = renderer.capabilities.getMaxAnisotropy();
function _cv(s){ const c=document.createElement('canvas'); c.width=c.height=s; return c; }
function _mkTex(c,rx,ry){ const t=new THREE.CanvasTexture(c); t.wrapS=t.wrapT=THREE.RepeatWrapping; t.repeat.set(rx||1,ry||1); t.colorSpace=THREE.SRGBColorSpace; t.anisotropy=_aniso; return t; }
export const TEX = (function(){
  // decayed flesh / general grunge — mid-grey so material colour tints it
  const grunge=_cv(256); (function(x){ x.fillStyle='#8c8c8c'; x.fillRect(0,0,256,256);
    for(let i=0;i<46;i++){ const px=Math.random()*256,py=Math.random()*256,r=12+Math.random()*56; const g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,Math.random()<.5?'#b6b6b6':'#5c5c5c'); g.addColorStop(1,'rgba(0,0,0,0)'); x.globalAlpha=.42; x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
    x.globalAlpha=1; for(let i=0;i<2600;i++){ x.fillStyle=Math.random()<.5?'rgba(40,40,40,.4)':'rgba(205,205,205,.3)'; x.beginPath(); x.arc(Math.random()*256,Math.random()*256,Math.random()*1.8,0,7); x.fill(); }
    for(let i=0;i<130;i++){ x.fillStyle='rgba(18,18,18,.5)'; x.beginPath(); x.arc(Math.random()*256,Math.random()*256,1+Math.random()*2.6,0,7); x.fill(); }
  })(grunge.getContext('2d'));
  // woven cloth / robe
  const cloth=_cv(128); (function(x){ x.fillStyle='#909090'; x.fillRect(0,0,128,128); x.globalAlpha=.55;
    for(let i=0;i<128;i+=3){ x.strokeStyle=(i/3)%2?'#7c7c7c':'#a4a4a4'; x.lineWidth=1.6; x.beginPath(); x.moveTo(0,i+.5); x.lineTo(128,i+.5); x.stroke(); }
    for(let i=0;i<128;i+=3){ x.strokeStyle=(i/3)%2?'rgba(120,120,120,.55)':'rgba(168,168,168,.45)'; x.lineWidth=1.3; x.beginPath(); x.moveTo(i+.5,0); x.lineTo(i+.5,128); x.stroke(); }
    x.globalAlpha=.15; for(let i=0;i<10;i++){ const px=Math.random()*128,py=Math.random()*128,r=20+Math.random()*40; const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'#5a5a5a'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
  })(cloth.getContext('2d'));
  // reptile scales / hide
  const scale=_cv(192); (function(x){ const s=192; x.fillStyle='#7e7e7e'; x.fillRect(0,0,s,s); const r=15;
    for(let row=-1;row*r*0.7<s+r;row++)for(let col=-1;col*r*1.4<s+r;col++){ const cx=col*r*1.4+(row%2?r*0.7:0), cy=row*r*0.7;
      const g=x.createRadialGradient(cx,cy-r*0.4,1,cx,cy,r*1.1); g.addColorStop(0,'#b0b0b0'); g.addColorStop(.6,'#828282'); g.addColorStop(1,'#5a5a5a');
      x.fillStyle=g; x.beginPath(); x.arc(cx,cy,r,0,7); x.fill(); x.strokeStyle='rgba(30,30,30,.35)'; x.lineWidth=1; x.stroke(); }
  })(scale.getContext('2d'));
  // bark / thorny
  const bark=_cv(128); (function(x){ const s=128; x.fillStyle='#7a7468'; x.fillRect(0,0,s,s);
    for(let i=0;i<64;i++){ const px=Math.random()*s,w=2+Math.random()*7; x.strokeStyle=Math.random()<.5?'rgba(60,54,44,.6)':'rgba(150,142,124,.4)'; x.lineWidth=w;
      x.beginPath(); x.moveTo(px,0); for(let y=0;y<=s;y+=8){ x.lineTo(px+Math.sin(y*.2+px)*2, y); } x.stroke(); }
    for(let i=0;i<5;i++){ x.fillStyle='rgba(40,34,26,.5)'; x.beginPath(); x.ellipse(Math.random()*s,Math.random()*s,3+Math.random()*5,6+Math.random()*9,0,0,7); x.fill(); }
  })(bark.getContext('2d'));
  // stone blocks
  const stone=_cv(256); (function(x){ const s=256; x.fillStyle='#8a8a8a'; x.fillRect(0,0,s,s);
    for(let i=0;i<34;i++){ const px=Math.random()*s,py=Math.random()*s,r=14+Math.random()*30; const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,Math.random()<.5?'#9e9e9e':'#6e6e6e'); g.addColorStop(1,'rgba(0,0,0,0)'); x.globalAlpha=.5; x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
    x.globalAlpha=1; x.strokeStyle='rgba(30,30,30,.55)'; x.lineWidth=2.4;
    for(let gy=0;gy<5;gy++){ const yy=gy*s/5; x.beginPath(); x.moveTo(0,yy); x.lineTo(s,yy); x.stroke();
      for(let gx=0;gx<5;gx++){ const xx=gx*s/5+((gy%2)?s/10:0); x.beginPath(); x.moveTo(xx,yy); x.lineTo(xx,yy+s/5); x.stroke(); } }
    x.globalAlpha=.5; for(let i=0;i<1800;i++){ x.fillStyle=Math.random()<.5?'rgba(40,40,40,.4)':'rgba(190,190,190,.3)'; x.beginPath(); x.arc(Math.random()*s,Math.random()*s,Math.random()*1.5,0,7); x.fill(); }
  })(stone.getContext('2d'));
  // human skin (warm, soft pores + cheek mottle, no scars — for living villagers)
  const skinH=_cv(256); (function(x){ const s=256; x.fillStyle='#c8c8c8'; x.fillRect(0,0,s,s);
    for(let i=0;i<44;i++){ const px=Math.random()*s,py=Math.random()*s,r=18+Math.random()*64; const g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,Math.random()<.5?'rgba(214,176,158,.18)':'rgba(150,118,104,.16)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
    for(let i=0;i<4200;i++){ x.fillStyle=Math.random()<.5?'rgba(120,96,84,.15)':'rgba(224,206,194,.13)'; x.beginPath(); x.arc(Math.random()*s,Math.random()*s,Math.random()*1.3,0,7); x.fill(); }
  })(skinH.getContext('2d'));
  // brushed metal
  const metal=_cv(128); (function(x){ const s=128; const g=x.createLinearGradient(0,0,0,s); g.addColorStop(0,'#bcbcbc'); g.addColorStop(.5,'#8e8e8e'); g.addColorStop(1,'#a6a6a6'); x.fillStyle=g; x.fillRect(0,0,s,s);
    x.globalAlpha=.25; for(let i=0;i<260;i++){ x.strokeStyle=Math.random()<.5?'#d6d6d6':'#6a6a6a'; x.lineWidth=Math.random()<.8?.6:1.2; const yy=Math.random()*s; x.beginPath(); x.moveTo(0,yy); x.lineTo(s,yy+(Math.random()-.5)*2); x.stroke(); }
    x.globalAlpha=.3; for(let i=0;i<24;i++){ x.fillStyle='rgba(40,40,50,.4)'; x.beginPath(); x.arc(Math.random()*s,Math.random()*s,.6+Math.random()*1.4,0,7); x.fill(); }
  })(metal.getContext('2d'));
  // charred stone (dark)
  const char=_cv(192); (function(x){ const s=192; x.fillStyle='#3a3a3a'; x.fillRect(0,0,s,s);
    for(let i=0;i<1700;i++){ x.fillStyle=Math.random()<.5?'rgba(10,10,10,.6)':'rgba(95,95,95,.3)'; x.beginPath(); x.arc(Math.random()*s,Math.random()*s,Math.random()*2,0,7); x.fill(); }
  })(char.getContext('2d'));
  // ember veins (emissive map: black base, bright branching cracks)
  const ember=_cv(192); (function(x){ const s=192; x.fillStyle='#000'; x.fillRect(0,0,s,s); x.strokeStyle='#fff'; x.lineCap='round';
    for(let i=0;i<11;i++){ let px=Math.random()*s,py=Math.random()*s; x.lineWidth=1.6+Math.random()*1.6; x.beginPath(); x.moveTo(px,py);
      for(let j=0;j<8;j++){ px+=(Math.random()-.5)*42; py+=(Math.random()-.5)*42; x.lineTo(px,py); } x.stroke(); }
  })(ember.getContext('2d'));
  // ethereal wisp streaks
  const wisp=_cv(128); (function(x){ const s=128; x.fillStyle='#787878'; x.fillRect(0,0,s,s); x.globalAlpha=.5;
    for(let i=0;i<40;i++){ const px=Math.random()*s; const g=x.createLinearGradient(px,0,px+6,0); g.addColorStop(0,'rgba(0,0,0,0)'); g.addColorStop(.5,Math.random()<.5?'#aaa':'#555'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.fillRect(px,0,6,s); }
  })(wisp.getContext('2d'));
  // wood planks
  const wood=_cv(128); (function(x){ const s=128; const pw=s/4; const tones=['#8a7250','#7d6646','#94795a','#736042'];
    for(let p=0;p<4;p++){ const px=p*pw; x.fillStyle=tones[p%4]; x.fillRect(px,0,pw,s);
      x.strokeStyle='rgba(40,28,16,.7)'; x.lineWidth=2; x.beginPath(); x.moveTo(px,0); x.lineTo(px,s); x.stroke();
      x.globalAlpha=.3; for(let i=0;i<10;i++){ x.strokeStyle=Math.random()<.5?'#6a553a':'#9a805e'; x.lineWidth=.8; const yy=Math.random()*s; x.beginPath(); x.moveTo(px+2,yy); x.bezierCurveTo(px+pw*.3,yy+4,px+pw*.6,yy-4,px+pw-2,yy); x.stroke(); }
      x.globalAlpha=1; }
  })(wood.getContext('2d'));
  // undead skin (high-res — pores, veins, blotches, scars; mid-tone so material colour tints it)
  const skin=_cv(512); (function(x){ const s=512; x.fillStyle='#9a9a93'; x.fillRect(0,0,s,s);
    for(let i=0;i<70;i++){ const px=Math.random()*s,py=Math.random()*s,r=16+Math.random()*64; const g=x.createRadialGradient(px,py,0,px,py,r);
      g.addColorStop(0,Math.random()<.5?'rgba(160,150,138,.28)':'rgba(70,82,70,.24)'); g.addColorStop(1,'rgba(0,0,0,0)'); x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); }
    for(let i=0;i<6500;i++){ x.fillStyle=Math.random()<.5?'rgba(58,58,52,.32)':'rgba(184,178,166,.22)'; x.beginPath(); x.arc(Math.random()*s,Math.random()*s,Math.random()*1.7,0,7); x.fill(); }
    x.strokeStyle='rgba(70,92,112,.16)'; for(let i=0;i<28;i++){ x.lineWidth=.6+Math.random(); let px=Math.random()*s,py=Math.random()*s; x.beginPath(); x.moveTo(px,py); for(let j=0;j<5;j++){ px+=(Math.random()-.5)*44; py+=(Math.random()-.5)*44; x.lineTo(px,py);} x.stroke(); }
    x.strokeStyle='rgba(40,28,26,.4)'; for(let i=0;i<10;i++){ x.lineWidth=1+Math.random()*1.6; const px=Math.random()*s,py=Math.random()*s,a=Math.random()*6,len=24+Math.random()*70; x.beginPath(); x.moveTo(px,py); x.lineTo(px+Math.cos(a)*len,py+Math.sin(a)*len); x.stroke(); }
  })(skin.getContext('2d'));
  // hair / beard strands
  const hair=_cv(256); (function(x){ const s=256; x.fillStyle='#6a5a46'; x.fillRect(0,0,s,s);
    for(let i=0;i<420;i++){ x.strokeStyle=Math.random()<.5?'rgba(28,22,14,.55)':'rgba(122,102,78,.4)'; x.lineWidth=.6+Math.random()*1.3; const px=Math.random()*s; x.beginPath(); x.moveTo(px,0); for(let y=0;y<=s;y+=12){ x.lineTo(px+Math.sin(y*.1+px)*3,y);} x.stroke(); }
  })(hair.getContext('2d'));
  // soft round glow sprite (for all particle systems — turns square points into soft dust/embers)
  const glow=_cv(64); (function(x){ const s=64; const g=x.createRadialGradient(s/2,s/2,0,s/2,s/2,s/2);
    g.addColorStop(0,'rgba(255,255,255,1)'); g.addColorStop(.35,'rgba(255,255,255,.6)'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.fillRect(0,0,s,s); })(glow.getContext('2d'));
  const glowTex=new THREE.CanvasTexture(glow); glowTex.colorSpace=THREE.SRGBColorSpace;
  // soft cloud mist (for drifting ground fog)
  const mist=_cv(256); (function(x){ const s=256; for(let i=0;i<64;i++){ const px=Math.random()*s,py=Math.random()*s,r=20+Math.random()*72;
    const g=x.createRadialGradient(px,py,0,px,py,r); g.addColorStop(0,'rgba(255,255,255,'+(0.05+Math.random()*0.10).toFixed(3)+')'); g.addColorStop(1,'rgba(255,255,255,0)');
    x.fillStyle=g; x.beginPath(); x.arc(px,py,r,0,7); x.fill(); } })(mist.getContext('2d'));
  return {
    grunge:_mkTex(grunge,1,1), cloth:_mkTex(cloth,3,3), scale:_mkTex(scale,2,2), bark:_mkTex(bark,1,3),
    stone:_mkTex(stone,2,2), metal:_mkTex(metal,2,2), char:_mkTex(char,1,1), ember:_mkTex(ember,1,1),
    wisp:_mkTex(wisp,1,2), wood:_mkTex(wood,2,2), glow:glowTex, mist:_mkTex(mist,1,1),
    skin:_mkTex(skin,1,1), hair:_mkTex(hair,1,2), skinH:_mkTex(skinH,1,1),
  };
})();
