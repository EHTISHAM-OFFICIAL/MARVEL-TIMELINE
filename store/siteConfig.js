import { useEffect, useState } from "htm/react";
import { doc, getDoc, serverTimestamp, setDoc } from "https://www.gstatic.com/firebasejs/12.19.0/firebase-firestore.js";
import { db } from "../services/firebase.js";

export const DEFAULT_VARS={bg:"#0a0a0f",bg2:"#12121a",bg3:"#1a1a26",card:"#16161f",cardHover:"#1e1e2c",border:"#2a2a3a",borderBright:"#3a3a52",text:"#e8e8f0",textDim:"#9a9ab0",textFaint:"#87879b",red:"#e62429",redBright:"#ff3b40",gold:"#f5b800",green:"#2ecc71",blue:"#3498db",purple:"#9b59b6",radius:"12px",radiusSm:"8px",shadow:"0 8px 32px rgba(0,0,0,.5)",glow1:"rgba(230,36,41,.12)",glow2:"rgba(155,89,182,.06)"};
export const DEFAULT_THEMES={
 midnight:{id:"midnight",name:"Midnight",description:"Cinematic black and crimson",vars:{...DEFAULT_VARS}},
 stark:{id:"stark",name:"Stark",description:"Steel and reactor red",vars:{...DEFAULT_VARS,bg:"#090c10",bg2:"#11161c",bg3:"#192129",card:"#151c23",cardHover:"#1e2933",border:"#29343d",borderBright:"#41515d",text:"#edf3f7",textDim:"#aebbc4",textFaint:"#85939e",red:"#e24a3b",redBright:"#ff695a",gold:"#f2bd42",glow1:"rgba(226,74,59,.11)",glow2:"rgba(80,160,190,.07)"}},
 cosmic:{id:"cosmic",name:"Cosmic",description:"Deep space and violet energy",vars:{...DEFAULT_VARS,bg:"#070710",bg2:"#0f1020",bg3:"#18172b",card:"#15152a",cardHover:"#201e38",border:"#2c2b4b",borderBright:"#48456d",text:"#eeeefe",textDim:"#aaa9ca",textFaint:"#8887ab",red:"#a855f7",redBright:"#c084fc",purple:"#a855f7",glow1:"rgba(168,85,247,.14)",glow2:"rgba(56,189,248,.08)"}},
 wakanda:{id:"wakanda",name:"Wakanda",description:"Obsidian and royal violet",vars:{...DEFAULT_VARS,bg:"#08080d",bg2:"#11101a",bg3:"#1b1827",card:"#171421",cardHover:"#211c30",border:"#30283f",borderBright:"#514261",text:"#f0edf7",textDim:"#b4abc4",textFaint:"#8f849f",red:"#8452f4",redBright:"#a78bfa",purple:"#8b5cf6",glow1:"rgba(139,92,246,.14)",glow2:"rgba(245,184,0,.05)"}},
 mystic:{id:"mystic",name:"Mystic",description:"Arcane night and cyan",vars:{...DEFAULT_VARS,bg:"#061013",bg2:"#0b181c",bg3:"#102329",card:"#0d1d22",cardHover:"#142b31",border:"#1d3a41",borderBright:"#2d5962",text:"#e6f7f8",textDim:"#9fc4c8",textFaint:"#6d989d",red:"#22d3ee",redBright:"#67e8f9",green:"#34d399",blue:"#38bdf8",purple:"#22d3ee",glow1:"rgba(34,211,238,.12)",glow2:"rgba(52,211,153,.06)"}},
 retro:{id:"retro",name:"Retro Marvel",description:"Classic dark and golden",vars:{...DEFAULT_VARS,bg:"#0d0b08",bg2:"#17130d",bg3:"#221c12",card:"#1b160f",cardHover:"#282015",border:"#3a2d1a",borderBright:"#5a4526",text:"#f5ead2",textDim:"#c6b99d",textFaint:"#968a72",red:"#c83b32",redBright:"#e8604f",gold:"#d8a93e",glow1:"rgba(200,59,50,.11)",glow2:"rgba(216,169,62,.07)"}},
 daylight:{id:"daylight",name:"Daylight",description:"Clean white with Marvel red",vars:{...DEFAULT_VARS,bg:"#f4f6f9",bg2:"#ffffff",bg3:"#edf1f5",card:"#ffffff",cardHover:"#f6f8fb",border:"#d7dde6",borderBright:"#b8c2d0",text:"#17202a",textDim:"#4f5d6d",textFaint:"#5e6d7e",red:"#c91820",redBright:"#a90f16",gold:"#9a6800",green:"#16834d",blue:"#1769aa",purple:"#7048a8",shadow:"0 10px 28px rgba(24,36,52,.12)",glow1:"rgba(201,24,32,.08)",glow2:"rgba(112,72,168,.05)"}},
 starkLight:{id:"starkLight",name:"Stark Light",description:"Bright steel and reactor red",vars:{...DEFAULT_VARS,bg:"#eef2f5",bg2:"#ffffff",bg3:"#e5ebef",card:"#ffffff",cardHover:"#f7fafc",border:"#cbd5dd",borderBright:"#9aa9b6",text:"#17212b",textDim:"#4b5b69",textFaint:"#596978",red:"#c72a31",redBright:"#a91c23",gold:"#8a5f00",green:"#19734a",blue:"#17679f",purple:"#76519a",shadow:"0 10px 30px rgba(24,39,53,.12)",glow1:"rgba(199,42,49,.07)",glow2:"rgba(23,103,159,.05)"}},
 dailyBugle:{id:"dailyBugle",name:"Daily Bugle",description:"Editorial white and headline red",vars:{...DEFAULT_VARS,bg:"#f7f5f0",bg2:"#fffdf8",bg3:"#ece9e1",card:"#fffdf8",cardHover:"#f4f1e9",border:"#d7d2c7",borderBright:"#a9a39a",text:"#1b1a18",textDim:"#55514b",textFaint:"#6c665d",red:"#b5151d",redBright:"#8f0d14",gold:"#8b6500",green:"#18744b",blue:"#1d5f91",purple:"#68458d",shadow:"0 10px 28px rgba(50,44,34,.12)",glow1:"rgba(181,21,29,.07)",glow2:"rgba(104,69,141,.05)"}},
 wakandaLight:{id:"wakandaLight",name:"Wakanda Light",description:"Ivory, violet and royal gold",vars:{...DEFAULT_VARS,bg:"#f4f0f7",bg2:"#fffdfd",bg3:"#ebe5ef",card:"#fffdfd",cardHover:"#f7f2f9",border:"#d6cbdc",borderBright:"#b19fba",text:"#211b27",textDim:"#5a4e61",textFaint:"#6d6174",red:"#7040a4",redBright:"#5c2e8d",gold:"#8a6500",green:"#18744b",blue:"#285f96",purple:"#7040a4",shadow:"0 10px 30px rgba(62,39,74,.12)",glow1:"rgba(112,64,164,.07)",glow2:"rgba(138,101,0,.04)"}}
};
export const DEFAULT_SITE_CONFIG={version:1,site:{brand:"MARVEL TIMELINE",tagline:"MCU & Marvel Connections Tracker",welcomeTitle:"WELCOME BACK",welcomeText:"Your Marvel archive is ready.",maintenance:false,maintenanceReopenAt:null},activeTheme:"midnight",themes:DEFAULT_THEMES,posters:{}};
let runtimeConfig=DEFAULT_SITE_CONFIG;
export function getRuntimeConfig(){return runtimeConfig;}
export function setRuntimeConfig(config){runtimeConfig={...DEFAULT_SITE_CONFIG,...config,site:{...DEFAULT_SITE_CONFIG.site,...(config?.site||{})},themes:{...DEFAULT_THEMES,...(config?.themes||{})},posters:config?.posters||{}};return runtimeConfig;}
export function isMaintenanceActive(config=runtimeConfig){const site=config?.site||{};if(!site.maintenance)return false;const reopen=site.maintenanceReopenAt?new Date(site.maintenanceReopenAt).getTime():NaN;return Number.isFinite(reopen)&&Date.now()>=reopen?false:true;}
// The stylesheet reads hyphenated names (--bg-2, --text-dim ...) while theme packages
// (and the admin theme editor) store camelCase keys. Publish BOTH so nothing stays on a stale default.
const CSS_ALIASES={bg2:"bg-2",bg3:"bg-3",cardHover:"card-hover",borderBright:"border-bright",textDim:"text-dim",textFaint:"text-faint",redBright:"red-bright",radiusSm:"radius-sm"};
const THEME_CACHE_KEY="mt-theme-cache";
function parseHex(value){const m=/^#?([0-9a-f]{3}|[0-9a-f]{6})$/i.exec(String(value||"").trim());if(!m)return null;let h=m[1];if(h.length===3)h=[...h].map(c=>c+c).join("");const n=parseInt(h,16);return[(n>>16)&255,(n>>8)&255,n&255];}
function luminance(value){const rgb=parseHex(value);if(!rgb)return null;const[r,g,b]=rgb.map(c=>{c/=255;return c<=.03928?c/12.92:Math.pow((c+.055)/1.055,2.4);});return .2126*r+.7152*g+.0722*b;}
function contrast(a,b){const x=luminance(a),y=luminance(b);if(x==null||y==null)return 1;return(Math.max(x,y)+.05)/(Math.min(x,y)+.05);}
// Nudge the accent just far enough (toward black or white, whichever helps its label text) that
// text drawn on it clears WCAG AA (4.5:1). Themes that already pass are returned unchanged.
function solidAccent(red,onRed){const base=parseHex(red);if(!base)return red;const toward=onRed==="#ffffff"?0:255;for(let t=0;t<=1;t+=.04){const c=base.map(v=>Math.round(v+(toward-v)*t));const hex="#"+c.map(v=>v.toString(16).padStart(2,"0")).join("");if(contrast(onRed,hex)>=4.6)return hex;}return red;}
// "light" or "dark", decided from the theme's own background, so custom admin themes are classified correctly.
export function themeMode(vars){const l=luminance({...DEFAULT_VARS,...(vars||{})}.bg);return l!=null&&l>.3?"light":"dark";}
function paintTheme(id,vars){
 const root=document.documentElement;
 const all={...DEFAULT_VARS,...(vars||{})};
 Object.entries(all).forEach(([k,v])=>{root.style.setProperty("--"+k,v);if(CSS_ALIASES[k])root.style.setProperty("--"+CSS_ALIASES[k],v);});
 const mode=themeMode(all),light=mode==="light";
 const onRed=contrast("#ffffff",all.red)>=contrast("#14141c",all.red)?"#ffffff":"#14141c";
 const derived={
  "on-red":onRed,
  "red-solid":solidAccent(all.red,onRed),
  "scrim":light?"rgba(20,28,40,.48)":"rgba(0,0,0,.74)",
  "shadow-ink":light?"#1c2838":"#000000",
  "hover-tint":light?"rgba(20,28,40,.045)":"rgba(255,255,255,.04)",
  "danger":light?"#b42318":"#ff6b6b",
  "on-danger":light?"#ffffff":"#2a0a0a"
 };
 Object.entries(derived).forEach(([k,v])=>root.style.setProperty("--"+k,v));
 root.style.colorScheme=mode;
 root.dataset.mode=mode;root.dataset.themePackage=id;root.dataset.theme=id;
 document.querySelector('meta[name="theme-color"]')?.setAttribute("content",all.bg);
 try{localStorage.setItem(THEME_CACHE_KEY,JSON.stringify({id,vars:all}));}catch(e){}
}
export function hasAppliedTheme(){return typeof document!=="undefined"&&Boolean(document.documentElement.dataset.theme);}
export function applyThemePackage(themeId){const theme=runtimeConfig.themes?.[themeId]||runtimeConfig.themes?.[runtimeConfig.activeTheme]||DEFAULT_THEMES.midnight;paintTheme(theme.id||themeId||"midnight",theme.vars||{});}
export function useSiteConfig(user){const [config,setConfig]=useState(runtimeConfig);useEffect(()=>{let alive=true;(async()=>{try{const snap=await getDoc(doc(db,"siteConfig","public"));if(alive&&snap.exists()){const next=setRuntimeConfig(snap.data());setConfig(next);}}catch(e){console.warn("Site configuration unavailable",e);}})();return()=>{alive=false;};},[user?.uid]);return config;}
export async function savePublicConfig(patch){const next={...runtimeConfig,...patch};await setDoc(doc(db,"siteConfig","public"),{...next,updatedAt:serverTimestamp()},{merge:true});setRuntimeConfig(next);return next;}
try{const cached=JSON.parse(localStorage.getItem(THEME_CACHE_KEY)||"null");if(cached&&cached.vars&&typeof document!=="undefined")paintTheme(cached.id||"midnight",cached.vars);}catch(e){}
