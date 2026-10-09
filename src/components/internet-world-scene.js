import { collectors } from './live-network'
import { worldProjection } from './world-camera'
// Original low-detail geographic illustration. All links are schematic.
export const continents = [
  [[-168,65],[-140,71],[-123,61],[-110,69],[-90,73],[-60,53],[-55,46],[-80,25],[-88,15],[-105,23],[-117,32],[-130,52],[-168,65]],
  [[-73,60],[-52,60],[-20,75],[-42,83],[-65,80]],
  [[-82,12],[-67,10],[-50,1],[-35,-6],[-45,-23],[-62,-55],[-75,-45],[-81,-5]],
  [[-10,36],[-9,51],[9,54],[5,71],[30,71],[44,54],[28,42],[14,36]],
  [[-18,32],[10,37],[34,31],[43,12],[51,10],[36,-12],[24,-35],[14,-30],[8,-6],[-16,13]],
  [[28,42],[44,54],[32,71],[70,77],[120,71],[170,58],[145,45],[130,31],[105,12],[98,2],[79,8],[69,26],[45,29]],
  [[112,-12],[135,-11],[153,-23],[146,-39],[115,-35]],
  [[95,5],[120,1],[141,-9],[129,-9],[104,-6]], [[46,-13],[50,-15],[46,-26],[43,-23]], [[166,-35],[178,-40],[170,-47]],
]
export const hubs = [...collectors, ...[
  [-122,37,'West coast'],[-80,26,'Miami'],[-99,19,'Mexico'],[-70,-33,'Santiago'],[-77,-12,'Lima'],[-58,-34,'Buenos Aires'],
  [2,49,'Paris'],[8,50,'Frankfurt'],[18,59,'Stockholm'],[-9,39,'Lisbon'],[37,56,'Moscow'],[31,30,'Cairo'],[3,7,'Lagos'],[37,-1,'Nairobi'],[55,25,'Dubai'],[73,19,'Mumbai'],[77,29,'Delhi'],[104,1,'Singapore'],[114,22,'Hong Kong'],[121,31,'Shanghai'],[127,37,'Seoul'],[151,-34,'Sydney'],[115,-32,'Perth'],[174,-37,'Auckland'],[-21,64,'Reykjavik'],[-123,49,'Vancouver'],[-79,44,'Toronto'],[-74,5,'Bogotá']
].map(([lon,lat,name]) => ({lon,lat,name}))]
export const links = hubs.flatMap((n,i) => [1,3,7].filter(step => i + step < hubs.length).map(step => [i,i+step]))
export const countryCenters = {US:[-98,39],GB:[-2,54],NL:[5,52],DE:[10,51],FR:[2,47],BR:[-52,-10],JP:[138,37],ZA:[25,-29],CN:[104,35],IN:[79,22],RU:[100,60],CA:[-105,56],AU:[134,-25],SG:[104,1],HK:[114,22],KR:[128,36],ID:[118,-3],TR:[35,39],VN:[106,16],IR:[54,32],UA:[32,49],PL:[19,52],IT:[12,43],ES:[-4,40],MX:[-102,24],AR:[-64,-35],CL:[-71,-33],CO:[-74,4],TH:[101,15],PK:[69,30],BD:[90,24],TW:[121,24],SE:[16,62],NO:[9,61],FI:[26,64],CH:[8,47],IE:[-8,53],AE:[54,24],SA:[45,24],EG:[30,27],NG:[8,10],KE:[38,0],IL:[35,31],RO:[25,46],CZ:[15,50],PT:[-8,40],BE:[4,51],AT:[14,48],PH:[122,12],MY:[102,4],NZ:[173,-41]}
const stars = Array.from({ length: 95 }, (_, i) => ({ x: ((i * 127.73) % 997) / 997, y: ((i * 61.19) % 991) / 991, alpha: .12 + (i % 5) * .04 }))
const fiberColors = ['#5debd6', '#9890ff', '#62aedc']

export function drawWorld(ctx, w, h, scene, still) {
  ctx.clearRect(0, 0, w, h)
  const project = worldProjection(w, h, scene)
  const gradient = ctx.createRadialGradient(w * .5, h * .48, 0, w * .5, h * .48, w * .75)
  gradient.addColorStop(0, '#142d43'); gradient.addColorStop(.55, '#091827'); gradient.addColorStop(1, '#030914')
  ctx.fillStyle = gradient; ctx.fillRect(0, 0, w, h)
  for (const star of stars) { ctx.fillStyle = `rgba(146,176,213,${star.alpha})`; ctx.fillRect(star.x * w, star.y * h, 1, 1) }
  const line = (points, color, width = 1) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.strokeStyle = color; ctx.lineWidth = width; ctx.stroke()
  }
  const polygon = (points, fill, stroke) => {
    ctx.beginPath(); points.forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.fillStyle = fill; ctx.fill()
    if (stroke) { ctx.strokeStyle = stroke; ctx.lineWidth = 1; ctx.stroke() }
  }
  // Perspective lattice suspended above a shadow plane.
  const corners = [[-180, -63], [180, -63], [180, 85], [-180, 85]]
  polygon(corners.map(p => project(...p, -8)), '#040d18', '#172d41')
  polygon(corners.map(p => project(...p, -2)), '#0b1d2a88', '#335066')
  for (let lon = -180; lon <= 180; lon += 12) line([project(lon, -63), project(lon, 85)], '#31486144', .6)
  for (let lat = -60; lat <= 80; lat += 12) line([project(-180, lat), project(180, lat)], '#31486144', .6)
  continents.forEach((land, index) => {
    polygon(land.map(p => project(...p, -1)), '#102535', '#244155')
    polygon(land.map(p => project(...p, 2)), index % 2 ? '#194750' : '#1a384d', '#50858b')
    // Small surface circuit traces, clipped to each continent.
    ctx.save(); ctx.beginPath(); land.map(p => project(...p, 2.2)).forEach((p, i) => i ? ctx.lineTo(...p) : ctx.moveTo(...p)); ctx.closePath(); ctx.clip()
    for (let lon = -165; lon < 170; lon += 10) line([project(lon, -60, 2.3), project(lon, 80, 2.3)], '#8fcfc118', .8)
    for (let lat = -50; lat < 80; lat += 10) line([project(-170, lat, 2.3), project(170, lat, 2.3)], '#8fcfc118', .8)
    ctx.restore()
  })
  // Project lifted fibers in world space; geographical routes remain illustrative.
  links.forEach(([i, j], index) => {
    const a = hubs[i], b = hubs[j], distance = Math.hypot(a.lon - b.lon, a.lat - b.lat)
    const lift = Math.min(43, 8 + distance * .13)
    const at = t => project(a.lon + (b.lon - a.lon) * t, a.lat + (b.lat - a.lat) * t, 7 + Math.sin(Math.PI * t) * lift)
    const points = Array.from({ length: 25 }, (_, k) => at(k / 24))
    const active = scene.selected === 'all' || a.id === scene.selected || b.id === scene.selected
    ctx.globalAlpha = active ? .75 : .14
    line(points.map(p => [p[0], p[1] + 3]), '#02070c', 4)
    line(points, '#123046', 3.5); line(points, fiberColors[index % 3], active ? 1.25 : .7)
    if (scene.illustrative && active) {
      const t = still ? .45 : (scene.time / (6000 + index % 5 * 700) + index * .137) % 1
      for (let trail = 5; trail >= 0; trail--) {
        const point = at(Math.max(0, t - trail * .009))
        ctx.globalAlpha = (.8 - trail * .12) * (active ? 1 : .2); ctx.fillStyle = '#ffca83'; ctx.fillRect(point[0] - 1.5, point[1] - 1.5, 3, 3)
      }
      const point = at(t); ctx.shadowColor = '#ffbd73'; ctx.shadowBlur = 9; ctx.fillStyle = '#ffe9bb'; ctx.fillRect(point[0] - 1.5, point[1] - 1.5, 3, 3); ctx.shadowBlur = 0
    }
    ctx.globalAlpha = 1
  })
  const now = Date.now()
  // Isometric router and server towers with status LEDs.
  hubs.forEach((node, i) => {
    const tall = i < 6 ? 8 : 6, base = project(node.lon, node.lat, 2), top = project(node.lon, node.lat, tall)
    ctx.globalAlpha = scene.selected === 'all' || node.id === scene.selected || node.id === scene.hovered ? 1 : .4
    const size = i < 6 ? 6 : 3.5
    polygon([[base[0]-size,base[1]], [base[0],base[1]+size*.5], [base[0],top[1]+size*.5], [top[0]-size,top[1]]], '#15394c', '#3b7183')
    polygon([[base[0],base[1]+size*.5], [base[0]+size,base[1]], [top[0]+size,top[1]], [top[0],top[1]+size*.5]], '#091f34', '#3b7183')
    polygon([[top[0]-size,top[1]], [top[0],top[1]-size*.5], [top[0]+size,top[1]], [top[0],top[1]+size*.5]], '#326f80', '#77b4b7')
    ctx.shadowColor = i < 6 ? '#69ffe0' : '#8c93ff'; ctx.shadowBlur = i < 6 ? 12 : 0; ctx.fillStyle = i < 6 ? '#94ffe4' : '#b2adff'; ctx.fillRect(top[0]-1.5,top[1]-1.5,3,3); ctx.shadowBlur = 0
    if (i < 6) {
      const selected = node.id === scene.selected || node.id === scene.hovered
      const labelX = top[0] + (i === 1 ? -80 : 12), labelY = top[1] + (i === 1 ? 19 : -18)
      line([top, [labelX + (i === 1 ? 60 : 0), labelY + 3]], selected ? '#ffd196' : '#5b9d9a88', .8)
      ctx.font = '10px monospace'; ctx.fillStyle = selected ? '#ffe0b0' : '#a0d6ce'; ctx.fillText(node.name.toUpperCase(), labelX, labelY)
      if (selected) { ctx.strokeStyle = '#ffcc87'; ctx.lineWidth = 1.5; ctx.strokeRect(top[0]-10,top[1]-10,20,20) }
    }
    ctx.globalAlpha = 1
  })
  // Only genuine accepted observations generate teal rings.
  const latest = new Map()
  scene.pulses.forEach(p => { if (now-p.created<4500) latest.set(p.host,p) })
  for (const p of latest.values()) {
    if (scene.selected !== 'all' && p.host !== scene.selected) continue
    const collector = collectors.find(n => n.id === p.host); if (!collector) continue
    const progress = still ? .35 : Math.min(1,(now-p.created)/4500), position = project(collector.lon,collector.lat,8)
    ctx.beginPath(); ctx.ellipse(...position,12+progress*25,(12+progress*25)*.55,0,0,Math.PI*2)
    ctx.strokeStyle = `rgba(107,255,216,${.9-progress*.65})`; ctx.lineWidth = 1.6; ctx.stroke()
    ctx.shadowColor = '#66ffd9'; ctx.shadowBlur = 13; ctx.fillStyle = '#aaffeb'; ctx.fillRect(position[0]-2,position[1]-2,4,4); ctx.shadowBlur = 0
  }
  scene.attacks.forEach(a => {
    const center = countryCenters[a.code]; if (!center) return
    const point = project(...center,10); ctx.beginPath(); ctx.arc(...point,5+Math.sqrt(a.share),0,Math.PI*2)
    ctx.fillStyle = '#ff685238'; ctx.fill(); ctx.strokeStyle = '#ff6852'; ctx.stroke(); ctx.fillStyle = '#ffb7ab'; ctx.font = '11px monospace'; ctx.fillText(`${a.code} ${a.share.toFixed(1)}%`,point[0]+10,point[1])
  })
}
