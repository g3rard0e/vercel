import test from 'node:test'
import assert from 'node:assert/strict'
import { Vector3, Euler } from 'three'
import { globeProjection, collectorCamera } from '../src/components/world-camera.js'
import { collectors } from '../src/components/live-network.js'

for (const [width,height] of [[390,592],[1638,1244]]) test(`WebGL collector geometry matches accessible picking at ${width}px`,()=>{
  for (const collector of collectors) {
    const state={globe:true,x:17,y:-9,zoom:1.2,yaw:.7,pitch:-.4,parallaxX:.02,parallaxY:-.015}
    const radius=Math.min(width*.39,height*.35)*state.zoom
    const lon=collector.lon*Math.PI/180,lat=collector.lat*Math.PI/180
    const vector=new Vector3(Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)).applyEuler(new Euler(-(state.pitch+state.parallaxY),state.yaw+state.parallaxX,0,'XYZ')).multiplyScalar(1.02)
    const expected=globeProjection(width,height,state)(collector.lon,collector.lat,2)
    assert.ok(Math.abs(width*.5+state.x+vector.x*radius-expected[0])<1e-8)
    assert.ok(Math.abs(height*.5+state.y-vector.y*radius-expected[1])<1e-8)
    const destination={...state,...collectorCamera(width,height,state,collector.id),parallaxX:0,parallaxY:0}
    const target=globeProjection(width,height,destination)(collector.lon,collector.lat,2)
    assert.ok(Math.abs(target[0]-width*.5)<1e-8)
    assert.ok(Math.abs(target[1]-height*.46)<1e-8)
    assert.ok(target[2]>.99)
  }
})
