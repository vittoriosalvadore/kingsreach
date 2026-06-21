// Recolorable hand-pixel villager billboards for the town crowd + shop NPCs.
// Pure builders: THREE + mat (scene) + TEX (textures) + PX (props) + helpers.
// The town-construction code (townCrowdFig / buildTownVillage) stays in
// index.html because it wires into townGroup/townHouse/townCrowd.
import * as THREE from 'three';
import { rand, randi, pick, shade } from './helpers.js';
import { mat } from './scene.js';
import { TEX } from './textures.js';
import { PX } from './props.js';

function drawVillagerElder(P, cx, pal){
  const robe=pal.outfitA, robeD=shade(robe,0.78), robeL=shade(robe,1.18);
  const under=pal.outfitB, underD=shade(under,0.8);
  const skin=pal.skin, skinD=shade(skin,0.82);
  const hair=pal.hair, trim=pal.trim, trimD=shade(trim,0.7);
  const wood=shade(pal.outfitB,0.55);
  const hx=cx-2;
  P(cx-4,43,4,2,skinD); P(cx+1,43,4,2,skinD);
  P(cx-5,20,11,16,robe); P(cx-6,30,13,10,robe); P(cx-6,40,13,3,robeD);
  P(cx+3,22,3,18,robeD); P(cx-5,22,2,16,robeL); P(cx-3,28,2,12,robeD);
  P(cx-3,24,6,3,under); P(cx-3,27,6,1,underD); P(cx-1,30,3,9,under);
  P(cx,27,2,1,trim); P(cx-1,28,1,2,trimD);
  P(cx-7,23,3,11,robe); P(cx-7,23,1,11,robeL); P(cx+4,23,3,10,robe); P(cx+6,23,1,10,robeD);
  P(cx-7,33,3,2,skinD); P(cx+4,32,3,2,skinD);
  P(cx+6,18,2,27,wood); P(cx+7,18,1,27,shade(pal.outfitB,0.4));
  P(cx+5,16,4,3,trim); P(cx+5,16,4,1,shade(trim,1.25));
  P(hx,18,4,2,skinD);
  P(hx-2,9,9,10,skin); P(hx-2,9,2,10,skinD); P(hx-2,16,9,1,skinD); P(hx+1,14,3,1,skinD);
  P(hx-1,12,1,1,shade(skin,0.45)); P(hx+3,12,1,1,shade(skin,0.45));
  P(hx-1,11,2,1,skinD); P(hx+3,11,2,1,skinD); P(hx+1,13,1,2,skinD); P(hx,16,3,1,shade(skin,0.55));
  P(hx-3,11,1,5,hair); P(hx+5,11,1,5,hair); P(hx-3,15,2,2,shade(hair,0.9)); P(hx+5,15,2,2,shade(hair,0.9));
  P(hx-3,5,11,4,robe); P(hx-4,7,2,9,robe); P(hx+7,7,2,9,robe);
  P(hx-4,7,1,9,robeD); P(hx+8,7,1,9,robeL); P(hx-2,5,11,1,robeL); P(hx-1,8,9,1,robeD);
}
function drawVillagerLaborer(P, cx, pal){
  const skinD=shade(pal.skin,0.78), skinL=shade(pal.skin,1.12);
  const apronD=shade(pal.outfitA,0.72), apronL=shade(pal.outfitA,1.18);
  const tunicD=shade(pal.outfitB,0.74), tunicL=shade(pal.outfitB,1.12);
  const hairD=shade(pal.hair,0.7), hairL=shade(pal.hair,1.15);
  const trimD=shade(pal.trim,0.7), bootC=shade(pal.outfitB,0.45);
  P(cx-5,38,4,6,tunicD); P(cx+1,38,4,6,pal.outfitB);
  P(cx-6,43,5,3,bootC); P(cx+1,43,5,3,bootC);
  P(cx-6,43,5,1,shade(pal.outfitB,0.6)); P(cx+1,43,5,1,shade(pal.outfitB,0.6));
  P(cx-7,20,14,20,pal.outfitB); P(cx-7,20,14,2,tunicL); P(cx-7,20,2,20,tunicD); P(cx+5,20,2,20,tunicD);
  P(cx-4,24,9,16,pal.outfitA); P(cx-4,24,9,1,apronL); P(cx-4,24,2,16,apronD); P(cx+3,24,2,16,apronD);
  P(cx-1,21,3,4,trimD); P(cx-4,32,9,1,apronD); P(cx-3,33,7,2,apronD); P(cx-3,33,7,1,apronL);
  P(cx-10,22,3,9,pal.outfitB); P(cx+7,22,3,9,pal.outfitB); P(cx-10,22,3,1,tunicL); P(cx+7,22,3,1,tunicL);
  P(cx-10,30,3,1,trimD); P(cx+7,30,3,1,trimD); P(cx-10,31,3,6,pal.skin); P(cx+7,31,3,6,pal.skin);
  P(cx-10,31,1,6,skinD); P(cx+9,31,1,6,skinD); P(cx-10,36,3,2,skinD); P(cx+7,36,3,2,skinD);
  P(cx-2,17,5,3,skinD);
  P(cx-5,6,11,11,pal.skin); P(cx-5,6,11,1,skinL); P(cx-5,6,1,11,skinD); P(cx+5,6,1,11,skinD);
  P(cx-3,10,2,2,'#241812'); P(cx+2,10,2,2,'#241812'); P(cx,11,1,2,skinD);
  P(cx-5,13,2,5,pal.hair); P(cx+4,13,2,5,pal.hair); P(cx-5,14,11,8,pal.hair); P(cx-5,14,11,1,hairD);
  P(cx-2,13,3,1,'#7a3f33'); P(cx-4,20,9,2,hairD); P(cx-3,21,7,1,hairD);
  P(cx-5,4,11,4,pal.hair); P(cx-5,4,11,1,hairL); P(cx-6,6,1,5,hairD); P(cx+5,6,1,5,hairD); P(cx-5,7,11,1,hairD);
}
function drawVillagerMatron(P, cx, pal){
  var A=pal.outfitA,B=pal.outfitB,T=pal.trim,S=pal.skin,H=pal.hair;
  var Ad=shade(A,0.7),Ah=shade(A,1.2),Sd=shade(S,0.78),Bd=shade(B,0.78),Bh=shade(B,1.18),Td=shade(T,0.72);
  P(cx-5,43,4,3,Td); P(cx+1,43,4,3,Td); P(cx-5,43,4,1,shade(T,0.55)); P(cx+1,43,4,1,shade(T,0.55));
  P(cx-5,20,10,4,A); P(cx-6,24,12,7,A); P(cx-7,31,14,8,A); P(cx-8,39,16,4,A); P(cx-8,39,16,1,Ad);
  P(cx+5,24,2,17,Ad); P(cx-7,24,2,9,Ah);
  P(cx-4,25,8,2,B); P(cx-5,27,10,14,B); P(cx-5,27,1,14,Bh); P(cx+4,27,1,14,Bd); P(cx-3,40,6,1,Bd);
  P(cx-6,30,1,3,T); P(cx+5,30,1,3,T);
  P(cx-7,22,2,12,A); P(cx+5,22,2,12,A); P(cx-7,34,2,3,S); P(cx+5,34,2,3,S);
  P(cx-9,33,4,4,T); P(cx-9,33,4,1,shade(T,1.25)); P(cx-9,36,4,1,Td); P(cx-9,32,4,1,Td);
  P(cx-2,17,4,3,S); P(cx-2,17,4,1,Sd);
  P(cx-5,9,10,9,S); P(cx-6,11,1,5,S); P(cx+5,11,1,5,S); P(cx+4,10,1,7,Sd); P(cx-5,17,10,1,Sd);
  P(cx-3,13,2,2,shade(S,0.45)); P(cx+1,13,2,2,shade(S,0.45)); P(cx-1,14,2,1,Sd); P(cx-2,16,4,1,shade(S,0.6));
  P(cx-4,15,1,1,shade(S,1.15)); P(cx+3,15,1,1,shade(S,1.15));
  P(cx-5,5,10,5,A); P(cx-6,7,1,6,A); P(cx+5,7,1,6,A); P(cx-4,4,8,2,Ah); P(cx-6,9,2,4,Ad); P(cx+4,9,2,4,Ad);
  P(cx-2,8,1,1,H); P(cx+1,8,1,1,H); P(cx-1,9,1,1,H); P(cx-6,12,2,2,A); P(cx+4,12,2,2,A);
}
function drawVillagerMerchant(P, cx, pal){
  var hi=function(c){return shade(c,1.28);}, lo=function(c){return shade(c,0.66);}, dk=function(c){return shade(c,0.5);};
  P(cx-4,42,3,3,dk(pal.outfitB)); P(cx+1,42,3,3,dk(pal.outfitB)); P(cx-4,44,8,1,shade(pal.outfitB,0.4));
  P(cx-5,21,11,6,pal.outfitA); P(cx-6,27,13,8,pal.outfitA); P(cx-7,35,15,7,pal.outfitA); P(cx-7,41,15,1,lo(pal.outfitA));
  P(cx-5,21,2,21,hi(pal.outfitA)); P(cx+4,27,3,15,lo(pal.outfitA));
  P(cx-1,22,3,18,pal.outfitB); P(cx-1,22,1,18,hi(pal.outfitB)); P(cx,22,1,18,lo(pal.outfitB));
  P(cx,25,1,1,pal.trim); P(cx,29,1,1,pal.trim); P(cx,33,1,1,pal.trim);
  P(cx-8,23,3,11,pal.outfitA); P(cx-8,23,1,11,hi(pal.outfitA)); P(cx+6,23,3,11,pal.outfitA); P(cx+8,23,1,11,lo(pal.outfitA));
  P(cx-8,34,3,2,pal.skin); P(cx+6,34,3,2,pal.skin);
  P(cx+5,29,4,5,pal.outfitB); P(cx+5,29,4,1,hi(pal.outfitB)); P(cx+8,30,1,4,lo(pal.outfitB)); P(cx+6,27,1,3,pal.trim); P(cx+7,32,1,1,pal.trim);
  P(cx-6,20,13,2,pal.trim); P(cx-6,20,13,1,shade(pal.trim,1.2)); P(cx-6,21,13,1,shade(pal.trim,0.7)); P(cx-1,20,3,2,pal.outfitB);
  P(cx-1,17,3,2,pal.skin); P(cx-1,18,3,1,shade(pal.skin,0.8));
  P(cx-4,9,9,9,pal.skin); P(cx-4,9,1,9,hi(pal.skin)); P(cx+4,9,1,9,lo(pal.skin)); P(cx-4,9,9,1,lo(pal.skin));
  P(cx-3,13,1,1,'#2a2018'); P(cx+2,13,1,1,'#2a2018'); P(cx-3,12,1,1,lo(pal.skin)); P(cx+2,12,1,1,lo(pal.skin)); P(cx,14,1,1,shade(pal.skin,0.7));
  P(cx-4,16,3,2,pal.hair); P(cx+2,16,3,2,pal.hair); P(cx-3,17,7,2,pal.hair); P(cx-3,19,5,1,lo(pal.hair)); P(cx-2,15,5,1,shade(pal.hair,0.9)); P(cx-4,16,1,2,hi(pal.hair));
  P(cx-5,10,1,5,pal.hair); P(cx+4,10,1,5,pal.hair);
  P(cx-5,7,11,3,pal.outfitB); P(cx-6,8,13,2,pal.outfitB); P(cx-5,5,9,2,pal.outfitB); P(cx-5,5,9,1,hi(pal.outfitB)); P(cx-6,9,13,1,lo(pal.outfitB)); P(cx+4,6,2,3,lo(pal.outfitB)); P(cx-1,5,2,1,pal.trim);
}
function drawVillagerHooded(P, cx, pal){
  const cloak=pal.outfitA, cloakLo=shade(cloak,0.7), cloakHi=shade(cloak,1.25), cloakDk=shade(cloak,0.45);
  const robe=pal.outfitB, robeLo=shade(robe,0.75); const trimC=pal.trim;
  const faceShadow=shade(pal.skin,0.5), skinLo=shade(pal.skin,0.72);
  P(cx-3,42,2,3,robeLo); P(cx+1,42,2,3,robeLo); P(cx-3,44,2,1,shade(robe,0.5)); P(cx+1,44,2,1,shade(robe,0.5));
  P(cx-5,20,11,18,cloak); P(cx-6,30,1,8,cloak); P(cx+5,30,1,8,cloak); P(cx-6,37,13,1,cloakLo); P(cx-5,20,2,18,cloakHi); P(cx+3,21,2,17,cloakLo);
  P(cx-1,28,2,9,robeLo); P(cx-1,23,2,4,trimC);
  P(cx-6,23,2,11,cloak); P(cx+4,23,2,11,cloak); P(cx-6,23,1,11,cloakHi); P(cx+5,23,1,11,cloakLo); P(cx-2,32,4,3,skinLo);
  P(cx-2,17,4,2,skinLo);
  P(cx-3,9,7,9,faceShadow); P(cx-3,15,7,3,pal.skin); P(cx-2,14,1,1,skinLo);
  P(cx-2,13,1,1,shade(pal.skin,0.85)); P(cx+1,13,1,1,shade(pal.skin,0.85)); P(cx,15,1,1,skinLo); P(cx-1,17,3,1,shade(pal.skin,0.65));
  P(cx-6,3,13,6,cloak); P(cx-6,3,13,2,cloakHi); P(cx-7,5,1,11,cloak); P(cx+6,5,1,11,cloak); P(cx-6,5,1,12,cloak); P(cx+5,5,1,12,cloak);
  P(cx-5,7,1,9,cloakDk); P(cx+4,7,1,9,cloakDk); P(cx-7,5,1,11,cloakHi); P(cx+6,5,1,11,cloakLo);
  P(cx-6,16,3,2,cloak); P(cx+3,16,3,2,cloak); P(cx-1,2,3,2,cloak); P(cx-1,1,2,1,cloakHi); P(cx-4,8,9,1,trimC);
}
function drawVillagerYouth(P, cx, pal){
  var sk=pal.skin, skD=shade(sk,0.8);
  var oA=pal.outfitA, oAL=shade(oA,1.18), oAD=shade(oA,0.78);
  var oB=pal.outfitB, oBD=shade(oB,0.8); var tr=pal.trim, trD=shade(tr,0.75);
  var hr=pal.hair, hrL=shade(hr,1.2), hrD=shade(hr,0.72);
  P(cx-4,38,3,7,sk); P(cx+1,38,3,7,sk); P(cx-4,38,1,7,skD); P(cx+3,38,1,7,skD);
  P(cx-5,44,4,2,sk); P(cx+1,44,4,2,sk); P(cx-5,45,4,1,skD); P(cx+1,45,4,1,skD);
  P(cx-5,20,10,16,oA); P(cx-5,20,2,16,oAD); P(cx+3,20,2,16,oAL); P(cx-5,20,10,2,oAL);
  P(cx-6,34,12,3,oA); P(cx-6,36,12,1,oAD); P(cx-6,32,12,2,oB); P(cx-6,33,12,1,oBD); P(cx-1,32,2,2,tr);
  P(cx-7,22,2,11,oA); P(cx-7,22,1,11,oAD); P(cx+5,22,2,11,oA); P(cx+6,22,1,11,oAL); P(cx-7,33,2,3,sk); P(cx+5,33,2,3,sk);
  P(cx-2,20,4,1,tr); P(cx-2,18,4,2,sk); P(cx-2,19,4,1,skD);
  P(cx-5,8,10,10,sk); P(cx-5,8,2,10,skD); P(cx-5,16,10,2,skD);
  P(cx-3,13,2,2,'#241a14'); P(cx+1,13,2,2,'#241a14'); P(cx,15,1,1,skD); P(cx-2,17,4,1,shade(sk,0.6));
  P(cx-5,5,10,4,hr); P(cx-6,8,2,5,hr); P(cx+4,8,2,5,hr); P(cx-5,4,10,1,hrL); P(cx-5,8,10,1,hr); P(cx-6,8,1,5,hrD); P(cx+5,8,1,5,hrD); P(cx-4,5,1,3,hrL); P(cx+2,5,2,2,hrL);
}
const VILLAGER_FN = { Elder:drawVillagerElder, Laborer:drawVillagerLaborer, Matron:drawVillagerMatron, Merchant:drawVillagerMerchant, Hooded:drawVillagerHooded, Youth:drawVillagerYouth };
const VILLAGER_PAL = {
  Elder:[{skin:'#cf9a6f',hair:'#d8d8d2',outfitA:'#4a3d6b',outfitB:'#7a6a4a',trim:'#cdb04a'},{skin:'#bd8458',hair:'#e2e0d6',outfitA:'#3a5a4a',outfitB:'#6a5a3a',trim:'#9fb8a0'},{skin:'#c79a72',hair:'#cfcfca',outfitA:'#5a5a64',outfitB:'#3e4450',trim:'#b9c2cf'},{skin:'#a9744d',hair:'#ece8dc',outfitA:'#6b2f2f',outfitB:'#4a2a24',trim:'#d4a93f'}],
  Laborer:[{skin:'#c2895a',hair:'#5a3a22',outfitA:'#6e4a2c',outfitB:'#8a4a3a',trim:'#b9952f'},{skin:'#a86b42',hair:'#9a9488',outfitA:'#3f4a52',outfitB:'#7a5a3a',trim:'#c9a24b'},{skin:'#8a5a38',hair:'#2c2420',outfitA:'#5a3320',outfitB:'#4a5a3a',trim:'#9a7d3a'},{skin:'#d49a6a',hair:'#7a4520',outfitA:'#4a4038',outfitB:'#9a5230',trim:'#caa64e'}],
  Matron:[{skin:'#e0a878',hair:'#7a5638',outfitA:'#9c5a4a',outfitB:'#e8ddc8',trim:'#a9803f'},{skin:'#c2895a',hair:'#3a2a22',outfitA:'#4a6a78',outfitB:'#d8d2be',trim:'#b8924a'},{skin:'#d49a6a',hair:'#5a4030',outfitA:'#6a7a4a',outfitB:'#e4dcc4',trim:'#9a7838'},{skin:'#caa07a',hair:'#8a7560',outfitA:'#7a5878',outfitB:'#ddd6c2',trim:'#a07a40'}],
  Merchant:[{skin:'#c2895a',hair:'#5a4632',outfitA:'#5b3a6e',outfitB:'#2f5a8c',trim:'#d9b24a'},{skin:'#a86a40',hair:'#3a2c20',outfitA:'#7a2030',outfitB:'#3a3f4a',trim:'#e0c060'},{skin:'#d8a878',hair:'#7a7068',outfitA:'#2e6b5a',outfitB:'#6a4a28',trim:'#cfcad0'},{skin:'#b88050',hair:'#241c14',outfitA:'#3a4a72',outfitB:'#883a5a',trim:'#d9b24a'}],
  Hooded:[{skin:'#c2895a',hair:'#3a2a1a',outfitA:'#4a4458',outfitB:'#6b5d4a',trim:'#b9a36a'},{skin:'#a9744f',hair:'#2a2420',outfitA:'#6e6f74',outfitB:'#3c3a38',trim:'#c9c2b0'},{skin:'#d29a6e',hair:'#1c1410',outfitA:'#5a2330',outfitB:'#2e1c20',trim:'#c0a04a'},{skin:'#b07b50',hair:'#241a12',outfitA:'#33503a',outfitB:'#4a3b2a',trim:'#9a8850'}],
  Youth:[{skin:'#d29a6e',hair:'#5a3a22',outfitA:'#7a9c5c',outfitB:'#6b4a2c',trim:'#c9b27a'},{skin:'#b87a4e',hair:'#2a2018',outfitA:'#9c6b3c',outfitB:'#5a3a24',trim:'#cdb98a'},{skin:'#e0b088',hair:'#a86a2c',outfitA:'#5c7a9c',outfitB:'#3a4a5e',trim:'#b8c4cc'},{skin:'#c98f60',hair:'#7a5230',outfitA:'#a85c5c',outfitB:'#6b3a3a',trim:'#d6c08a'}],
};
const CROWD_POOL = ['Elder','Laborer','Matron','Merchant','Hooded','Youth'];
const NPC_VILLAGER = { smith:['Laborer',0], inn:['Laborer',1], arms:['Laborer',2], jewel:['Merchant',0], alch:['Elder',1], herald:['Hooded',0] };
const _vilCache={};
function villagerTex(name,pi){ const key=name+pi; if(_vilCache[key]) return _vilCache[key];
  const W=28,H=46; const cv=document.createElement('canvas');cv.width=W;cv.height=H;const x=cv.getContext('2d');x.imageSmoothingEnabled=false;
  (VILLAGER_FN[name]||drawVillagerYouth)(PX(x),14, VILLAGER_PAL[name][pi]||VILLAGER_PAL[name][0]);
  const tex=new THREE.CanvasTexture(cv);tex.magFilter=THREE.NearestFilter;tex.minFilter=THREE.NearestFilter;tex.generateMipmaps=false;tex.colorSpace=THREE.SRGBColorSpace;
  const rec={tex,aspect:W/H}; _vilCache[key]=rec; return rec; }
function villagerSprite(name,pi,worldH){ const rec=villagerTex(name,pi); const g=new THREE.Group();
  const sp=new THREE.Sprite(new THREE.SpriteMaterial({map:rec.tex,transparent:true,alphaTest:0.5,depthWrite:false,fog:true}));
  sp.scale.set(worldH*rec.aspect,worldH,1); sp.position.y=worldH/2; g.add(sp); return g; }

const NPC_LOOK = {
  smith:  {skin:0xc2895a, hair:0x2a1a0e, beard:true,  build:1.18, apron:0x8a5a2e},
  jewel:  {skin:0xd8b48c, hair:0x3a2236, beard:false, build:0.95, collar:0xf0d46a, brooch:0x6ab0ff},
  alch:   {skin:0xcaa882, hair:0xc9c2b4, beard:false, build:0.96, hood:0x1f4a2e, pouch:0x9a6a34},
  inn:    {skin:0xc89a6a, hair:0x4a2a14, beard:true,  build:1.12, apron:0xcebfa0},
  herald: {skin:0xb89a7a, hair:0xd2ccc0, beard:true,  build:1.0,  long:true, hood:0x222230, tabard:0x9a948a},
  arms:   {skin:0xb88a5e, hair:0x1a120a, beard:true,  build:1.06, baldric:0x2a1c10, pauldron:0x9aa0ac},
};
function buildNpcFig(npc){
  const m = NPC_VILLAGER[npc.id] || ['Laborer',0];
  return villagerSprite(m[0], m[1], 1.95); // role-matched pixel villager; caller positions it in the shop
}

export { villagerSprite, CROWD_POOL, VILLAGER_PAL, buildNpcFig };
