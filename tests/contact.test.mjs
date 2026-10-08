import test from 'node:test'
import assert from 'node:assert/strict'
import { createContactHandler, readLimitedBody, MAX_BODY_BYTES } from '../lib/contact.js'
const env = { MS_TENANT_ID: 'tenant', MS_CLIENT_ID: 'client', MS_CLIENT_SECRET: 'TEST_SECRET_NOT_REAL', MS_FROM_EMAIL: 'contact@example.test' }
const valid = { name: 'Example User', email: 'visitor@example.test', phone: '', service: 'Other', message: 'Please contact me.', website: '', elapsedMs: 4000 }
function setup(extra = {}) {
  const calls = [], logs = []
  let time = 1_000_000
  const handle = createContactHandler({ now: () => time, log: value => logs.push(value), fetchImpl: async (url, options) => {
    calls.push({ url, options })
    if (url.includes('siteverify')) return Response.json({ success: true, hostname: 'example.test', action: 'contact' })
    if (url.includes('/token')) return Response.json({ access_token: 'TEST_TOKEN_NOT_REAL', expires_in: 3600 })
    return new Response(null, { status: 202 })
  }, ...extra })
  const send = (fields = valid, changes = {}, settings = env) => handle({ method: 'POST', url: 'https://example.test/api/contact',
    headers: new Headers({ 'Content-Type': 'application/json', Origin: 'https://example.test', 'Sec-Fetch-Site': 'same-origin', 'X-Geamy-Form': 'contact-v3' }),
    ip: '192.0.2.1', readBody: async () => JSON.stringify(fields), ...changes,
  }, settings)
  return { handle, send, calls, logs, advance: amount => { time += amount } }
}
test('accepted mail uses server mailbox and never returns credentials', async () => {
  const { send, calls } = setup()
  const result = await send()
  assert.equal(result.status, 200)
  assert.deepEqual(await result.json(), { ok: true })
  assert.equal(result.headers.get('cache-control'), 'no-store')
  assert.equal(calls.length, 2)
  const mail = JSON.parse(calls[1].options.body)
  assert.equal(mail.message.toRecipients[0].emailAddress.address, env.MS_FROM_EMAIL)
  assert.equal(mail.message.from.emailAddress.address, env.MS_FROM_EMAIL)
  assert.equal(mail.message.replyTo[0].emailAddress.address, valid.email)
  assert.equal(calls[1].options.headers.Authorization, 'Bearer TEST_TOKEN_NOT_REAL')
})
test('HTML is escaped; newlines remain line breaks', async () => {
  const { send, calls } = setup()
  await send({ ...valid, name: '<img src=x>', message: '<script>alert(1)</script>\nHello & goodbye' })
  const html = JSON.parse(calls[1].options.body).message.body.content
  assert.ok(html.includes('&lt;img'))
  assert.ok(html.includes('&lt;script&gt;'))
  assert.ok(html.includes('<br>Hello &amp; goodbye'))
  assert.ok(!html.includes('<script>'))
})
for (const [label, fields] of [
  ['array', []], ['null', null], ['unknown field', { ...valid, to: 'attacker@example.test' }],
  ['email format', { ...valid, email: 'not-email' }], ['header newline', { ...valid, name: 'a\r\nBcc:x' }],
  ['non-string phone', { ...valid, phone: {} }], ['large name', { ...valid, name: 'a'.repeat(121) }],
  ['empty message', { ...valid, message: ' ' }], ['invalid service', { ...valid, service: 'Unknown' }],
  ['too fast', { ...valid, elapsedMs: 20 }], ['string timer', { ...valid, elapsedMs: '4000' }],
  ['oversized token', { ...valid, turnstileToken: 'a'.repeat(2049) }],
]) test(`rejects ${label}`, async () => {
  const { send, calls } = setup()
  assert.equal((await send(fields)).status, 400)
  assert.equal(calls.length, 0)
})
test('rejects malformed JSON and throwing Vercel lazy getter', async () => {
  const { send } = setup()
  assert.equal((await send(valid, { readBody: async () => '{' })).status, 400)
  assert.equal((await send(valid, { readBody: async () => { throw new SyntaxError() } })).status, 400)
})
test('rejects non-POST without upstream work', async () => {
  const { send, calls } = setup()
  const result = await send(valid, { method: 'GET' })
  assert.equal(result.status, 405)
  assert.equal(result.headers.get('allow'), 'POST')
  assert.equal(calls.length, 0)
})
test('rejects missing origin, foreign origin, missing form marker and cross-site fetch', async () => {
  for (const change of [{ origin: '' }, { origin: 'https://evil.test' }, { 'x-geamy-form': '' }, { 'sec-fetch-site': 'cross-site' }]) {
    const { send, calls } = setup()
    const headers = new Headers({ 'content-type': 'application/json', origin: 'https://example.test', 'x-geamy-form': 'contact-v3', ...change })
    assert.equal((await send(valid, { headers })).status, 403)
    assert.equal(calls.length, 0)
  }
})
test('rejects content-type lookalikes', async () => {
  const { send } = setup()
  assert.equal((await send(valid, { headers: new Headers({ 'content-type': 'application/json-evil' }) })).status, 415)
})
test('honeypot returns a neutral response without sending mail', async () => {
  const { send, calls } = setup()
  assert.equal((await send({ ...valid, website: 'bot-filled' })).status, 200)
  assert.equal(calls.length, 0)
})
test('actual UTF-8 payload bytes are limited without Content-Length', async () => {
  const { send, calls } = setup()
  assert.equal((await send(valid, { readBody: async () => ' '.repeat(MAX_BODY_BYTES + 1) })).status, 413)
  assert.equal(calls.length, 0)
})
test('edge stream is bounded and cancelled', async () => {
  const request = new Request('https://example.test', { method: 'POST', body: 'x'.repeat(MAX_BODY_BYTES + 1) })
  await assert.rejects(readLimitedBody(request), RangeError)
  assert.equal(await readLimitedBody(new Request('https://example.test', { method: 'POST', body: '{"ok":true}' })), '{"ok":true}')
})
test('per-IP throttle resets after its window', async () => {
  const { send, advance } = setup()
  for (let i = 0; i < 5; i++) assert.equal((await send()).status, 200)
  const result = await send()
  assert.equal(result.status, 429)
  assert.equal(result.headers.get('retry-after'), '600')
  advance(600_001)
  assert.equal((await send()).status, 200)
})
test('valid token cached until expiry margin; rotated credentials invalidate it', async () => {
  const { send, calls, advance } = setup()
  await send(); await send()
  assert.equal(calls.filter(c => c.url.includes('/token')).length, 1)
  await send(valid, {}, { ...env, MS_CLIENT_SECRET: 'ROTATED_TEST_SECRET' })
  assert.equal(calls.filter(c => c.url.includes('/token')).length, 2)
  advance(3_550_000)
  await send(valid, {}, { ...env, MS_CLIENT_SECRET: 'ROTATED_TEST_SECRET' })
  assert.equal(calls.filter(c => c.url.includes('/token')).length, 3)
})
test('concurrent requests share an in-flight token request', async () => {
  const { send, calls } = setup()
  await Promise.all([send(), send(), send()])
  assert.equal(calls.filter(c => c.url.includes('/token')).length, 1)
})
test('provider errors do not expose secret response content or trigger send retries', async () => {
  let count = 0
  const { send, logs } = setup({ fetchImpl: async url => {
    count++
    return url.includes('/token') ? Response.json({ access_token: 'PRIVATE', expires_in: 3600 }) : Response.json({ secret: 'PROVIDER_PRIVATE_DETAILS' }, { status: 403 })
  } })
  const result = await send()
  assert.equal(result.status, 502)
  assert.ok(!(await result.text()).includes('PRIVATE'))
  assert.ok(!JSON.stringify(logs).includes('PRIVATE'))
  assert.equal(count, 2)
})
test('missing server configuration is generic and does not call providers', async () => {
  const { send, calls } = setup()
  assert.equal((await send(valid, {}, {})).status, 503)
  assert.equal(calls.length, 0)
})
test('configured Turnstile fails closed when token missing', async () => {
  const { send, calls } = setup()
  assert.equal((await send(valid, {}, { ...env, TURNSTILE_SECRET_KEY: 'TEST' })).status, 403)
  assert.equal(calls.length, 0)
})
test('Turnstile checks hostname and action', async () => {
  const { send } = setup({ fetchImpl: async () => Response.json({ success: true, hostname: 'other.test', action: 'contact' }) })
  assert.equal((await send({ ...valid, turnstileToken: 'test' }, {}, { ...env, TURNSTILE_SECRET_KEY: 'TEST' })).status, 403)
})
test('Turnstile succeeds only with matching verification', async () => {
  const { send, calls } = setup()
  assert.equal((await send({ ...valid, turnstileToken: 'test' }, {}, { ...env, TURNSTILE_SECRET_KEY: 'TEST' })).status, 200)
  assert.equal(calls.length, 3)
})
test('frontend-only Turnstile configuration does not bypass server verification', async () => {
  const { send, calls } = setup()
  assert.equal((await send({ ...valid, turnstileToken: 'test' })).status, 503)
  assert.equal(calls.length, 0)
})
