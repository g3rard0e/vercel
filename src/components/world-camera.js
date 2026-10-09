import { collectors } from './live-network.js'

export function globeProjection(width, height, scene) {
  const radius = Math.min(width * .39, height * .35) * scene.zoom
  const yaw = (scene.yaw || 0) + (scene.parallaxX || 0), pitch = (scene.pitch || 0) + (scene.parallaxY || 0)
  return (lon, lat, altitude = 0) => {
    const longitude = lon * Math.PI / 180 + yaw, latitude = lat * Math.PI / 180
    const x = Math.cos(latitude) * Math.sin(longitude), y = -Math.sin(latitude), z = Math.cos(latitude) * Math.cos(longitude)
    const ry = y * Math.cos(pitch) - z * Math.sin(pitch), rz = y * Math.sin(pitch) + z * Math.cos(pitch)
    const distance = radius * (1 + altitude / 100)
    return [width * .5 + scene.x + x * distance, height * .5 + scene.y + ry * distance, rz]
  }
}


export function worldProjection(width, height, scene) {
  if (scene.globe) { const project = globeProjection(width, height, scene); return (...point) => project(...point).slice(0, 2) }
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
  const project = scene.globe ? globeProjection(width, height, scene) : worldProjection(width, height, scene)
  return collectors.filter(c => !scene.globe || project(c.lon,c.lat,2)[2] > .05).map(c => { const p = project(c.lon, c.lat, scene.globe ? 2 : 8); return { ...c, distance: Math.hypot(x - p[0], y - p[1]) } })
    .filter(c => c.distance < 24).sort((a, b) => a.distance - b.distance)[0] || null
}

export function collectorCamera(width, height, scene, id) {
  const collector = collectors.find(c => c.id === id)
  if (!collector) return { x: 0, y: 0, zoom: 1, yaw: scene.globe ? -.3 : -.1, pitch: scene.globe ? -.25 : .65 }
  if (scene.globe) {
    const target = -collector.lon * Math.PI / 180
    const delta = Math.atan2(Math.sin(target-scene.yaw),Math.cos(target-scene.yaw))
    return { x: 0, y: -height * .04, zoom: 1.35, yaw: scene.yaw + delta, pitch: -collector.lat * Math.PI / 180 }
  }
  const camera = { ...scene, x: 0, y: 0, zoom: 1.75, parallaxX: 0, parallaxY: 0 }
  const point = worldProjection(width, height, camera)(collector.lon, collector.lat, 8)
  return { zoom: camera.zoom, x: width * .5 - point[0], y: height * .46 - point[1] }
}
