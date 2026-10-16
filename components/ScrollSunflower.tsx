'use client';

import {useEffect, useRef} from 'react';

/** A single intact illustration: no masks, cropped petals or SVG seams. */
export default function ScrollSunflower() {
  const ref=useRef<HTMLDivElement>(null);
  useEffect(()=>{
    const flower=ref.current;
    const hero=flower?.closest('section');
    if(!flower||!hero)return;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0;
    const draw=()=>{
      frame=0;
      if(motion.matches){flower.style.transform='none';return;}
      const bounds=hero.getBoundingClientRect();
      const range=Math.min(bounds.height*.65,window.innerHeight*.6);
      const p=Math.max(0,Math.min(1,(window.innerHeight*.12-bounds.top)/Math.max(1,range)));
      const eased=p*p*(3-2*p);
      // Compute final numeric transforms in JS for consistent Safari support.
      flower.style.transform=`translate3d(0,${8-16*eased}px,0) rotate(${-3+5*eased}deg) scale(${.94+.06*eased})`;
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw)};
    draw();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    motion.addEventListener('change',schedule);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);motion.removeEventListener('change',schedule)};
  },[]);
  return <div ref={ref} className="scroll-sunflower"><img src="/sunflower-ink.png" width="1024" height="1536" alt="Botanical sunflower drawn in black ink" fetchPriority="high"/></div>;
}
