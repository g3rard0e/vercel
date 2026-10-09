import { useEffect, useRef, useState } from 'react'
import { collectors, parseRoutingMessage } from './live-network'
import { gsap } from 'gsap'
import { useAtlasMotion } from './useAtlasMotion'
import { collectorCamera, hitCollector } from './world-camera'
import { drawWorld } from './internet-world-scene'
import { drawGlobe } from './globe-scene'
import './InternetWorld.css'

export default function InternetWorld() {
  const canvas = useRef(null), section = useRef(null), consoleRef = useRef(null), observedTotal = useRef(0), cameraTween = useRef(null)
  const scene = useRef({ x: 0, y: 0, zoom: 1, globe: true, yaw: -.3, pitch: -.25, parallaxX: 0, parallaxY: 0, pointerX: 0, pointerY: 0, scrollDepth: 0, manual: false, hovered: null, time: 0, pulses: [], attacks: [], selected: 'all', illustrative: true })
  const [status, setStatus] = useState('Waiting for live data'), [events, setEvents] = useState([])
  const [count, setCount] = useState(0), [selected, setSelected] = useState('all')
  const [localPaused, setPaused] = useState(false), [globalPaused, setGlobalPaused] = useState(document.documentElement.dataset.motion === 'off'), [fiber, setFiber] = useState(true)
  const paused = localPaused || globalPaused
  const [radar, setRadar] = useState({ state: 'loading', locations: [] })
  const [reduced, setReduced] = useState(false), [expanded, setExpanded] = useState(false), [view, setView] = useState('globe'), [hovered, setHovered] = useState(null)
  useAtlasMotion(section, scene, paused, reduced, expanded)
  useEffect(() => { if(paused || reduced) cameraTween.current?.kill(); return () => cameraTween.current?.kill() }, [paused, reduced])
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
    const stop = () => { clearTimeout(retry); clearInterval(idle); if (socket) { socket.onopen = null; socket.onmessage = null; socket.onerror = null; socket.onclose = null; socket.close(); socket = null } }
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
    let frame, active = false, previous = 0, dragging = null, moved = 0, currentHover = null
    const resize = () => { const r = el.getBoundingClientRect(), dpr = Math.min(devicePixelRatio || 1, 2); el.width = r.width * dpr; el.height = r.height * dpr; ctx.setTransform(dpr, 0, 0, dpr, 0, 0); paint(0) }
    const paint = dt => {
      scene.current.time += dt
      const mix = 1 - Math.exp(-Math.max(1, dt) / 180)
      scene.current.parallaxX += ((paused || reduced ? 0 : scene.current.pointerX) - scene.current.parallaxX) * mix
      scene.current.parallaxY += ((paused || reduced ? 0 : scene.current.pointerY) - scene.current.parallaxY) * mix
      const draw = scene.current.globe ? drawGlobe : drawWorld
      draw(ctx, el.clientWidth, el.clientHeight, scene.current, paused || reduced)
    }
    const loop = t => { if (active && !document.hidden) { if (t - previous > 32) { paint(paused || reduced ? 0 : Math.min(t - previous, 50)); previous = t } frame = requestAnimationFrame(loop) } }
    const observer = new IntersectionObserver(([e]) => { active = e.isIntersecting; cancelAnimationFrame(frame); if (active) { previous = performance.now(); frame = requestAnimationFrame(loop) } })
    const resizeObserver = new ResizeObserver(resize); resizeObserver.observe(el); observer.observe(el)
    const visibility = () => { cancelAnimationFrame(frame); if (!document.hidden && active) { previous = performance.now(); frame = requestAnimationFrame(loop) } }
    const point = e => { const r = el.getBoundingClientRect(); return [e.clientX - r.left, e.clientY - r.top] }
    const down = e => { cameraTween.current?.kill(); dragging = [e.clientX, e.clientY]; moved = 0; el.setPointerCapture(e.pointerId) }
    const move = e => {
      const [x, y] = point(e)
      if (dragging) {
        const dx = e.clientX - dragging[0], dy = e.clientY - dragging[1]
        moved += Math.abs(dx) + Math.abs(dy); scene.current.manual = true; scene.current.scrollDepth = 0
        if (scene.current.globe) { scene.current.yaw += dx * .005; scene.current.pitch = Math.max(-1.4, Math.min(1.4, scene.current.pitch + dy * .005)) } else { scene.current.x += dx; scene.current.y += dy } dragging = [e.clientX, e.clientY]
        return
      }
      if (e.pointerType === 'mouse') {
        scene.current.pointerX = (x / el.clientWidth - .5) * .06
        scene.current.pointerY = (y / el.clientHeight - .5) * .07
      }
      const hit = hitCollector(el.clientWidth, el.clientHeight, scene.current, x, y)
      if(currentHover !== (hit?.id || null)) { currentHover = hit?.id || null; scene.current.hovered = currentHover; setHovered(currentHover); el.style.cursor = hit ? 'pointer' : 'grab' }
    }
    const up = e => { if(dragging && moved < 6) { const [x,y] = point(e), hit = hitCollector(el.clientWidth,el.clientHeight,scene.current,x,y); if(hit) chooseCollector(hit.id) } dragging = null }
    const cancel = () => { dragging = null }
    const leave = () => { scene.current.pointerX = 0; scene.current.pointerY = 0; scene.current.hovered = null; currentHover = null; setHovered(null) }
    el.addEventListener('pointerdown', down); el.addEventListener('pointermove', move); el.addEventListener('pointerup', up); el.addEventListener('pointercancel', cancel); el.addEventListener('pointerleave', leave); document.addEventListener('visibilitychange', visibility)
    resize()
    return () => { cancelAnimationFrame(frame); observer.disconnect(); resizeObserver.disconnect(); el.removeEventListener('pointerdown', down); el.removeEventListener('pointermove', move); el.removeEventListener('pointerup', up); el.removeEventListener('pointercancel', cancel); el.removeEventListener('pointerleave', leave); document.removeEventListener('visibilitychange', visibility) }
  }, [paused, reduced])
  const travel = destination => {
    scene.current.manual = true; scene.current.scrollDepth = 0; scene.current.pointerX = 0; scene.current.pointerY = 0
    cameraTween.current?.kill()
    if(paused || reduced) Object.assign(scene.current, destination)
    else cameraTween.current = gsap.to(scene.current, { ...destination, duration: 1.15, ease: 'power3.inOut', overwrite: 'auto' })
  }
  const zoom = amount => travel({ zoom: Math.max(.6, Math.min(2.5, scene.current.zoom + amount)) })
  const expand = () => setExpanded(value => !value)
  const pan = (x, y) => travel(scene.current.globe ? { yaw: scene.current.yaw - x * .005, pitch: Math.max(-1.4,Math.min(1.4,scene.current.pitch - y * .005)) } : { x: scene.current.x + x, y: scene.current.y + y })
  const chooseCollector = id => { setSelected(id); travel(collectorCamera(canvas.current.clientWidth, canvas.current.clientHeight, scene.current, id)) }
  const changeView = mode => { setView(mode); setSelected('all'); scene.current.globe = mode === 'globe'; travel({ x: 0, y: 0, zoom: 1, pitch: mode === 'globe' ? -.25 : mode === 'plan' ? 0 : .65, yaw: mode === 'globe' ? -.3 : mode === 'plan' ? 0 : -.1 }) }
  const reset = () => changeView(view)
  const focused = collectors.find(c => c.id === selected)
  const shown = events.filter(e => selected === 'all' || e.host === selected)
  return <section className="iw" id="live" ref={section} aria-labelledby="iw-title">
    <header className="iw-heading"><div><p className="iw-eyebrow">GEAMY OBSERVATORY / PLANET NETWORK</p><h2 id="iw-title">A world that<br/><em>never stops connecting.</em></h2></div><p>Explore the infrastructure beneath the Internet.<br/>Real routing observations. A living, illustrated world.</p></header>
    <div className={`iw-console ${expanded ? 'iw-expanded' : ''}`} ref={consoleRef} tabIndex={expanded ? -1 : undefined} role={expanded ? 'dialog' : undefined} aria-modal={expanded ? true : undefined} aria-label={expanded ? 'Geamy Internet world' : undefined}>
      <div className="iw-map"><canvas ref={canvas} tabIndex={0} onKeyDown={e => { const direction = {ArrowLeft:[40,0],ArrowRight:[-40,0],ArrowUp:[0,40],ArrowDown:[0,-40]}[e.key]; if(direction){e.preventDefault();pan(...direction)} }} aria-label="Illustrated world of network connections. Drag to rotate the globe or move the map, click a collector or use the observation selector. Live observations are listed in the adjacent panel." />
        <div className="iw-map-top"><span className="iw-badge">GEAMY / NETWORK ATLAS</span><span className="iw-status" role="status">{status}</span></div>
        <div className="iw-view-switch" role="group" aria-label="Camera view"><button aria-pressed={view === 'globe'} onClick={() => changeView('globe')}>Globe</button><button aria-pressed={view === 'perspective'} onClick={() => changeView('perspective')}>Perspective</button><button aria-pressed={view === 'plan'} onClick={() => changeView('plan')}>Plan view</button></div>
        {hovered && <div className="iw-hover-label">{collectors.find(c => c.id === hovered)?.name} · click to explore</div>}
        <div className="iw-map-label"><span>THE CONNECTED PLANET</span><b>Signals without borders.</b><small>{view === 'globe' ? 'Drag to rotate · click a collector · arrow keys to turn' : 'Drag to explore · click a collector · arrow keys to pan'}</small></div>
        <div className="iw-map-controls" aria-label="Map controls"><button onClick={() => zoom(.2)} aria-label="Zoom in">+</button><button onClick={() => zoom(-.2)} aria-label="Zoom out">−</button><button onClick={reset}>Reset</button><button onClick={expand}>{expanded ? 'Exit world' : 'Expand world'}</button><button onClick={() => setPaused(!localPaused)} disabled={globalPaused} aria-pressed={paused}>{globalPaused ? 'Global pause' : paused ? 'Resume' : 'Pause'}</button></div>
        <div className="iw-legend"><span><i/>Illustrated fiber</span><span><i/>Observed BGP update</span><span><i/>Radar attack origin</span></div>
      </div>
      <aside className="iw-panel" aria-label="Observed network activity">
        <div className="iw-panel-heading"><span>LIVE SIGNALS</span><b>{count.toLocaleString()}</b><small>announcements received this session</small></div>
        <label className="iw-field">Observation point<select value={selected} onChange={e => chooseCollector(e.target.value)}><option value="all">All six collectors</option>{collectors.map(c => <option key={c.id} value={c.id}>{c.name} / {c.id}</option>)}</select></label>
        <div className="iw-focus-summary"><span>{focused ? focused.name : 'Six observation points'}</span><small>{focused ? `${focused.id.toUpperCase()} · ${focused.lat.toFixed(2)}° / ${focused.lon.toFixed(2)}°` : 'Select a collector to fly closer.'}</small></div>
        <label className="iw-toggle"><input type="checkbox" checked={fiber} onChange={e => setFiber(e.target.checked)}/> Illustrated packet motion</label>
        <div className="iw-stream" aria-label="Latest sampled announcements">{shown.length ? shown.slice(0, 4).map((e, i) => <div className="iw-event" key={`${e.timestamp}-${i}`}><div><span>{collectors.find(c => c.id === e.host)?.name}</span><time>{new Date(e.timestamp * 1000).toLocaleTimeString()}</time></div><b>{e.path.map(n => `AS${n}`).join(' → ')}</b><small>{e.prefix}</small></div>) : <p className="iw-empty">{paused ? 'Observations paused.' : 'Waiting for observations from this collector.'}<br/>No synthetic events are added to this feed.</p>}</div>
        <div className="iw-threat"><span className="iw-eyebrow">NETWORK ATTACKS / CLOUDFLARE RADAR</span>{radar.state === 'ready' ? <><b>Observed origin distribution · last 24h</b><small>Dataset updated: {new Date(radar.lastUpdated).toLocaleString()}<br/>Window: {new Date(radar.startTime).toLocaleString()} → {new Date(radar.endTime).toLocaleString()}<br/>Confidence: {radar.confidence ?? 'not supplied'}/5</small>{radar.locations.slice(0, 3).map(l => <p key={l.code}>{l.name}<strong>{l.share.toFixed(2)}%</strong></p>)}</> : <><b>{radar.state === 'unconfigured' ? 'Attack source not connected' : radar.state === 'loading' ? 'Checking attack source…' : 'Attack source unavailable'}</b><small>{radar.state === 'unconfigured' ? 'Live attack data requires a private Radar API token. No attacks are simulated.' : 'No attack statistics are displayed until the source is available.'}</small></>}</div>
      </aside>
    </div>
    <div className="iw-method"><p><b>What you are seeing</b> Teal pulses reflect sampled announcements observed by six RIPE RIS collectors, filtered to AS3356. AS paths are logical routes, not packet traces. Cables, hubs and amber packets are illustrative; positions mark collectors, not physical routes. This is a partial observation of the Internet.</p><p><b>Source & freshness</b> <a href="https://ris-live.ripe.net/manual/" target="_blank" rel="noreferrer">RIPE NCC RIS Live ↗</a> · announcements older than two minutes are excluded. Up to ten pulses/second are visualized. <a href="https://radar.cloudflare.com/security/network-layer" target="_blank" rel="noreferrer">Cloudflare Radar ↗</a> supplies aggregated attack origins, polled every five minutes. Country locations do not identify attackers.</p></div>
  </section>
}
