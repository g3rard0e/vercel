import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'
import InternetWorld from './components/InternetWorld'
import About from './sections/About'
import Terms from './sections/Terms'
import Contact from './sections/Contact'
import './components/NetworkJourney.js'
import './components/NetworkJourney.css'
import './sections/Services.css'
import './components/ServiceExperience.js'
import './components/ServiceExperience.css'
import './motion.css'
import './experience-layout.css'

export default function App() {
  useEffect(() => {
    const elements = document.querySelectorAll('.reveal, .reveal-left, .reveal-right')
    const observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (entry.isIntersecting) { entry.target.classList.add('visible'); observer.unobserve(entry.target) }
      })
    }, { threshold: 0.08 })
    elements.forEach(element => observer.observe(element))
    return () => observer.disconnect()
  }, [])
  return (
    <>
      <a className="skip-link" href="#main">Skip to content</a>
      <Navbar />
      <main id="main" className="gx-page" style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <InternetWorld />
        <geamy-experiences id="services" />
        <div className="gx-deep-dive"><span>GO ONE LAYER DEEPER</span><h2>Follow a single connection.</h2><p>Scroll through the hardware behind the experience, or continue to meet Geamy.</p><a href="#about">Meet your technology partner &darr;</a></div>
        <network-journey id="journey" />
        <About /><Terms /><Contact />
      </main>
      <Footer />
      <div className="gx-global-motion"><geamy-motion /></div>
    </>
  )
}
