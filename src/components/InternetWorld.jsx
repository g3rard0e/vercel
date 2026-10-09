import { useEffect, useRef, useState } from 'react'
import { collectors, parseRoutingMessage } from './live-network'
import { drawWorld } from './internet-world-scene'
import './InternetWorld.css'

export default function InternetWorld() {
  const canvas = useRef(null), section = useRef(null), consoleRef = useRef(null), observedTotal = useRef(0)
  const scene = useRef({ x: 0, y: 0, zoom: 1, time: 0, pulses: [], attacks: [], selected: 'all', illustrative: true })
  const [status, setStatus] = useState('Waiting for live data'), [events, setEvents] = useState([])
  const [count, setCount] = useState(0), [selected, setSelected] = useState('all')
  const [localPaused, setPaused] = useState(false), [globalPaused, setGlobalPaused] = useState(document.documentElement.dataset.motion === 'off'), [fiber, setFiber] = useState(true)
  const paused = localPaused || globalPaused
  const [radar, setRadar] = useState({ state: 'loading', locations: [] })
  const [reduced, setReduced] = useState(false), [expanded, setExpanded] = useState(false)
  useEffect(() => {
    if (!expanded) return
    const previousFocus = document.activeElement, previousOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'; consoleRef.current.focus()
    const key = e => {
      if(e.key === 'Escape') { setExpanded(false); return }
      if(e.key !== 'Tab') return
      const controls = [...consoleRef.current.querySelectorAll('button:not(:disabled), input, select, canvas[tabindex]')]
      const first = controls[0], last = controls[controls.length - 1]
      if(e.shiftKey && (document.activeElement === first || document.activeElement === consoleRef.current)) { e.preventDefault(); last?.focus() }
      else if(!e.shiftKey && document.activeElement === last) { e.preventDefault(); first?.focus() }
    }
    document.addEventListener('keydown', key)
    return () => { document.body.style.overflow = previousOverflow; document.removeEventListener('keydown', key); previousFocus?.focus?.() }
  }, [expanded])
  useEffect(() => {
    const media = matchMedia('(prefers-reduced-motion: reduce)')
    const change = () => setReduced(media.matches)
    change(); media.addEventListener('change', change)
    return () => media.removeEventListener('change', change)
  }, [])
  useEffect(() => {
    const motion = e => setGlobalPaused(document.documentElement.dataset.motion === 'off')
    window.addEventListener('geamy-motion', motion)
    return () => window.removeEventListener('geamy-motion', motion)
  }, [])
  useEffect(() => {
    scene.current.selected = selected; scene.current.illustrative = fiber
  }, [selected, fiber])
  useEffect(() => {
    let socket, retry, idle, alive = true, visible = false, attempt = 0, total = observedTotal.current, lastPublish = 0, lastPulse = 0, lastMessage = 0
    let recent = []
    const stop = () => { clearTimeout(retry); clearInterval(idle); if (socket) { socket.onclose = null; socket.close(); socket = null } }
    const start = () => {
      if (!alive || !visible || document.hidden || paused || socket) return
      setStatus('Connecting to RIPE NCC')
      socket = new WebSocket('wss://ris-live.ripe.net/v1/ws/?client=geamy-services-world-v1')
      socket.onopen = () => {
        attempt = 0; lastMessage = Date.now(); setStatus('Connected · waiting for observations')
        collectors.forEach(c => socket.send(JSON.stringify({ type: 'ris_subscribe', data: { host: c.id, type: 'UPDATE', require: 'announcements', path: 3356 } })))
      }
      socket.onmessage = e => {
        const observation = parseRoutingMessage(e.data)
        if (!observation) return
        const now = Date.now(); lastMessage = now; total++; observedTotal.current = total
        if (now - lastPulse > 100) {
          recent = [observation, ...recent].slice(0, 8)
          scene.current.pulses = [...scene.current.pulses.filter(p => now - p.created < 4500), { ...observation, created: now }].slice(-40)
          lastPulse = now
        }
        if (now - lastPublish > 1000) { setCount(total); setEvents([...recent]); setStatus('Live · RIPE NCC observations'); lastPublish = now }
      }
      socket.onerror = () => setStatus('Connection unavailable · reconnecting')
      socket.onclose = () => {
        socket = null; clearInterval(idle); if (!alive || !visible || document.hidden || paused) return
        setStatus('Disconnected · reconnecting'); retry = setTimeout(start, Math.min(60000, 2000 * 2 ** Math.min(attempt++, 5)))
      }
      idle = setInterval(() => {
        if (Date.now() - lastMessage > 60000) setStatus('Connected · no recent observations')
        if (socket?.readyState === WebSocket.OPEN) socket.send(JSON.stringify({ type: 'ping' }))
      }, 30000)
    }
    const visibility = () => { if (document.hidden) { stop(); setStatus('Feed suspended · tab hidden') } else start() }
    const observer = new IntersectionObserver(([entry]) => { visible = entry.isIntersecting; if (visible) start(); else { stop(); setStatus('Feed suspended · outside view') } }, { rootMargin: '100px' })
    observer.observe(consoleRef.current); document.addEventListener('visibilitychange', visibility)
    if (paused) setStatus('Feed paused')
    return () => { alive = false; stop(); observer.disconnect(); document.removeEventListener('visibilitychange', visibility) }
  }, [paused])
  useEffect(() => {
    let alive = true, timer, controller
    const poll = async () => {
      if (document.hidden || paused) { timer = setTimeout(poll, 300000); return }
      controller = new AbortController()
      const timeout = setTimeout(() => controller.abort(), 10000)
      try {
        const res = await fetch('/api/network', { signal: controller.signal })
        const data = await res.json()
        if (alive) {
          if (!res.ok || !['ready', 'unconfigured'].includes(data.state)) throw new Error('unavailable')
          setRadar(data); scene.current.attacks = data.state === 'ready' ? data.locations : []
        }
      } catch { if (alive) { setRadar({ state: 'unavailable', locations: [] }); scene.current.attacks = [] } }
      finally { clearTimeout(timeout); if (alive) timer = setTimeout(poll, 300000) }
    }
    poll()
    return () => { alive = false; clearTimeout(timer); controller?.abort() }
  }, [paused])
  useEffect(() => {
    const el = canvas.current, ctx = el.getContext('2d')
    if (!ctx) return
    let frame, active = false, previous = 0, dragging = null
    const resize = () => { const r = el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); el.width = r.width * dpr; el.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); paint(0) }
    const paint = dt => { scene.current.time += dt; drawWorld(ctx, el.clientWidth, el.clientHeight, scene.current, paused || reduced) }
    const loop = t => { if (active && !document.hidden) { if (t - previous > 32) { paint(paused || reduced ? 0 : Math.min(t - previous, 50)); previous = t } frame = requestAnimationFrame(loop) } }
    const observer = new IntersectionObserver(([e]) => { active = e.isIntersecting; cancelAnimationFrame(frame); if (active) { previous = performance.now(); frame = requestAnimationFrame(loop) } })
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(el); observer.observe(el)
    const visibility = () => { cancelAnimationFrame(frame); if (!document.hidden && active) { previous = performance.now(); frame = requestAnimationFrame(loop) } }
    const down = e => { dragging = [e.clientX, e.clientY]; el.setPointerCapture(e.pointerId) }
    const move = e => { if (!dragging) return; scene.current.x += e.clientX - dragging[0]; scene.current.y += e.clientY - dragging[1]; dragging = [e.clientX, e.clientY] }
    const up = () => { dragging = null }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', up); document.addEventListener('visibilitychange', visibility)
    resize()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', up); document.removeEventListener('visibilitychange', visibility) }
  }, [paused, reduced])
  const zoom = amount => { scene.current.zoom = Math.max(.6, Math.min(2.5, scene.current.zoom + amount)) }
  const expand = () => setExpanded(value => !value)
  const pan = (x, y) => { scene.current.x += x; scene.current.y += y }
  const reset = () => { Object.assign(scene.current, { x: 0, y: 0, zoom: 1 }); setSelected('all') }
  const shown = events.filter(e => selected === 'all' || e.host === selected)
  return <section className="iw" id="live" ref={section} aria-labelledby="iw-title">
    <header className="iw-heading"><div><p className="iw-eyebrow">GEAMY OBSERVATORY / PLANET NETWORK</p><h2 id="iw-title">A world that<br/><em>never stops connecting.</em></h2></div><p>Explore the infrastructure beneath the Internet.<br/>Real routing observations. A living, illustrated world.</p></header>
    <div className={`iw-console ${expanded ? 'iw-expanded' : ''}`} ref={consoleRef} tabIndex={expanded ? -1 : undefined} role={expanded ? 'dialog' : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? 'Geamy Internet world' : undefined}>
      <div className="iw-map"><canvas ref={canvas} tabIndex={0} onKeyDown={e => { const direction = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}[e.key]; if(direction){e.preventDefault();pan(...direction)} }} aria-label="Illustrated world of network connections. Drag to move. Live observations are listed in the adjacent panel." />
        <div className="iw-map-top"><span className="iw-badge">GLOBAL NETWORK / 01</span><span className="iw-status" role="status">{status}</span></div>
        <div className="iw-map-label"><span>THE CONNECTED PLANET</span><b>Signals without borders.</b><small>Drag to explore · focus map + arrow keys to pan</small></div>
        <div className="iw-map-controls" aria-label="Map controls"><button onClick={() => zoom(.2)} aria-label="Zoom in">+</button><button onClick={() => zoom(-.2)} aria-label="Zoom out">−</button><button onClick={reset}>Reset</button><button onClick={expand}>{expanded ? 'Exit world' : 'Expand world'}</button><button onClick={() => setPaused(!localPaused)} disabled={globalPaused} aria-pressed={paused}>{globalPaused ? 'Global pause' : paused ? 'Resume' : 'Pause'}</button></div>
        <div className="iw-legend"><span><i/>Illustrated fiber</span><span><i/>Observed BGP update</span><span><i/>Radar attack origin</span></div>
      </div>
      <aside className="iw-panel" aria-label="Observed network activity">
        <div className="iw-panel-heading"><span>LIVE SIGNALS</span><b>{count.toLocaleString()}</b><small>announcements received this session</small></div>
        <label className="iw-field">Observation point<select value={selected} onChange={e => setSelected(e.target.value)}><option value="all">All six collectors</option>{collectors.map(c => <option key={c.id} value={c.id}>{c.name} / {c.id}</option>)}</select></label>
        <label className="iw-toggle"><input type="checkbox" checked={fiber} onChange={e => setFiber(e.target.checked)}/> Illustrated packet motion</label>
        <div className="iw-stream" aria-label="Latest sampled announcements">{shown.length ? shown.slice(0, 4).map((e, i) => <div className="iw-event" key={`${e.timestamp}-${i}`}><div><span>{collectors.find(c => c.id === e.host)?.name}</span><time>{new Date(e.timestamp * 1000).toLocaleTimeString()}</time></div><b>{e.path.map(n => `AS${n}`).join(' → ')}</b><small>{e.prefix}</small></div>) : <p className="iw-empty">{paused ? 'Observations paused.' : 'Waiting for observations from this collector.'}<br/>No synthetic events are added to this feed.</p>}</div>
        <div className="iw-threat"><span className="iw-eyebrow">NETWORK ATTACKS / CLOUDFLARE RADAR</span>{radar.state === 'ready' ? <><b>Observed origin distribution · last 24h</b><small>Dataset updated: {new Date(radar.lastUpdated).toLocaleString()}<br/>Window: {new Date(radar.startTime).toLocaleString()} → {new Date(radar.endTime).toLocaleString()}<br/>Confidence: {radar.confidence ?? 'not supplied'}/5</small>{radar.locations.slice(0, 3).map(l => <p key={l.code}>{l.name}<strong>{l.share.toFixed(2)}%</strong></p>)}</> : <><b>{radar.state === 'unconfigured' ? 'Attack source not connected' : radar.state === 'loading' ? 'Checking attack source…' : 'Attack source unavailable'}</b><small>{radar.state === 'unconfigured' ? 'Live attack data requires a private Radar API token. No attacks are simulated.' : 'No attack statistics are displayed until the source is available.'}</small></>}</div>
      </aside>
    </div>
    <div className="iw-method"><p><b>What you are seeing</b> Teal pulses reflect sampled announcements observed by six RIPE RIS collectors, filtered to AS3356. AS paths are logical routes, not packet traces. Cables, hubs and amber packets are illustrative; positions mark collectors, not physical routes. This is a partial observation of the Internet.</p><p><b>Source & freshness</b> <a href="https://ris-live.ripe.net/manual/" target="_blank" rel="noreferrer">RIPE NCC RIS Live ↗</a> · announcements older than two minutes are excluded. Up to ten pulses/second are visualized. <a href="https://radar.cloudflare.com/security/network-layer" target="_blank" rel="noreferrer">Cloudflare Radar ↗</a> supplies aggregated attack origins, polled every five minutes. Country locations do not identify attackers.</p></div>
  </section>
}
