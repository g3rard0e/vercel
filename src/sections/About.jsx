import './About.css'

const stack = [
  'Meraki', 'FortiGate', 'Palo Alto', 'WatchGuard', 'Ubiquiti',
  'Microsoft 365', 'Azure', 'Intune', 'Sophos', 'ThreatLocker',
  'Acronis', 'Veeam', 'VMware', 'Hyper-V', 'Proxmox',
  'ConnectWise', 'NinjaRMM', 'ITGlue',
]

const certs = [
  { name: 'CompTIA Network+', status: 'active' },
  { name: 'MS-900', status: 'active' },
  { name: 'CompTIA Security+', status: 'active' },
  { name: 'Acronis Cyber Protect Associate', status: 'active' },
  { name: 'NSE 1, 2, 3, 4...', status: 'in-progress' },
]

export default function About() {
  return (
    <section className="about-section" id="about">
      <div className="container about-inner">
        <div className="about-content reveal-left">
          <span className="section-label">Who we are</span>
          <h2 className="section-title">
            About<br />
            <span className="accent-word">Geamy Services</span>
          </h2>

          <p className="about-text">
            Geamy Services LLC is a Miami-based IT consultancy run by Gerardo Espinosa — a network engineer
            with over 12 years of hands-on experience across ISP environments, managed services, and enterprise IT.
          </p>
          <p className="about-text">
            The focus is straightforward: implement solutions that actually work, configure them right the first time,
            and make sure your team can rely on them. No fluff, no unnecessary complexity.
          </p>
          <p className="about-text">
            Whether you need to lock down your network, migrate to the cloud, or just get your office
            infrastructure running properly — this is the shop for it.
          </p>

          <div className="certs">
            {certs.map(c => (
              <div className="cert-badge" key={c.name}>
                <span className={`cert-status ${c.status}`} />
                <span className="cert-name">{c.name}</span>
                {c.status === 'in-progress' && <span className="cert-wip">in progress</span>}
              </div>
            ))}
          </div>
        </div>

        <div className="about-stack reveal-right reveal-delay-2">
          <p className="stack-label section-label">Tech stack</p>
          <div className="stack-grid">
            {stack.map((s, i) => (
              <div
                className="stack-item"
                key={s}
                style={{ animationDelay: `${i * 0.045}s` }}
              >
                {s}
              </div>
            ))}
          </div>

          <div className="about-card">
            <div className="about-card-row">
              <span className="about-card-key">Location</span>
              <span className="about-card-val">Miami, FL</span>
            </div>
            <div className="about-card-row">
              <span className="about-card-key">Service area</span>
              <span className="about-card-val">South Florida + Remote</span>
            </div>
            <div className="about-card-row">
              <span className="about-card-key">Languages</span>
              <span className="about-card-val">English / Spanish</span>
            </div>
            <div className="about-card-row">
              <span className="about-card-key">Response time</span>
              <span className="about-card-val">Same business day</span>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
