import { createContactHandler, MAX_BODY_BYTES } from '../lib/contact.js'
const handle = createContactHandler()

export default async function handler(req, res) {
  const headers = new Headers()
  for (const [key, value] of Object.entries(req.headers)) {
    if (typeof value === 'string') headers.set(key, value)
  }
  // Host is routed by Vercel. Do not derive trusted origins from x-forwarded-host.
  const host = headers.get('host') || 'invalid.local'
  const local = /^(localhost|127\.0\.0\.1)(:\d+)?$/.test(host)
  const result = await handle({
    method: req.method, headers, url: `${local ? 'http' : 'https'}://${host}/api/contact`,
    // Vercel overwrites x-forwarded-for at its edge. Do not trust it off-platform.
    ip: process.env.VERCEL ? headers.get('x-forwarded-for')?.split(',')[0].trim() : req.socket?.remoteAddress,
    readBody: async () => {
      // Vercel's lazy JSON getter may throw. The shared handler catches it.
      const body = req.body
      const raw = typeof body === 'string' ? body : JSON.stringify(body)
      if (typeof raw !== 'string') return ''
      if (Buffer.byteLength(raw, 'utf8') > MAX_BODY_BYTES) throw new RangeError('body_limit')
      return raw
    },
  }, process.env)
  result.headers.forEach((value, key) => res.setHeader(key, value))
  res.statusCode = result.status
  res.end(await result.text())
}
