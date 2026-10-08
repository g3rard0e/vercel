import { createContactHandler, readLimitedBody } from '../../lib/contact.js'
const handle = createContactHandler()

export async function onRequest({ request, env }) {
  return handle({ method: request.method, headers: request.headers, url: request.url,
    ip: request.headers.get('CF-Connecting-IP'), readBody: () => readLimitedBody(request),
  }, env)
}
