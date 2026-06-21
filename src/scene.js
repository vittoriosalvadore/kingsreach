// Three.js foundation: the live quality/brightness config plus the renderer,
// scene, cameras, lights, and procedural sky. Most of the visual code imports
// from here. Depends only on THREE + leaf modules (helpers, data) — no game
// state — so there are no circular imports.
//
// Q and B are the LIVE config objects (their `.key` field tracks the current
// preset). applyQuality/applyBright in index.html mutate them via Object.assign;
// this module just provides the initial values and the GL objects.
import * as THREE from 'three';
import { $ } from './helpers.js';
import { QPRESETS, BPRESETS, BIOMES } from './data.js';

const QDEFAULT = /Mobi|Android|iPhone|iPad|iPod/i.test(navigator.userAgent) ? 'medium' : 'high';
let qk = QDEFAULT;
try{ const saved=localStorage.getItem('kr_quality'); if(saved&&QPRESETS[saved]) qk=saved; }catch(e){}
export const Q = Object.assign({}, QPRESETS[qk]);

let bk = 'normal';
try{ const sb=localStorage.getItem('kr_bright'); if(sb&&BPRESETS[sb]) bk=sb; }catch(e){}
export const B = Object.assign({}, BPRESETS[bk]);

// ---- renderer ----
export const gameEl = $('game'), canvas = $('c');
export const renderer = new THREE.WebGLRenderer({canvas,antialias:Q.aa,powerPreference:'high-performance',preserveDrawingBuffer:true});
export const bootAA = Q.aa;
renderer.setPixelRatio(Math.min(devicePixelRatio,Q.pixel));
renderer.outputColorSpace = THREE.SRGBColorSpace;
renderer.toneMapping = THREE.ACESFilmicToneMapping;
renderer.toneMappingExposure = B.exp;
renderer.shadowMap.enabled = false;
renderer.autoClear = false;
export let RETRO_W = 200; // internal render width (px); the whole world renders this small and CSS upscales nearest-neighbour into hard 16-bit pixels

export const scene = new THREE.Scene();
scene.fog = new THREE.FogExp2(BIOMES[0].fog, 0.028);
export const camera = new THREE.PerspectiveCamera(70, 1, 0.1, 600);
export const weaponScene = new THREE.Scene();
export const weaponCam = new THREE.PerspectiveCamera(55, 1, 0.01, 10);

export const skyUniforms = { top:{value:new THREE.Color(BIOMES[0].sky[0])}, horizon:{value:new THREE.Color(BIOMES[0].sky[1])}, bottom:{value:new THREE.Color(BIOMES[0].sky[2])}, starInt:{value:0.7}, uTime:{value:0} };
export const sky = new THREE.Mesh(new THREE.SphereGeometry(400,24,16), new THREE.ShaderMaterial({
  side:THREE.BackSide, depthWrite:false, fog:false, uniforms:skyUniforms,
  vertexShader:`varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }`,
  fragmentShader:`varying vec3 vP; uniform vec3 top; uniform vec3 horizon; uniform vec3 bottom; uniform float starInt; uniform float uTime;
    float hash(vec3 p){ p=fract(p*0.3183099+vec3(0.1,0.2,0.3)); p*=17.0; return fract(p.x*p.y*p.z*(p.x+p.y+p.z)); }
    void main(){ vec3 d=normalize(vP); float h=d.y;
      vec3 c=mix(horizon,top,pow(max(h,0.),.45)); c=mix(c,bottom,pow(max(-h,0.),.5));
      if(h>0.04 && starInt>0.001){ vec3 cell=floor(d*150.0); float r=hash(cell);
        float star=smoothstep(0.992,1.0,r); float tw=0.6+0.4*sin(uTime*2.0+r*40.0);
        c+=vec3(star)*tw*starInt*smoothstep(0.04,0.35,h); }
      gl_FragColor=vec4(c,1.); }`
}));
sky.renderOrder = -1; scene.add(sky);

export const hemi = new THREE.HemisphereLight(BIOMES[0].hemiSky, BIOMES[0].hemiGround, 0.9); scene.add(hemi);
export const sun = new THREE.DirectionalLight(BIOMES[0].sun, BIOMES[0].sunInt); sun.position.set(-8,14,-6); scene.add(sun);
export const accentLight = new THREE.PointLight(BIOMES[0].accent, 6, 22, 2.2); scene.add(accentLight);
// warm key + cool rim that sculpt the enemy in combat (so texture/poly read instead of a flat glow)
export const enemyKey = new THREE.PointLight(0xffe8cc, 0, 18, 2); scene.add(enemyKey);
export const enemyRim = new THREE.PointLight(0xbfd4ff, 0, 16, 2); scene.add(enemyRim);
export const townLight = new THREE.PointLight(0xffc070, 0, 50, 1.6); townLight.position.set(0,4,-9); scene.add(townLight);
export const townFill = new THREE.PointLight(0xffe2b4, 0, 40, 1.6); townFill.position.set(0,5,3); scene.add(townFill);
weaponScene.add(new THREE.HemisphereLight(0xbfcfff,0x20140a,1.1));
export const wkey = new THREE.DirectionalLight(0xffe6c0,1.4); wkey.position.set(-1,2,2); weaponScene.add(wkey);
