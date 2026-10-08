import test from 'node:test'
import assert from 'node:assert/strict'
import { readFileSync } from 'node:fs'
import { createContext, runInContext, Script } from 'node:vm'

const source = readFileSync(new URL('../src/components/ServiceExperience.js', import.meta.url), 'utf8')
function fixture() {
  const registry = new Map()
  const context = createContext({
    HTMLElement: class {},
    customElements: { get: name => registry.get(name), define: (name, value) => registry.set(name, value) },
  })
  new Script(source).runInContext(context)
  return { context, registry }
}

test('experience registers three native components without external libraries', () => {
  const { registry } = fixture()
  assert.deepEqual([...registry.keys()], ['geamy-experiences', 'geamy-universe', 'geamy-motion'])
})
test('catalog retains eight unique business service categories', () => {
  const { context } = fixture()
  const ids = JSON.parse(runInContext('JSON.stringify(catalog.map(s => s.id))', context))
  assert.deepEqual(ids, ['network', 'cloud', 'security', 'cameras', 'web', 'automation', 'backup', 'support'])
  assert.equal(new Set(ids).size, 8)
})
test('every service supplies a complete original illustration and named controls', () => {
  const { context } = fixture()
  const scenes = JSON.parse(runInContext('JSON.stringify(catalog.map(s => artwork[s.id]()))', context))
  for (const html of scenes) {
    assert.match(html, /class="gx-art /)
    assert.match(html, /data-action=/)
    assert.equal((html.match(/<div\b/g) || []).length, (html.match(/<\/div>/g) || []).length)
    assert.doesNotMatch(html, /<script|<iframe|https?:\/\//i)
  }
})
test('support preview has three valid selectable options', () => {
  const { context } = fixture()
  const html = runInContext('supportArt()', context)
  assert.equal((html.match(/<option>/g) || []).length, 3)
  assert.equal((html.match(/<\/option>/g) || []).length, 3)
  assert.match(html, /<option>Printer connection<\/option>/)
})
test('camera demo exposes three individually named camera buttons', () => {
  const { context } = fixture()
  const html = runInContext('camerasArt()', context)
  for (const name of ['lobby', 'warehouse', 'office']) assert.ok(html.includes(`aria-label="Select ${name} camera"`))
  assert.match(html, /SIMULATED VIEW/)
})
test('demo actions cannot request external services or open camera permissions', () => {
  assert.doesNotMatch(source, /\bfetch\s*\(|XMLHttpRequest|getUserMedia|WebSocket|document\.cookie|localStorage/)
  assert.match(source, /human checkpoint|Human approval/i)
  assert.match(source, /ILLUSTRATIVE DEMO \/ NOT A LIVE SYSTEM/)
})
test('app mounts experience and retains original network and business sections', () => {
  const app = readFileSync(new URL('../src/App.jsx', import.meta.url), 'utf8')
  for (const entry of ['<geamy-experiences id="services"', '<network-journey id="journey"', '<About />', '<Terms />', '<Contact />']) assert.ok(app.includes(entry))
})
