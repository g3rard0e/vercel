import { useEffect } from 'react'
import Navbar from './components/Navbar'
import Footer from './components/Footer'
import Hero from './sections/Hero'
import Services from './sections/Services'
import About from './sections/About'
import Terms from './sections/Terms'
import Contact from './sections/Contact'
import './components/NetworkJourney.js'
import './components/NetworkJourney.css'
import './motion.css'

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
      <main id="main" style={{ position: 'relative', zIndex: 1 }}>
        <Hero />
        <network-journey id="journey" />
        <Services /><About /><Terms /><Contact />
      </main>
      <Footer />
    </>
  )
}
