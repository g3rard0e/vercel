export const collectors = [
  { id: 'rrc00', name: 'Amsterdam', lon: 4.9, lat: 52.37 },
  { id: 'rrc01', name: 'London', lon: -0.12, lat: 51.5 },
  { id: 'rrc06', name: 'Tokyo', lon: 139.76, lat: 35.68 },
  { id: 'rrc11', name: 'New York', lon: -74, lat: 40.71 },
  { id: 'rrc15', name: 'São Paulo', lon: -46.63, lat: -23.55 },
  { id: 'rrc19', name: 'Johannesburg', lon: 28.05, lat: -26.2 },
]
// Accept only bounded, recent, genuine announcements. A BGP path is logical,
// never treated as a physical cable, traffic volume, or a detected attack.
export function parseRoutingMessage(raw, now = Date.now()) {
  if (typeof raw !== 'string' || raw.length > 65536) return null
  let message
  try { message = JSON.parse(raw) } catch { return null }
  const d = message?.data
  if (message?.type !== 'ris_message' || d?.type !== 'UPDATE' || !Number.isFinite(d.timestamp)) return null
  if (Math.abs(now / 1000 - d.timestamp) > 120) return null
  const host = typeof d.host === 'string' ? d.host.split('.')[0] : ''
  if (!collectors.some(c => c.id === host) || !Array.isArray(d.path) || !Array.isArray(d.announcements) || !d.announcements.length) return null
  const path = d.path.filter(n => Number.isSafeInteger(n) && n > 0 && n <= 4294967295).slice(0, 16)
  if (path.length < 2) return null
  const prefix = d.announcements[0]?.prefixes?.[0]
  return { host, path, timestamp: d.timestamp, prefix: typeof prefix === 'string' && /^[0-9a-fA-F.:/]{3,50}$/.test(prefix) ? prefix : 'IPv4 / IPv6' }
}
