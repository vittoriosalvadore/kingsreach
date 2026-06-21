// Pure, dependency-free helpers used throughout the game.
// Extracted from index.html as the first step of modularizing the single file.
export const $ = id => document.getElementById(id);
export const clamp = (v,a,b)=>Math.max(a,Math.min(b,v));
export const lerp = (a,b,t)=>a+(b-a)*t;
export const rand = (a,b)=>a+Math.random()*(b-a);
export const randi = (a,b)=>Math.floor(rand(a,b+1));
export const pick = arr=>arr[Math.floor(Math.random()*arr.length)];
export const chance = p=>Math.random()<p;
export const shuffle = arr=>arr.slice().sort(()=>Math.random()-0.5);
export const easeOut = t=>1-Math.pow(1-t,2);
export const easeIn = t=>t*t;
export const ROMAN=['','I','II','III','IV','V','VI','VII','VIII','IX','X','XI','XII','XIII','XIV','XV'];
export const toRoman = n=>ROMAN[n]||('#'+n);
