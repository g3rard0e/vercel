import { useState, useEffect } from 'react'
import './Navbar.css'
const links = ['Live', 'Journey', 'Services', 'About', 'Terms', 'Contact']
export default function Navbar() {
  const [scrolled, setScrolled] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 40)
    const onKey = e => { if (e.key === 'Escape') setMenuOpen(false) }
    onScroll(); window.addEventListener('scroll', onScroll, { passive: true }); window.addEventListener('keydown', onKey)
    return () => { window.removeEventListener('scroll', onScroll); window.removeEventListener('keydown', onKey) }
  }, [])
  return (
    <nav className={`navbar ${scrolled ? 'scrolled' : ''}`} aria-label="Main navigation">
      <div className="navbar-inner container">
        <a href="#home" className="navbar-logo" onClick={() => setMenuOpen(false)} aria-label="Geamy Services home"><span className="logo-bracket">[</span><span className="logo-text">GEAMY</span><span className="logo-bracket">]</span></a>
        <div id="main-navigation" className={`navbar-links ${menuOpen ? 'open' : ''}`}>
          {links.map(label => <a key={label} href={`#${label.toLowerCase()}`} onClick={() => setMenuOpen(false)} className="nav-link"><span className="nav-link-num">/ </span>{label}</a>)}
          <a href="#contact" onClick={() => setMenuOpen(false)} className="nav-cta">Get a Quote</a>
        </div>
        <button type="button" className={`hamburger ${menuOpen ? 'open' : ''}`} onClick={() => setMenuOpen(value => !value)} aria-label={menuOpen ? 'Close menu' : 'Open menu'} aria-controls="main-navigation" aria-expanded={menuOpen}><span/><span/><span/></button>
      </div>
    </nav>
  )
}
