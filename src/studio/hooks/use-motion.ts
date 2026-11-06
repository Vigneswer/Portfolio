"use client";
import { useEffect, useSyncExternalStore, type RefObject } from "react";
const reducedQuery = "(prefers-reduced-motion: reduce)";
const subscribeReduced = (callback:()=>void) => { const m=window.matchMedia(reducedQuery);m.addEventListener("change",callback);return()=>m.removeEventListener("change",callback); };
export function useReducedMotion() { return useSyncExternalStore(subscribeReduced,()=>window.matchMedia(reducedQuery).matches,()=>true); }
const subscribeVisibility = (callback:()=>void) => {document.addEventListener("visibilitychange",callback);return()=>document.removeEventListener("visibilitychange",callback);};
export function usePageVisible() { return useSyncExternalStore(subscribeVisibility,()=>!document.hidden,()=>true); }
const compactQuery = "(max-width: 800px)";
const subscribeCompact = (callback:()=>void) => { const m=window.matchMedia(compactQuery);m.addEventListener("change",callback);return()=>m.removeEventListener("change",callback); };
export function useCompactViewport() { return useSyncExternalStore(subscribeCompact,()=>window.matchMedia(compactQuery).matches,()=>true); }
const coarsePointerQuery = "(pointer: coarse)";
const subscribeCoarsePointer = (callback:()=>void) => { const m=window.matchMedia(coarsePointerQuery);m.addEventListener("change",callback);return()=>m.removeEventListener("change",callback); };
export function useCoarsePointer() { return useSyncExternalStore(subscribeCoarsePointer,()=>window.matchMedia(coarsePointerQuery).matches,()=>false); }
export function usePointerParallax(ref:RefObject<HTMLDivElement|null>,enabled:boolean,reset:number) {
 useEffect(()=>{
  const node=ref.current;if(!node||!enabled||!window.matchMedia("(hover: hover) and (pointer: fine)").matches)return;
  let frame=0,x=0,y=0,tx=0,ty=0;
  const tick=()=>{if(document.hidden){frame=0;return;}x+=(tx-x)*.14;y+=(ty-y)*.14;node.style.setProperty("--rx",`${-y*3}deg`);node.style.setProperty("--ry",`${x*5}deg`);node.style.setProperty("--mx",`${x*5}px`);node.style.setProperty("--my",`${y*3}px`);if(Math.abs(tx-x)+Math.abs(ty-y)>.002)frame=requestAnimationFrame(tick);else frame=0;};
  const request=()=>{if(!frame&&!document.hidden)frame=requestAnimationFrame(tick);};
  const move=(e:PointerEvent)=>{if(e.pointerType==="touch")return;const b=node.getBoundingClientRect();tx=Math.max(-1,Math.min(1,(e.clientX-b.left-b.width/2)/(b.width/2)));ty=Math.max(-1,Math.min(1,(e.clientY-b.top-b.height/2)/(b.height/2)));request();};
  const leave=()=>{tx=0;ty=0;request();};
  node.addEventListener("pointermove",move,{passive:true});node.addEventListener("pointerleave",leave);window.addEventListener("blur",leave);
  return()=>{cancelAnimationFrame(frame);node.removeEventListener("pointermove",move);node.removeEventListener("pointerleave",leave);window.removeEventListener("blur",leave);for(const p of ["--rx","--ry","--mx","--my"])node.style.removeProperty(p);};
 },[ref,enabled,reset]);
}
