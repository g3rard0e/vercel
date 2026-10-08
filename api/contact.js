import { createContactHandler, readLimitedBody } from '../lib/contact.js'
const handle = createContactHandler()

// Read the original byte stream before parsing; do not use a pre-parsed body getter.
export default {
  fetch(request) {
    return handle({
      method: request.method,
      headers: request.headers,
      url: request.url,
      ip: process.env.VERCEL ? request.headers.get('x-real-ip') : 'local',
      readBody: () => readLimitedBody(request),
    }, process.env)
  },
}
