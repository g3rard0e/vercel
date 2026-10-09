import { useEffect, useRef } from 'react'
import { gsap } from 'gsap'
import { ScrollTrigger } from 'gsap/ScrollTrigger'

gsap.registerPlugin(ScrollTrigger)

export function useAtlasMotion(scope, scene, paused, reduced, expanded) {
  const introduced = useRef(false)
  useEffect(() => {
    if (expanded || paused || reduced || matchMedia('(prefers-reduced-motion: reduce)').matches) {
      scene.current.scrollDepth = 0
      return
    }
    const context = gsap.context(() => {
      if (!introduced.current) {
        introduced.current = true
        gsap.timeline({ scrollTrigger: { trigger: scope.current, start: 'top 88%', once: true } })
          .from('.iw-heading > div', { y: 26, opacity: 0, duration: .85, ease: 'power3.out', clearProps: 'transform,opacity' })
          .from('.iw-heading > p', { y: 16, opacity: 0, duration: .65, ease: 'power2.out', clearProps: 'transform,opacity' }, '-=.55')
          .from('.iw-map', { opacity: 0, duration: .8, clearProps: 'opacity' }, '-=.45')
          .from('.iw-panel > *', { y: 12, opacity: 0, stagger: .055, duration: .55, ease: 'power3.out', clearProps: 'transform,opacity' }, '-=.6')
      }
      ScrollTrigger.create({ trigger: scope.current, start: 'top bottom', end: 'center center', onUpdate: self => { scene.current.scrollDepth = scene.current.manual ? 0 : 1 - self.progress } })
    }, scope)
    return () => context.revert()
  }, [scope, scene, paused, reduced, expanded])
}
