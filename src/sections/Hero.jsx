import './Hero.css'

export default function Hero() {
  return (
    <>
      <section className="hero hero-v2" id="home">
        <div className="hero-aurora" aria-hidden="true" />
        <div className="container hero-inner">
          <div className="hero-left">
            <p className="hero-eyebrow"><span /> GEAMY SERVICES / MIAMI + REMOTE</p>
            <h1 className="hero-title">Your business.<br />Connected.<br /><span>In full motion.</span></h1>
            <p className="hero-sub">Networks. Cloud. Security. Cameras. Websites.<br />The systems behind your next chapter, connected by one technology partner.</p>
            <div className="hero-actions">
              <a className="btn-primary" href="#services">Explore the possibilities <span>↗</span></a>
              <a className="hero-explore" href="#contact">Let's build something <span>&rarr;</span></a>
            </div>
            <div className="hero-stats" aria-label="Geamy Services experience">
              <div><strong>12<span>+</span></strong><small>Years experience</small></div>
              <div><strong>50<span>+</span></strong><small>Projects delivered</small></div>
              <div><strong>30<span>d</span></strong><small>Work warranty</small></div>
            </div>
          </div>
          <div className="hero-right">
            <div className="hero-art-label"><span>YOUR BUSINESS, REIMAGINED</span><span>01 &mdash; 08</span></div>
            <geamy-universe aria-label="Interactive map of Geamy services" />
            <div className="hero-art-footer"><span>CHOOSE A SPECIALTY TO EXPLORE</span><a href="#journey">Inside the network ↗</a></div>
          </div>
        </div>
        <div className="hero-bottom"><span>FROM THE FIRST CONNECTION TO WHAT COMES NEXT.</span><a href="#services">SCROLL. EXPLORE. IMAGINE. &darr;</a></div>
      </section>
      <div className="hero-ribbon" aria-hidden="true"><div>{[0, 1].map(i => <span key={i}>CONNECT <b>+</b> MODERNIZE <b>+</b> PROTECT <b>+</b> SEE <b>+</b> CREATE <b>+</b> SIMPLIFY <b>+</b> RECOVER <b>+</b> SUPPORT <b>+</b></span>)}</div></div>
    </>
  )
}
