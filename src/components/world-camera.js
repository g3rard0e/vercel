import { collectors } from './live-network.js'

export function worldProjection(width, height, scene) {
  const scale = Math.min(width / 390, height / 235) * scene.zoom
  const yaw = (scene.yaw ?? -.1) + (scene.parallaxX ?? 0)
  const pitch = (scene.pitch ?? .65) + (scene.parallaxY ?? 0) + (scene.manual ? 0 : (scene.scrollDepth ?? 0) * .08)
  return (lon, lat, altitude = 0) => {
    const x = lon * scale, y = -lat * scale * 1.12, z = altitude * scale
    const rx = x * Math.cos(yaw) - y * Math.sin(yaw)
    const ry = x * Math.sin(yaw) + y * Math.cos(yaw)
    const depth = ry * Math.sin(pitch) - z * Math.cos(pitch)
    const perspective = 1100 / Math.max(300, 1100 + depth)
    return [width * .5 + scene.x + rx * perspective, height * .53 + scene.y + (ry * Math.cos(pitch) - z * Math.sin(pitch)) * perspective]
  }
}

export function hitCollector(width, height, scene, x, y) {
  const project = worldProjection(width, height, scene)
  return collectors.map(c => { const p = project(c.lon, c.lat, 8); return { ...c, distance: Math.hypot(x - p[0], y - p[1]) } })
    .filter(c => c.distance < 24).sort((a, b) => a.distance - b.distance)[0] || null
}

export function collectorCamera(width, height, scene, id) {
  const collector = collectors.find(c => c.id === id)
  if (!collector) return { x: 0, y: 0, zoom: 1, yaw: -.1, pitch: .65 }
  const camera = { ...scene, x: 0, y: 0, zoom: 1.75, parallaxX: 0, parallaxY: 0 }
  const point = worldProjection(width, height, camera)(collector.lon, collector.lat, 8)
  return { zoom: camera.zoom, x: width * .5 - point[0], y: height * .46 - point[1] }
}
