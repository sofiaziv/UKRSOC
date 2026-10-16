'use client';

import {useEffect, useId, useRef} from 'react';

/** Keep the original ink artwork, articulating its petals as separate SVG layers. */
export default function ScrollSunflower() {
  const ref=useRef<SVGSVGElement>(null);
  const id=useId().replace(/:/g,'');
  useEffect(()=>{
    const svg=ref.current;
    const hero=svg?.closest('section');
    if(!svg||!hero)return;
    const motion=window.matchMedia('(prefers-reduced-motion: reduce)');
    let frame=0;
    const draw=()=>{
      frame=0;
      const bounds=hero.getBoundingClientRect();
      const range=Math.min(bounds.height*.65,window.innerHeight*.6);
      const progress=motion.matches?1:Math.max(0,Math.min(1,-bounds.top/Math.max(1,range)));
      const eased=progress*progress*(3-2*progress);
      svg.style.setProperty('--bloom',String(eased));
    };
    const schedule=()=>{if(!frame)frame=requestAnimationFrame(draw)};
    draw();
    window.addEventListener('scroll',schedule,{passive:true});
    window.addEventListener('resize',schedule);
    motion.addEventListener('change',schedule);
    return()=>{cancelAnimationFrame(frame);window.removeEventListener('scroll',schedule);window.removeEventListener('resize',schedule);motion.removeEventListener('change',schedule)};
  },[]);
  const cx=620,cy=435;
  const sectors=Array.from({length:16},(_,i)=>{
    const a=(i*22.5-5)*Math.PI/180,b=(i*22.5+23)*Math.PI/180;
    return `M ${cx} ${cy} L ${cx+610*Math.cos(a)} ${cy+610*Math.sin(a)} A 610 610 0 0 1 ${cx+610*Math.cos(b)} ${cy+610*Math.sin(b)} Z`;
  });
  return <svg ref={ref} className="scroll-sunflower" viewBox="0 0 1024 1536" role="img" aria-label="Ink-drawn sunflower gently opening as you scroll" style={{'--bloom':1} as React.CSSProperties}>
    <defs>
      <mask id={`${id}-stem`}><rect width="1024" height="1536" fill="white"/><ellipse cx={cx} cy={cy} rx="490" ry="440" fill="black"/></mask>
      <clipPath id={`${id}-head`}><ellipse cx={cx} cy={cy} rx="490" ry="440"/></clipPath>
      <clipPath id={`${id}-heart`}><ellipse cx="610" cy="438" rx="182" ry="218" transform="rotate(-30 610 438)"/></clipPath>
      {sectors.map((d,i)=><clipPath key={i} id={`${id}-petal-${i}`}><path d={d}/></clipPath>)}
    </defs>
    <image href="/sunflower-ink.png" width="1024" height="1536" mask={`url(#${id}-stem)`}/>
    <g className="sunflower-head">
      <g clipPath={`url(#${id}-head)`}>{sectors.map((_,i)=><g key={i} className="sunflower-petals" style={{'--petal-offset':`${i%2?1:-1}`} as React.CSSProperties}><image href="/sunflower-ink.png" width="1024" height="1536" clipPath={`url(#${id}-petal-${i})`}/></g>)}</g>
      <image href="/sunflower-ink.png" width="1024" height="1536" clipPath={`url(#${id}-heart)`}/>
    </g>
  </svg>;
}
