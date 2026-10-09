import test from 'node:test'
import assert from 'node:assert/strict'
import { collectors } from '../src/components/live-network.js'
import { worldProjection, hitCollector, collectorCamera } from '../src/components/world-camera.js'

test('collector picking tracks projection across mobile, desktop and camera views', () => {
  for (const [width,height] of [[390,420],[1400,900]]) for (const pitch of [0,.65]) {
    const scene={x:35,y:-20,zoom:1.75,pitch,yaw:-.1,manual:true}
    const project=worldProjection(width,height,scene)
    for(const c of collectors) {
      const [x,y]=project(c.lon,c.lat,8)
      assert.ok(Number.isFinite(x)&&Number.isFinite(y))
      assert.equal(hitCollector(width,height,scene,x,y)?.id,c.id)
    }
    assert.equal(hitCollector(width,height,scene,-10000,-10000),null)
  }
})
test('camera flights center every collector and reset an unknown selection', () => {
  for(const [width,height] of [[390,420],[1400,900]]) for(const pitch of [0,.65]) for(const c of collectors) {
    const scene={x:0,y:0,zoom:1,pitch,yaw:-.1,manual:true}
    const camera=collectorCamera(width,height,scene,c.id)
    const [x,y]=worldProjection(width,height,{...scene,...camera})(c.lon,c.lat,8)
    assert.ok(Math.abs(x-width*.5)<1e-9)
    assert.ok(Math.abs(y-height*.46)<1e-9)
  }
  assert.deepEqual(collectorCamera(390,420,{},'all'),{x:0,y:0,zoom:1,yaw:-.1,pitch:.65})
})

test('globe hides rear collectors from picking and flights reveal each selected city',()=>{
  for(const [width,height] of [[390,420],[1400,900]]) {
    const scene={x:0,y:0,zoom:1,yaw:-.3,pitch:-.25,globe:true}
    const project=worldProjection(width,height,scene)
    const tokyo=collectors.find(c=>c.id==='rrc06'),rear=project(tokyo.lon,tokyo.lat,2)
    assert.notEqual(hitCollector(width,height,scene,...rear)?.id,tokyo.id)
    for(const c of collectors){
      const camera={...scene,...collectorCamera(width,height,scene,c.id)}
      const [x,y]=worldProjection(width,height,camera)(c.lon,c.lat,2)
      assert.ok(Math.abs(x-width*.5)<1e-8)
      assert.ok(Math.abs(y-height*.46)<1e-8)
      assert.equal(hitCollector(width,height,camera,x,y)?.id,c.id)
    }
  }
})
