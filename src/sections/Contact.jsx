import { useRef, useState } from 'react'
import Turnstile from '../components/Turnstile'
import './Contact.css'
const SERVICES = ['Network Infrastructure', 'Microsoft 365 / Cloud Migration', 'Security & Endpoint Protection', 'CCTV & Physical Security', 'Website, Domain & Hosting', 'Automation & Workflow', 'Backup & Disaster Recovery', 'IT Support & Helpdesk', 'Other']
const siteKey = import.meta.env.VITE_TURNSTILE_SITE_KEY || ''
export default function Contact() {
  const [form, setForm] = useState({ name: '', email: '', phone: '', service: '', message: '' })
  const [website, setWebsite] = useState('')
  const [status, setStatus] = useState('idle')
  const [error, setError] = useState('')
  const [token, setToken] = useState('')
  const [resetKey, setResetKey] = useState(0)
  const startedAt = useRef(performance.now())
  const sending = useRef(false)
  const handleChange = e => setForm(value => ({ ...value, [e.target.name]: e.target.value }))
  const handleSubmit = async e => {
    e.preventDefault()
    if (sending.current) return
    sending.current = true; setStatus('sending'); setError('')
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 28000)
    try {
      const response = await fetch('/api/contact', { method: 'POST', signal: controller.signal,
        headers: { 'Content-Type': 'application/json', 'X-Geamy-Form': 'contact-v3' },
        body: JSON.stringify({ ...form, website, elapsedMs: Math.round(performance.now() - startedAt.current), ...(token ? { turnstileToken: token } : {}) }),
      })
      const data = await response.json()
      if (!response.ok || data.ok !== true) {
        throw new Error(response.status === 429 ? 'Please wait 10 minutes before trying again, or email us directly.' : response.status === 403 ? 'Please refresh the page and complete verification before trying again.' : 'Your message could not be submitted. Please try again or email us directly.')
      }
      setStatus('success')
    } catch (reason) {
      setStatus('error')
      setError(reason.name === 'AbortError' ? 'We could not confirm submission. Please email us directly rather than submitting repeatedly.' : reason instanceof SyntaxError || reason instanceof TypeError ? 'The contact service is unavailable. Please email us directly.' : reason.message)
      setToken(''); setResetKey(value => value + 1)
    } finally { clearTimeout(timer); sending.current = false }
  }
  return (
    <section className="contact-section" id="contact">
      <div className="container contact-inner">
        <div className="contact-info">
          <span className="section-label">Your next connection</span>
          <h2 className="section-title">Let's build<br /><span style={{ color: 'var(--accent)' }}>what's next.</span></h2>
          <p className="contact-sub">Tell us what you need. We'll come back with a clear quote, a timeline, and practical next steps.</p>
          <div className="contact-details">
            <a href="mailto:gerardo@geamyservices.com" className="contact-detail"><span className="detail-icon" aria-hidden="true">@</span><div><span className="detail-label">Email</span><span className="detail-val">gerardo@geamyservices.com</span></div></a>
            <a href="https://wa.me/13054000000" target="_blank" rel="noopener noreferrer" className="contact-detail"><span className="detail-icon" aria-hidden="true">&nearr;</span><div><span className="detail-label">WhatsApp</span><span className="detail-val">Message us directly</span></div></a>
            <div className="contact-detail"><span className="detail-icon" aria-hidden="true">+</span><div><span className="detail-label">Location</span><span className="detail-val">Miami, FL - Remote available</span></div></div>
          </div>
        </div>
        <div className="contact-form-wrap">
          {status === 'success' ? <div className="form-success" role="status"><span className="success-icon" aria-hidden="true">&#10003;</span><h3>Message submitted.</h3><p>Thank you for reaching out. We'll get back to you within one business day.</p></div> :
            <form className="contact-form" onSubmit={handleSubmit}>
              <div className="contact-trap" aria-hidden="true"><label htmlFor="contact-website">Leave this field empty</label><input id="contact-website" name="website" value={website} onChange={e => setWebsite(e.target.value)} tabIndex={-1} autoComplete="off" /></div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="contact-name">Name</label><input id="contact-name" name="name" autoComplete="name" maxLength={120} placeholder="Your name" value={form.name} onChange={handleChange} required /></div>
                <div className="form-group"><label htmlFor="contact-email">Email</label><input id="contact-email" name="email" type="email" autoComplete="email" maxLength={254} placeholder="you@company.com" value={form.email} onChange={handleChange} required /></div>
              </div>
              <div className="form-row">
                <div className="form-group"><label htmlFor="contact-phone">Phone (optional)</label><input id="contact-phone" name="phone" type="tel" autoComplete="tel" maxLength={40} placeholder="Your phone number" value={form.phone} onChange={handleChange} /></div>
                <div className="form-group"><label htmlFor="contact-service">Service needed</label><select id="contact-service" name="service" value={form.service} onChange={handleChange} required><option value="">Select a service</option>{SERVICES.map(service => <option key={service}>{service}</option>)}</select></div>
              </div>
              <div className="form-group"><label htmlFor="contact-message">Tell us about your project</label><textarea id="contact-message" name="message" rows={5} maxLength={5000} placeholder="Describe what you need..." value={form.message} onChange={handleChange} required /></div>
              <p className="contact-privacy">Please do not include passwords, access tokens or other sensitive credentials.</p>
              {siteKey && <Turnstile siteKey={siteKey} onVerify={setToken} resetKey={resetKey} />}
              {status === 'error' && <p className="contact-status" role="alert">{error} <a href="mailto:gerardo@geamyservices.com">gerardo@geamyservices.com</a></p>}
              <button type="submit" className="btn-primary form-submit" disabled={status === 'sending' || Boolean(siteKey && !token)}>{status === 'sending' ? 'Submitting...' : 'Send message'} <span aria-hidden="true">&nearr;</span></button>
            </form>}
        </div>
      </div>
    </section>
  )
}
