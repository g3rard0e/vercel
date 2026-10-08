import './Hero.css'

export default function Hero() {
  return (
    <section className="hero" id="home">
      <div className="hero-grain" aria-hidden="true" />
      <div className="container hero-inner">
        <div className="hero-left">
          <p className="hero-eyebrow"><span /> GEAMY SERVICES / MIAMI + REMOTE</p>
          <h1 className="hero-title">Infrastructure.<br /><span>In motion.</span></h1>
          <p className="hero-sub">Behind every productive business is a world of connections. We design, secure and support yours.</p>
          <div className="hero-actions">
            <a className="btn-primary" href="#contact">Let's build your next connection <span>&nearr;</span></a>
            <a className="hero-explore" href="#journey">Enter the network <span>&darr;</span></a>
          </div>
          <div className="hero-stats" aria-label="Geamy Services experience">
            <div><strong>12<span>+</span></strong><small>Years experience</small></div>
            <div><strong>50<span>+</span></strong><small>Projects delivered</small></div>
            <div><strong>30<span>d</span></strong><small>Work warranty</small></div>
          </div>
        </div>
        <div className="hero-right">
          <div className="hero-art-label"><span>THE ART OF STAYING CONNECTED</span><span>01 / 06</span></div>
          <network-preview aria-hidden="true" />
          <div className="hero-art-footer"><span>ROUTING / SECURITY / CLOUD</span><a href="#journey" aria-label="Explore the interactive network">Explore the system &nearr;</a></div>
        </div>
      </div>
      <div className="hero-bottom"><span>BUILT TO KEEP YOUR BUSINESS MOVING.</span><a href="#journey">SCROLL TO DISCOVER &darr;</a></div>
    </section>
  )
}
