import { useEffect, useRef, useState } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'
import './ExperienceDirection.css'

gsap.registerPlugin(ScrollTrigger)
const chapters=[['home','The beginning'],['live','Live Internet'],['services','Your possibilities'],['journey','Inside the connection'],['about','Meet Geamy'],['terms','Working together'],['contact','Your next connection']]

export default function ExperienceDirection() {
  const [active,setActive]=useState('home'),rail=useRef(null)
  useEffect(()=>{
    let frame=0,context,started=false
    const media=matchMedia('(prefers-reduced-motion: reduce)')
    const update=()=>{
      frame=0
      const nodes=chapters.map(([id])=>document.getElementById(id)).filter(Boolean)
      let current=nodes[0]?.id || 'home'
      for(const node of nodes) if(node.getBoundingClientRect().top<innerHeight*.38)current=node.id
      setActive(current)
      const distance=document.documentElement.scrollHeight-innerHeight
      rail.current?.style.setProperty('--read-progress',String(distance>0?Math.max(0,Math.min(1,scrollY/distance)):0))
    }
    const scroll=()=>{if(!frame)frame=requestAnimationFrame(update)}
    const configure=()=>{
      context?.revert();context=null
      if(media.matches||document.documentElement.dataset.motion==='off')return
      context=gsap.context(()=>{
        if(!started){started=true;gsap.timeline({defaults:{ease:'power3.out'}})
          .from('.hero-eyebrow',{y:12,opacity:0,duration:.65,clearProps:'transform,opacity'})
          .from('.hero-title-line > span',{yPercent:110,rotate:3,duration:1,stagger:.12,clearProps:'transform'},'-.35')
          .from('.hero-sub, .hero-actions, .hero-stats',{y:18,opacity:0,duration:.7,stagger:.09,clearProps:'transform,opacity'},'-.7')
          .from('.hero-right',{opacity:0,duration:1,clearProps:'opacity'},'-.8')}
        gsap.to('.hero-right',{yPercent:-8,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}})
        gsap.to('.hero-aurora',{yPercent:35,scale:1.18,ease:'none',scrollTrigger:{trigger:'.hero',start:'top top',end:'bottom top',scrub:1}})
        gsap.from('.gx-deep-dive h2',{y:35,duration:.9,ease:'power3.out',scrollTrigger:{trigger:'.gx-deep-dive',start:'top 85%',toggleActions:'play none none reverse'},clearProps:'transform'})
      })
    }
    configure();update()
    addEventListener('scroll',scroll,{passive:true});addEventListener('resize',scroll);addEventListener('geamy-motion',configure);media.addEventListener('change',configure)
    return()=>{context?.revert();cancelAnimationFrame(frame);removeEventListener('scroll',scroll);removeEventListener('resize',scroll);removeEventListener('geamy-motion',configure);media.removeEventListener('change',configure)}
  },[])
  return <nav className="gx-chapters" aria-label="Experience chapters" ref={rail}>
    <span className="gx-chapter-track" aria-hidden="true" />
    {chapters.map(([id,label],i)=><a key={id} href={`#${id}`} aria-label={`${String(i+1).padStart(2,'0')} · ${label}`} aria-current={active===id?'location':undefined}><span className="gx-chapter-number" aria-hidden="true">{String(i+1).padStart(2,'0')}</span><span className="gx-chapter-label" aria-hidden="true">{label}</span></a>)}
  </nav>
}
