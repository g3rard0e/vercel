import * as THREE from 'three'
import { collectors } from './live-network.js'
import { globeProjection } from './world-camera.js'
import { countryCenters } from './internet-world-scene.js'

const position = (lon, lat, radius = 1) => new THREE.Vector3(Math.cos(lat*Math.PI/180)*Math.sin(lon*Math.PI/180), Math.sin(lat*Math.PI/180), Math.cos(lat*Math.PI/180)*Math.cos(lon*Math.PI/180)).multiplyScalar(radius)
// Art-directed connections, not claims about submarine cables or actual packet paths.
const sites = [...collectors, {lon:-122,lat:37}, {lon:55,lat:25}, {lon:104,lat:1}, {lon:151,lat:-34}, {lon:-80,lat:26}, {lon:8,lat:50}]
const pairs = [[0,3],[1,3],[0,2],[0,4],[0,5],[3,6],[3,10],[4,10],[5,7],[7,8],[2,8],[8,9],[6,2],[0,11],[11,7],[4,5]]
export function createGlobe(canvas) {
  let renderer
  try { renderer = new THREE.WebGLRenderer({canvas, antialias:true, alpha:true, powerPreference:'low-power'}) } catch { return null }
  renderer.setPixelRatio(Math.min(devicePixelRatio || 1, 1.75))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping; renderer.toneMappingExposure = .9
  const world = new THREE.Scene(), group = new THREE.Group(), camera = new THREE.OrthographicCamera(-2,2,2,-2,.1,20)
  world.add(group); camera.position.z = 5
  const sun = new THREE.DirectionalLight('#deefff',3.2); sun.position.set(-3,2,4); world.add(sun)
  const fill = new THREE.DirectionalLight('#467cb8',.35); fill.position.set(3,-1,-1); world.add(fill)
  world.add(new THREE.AmbientLight('#7893b0',.15))
  const material = new THREE.MeshStandardMaterial({color:'#bbcbd8',roughness:.85,metalness:.08,normalScale:new THREE.Vector2(.7,.7),emissive:'#ffc36b',emissiveIntensity:.8})
  const earth = new THREE.Mesh(new THREE.SphereGeometry(1,96,64),material); earth.rotation.y=-Math.PI/2; group.add(earth)
  const atmosphere = new THREE.Mesh(new THREE.SphereGeometry(1.015,64,48),new THREE.ShaderMaterial({transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,vertexShader:'varying vec3 n; varying vec3 v; void main(){ vec4 p=modelViewMatrix*vec4(position,1.); n=normalize(normalMatrix*normal); v=normalize(-p.xyz); gl_Position=projectionMatrix*p; }',fragmentShader:'varying vec3 n; varying vec3 v; void main(){float rim=pow(1.-max(0.,dot(normalize(n),normalize(v))),4.); gl_FragColor=vec4(.12,.48,.85,rim*.4); }'})); group.add(atmosphere)
  const cables = pairs.map(([a,b],i) => {
    const from=position(sites[a].lon,sites[a].lat),to=position(sites[b].lon,sites[b].lat),angle=from.angleTo(to)
    const points=Array.from({length:49},(_,j)=>{const t=j/48,p=from.clone().multiplyScalar(Math.sin((1-t)*angle)).addScaledVector(to,Math.sin(t*angle)).divideScalar(Math.sin(angle));return p.multiplyScalar(1.008+Math.sin(t*Math.PI)*(.12+i%3*.035))})
    const curve=new THREE.CatmullRomCurve3(points),color=['#81bdce','#bab0d5','#90cabb'][i%3]
    const tube=new THREE.Mesh(new THREE.TubeGeometry(curve,96,.0015,5,false),new THREE.MeshBasicMaterial({color,transparent:true,opacity:.65}));group.add(tube)
    const head=new THREE.Mesh(new THREE.SphereGeometry(.005,8,6),new THREE.MeshBasicMaterial({color:'#ffe0a2'}));group.add(head)
    const geometry=new THREE.BufferGeometry(),positions=new Float32Array(24*3),colors=new Float32Array(24*3)
    for(let j=0;j<24;j++){colors[j*3]=1;colors[j*3+1]=.75;colors[j*3+2]=.3}
    geometry.setAttribute('position',new THREE.BufferAttribute(positions,3));geometry.setAttribute('color',new THREE.BufferAttribute(colors,3))
    const trail=new THREE.Line(geometry,new THREE.LineBasicMaterial({vertexColors:true,transparent:true,opacity:.65}));group.add(trail)
    return {curve,head,trail,positions,colors,index:i}
  })
  const marks=collectors.map(c=>{const m=new THREE.Mesh(new THREE.SphereGeometry(.008,12,8),new THREE.MeshBasicMaterial({color:'#70f5d6'}));m.position.copy(position(c.lon,c.lat,1.02));group.add(m);return {c,m}})
  const textures=[],controller={ready:false,render,dispose};let disposed=false,loaded=0,lastW=0,lastH=0
  const loader=new THREE.TextureLoader()
  for(const [field,file] of [['map','earth_day_4096.jpg'],['normalMap','earth_normal_2048.jpg'],['emissiveMap','earth_night_4096.jpg']]) loader.load(`/textures/${file}`,texture=>{if(disposed){texture.dispose();return}textures.push(texture);if(field!=='normalMap')texture.colorSpace=THREE.SRGBColorSpace;texture.anisotropy=Math.min(4,renderer.capabilities.getMaxAnisotropy());material[field]=texture;material.needsUpdate=true;if(++loaded===3)controller.ready=true},undefined,()=>{controller.ready=false})
  const lost=e=>{e.preventDefault();controller.ready=false};canvas.addEventListener('webglcontextlost',lost)
  function render(w,h,s,still){
    if(disposed||!w||!h)return
    if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);lastW=w;lastH=h}
    const radius=Math.min(w*.39,h*.35)*s.zoom
    camera.left=-w/(2*radius);camera.right=w/(2*radius);camera.top=h/(2*radius);camera.bottom=-h/(2*radius);camera.updateProjectionMatrix()
    group.position.set(s.x/radius,-s.y/radius,0);group.rotation.set(-(s.pitch+s.parallaxY),s.yaw+s.parallaxX,0,'XYZ')
    cables.forEach(c=>{c.head.visible=c.trail.visible=s.illustrative;const t=still?.42:((s.time/(9000+c.index*330)+c.index*.137)%1);c.head.position.copy(c.curve.getPoint(t));for(let j=0;j<24;j++){const p=c.curve.getPoint(Math.max(0,t-j*.002));p.toArray(c.positions,j*3);const fade=1-j/24;c.colors[j*3]=fade;c.colors[j*3+1]=fade*.75;c.colors[j*3+2]=fade*.3}c.trail.geometry.attributes.position.needsUpdate=true;c.trail.geometry.attributes.color.needsUpdate=true})
    marks.forEach(({c,m})=>m.material.color.set(c.id===s.selected||c.id===s.hovered?'#ffd493':'#70f5d6'))
    renderer.render(world,camera)
  }
  function dispose(){disposed=true;canvas.removeEventListener('webglcontextlost',lost);world.traverse(o=>{o.geometry?.dispose();if(o.material){for(const m of Array.isArray(o.material)?o.material:[o.material])m.dispose()}});textures.forEach(t=>t.dispose());renderer.dispose()}
  return controller
}
export function drawGlobeOverlay(ctx,w,h,s,still){
  ctx.clearRect(0,0,w,h);const project=globeProjection(w,h,s),now=Date.now()
  collectors.forEach(c=>{const p=project(c.lon,c.lat,2);if(p[2]<.12)return;const selected=c.id===s.selected||c.id===s.hovered,pulse=s.pulses.findLast(x=>x.host===c.id&&now-x.created<4500)
    if(pulse&&(s.selected==='all'||c.id===s.selected)){const t=still?.35:(now-pulse.created)/4500;ctx.strokeStyle=`rgba(112,245,214,${1-t})`;ctx.lineWidth=1.5;ctx.beginPath();ctx.arc(p[0],p[1],8+t*25,0,Math.PI*2);ctx.stroke()}
    ctx.font=`${selected?'600 ':''}10px monospace`;ctx.fillStyle=selected?'#ffdaac':'#c4dbdf';ctx.shadowColor='#020713';ctx.shadowBlur=5;const dx=c.id==='rrc01'?-75:12,dy=c.id==='rrc01'?21:-15;ctx.fillText(c.name.toUpperCase(),p[0]+dx,p[1]+dy);ctx.shadowBlur=0
  })
  s.attacks.forEach(a=>{const location=countryCenters[a.code];if(!location)return;const p=project(...location,3);if(p[2]<.05)return;ctx.fillStyle='#ff765f';ctx.beginPath();ctx.arc(p[0],p[1],3+Math.sqrt(a.share),0,Math.PI*2);ctx.fill()})
}
