// Pixel-art prop sprites: the hand-drawn 16-bit billboards (trees, rocks,
// mushrooms, pillars, walls, torches, spires, bones, braziers, lava) and the
// per-biome builders. Pure canvas/THREE drawing — depends only on THREE +
// helpers. PX (the pixel-plot helper) is reused by the enemy/villager sprites.
import * as THREE from 'three';
import { rand, chance } from './helpers.js';

// ---- pixel-art props: authored 16-bit billboard sprites (alpha-tested cutouts, camera-facing) ----
const _propCache={};
function propRec(key,W,H,draw){ if(_propCache[key]) return _propCache[key];
  const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.imageSmoothingEnabled=false; draw(x,W,H);
  const tex=new THREE.CanvasTexture(cv); tex.magFilter=THREE.NearestFilter; tex.minFilter=THREE.NearestFilter; tex.generateMipmaps=false; tex.colorSpace=THREE.SRGBColorSpace;
  const rec={tex,aspect:W/H}; _propCache[key]=rec; return rec; }
function spriteProp(rec,worldH){ const g=new THREE.Group();
  const m=new THREE.Sprite(new THREE.SpriteMaterial({map:rec.tex,transparent:true,alphaTest:0.5,depthWrite:false,fog:true}));
  const Wd=worldH*rec.aspect; m.scale.set(chance(.5)?-Wd:Wd,worldH,1); m.position.y=worldH/2; g.add(m); return g; }
function PX(x){ return (px,py,w,h,c)=>{ x.fillStyle=c; x.fillRect(px|0,py|0,Math.max(1,w|0),Math.max(1,h|0)); }; }
function dTree(x,W,H){ const P=PX(x),cx=W>>1; const tk='#241a12',tkD='#140d07',tkL='#352718',lf='#16291b',lfD='#0d1810',lfL='#234a2e';
  for(let y=H-1;y>H*0.34;y--){ const t=(H-1-y)/H,w=Math.max(1,3-t*2); for(let i=-w;i<=w;i++)P(cx+i,y,1,1, i<=-w+1?tkD:i>=w-1?tkD:(i<0?tk:tkL)); }
  P(cx-3,H-2,7,2,tkD);
  const ty=(H*0.4)|0, B=(sx,sy,dx,dy,n,c)=>{let bx=sx,by=sy;for(let i=0;i<n;i++){bx+=dx;by+=dy;P(bx,by,1,1,c);if(i<n*0.6)P(bx,by+1,1,1,c);}};
  B(cx,ty,-0.7,-0.8,9,tkD);B(cx,ty-2,0.8,-0.7,10,tk);B(cx,ty-6,-0.5,-0.9,6,tkD);B(cx,ty-8,0.6,-0.85,7,tk);
  for(let i=0;i<28;i++){ const a=i*2.4,r=1.5+(i%6); P(cx+Math.cos(a)*r,(H*0.16)+Math.sin(a)*r*0.7,1,1, i%4===0?lfL:(i%2?lf:lfD)); } }
function dRock(x,W,H){ const P=PX(x),cx=W>>1; const m='#2b2f29',l='#3d433a',d='#161a15',moss='#34532f';
  for(let y=2;y<H;y++){ const t=y/(H-1),w=Math.round((W/2-1)*Math.sqrt(Math.max(0,1-Math.pow((t-0.6)/0.7,2)))); for(let i=-w;i<=w;i++){ let c=m; if(y<6&&i<0)c=l; if(y>H-4)c=d; P(cx+i,y,1,1,c);} }
  for(let i=0;i<5;i++)P(cx-3+i*2,(H*0.55)|0,1,1,moss); }
function dMush(x,W,H){ const P=PX(x); const st='#cfc8b2',stD='#9a937c',cap='#0a3a26',capL='#1a6a44',glow='#5cffa0',dot='#cffff0';
  const S=(bx,h,cw)=>{ for(let y=H-1;y>H-1-h;y--)P(bx,y,2,1,(y&1)?st:stD); const cy=H-1-h; for(let i=-cw;i<=cw;i++){const yy=cy-Math.round(Math.sqrt(Math.max(0,cw*cw-i*i))*0.8);for(let y=yy;y<=cy;y++)P(bx+i,y,1,1,y===yy?glow:(i<0?cap:capL));} P(bx-cw+1,cy-1,1,1,dot);P(bx+cw-1,cy-1,1,1,dot); };
  S(4,7,3); S(12,5,2); S(8,9,2); }
function buildForestProp(){ const r=Math.random();
  if(r<.55) return spriteProp(propRec('f_tree',26,42,dTree), rand(5.5,8));
  if(r<.8)  return spriteProp(propRec('f_rock',22,15,dRock), rand(1.2,2.0));
  return spriteProp(propRec('f_mush',18,16,dMush), rand(.9,1.3)); }
function dPillar(x,W,H){ const P=PX(x),cx=W>>1; const m='#3a3a44',l='#4e4e5a',d='#212129';
  for(let y=H-5;y<H;y++)for(let i=-5;i<=5;i++)P(cx+i,y,1,1,y===H-5?l:(i<-3||i>3?d:m));
  for(let y=4;y<H-5;y++)for(let i=-3;i<=3;i++)P(cx+i,y,1,1, i===-3||i===3?d:(i===-1?l:m));
  for(let i=-3;i<=3;i++){ const tj=2+((i*i)%3); for(let y=4;y<4+tj;y++)P(cx+i,y,1,1,d); } }
function dWall(x,W,H){ const P=PX(x); const m='#33333b',l='#45454f',mort='#101015',top=(H*0.22)|0;
  for(let y=top;y<H;y++)for(let i=0;i<W;i++)P(i,y,1,1,m);
  for(let gy=top;gy<H;gy+=5){ for(let i=0;i<W;i++)P(i,gy,1,1,mort); const off=(((gy-top)/5)|0)%2?4:0; for(let gx=-off;gx<W;gx+=8)P(gx,gy,1,5,mort); }
  for(let i=0;i<W;i++)P(i,top,1,1,l);
  for(let i=0;i<W;i++){ const j=((i*3)%5); for(let y=top-j;y<top;y++)P(i,y,1,1,m); } }
function dTorch(x,W,H){ const P=PX(x),cx=W>>1; const post='#241a10',postD='#150e08',fl='#ff8a1e',flL='#ffd24a',flD='#e0531a',fy=(H*0.4)|0;
  for(let y=fy;y<H;y++)P(cx,y,2,1,(y&1)?post:postD);
  P(cx-1,fy,4,2,postD);
  for(let y=fy-9;y<fy;y++){ const w=Math.round(3*Math.sin((y-(fy-9))/9*Math.PI)); for(let i=-w;i<=w;i++)P(cx+i,y,1,1, i===0?flL:(y>fy-4?flD:fl)); }
  P(cx,fy-9,1,1,flL); }
function buildCastleProp(){ const r=Math.random();
  if(r<.45) return spriteProp(propRec('c_pillar',16,38,dPillar), rand(3,6.5));
  if(r<.78) return spriteProp(propRec('c_wall',28,22,dWall), rand(2.4,4));
  return spriteProp(propRec('c_torch',12,30,dTorch), rand(2.4,3.2)); }
function dSpire(x,W,H){ const P=PX(x),cx=W>>1; const m='#241510',d='#140b07',l='#3a2418',em='#ff5a1e',emL='#ffb060';
  for(let y=2;y<H;y++){ const t=(y-2)/(H-3),w=Math.max(1,Math.round(t*(W/2-1))); for(let i=-w;i<=w;i++)P(cx+i,y,1,1, i<0?(i<-w+1?d:m):l); }
  for(let i=0;i<7;i++)P(cx-2+(i*5)%5,(H*0.4)+(i*7)%((H*0.5)|0),1,1, i%2?em:emL); }
function dBones(x,W,H){ const P=PX(x); const b='#cbc3a8',bD='#9a9079',bDk='#6a634f',sx=6,sy=H-9;
  for(let i=0;i<W;i+=2)P(i,H-2,2,2,bDk);
  for(let i=0;i<6;i++)for(let j=0;j<6;j++)P(sx+i,sy+j,1,1,(j>4)?bD:b); P(sx+1,sy+3,2,2,'#15110b');P(sx+4,sy+3,1,2,'#15110b');
  P(W-9,H-4,7,2,b);P(W-10,H-5,2,4,bD);P(W-3,H-5,2,4,bD);P(3,H-3,8,1,bD);P(W-12,H-7,6,1,b); }
function dBrazier(x,W,H){ const P=PX(x),cx=W>>1; const post='#18100a',bowl='#0e0805',fl='#ff6a20',flL='#ffd24a',flD='#d8401a',fy=((H*0.45)|0)-1;
  for(let y=(H*0.45)|0;y<H;y++)P(cx,y,2,1,post);
  P(cx-3,(H*0.45)|0,7,2,bowl);
  for(let y=fy-8;y<fy;y++){ const w=Math.round(3*Math.sin((y-(fy-8))/8*Math.PI)); for(let i=-w;i<=w;i++)P(cx+i,y,1,1, i===0?flL:(y>fy-3?flD:fl)); } }
function dLava(x,W,H){ const P=PX(x); const a='#3a0d04',b='#ff5a1e',c='#ffb050',d='#7a1c08';
  x.fillStyle=a;x.fillRect(0,0,W,H);
  for(let i=0;i<60;i++)P((i*7)%W,(i*11)%H,1,1, i%3===0?c:(i%2?b:d));
  for(let i=0;i<6;i++){ let px=(i*5)%W,py=2+i*3; for(let k=0;k<6;k++){px=(px+(k%2?1:-1)+W)%W;py+=2;P(px,py,1,1,b);} } }
function buildDungeonProp(){ const r=Math.random();
  if(r<.4)  return spriteProp(propRec('d_spire',16,32,dSpire), rand(2.5,5.5));
  if(r<.65) return spriteProp(propRec('d_bones',24,15,dBones), rand(1.2,1.8));
  if(r<.85){ const g=new THREE.Group(); const lp=new THREE.Mesh(new THREE.CircleGeometry(rand(1,2.2),10), new THREE.MeshBasicMaterial({map:propRec('d_lava',24,24,dLava).tex,transparent:true,fog:true,depthWrite:false})); lp.rotation.x=-Math.PI/2; lp.position.y=0.04; g.add(lp); return g; }
  return spriteProp(propRec('d_brazier',12,24,dBrazier), rand(2.2,3)); }
const PROP_FN = { forest:buildForestProp, castle:buildCastleProp, dungeon:buildDungeonProp };

export { PROP_FN, PX };
