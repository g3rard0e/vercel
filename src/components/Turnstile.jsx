import { useEffect, useRef } from 'react'
let loading
function load() {
  if (window.turnstile) return Promise.resolve(window.turnstile)
  if (!loading) loading = new Promise((resolve, reject) => {
    const script = document.createElement('script')
    script.src = 'https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit'
    script.async = true
    script.onload = () => window.turnstile ? resolve(window.turnstile) : reject(new Error('Verification unavailable'))
    script.onerror = () => reject(new Error('Verification unavailable'))
    document.head.appendChild(script)
  })
  return loading
}
export default function Turnstile({ siteKey, onVerify, resetKey }) {
  const container = useRef(null)
  useEffect(() => {
    let cancelled = false, widget, api
    onVerify('')
    load().then(instance => {
      if (cancelled || !container.current) return
      api = instance
      widget = api.render(container.current, { sitekey: siteKey, action: 'contact', theme: 'dark', size: 'flexible',
        callback: onVerify, 'expired-callback': () => onVerify(''), 'error-callback': () => onVerify(''),
      })
    }).catch(() => onVerify(''))
    return () => { cancelled = true; if (api && widget !== undefined) api.remove(widget) }
  }, [siteKey, onVerify, resetKey])
  return <div className="contact-verify" ref={container} aria-label="Spam protection verification" />
}
