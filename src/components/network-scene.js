// Original procedural artwork. No external images, WebGL dependency, or telemetry.
const clamp = (v, a = 0, b = 1) => Math.max(a, Math.min(b, v))
const mix = (a, b, t) => a + (b - a) * t
const sub = (a, b) => a.map((n, i) => n - b[i])
const dot = (a, b) => a.reduce((n, v, i) => n + v * b[i], 0)
const cross = (a, b) => [a[1]*b[2]-a[2]*b[1], a[2]*b[0]-a[0]*b[2], a[0]*b[1]-a[1]*b[0]]
const norm = v => { const n = Math.hypot(...v) || 1; return v.map(x => x / n) }
export const STAGES = [
  { name: 'Internet', title: 'Every connection starts somewhere.', copy: 'From a remote team to a new office, the first hop connects your business to the world.', tags: 'WAN connectivity / Remote access', x: -25, z: 1 },
  { name: 'Firewall', title: 'A boundary. Not a bottleneck.', copy: 'Traffic meets its first security boundary. We configure firewall policies, VPNs and segmentation around your business.', tags: 'Firewall policies / Secure VPN', x: -15, z: -2 },
  { name: 'Router', title: 'The right path forward.', copy: 'A packet finds its next destination. Thoughtful routing connects your sites, cloud services and people.', tags: 'Routing / Site-to-site connectivity', x: -5, z: 2 },
  { name: 'Switch', title: 'Everything, connected.', copy: 'Inside your network, switches connect the devices that keep work moving. Structured cabling and VLANs bring order to the flow.', tags: 'Structured cabling / VLANs', x: 5, z: -2 },
  { name: 'Server', title: 'Where work comes to life.', copy: 'Infrastructure becomes applications, files and collaboration. We implement cloud migrations, backups and recovery.', tags: 'Microsoft 365 / Cloud / Backup', x: 15, z: 1 },
  { name: 'Endpoint', title: 'It all comes back to people.', copy: 'The journey ends at a workstation. Endpoint protection and practical support help your team get on with their day.', tags: 'Endpoint protection / IT support', x: 25, z: 0 },
]
const ports = STAGES.map(s => [s.x, 0.7, s.z + 2.8])
function route(t) {
  const n = clamp(t) * 5, i = Math.min(4, Math.floor(n)), f = n - i
  const a = ports[Math.max(0, i - 1)], b = ports[i], c = ports[i + 1], d = ports[Math.min(5, i + 2)]
  return b.map((v, j) => 0.5 * ((2*v) + (-a[j]+c[j])*f + (2*a[j]-5*v+4*c[j]-d[j])*f*f + (-a[j]+3*v-3*c[j]+d[j])*f*f*f))
}

export class NetworkScene {
  constructor(canvas, preview = false) {
    this.canvas = canvas; this.ctx = canvas.getContext('2d', { alpha: false }); this.preview = preview
    this.hitAreas = []; this.resize()
  }
  resize() {
    this.w = this.canvas.clientWidth || 800; this.h = this.canvas.clientHeight || 600
    this.dpr = Math.min(window.devicePixelRatio || 1, 1.5)
    this.canvas.width = Math.round(this.w * this.dpr); this.canvas.height = Math.round(this.h * this.dpr)
  }
  project(p) {
    const v = sub(p, this.eye), depth = dot(v, this.forward)
    if (depth < 0.2) return null
    const scale = this.focal / depth
    return { x: this.cx + dot(v, this.right)*scale, y: this.cy - dot(v, this.up)*scale, depth, scale }
  }
  line(points, color, width = 1, glow = 0) {
    const ctx = this.ctx, projected = points.map(p => this.project(p))
    if (projected.some(p => !p)) return
    ctx.beginPath(); projected.forEach((p, i) => i ? ctx.lineTo(p.x, p.y) : ctx.moveTo(p.x, p.y))
    ctx.strokeStyle = color; ctx.lineWidth = width; ctx.shadowBlur = glow; ctx.shadowColor = color; ctx.stroke(); ctx.shadowBlur = 0
  }
  box(x, y, z, w, h, d, color = '#55cdec', lit = false) {
    const verts = [[-1,0,-1],[1,0,-1],[1,1,-1],[-1,1,-1],[-1,0,1],[1,0,1],[1,1,1],[-1,1,1]]
      .map(([a,b,c]) => [x+a*w/2, y+b*h, z+c*d/2])
    const faces = [[0,1,2,3],[4,7,6,5],[0,4,5,1],[3,2,6,7],[0,3,7,4],[1,5,6,2]]
    faces.forEach((ids, i) => {
      const ps = ids.map(id => this.project(verts[id])); if (ps.some(p => !p)) return
      this.faces.push({ ps, depth: ps.reduce((sum, p) => sum+p.depth, 0)/4,
        fill: lit ? ['#0a2532','#123b48','#07141f','#235364','#0a202c','#10303d'][i] : ['#080e18','#111e2b','#050a12','#21313e','#0b1520','#152532'][i], color, lit })
    })
  }
  hardware(stage, index, active) {
    const { x, z } = stage, c = active ? '#6ee5fa' : '#345667'
    this.box(x, -0.22, z, 5.9, 0.22, 4.8, active ? '#3cbac8' : '#183540')
    if (index === 0) {
      for (let j = 0; j < 3; j++) this.box(x+(j-1)*1.2, 0.5, z, 1.1, 1.5 + (j===1 ? 1.2 : 0), 1.8, c, active)
    } else if (index === 1) {
      for (let row = 0; row < 4; row++) for (let col = 0; col < 4; col++) {
        this.box(x-1.6+col*1.05+(row%2 ? 0.24 : 0), 0.2+row*0.73, z, 0.95, 0.64, 1.15, c, active && (row+col)%3===0)
      }
    } else if (index === 2 || index === 3) {
      this.box(x, 0.35, z, 4.9, 0.85, 2.8, c)
      const count = index === 3 ? 10 : 4
      for (let p = 0; p < count; p++) this.box(x-1.95+p*(3.9/(count-1)), 0.63, z+1.45, 0.28, 0.25, 0.1, c, active)
      for (let v = 0; v < 7; v++) this.box(x-1.25+v*0.4, 1.21, z-0.25, 0.1, 0.04, 1.5, '#243e4d')
      if (index === 2) { this.box(x-1.85, 1.15, z-1, 0.15, 2.1, 0.15, c); this.box(x+1.85, 1.15, z-1, 0.15, 2.1, 0.15, c) }
    } else if (index === 4) {
      this.box(x, 0, z, 3.0, 4.9, 2.8, c)
      for (let rack = 0; rack < 6; rack++) {
        this.box(x, 0.32+rack*0.73, z+1.45, 2.55, 0.55, 0.12, c)
        this.box(x-0.94, 0.55+rack*0.73, z+1.54, 0.1, 0.08, 0.04, active ? '#a6ffd0' : c, active)
        for (let vent = 0; vent < 5; vent++) this.box(x-0.3+vent*0.29, 0.45+rack*0.73, z+1.53, 0.06, 0.28, 0.02, '#36505c')
      }
    } else {
      this.box(x, 0, z, 2.6, 0.15, 1.3, c); this.box(x, 0.14, z, 0.3, 1.15, 0.32, c)
      this.box(x, 1.25, z, 4.4, 2.8, 0.25, c)
      this.box(x, 1.48, z+0.15, 3.96, 2.36, 0.025, c, active)
      this.box(x, 0.05, z+1.7, 3.5, 0.15, 1.2, c)
    }
    // A visible cable connects the conduit to the device's front port.
    this.cables.push({ points: [[x, 0.7, z+1.5], [x,0.7,z+2.8]], color: active ? '#69e5f5' : '#244450' })
  }
  draw(progress, seconds, pointer = { x: 0, y: 0 }, still = false) {
    if (!this.ctx) return
    const ctx = this.ctx, w = this.w, h = this.h, mobile = w < 650
    ctx.setTransform(this.dpr,0,0,this.dpr,0,0); ctx.fillStyle = '#060b13'; ctx.fillRect(0,0,w,h)
    const glow = ctx.createRadialGradient(w*.65,h*.52,0,w*.65,h*.52,w*.6)
    glow.addColorStop(0,'#0b2433'); glow.addColorStop(.55,'#09151f'); glow.addColorStop(1,'#060b13')
    ctx.fillStyle = glow; ctx.fillRect(0,0,w,h)
    const focus = route(progress), view = this.preview ? 1.22 : 1
    this.eye = [focus[0]+14*view+pointer.x*3, 12*view+pointer.y*1.5, focus[2]+24*view]
    const target = [focus[0]+(mobile ? 0 : 2), 1.2, focus[2]-1]
    this.forward = norm(sub(target, this.eye)); this.right = norm(cross(this.forward,[0,1,0])); this.up = cross(this.right,this.forward)
    this.focal = Math.min(w*(mobile ? 1.25 : .83), h*1.6)
    this.cx = w*(mobile || this.preview ? .5 : .63); this.cy = h*(mobile ? .52 : .56)
    for (let x = -40; x <= 40; x += 2) this.line([[x,-.28,-16],[x,-.28,22]], 'rgba(107,186,209,.065)')
    for (let z = -16; z <= 22; z += 2) this.line([[-40,-.28,z],[40,-.28,z]], 'rgba(107,186,209,.065)')
    const active = Math.min(5,Math.round(progress*5))
    const all = [], passed = []
    for (let i = 0; i <= 200; i++) { const point = route(i/200); all.push(point); if (i/200 <= progress) passed.push(point) }
    this.line(all, 'rgba(54,103,128,.23)', 13)
    this.line(all, '#173644', 2)
    // Conduit rings give the signal route physical depth.
    for (let i = 0; i <= 75; i++) {
      const point = route(i/75), ring = []
      for (let n = 0; n <= 16; n++) { const angle = n/16*Math.PI*2; ring.push([point[0],point[1]+Math.cos(angle)*.32,point[2]+Math.sin(angle)*.32]) }
      this.line(ring, i/75 <= progress ? 'rgba(89,216,230,.35)' : 'rgba(45,95,115,.26)', .8)
    }
    this.line(passed, '#66e9f8', 2.5, 12)
    this.faces = []; this.cables = []
    STAGES.forEach((stage, index) => this.hardware(stage,index,index===active))
    this.faces.sort((a,b) => b.depth-a.depth)
    for (const face of this.faces) {
      ctx.beginPath(); face.ps.forEach((p,i) => i ? ctx.lineTo(p.x,p.y) : ctx.moveTo(p.x,p.y)); ctx.closePath()
      ctx.fillStyle = face.fill; ctx.fill(); ctx.strokeStyle = face.color; ctx.globalAlpha = face.lit ? .85 : .6; ctx.lineWidth = .75; ctx.stroke(); ctx.globalAlpha = 1
    }
    this.cables.forEach(c => this.line(c.points,c.color,2))
    const packet = this.project(focus)
    if (packet) {
      const size = clamp(packet.scale*.20,4,10), radius = size*(2.7+(still ? 0 : Math.sin(seconds*2)*.25))
      const aura = ctx.createRadialGradient(packet.x,packet.y,0,packet.x,packet.y,radius*2)
      aura.addColorStop(0,'rgba(147,250,255,.65)'); aura.addColorStop(1,'rgba(71,215,242,0)')
      ctx.fillStyle = aura; ctx.beginPath(); ctx.arc(packet.x,packet.y,radius*2,0,Math.PI*2); ctx.fill()
      ctx.fillStyle = '#efffff'; ctx.shadowBlur = 18; ctx.shadowColor = '#62edff'
      ctx.beginPath(); ctx.moveTo(packet.x,packet.y-size); ctx.lineTo(packet.x+size,packet.y); ctx.lineTo(packet.x,packet.y+size); ctx.lineTo(packet.x-size,packet.y); ctx.closePath(); ctx.fill(); ctx.shadowBlur=0
    }
    // An ambient signal is illustrative, not a performance or security measurement.
    if (!still) for (let i = 0; i < 14; i++) {
      const point = this.project(route((seconds*.014+i/14)%1)); if (!point) continue
      ctx.fillStyle = 'rgba(166,238,253,.38)'; ctx.fillRect(point.x, point.y-1,2,2)
    }
    this.hitAreas = []
    STAGES.forEach((stage,index) => {
      const position = this.project([stage.x,index===4 ? 5.9 : 4.6,stage.z])
      if (!position || position.x < 45 || position.x > w-45 || position.y < 35 || position.y > h-100) return
      if (Math.abs(stage.x-focus[0]) > (mobile ? 12 : 18)) return
      ctx.font = `${index===active ? '500' : '400'} ${mobile ? 10 : 11}px monospace`
      ctx.textAlign = 'center'; ctx.fillStyle = index===active ? '#bbf5ff' : '#658a9e'
      ctx.fillText(`0${index+1} / ${stage.name.toUpperCase()}`,position.x,position.y)
      ctx.beginPath(); ctx.moveTo(position.x,position.y+8); ctx.lineTo(position.x,position.y+27); ctx.strokeStyle='#325b6c'; ctx.lineWidth=1; ctx.stroke()
      this.hitAreas.push({ index, x:position.x, y:position.y+65, radius:65 })
    })
    // Deliberate vignette leaves room for readable story copy.
    if (!this.preview && !mobile) {
      const mask=ctx.createLinearGradient(0,0,w*.5,0); mask.addColorStop(0,'rgba(6,11,19,.97)'); mask.addColorStop(.65,'rgba(6,11,19,.7)'); mask.addColorStop(1,'rgba(6,11,19,0)')
      ctx.fillStyle=mask;ctx.fillRect(0,0,w*.5,h)
    }
  }
}
export { clamp }
