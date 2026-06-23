// Hand-coded pixel-art UI icons, rendered as crisp inline SVG so the DOM menus
// match the game's 16-bit look instead of relying on OS emoji (which differ per
// device and clash with the art). Each icon is a char-grid + palette — the same
// format as the canvas HUD icons (_blit). Pure & dependency-free.
//
// uiIcon(name, px) -> an <svg> string ('' if unknown). Use it in innerHTML, e.g.
//   el.innerHTML = uiIcon('anvil');

export const PXI = {
  // ---- migrated from the canvas HUD icon set (7x7) ----
  heart:{g:[".HM.MD.","HMMMMMD","HMMMMMD","DMMMMMD",".DMMMD.","..DMD..","...D..."],p:{H:"#ff533e",M:"#c0392b",D:"#77231a"}},
  coin:{g:["...H...","..HGD..",".HGGGD.","HGGGGGE",".DGGGE.","..DGE..","...E..."],p:{H:"#f0d98c",G:"#d9b96a",D:"#8a743f",E:"#5a4a28"}},
  sword:{g:["....HS.","...HSD.","..HSD..",".gGg...","..S....","..g....","..D...."],p:{H:"#e8e2d2",S:"#9a948a",D:"#5a564e",G:"#d9b96a",g:"#8a743f"}},
  shield:{g:["HGGGGGD","GFFFFFD","GFFFFfD","DFFFFfD",".DFFfD.","..DfD..","...D..."],p:{H:"#f0d98c",G:"#d9b96a",D:"#8a743f",F:"#3a3026",f:"#241c14"}},
  flask:{g:["..KK...","..NN...",".gNNg..",".GHLLD.",".GLLLD.",".gLLLg.","..ggg.."],p:{K:"#8a743f",N:"#9a948a",G:"#cfcabd",L:"#5ac06a",H:"#86ff96",D:"#36733f",g:"#5a564e"}},
  spark:{g:["...G...","...g...",".G.C.D.","GgCCCgD",".G.C.D.","...g...","...D..."],p:{C:"#fff4d0",G:"#f0d98c",g:"#d9b96a",D:"#8a743f"}},
  boot:{g:[".HL....",".HL....",".HLD...",".HLD...",".HLLD..",".HLLLD.",".SSSSs."],p:{H:"#a86b3a",L:"#7a4a26",D:"#4a2c16",S:"#8a743f",s:"#5a4a28"}},
  rune:{g:["...H...","..HMD..",".HMMMD.","HMMCMMD",".HMMMD.","..DMD..","...D..."],p:{H:"#cfeeff",M:"#9fd8ff",D:"#4f6c80",C:"#ffffff"}},
  // ---- NPCs & UI (9x9) ----
  anvil:{g:["..HHHHHM.",".HMMMMMD.","HMMMMMMMM",".MMMMMMD.","...MMD...","...MMD...","..HMMMD..",".HMMMMMD.","DDDDDDDDD"],p:{H:"#bdbdc6",M:"#7a7a86",D:"#43434e"}},
  ring:{g:["....C....","...GHG...","..G...D..",".H.....D.",".H.....D.",".G.....D.","..G...D..","...DDD...","........."],p:{H:"#f0d98c",M:"#d9b96a",D:"#8a743f",G:"#d9b96a",C:"#9fd8ff"}},
  tankard:{g:["..WWWWW..",".HMMMMMD.","HMMMMMDDH","HMMMMMD.M","HMMMMMD.M","HMMMMMDDH","HMMMMMD..",".DMMMDD..","..DDDD..."],p:{H:"#f0d98c",M:"#d9b96a",D:"#8a743f",W:"#ffffff"}},
  scroll:{g:["HHHHHHHHH","HMMMMMMMD",".PPPPPPP.",".PEEEEEP.",".PEEEEEP.",".PEEEEEP.",".PPPPPPP.","HMMMMMMMD","HHHHHHHHH"],p:{H:"#9a6b3a",M:"#6e4a24",D:"#3f2a14",P:"#c9b88e",E:"#e8dcc0"}},
  pack:{g:[".D...D...",".HMMMMD..","HMMMMMMD.","HMFFFFMD.","HMFFFFMD.","HMMSSMMD.","HMMSSMMD.","HMMMMMMD.",".DDDDDD.."],p:{H:"#9a6b3a",M:"#6e4a24",D:"#3f2a14",F:"#8a743f",S:"#3f2a14"}},
  note:{g:[".........",".....MHH.",".....MMH.",".....MD..",".....MD..",".HH..MD..","HMMM.MD..","HMMMMMD..",".DDDD...."],p:{H:"#f0d98c",M:"#d9b96a",D:"#8a743f"}},
  cog:{g:["..H.M.D..",".HMMMMMD.","HMMDDDMMD","M.D...D.D",".MD...DM.","M.D...D.D","HMMDDDMMD",".HMMMMMD.","..H.M.D.."],p:{H:"#bdbdc6",M:"#7a7a86",D:"#43434e"}},
  soul:{g:["....H....","...HM....","..HMD....","..HMMD...",".HMMMD...",".HMMMMD..","..HMMD...","...MMD...","...DMD..."],p:{H:"#d8b0ff",M:"#a86fe0",D:"#5a3f8a"}},
  // ---- world / events (9x9) ----
  skull:{g:["..MMMM...",".MHHHHM..","MHHHHHHM.","MHDHHDHM.","MHDHHDHM.",".MHHHHM..","..MHHM...","..M.M.M..","..MMMM..."],p:{H:"#efe9d6",M:"#c8bfa4",D:"#3e3328"}},
  flame:{g:["....D....","...DMD...","..DMMD...",".DMHMD...",".DMHHMD..","DMHHHHMD.","DMHHHHMD.",".DMHHMD..","..DMMD..."],p:{H:"#ffe08a",M:"#ff8a3a",D:"#c0432b"}},
  fountain:{g:["...W.W...","....W....",".SSSSSSS.",".SWWWWWS.",".SSSSSSS.","...SSS...","...SSS...","..SSSSS..",".SDDDDDS."],p:{S:"#9aa0a6",D:"#3e4348",W:"#9fd8ff"}},
  urn:{g:["...HMD...","...MMM...","..HMMMD..",".HMMMMMD.","HMHMMMDMD","HMHMMMDMD","HMHMMMDMD",".DMMMMMD.","..DMMMD.."],p:{H:"#c89a6a",M:"#9a6b3a",D:"#5f3f20"}},
  drop:{g:["....H....","....H....","...HMM...","...HMM...","..HMMMD..","..HMMMD..",".HMMMMD..",".HMMMMD..","..DMMD..."],p:{H:"#cfeeff",M:"#5ab0e0",D:"#2f6f9f"}},
  bell:{g:["....H....","...HMM...","..HMMMD..","..HMMMD..",".HMMMMMD.",".HMMMMMD.","HMMMMMMMD","DDDDDDDDD","....D...."],p:{H:"#f0d98c",M:"#d9b96a",D:"#8a743f"}},
  candle:{g:["....F....","...FFF...","....C....","...HMD...","...HMD...","...HMD...","...HMD...","..HHMDD..","..DMMMD.."],p:{H:"#efe6c8",M:"#c8bf9a",D:"#8a8060",F:"#ffcf6a",C:"#8a8060"}},
  tree:{g:["....H....","...HMD...","..HMMMD..","...HMD...","..HMMMD..",".HMMMMMD.","HMMMMMMMD","....T....","...TTT..."],p:{H:"#7fd089",M:"#3a8a4a",D:"#235a30",T:"#6e4a24"}},
  // ---- stats & gear (9x9) ----
  target:{g:["..MWMM...","MWWMWWM..","WMRRRMW..","MWRWRWM..","WMRRRMW..","MWWMWWM..","..MWMM...",".........","........."],p:{M:"#c0392b",W:"#efe9d6",R:"#77231a"}},
  plus:{g:["...HMD...","...HMD...","...HMD...","HHHHMDDDD","MMMMMDDDD","DDDMDDDDD","...DMD...","...DMD...","...DMD..."],p:{H:"#86ff96",M:"#3aa05a",D:"#1f6b3a"}},
  snow:{g:["....H....","H.D.M.D.H",".M.HMH.M.","..DHMHD..","HMMM.MMMH","..DHMHD..",".M.HMH.M.","H.D.M.D.H","....H...."],p:{H:"#eaffff",M:"#bfe8ff",D:"#7fb8d8"}},
  helm:{g:["..HHHH...",".HMMMMMD.",".HMMMMMD.",".DDDDDDD.",".HMMMMMD.",".HMMDMMD.",".HMMDMMD.",".HMMMMMD.","..DDDDD.."],p:{H:"#bdbdc6",M:"#7a7a86",D:"#43434e"}},
  glove:{g:["H.H.H....","MMMMMM...","MMMMMMD..",".HMMMMD..",".MMMMMD..",".MMMMMD..",".MMMMMD..",".DMMMDD..","..DDDD..."],p:{H:"#bdbdc6",M:"#7a7a86",D:"#43434e"}},
  shirt:{g:["HM...MD..","HMMMMMMD.","HMMMMMMD.","MHMMMMDM.","..HMMD...","..MMMD...","..MMMD...","..MMMD...","..DDDD..."],p:{H:"#7a8aa0",M:"#4a5a72",D:"#2a3346"}},
  gem:{g:["..HMMM...",".HMMMMD..","HMHMMMMD.","MHMMMMMD.",".DMMMMD..","..DMMD...","...DMD...","....D....","........."],p:{H:"#e0b8ff",M:"#a86fe0",D:"#5a3f8a"}},
  charm:{g:["...HMD...","..H.G.D..","...HMD...","..HMMMD..",".HMGMMD..",".HMMMMD..",".HMMMMD..","..DMMD...","...DD...."],p:{H:"#f0d98c",M:"#d9b96a",D:"#8a743f",G:"#a86fe0"}},
};

// Aliases: semantic names used around the game -> a glyph in PXI.
const ALIAS = { gold:'coin', souls:'soul', music:'note', options:'cog', gear:'pack',
  potion:'flask', armor:'shield', trinket:'gem', talisman:'charm', crit:'target',
  regen:'plus', speed:'boot', lifesteal:'drop', def:'shield', atk:'sword', hp:'heart',
  vitality:'heart', spell:'spark', water:'drop', cache:'urn', shrine:'fountain',
  rest:'tankard', fight:'sword', elite:'skull', treasure:'coin', merchant:'coin',
  star:'spark', galaxy:'spark', blood:'drop' };

export function hasIcon(name){ return !!(PXI[name] || (ALIAS[name] && PXI[ALIAS[name]])); }

// Build a crisp inline-SVG string for a named icon at `px` display size.
export function uiIcon(name, px){
  const ic = PXI[name] || PXI[ALIAS[name]]; if(!ic) return '';
  const g = ic.g, p = ic.p, rows = g.length, cols = g[0].length; px = px || 22;
  let rects = '';
  for(let y=0;y<rows;y++){ const row = g[y]; let x=0;
    while(x<cols){ const ch = row[x];
      if(ch==='.'||ch===' '||!p[ch]){ x++; continue; }
      let w=1; while(x+w<cols && row[x+w]===ch) w++;          // merge same-colour runs
      rects += '<rect x="'+x+'" y="'+y+'" width="'+w+'" height="1" fill="'+p[ch]+'"/>';
      x+=w;
    } }
  return '<svg class="pxi" viewBox="0 0 '+cols+' '+rows+'" width="'+px+'" height="'+px+
    '" shape-rendering="crispEdges" xmlns="http://www.w3.org/2000/svg" style="display:inline-block;vertical-align:middle">'+rects+'</svg>';
}
