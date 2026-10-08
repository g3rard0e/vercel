// Server-only module. Never import this file into src/ or expose MS_* with VITE_.
export const MAX_BODY_BYTES = 24_000
const encoder = new TextEncoder()
const WINDOW_MS = 600_000
const SERVICES = new Set([
  'Network Infrastructure', 'Microsoft 365 / Cloud Migration',
  'Security & Endpoint Protection', 'CCTV & Physical Security',
  'Website, Domain & Hosting', 'Automation & Workflow',
  'Backup & Disaster Recovery', 'IT Support & Helpdesk', 'Other',
])
const LIMITS = { name: 120, email: 254, phone: 40, service: 80, message: 5000 }
const ALLOWED_FIELDS = new Set([...Object.keys(LIMITS), 'website', 'elapsedMs', 'turnstileToken'])
const json = (body, status = 200, extra = {}) => new Response(JSON.stringify(body), {
  status,
  headers: {
    'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store',
    'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY',
    'Referrer-Policy': 'strict-origin-when-cross-origin',
    'Strict-Transport-Security': 'max-age=31536000',
    'Permissions-Policy': 'camera=(), microphone=(), geolocation=()',
    'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'; base-uri 'none'", ...extra,
  },
})
export const escapeHtml = value => value.replace(/[&<>"']/g, char => ({
  '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;',
})[char])

export async function readLimitedBody(request) {
  if (!request.body) return ''
  const reader = request.body.getReader()
  const chunks = []
  let length = 0
  try {
    while (true) {
      const { done, value } = await reader.read()
      if (done) break
      length += value.byteLength
      if (length > MAX_BODY_BYTES) {
        await reader.cancel()
        throw new RangeError('body_limit')
      }
      chunks.push(value)
    }
  } finally { reader.releaseLock() }
  const bytes = new Uint8Array(length)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.length }
  return new TextDecoder('utf-8', { fatal: true }).decode(bytes)
}

function parseFields(raw) {
  if (typeof raw !== 'string' || encoder.encode(raw).length > MAX_BODY_BYTES) throw new RangeError('body_limit')
  const fields = JSON.parse(raw)
  if (!fields || typeof fields !== 'object' || Array.isArray(fields)) throw new TypeError('fields')
  if (Object.keys(fields).some(key => !ALLOWED_FIELDS.has(key))) throw new TypeError('fields')
  if (fields.website != null && typeof fields.website !== 'string') throw new TypeError('fields')
  if (fields.website?.trim()) return { honeypot: true }
  if (typeof fields.elapsedMs !== 'number' || !Number.isFinite(fields.elapsedMs) || fields.elapsedMs < 1200) {
    throw new TypeError('timing')
  }
  const result = {}
  for (const [key, limit] of Object.entries(LIMITS)) {
    const value = fields[key] ?? (key === 'phone' ? '' : null)
    if (typeof value !== 'string' || value.length > limit || (key !== 'phone' && !value.trim())) throw new TypeError('fields')
    // Prevent control characters in email headers; message may include tabs/newlines.
    const controls = key === 'message' ? /[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/ : /[\u0000-\u001f\u007f]/
    if (controls.test(value)) throw new TypeError('fields')
    result[key] = value.normalize('NFC').trim()
    if (result[key].length > limit) throw new TypeError('fields')
  }
  if (!SERVICES.has(result.service) || !/^[A-Za-z0-9.!#$%&'*+\/=?^_`{|}~-]+@[A-Za-z0-9](?:[A-Za-z0-9.-]*[A-Za-z0-9])?\.[A-Za-z]{2,63}$/.test(result.email)) throw new TypeError('fields')
  if (result.phone && !/^[+\d\s().-]{5,40}$/.test(result.phone)) throw new TypeError('fields')
  if (fields.turnstileToken != null && (typeof fields.turnstileToken !== 'string' || fields.turnstileToken.length > 2048)) throw new TypeError('fields')
  return { ...result, turnstileToken: fields.turnstileToken || '' }
}

export function createContactHandler({ fetchImpl = globalThis.fetch, now = Date.now, log = console.error } = {}) {
  // Bounded, per-instance mitigation, NOT a distributed WAF or durable rate limit.
  const buckets = new Map()
  let globalBucket = { count: 0, expires: 0 }
  let tokenCache = null
  let tokenPending = null

  function allow(ip) {
    const time = now()
    if (globalBucket.expires <= time) globalBucket = { count: 0, expires: time + WINDOW_MS }
    if (globalBucket.count >= 60) return false
    for (const [key, bucket] of buckets) if (bucket.expires <= time) buckets.delete(key)
    const key = String(ip || 'unknown').slice(0, 128)
    let bucket = buckets.get(key)
    if (!bucket) {
      if (buckets.size >= 2048) return false
      bucket = { count: 0, expires: time + WINDOW_MS }
      buckets.set(key, bucket)
    }
    if (bucket.count >= 5) return false
    bucket.count++; globalBucket.count++
    return true
  }

  async function upstream(url, options) {
    const controller = new AbortController()
    const timer = setTimeout(() => controller.abort(), 8000)
    try {
      const response = await fetchImpl(url, { ...options, signal: controller.signal, redirect: 'error' })
      // Read within the timeout too. Bound our own upstream data processing.
      const text = await response.text()
      if (text.length > 100_000) throw new Error('upstream_response')
      return { ok: response.ok, status: response.status, text }
    } finally { clearTimeout(timer) }
  }

  async function getToken(env) {
    const identity = [env.MS_TENANT_ID, env.MS_CLIENT_ID, env.MS_CLIENT_SECRET].join('\u0000')
    if (tokenCache?.identity === identity && tokenCache.expires > now()) return tokenCache.token
    if (tokenPending?.identity === identity) return tokenPending.promise
    const promise = (async () => {
      const response = await upstream(`https://login.microsoftonline.com/${encodeURIComponent(env.MS_TENANT_ID)}/oauth2/v2.0/token`, {
        method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams({ client_id: env.MS_CLIENT_ID, client_secret: env.MS_CLIENT_SECRET,
          scope: 'https://graph.microsoft.com/.default', grant_type: 'client_credentials' }),
      })
      if (!response.ok) throw new Error('identity_provider')
      const data = JSON.parse(response.text)
      if (typeof data.access_token !== 'string' || !data.access_token || data.access_token.length > 20_000) throw new Error('identity_provider')
      const seconds = Number(data.expires_in)
      const lifetime = Number.isFinite(seconds) ? Math.max(0, Math.min(seconds, 3600) - 60) * 1000 : 0
      tokenCache = { identity, token: data.access_token, expires: now() + lifetime }
      return data.access_token
    })()
    const pending = { identity, promise }
    tokenPending = pending
    try { return await promise } finally { if (tokenPending === pending) tokenPending = null }
  }

  return async function handle({ method, headers, url, ip, readBody }, env = {}) {
    if (method !== 'POST') return json({ error: 'Method not allowed' }, 405, { Allow: 'POST' })
    if ((headers.get('content-type') || '').split(';')[0].trim().toLowerCase() !== 'application/json') {
      return json({ error: 'JSON required' }, 415)
    }
    const claimedLength = headers.get('content-length')
    if (claimedLength && (!/^\d+$/.test(claimedLength) || Number(claimedLength) > MAX_BODY_BYTES)) return json({ error: 'Request too large' }, 413)
    let origin
    try {
      const rawOrigin = headers.get('origin') || ''
      origin = new URL(rawOrigin).origin
      if (rawOrigin !== origin) return json({ error: 'Request denied' }, 403)
      const allowed = env.ALLOWED_ORIGINS ? env.ALLOWED_ORIGINS.split(',').map(value => {
        const entry = value.trim(), parsed = new URL(entry)
        if (entry !== parsed.origin || (parsed.protocol !== 'https:' && !(parsed.protocol === 'http:' && ['localhost', '127.0.0.1'].includes(parsed.hostname)))) throw new TypeError('origin')
        return parsed.origin
      }) : ['https://geamyservices.com', 'https://www.geamyservices.com']
      if (origin === 'null' || !allowed.includes(origin)) return json({ error: 'Request denied' }, 403)
    } catch { return json({ error: 'Request denied' }, 403) }
    const site = headers.get('sec-fetch-site')
    if ((site && !['same-origin', 'same-site'].includes(site)) || headers.get('x-geamy-form') !== 'contact-v3') {
      return json({ error: 'Request denied' }, 403)
    }
    if (!allow(ip)) return json({ error: 'Please wait before trying again' }, 429, { 'Retry-After': '600' })
    let fields
    try { fields = parseFields(await readBody()) }
    catch (error) { return json({ error: error instanceof RangeError ? 'Request too large' : 'Invalid form fields' }, error instanceof RangeError ? 413 : 400) }
    if (fields.honeypot) return json({ ok: true })
    if (['MS_TENANT_ID', 'MS_CLIENT_ID', 'MS_CLIENT_SECRET', 'MS_FROM_EMAIL'].some(key => typeof env[key] !== 'string' || !env[key].trim())) {
      log('Contact: configuration unavailable')
      return json({ error: 'Contact service temporarily unavailable' }, 503)
    }
    try {
      if (env.TURNSTILE_SECRET_KEY) {
        if (!fields.turnstileToken) return json({ error: 'Please complete verification' }, 403)
        const verification = await upstream('https://challenges.cloudflare.com/turnstile/v0/siteverify', {
          method: 'POST', headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
          body: new URLSearchParams({ secret: env.TURNSTILE_SECRET_KEY, response: fields.turnstileToken }),
        })
        const result = verification.ok ? JSON.parse(verification.text) : {}
        if (result.success !== true || result.action !== 'contact' || result.hostname !== new URL(origin).hostname) {
          return json({ error: 'Verification failed. Please try again' }, 403)
        }
      } else if (fields.turnstileToken) {
        // A configured frontend challenge must never silently skip server verification.
        log('Contact: verification configuration mismatch')
        return json({ error: 'Contact service temporarily unavailable' }, 503)
      }
      const token = await getToken(env)
      const { name, email, phone, service, message } = fields
      const html = `<div style="font:16px/1.6 sans-serif;color:#182635;max-width:640px"><h2>Geamy Services - New inquiry</h2><p><strong>Name:</strong> ${escapeHtml(name)}<br><strong>Email:</strong> ${escapeHtml(email)}<br><strong>Phone:</strong> ${escapeHtml(phone || 'Not provided')}<br><strong>Service:</strong> ${escapeHtml(service)}</p><hr><p>${escapeHtml(message).replace(/\r?\n/g, '<br>')}</p></div>`
      const response = await upstream(`https://graph.microsoft.com/v1.0/users/${encodeURIComponent(env.MS_FROM_EMAIL)}/sendMail`, {
        method: 'POST', headers: { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: { subject: `[Geamy] New inquiry - ${service}`,
          body: { contentType: 'HTML', content: html },
          from: { emailAddress: { name: 'Geamy Contact Form', address: env.MS_FROM_EMAIL } },
          toRecipients: [{ emailAddress: { address: env.MS_FROM_EMAIL } }],
          replyTo: [{ emailAddress: { name, address: email } }],
        }, saveToSentItems: false }),
      })
      if (!response.ok) {
        if (response.status === 401) tokenCache = null
        // No automatic sendMail retry: this is not an idempotent operation.
        log(`Contact: Graph rejected request (${response.status})`)
        return json({ error: 'Unable to submit your message. Please email us directly' }, 502)
      }
      return json({ ok: true }) // Graph accepted the request; not a delivery guarantee.
    } catch {
      // Never log provider response bodies, submitted PII, credentials or tokens.
      log('Contact: upstream request failed')
      return json({ error: 'Unable to submit your message. Please email us directly' }, 502)
    }
  }
}
