import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function createJourney(canvas){
  let renderer
  try{renderer=new THREE.WebGLRenderer({canvas,antialias:true,alpha:true,powerPreference:'low-power'})}catch{return null}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=.9
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(35,1,.1,100),rig=new THREE.Group();world.add(rig)
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),environment=pmrem.fromScene(room,.04);world.environment=environment.texture;room.dispose();pmrem.dispose()
  const light=new THREE.DirectionalLight('#e0eaff',4);light.position.set(-4,8,6);world.add(light);world.add(new THREE.AmbientLight('#456d98',.5))
  const glow=new THREE.PointLight('#89d9ff',35,30);world.add(glow)
  const metal=new THREE.MeshStandardMaterial({color:'#697a99',metalness:.9,roughness:.3}),dark=new THREE.MeshStandardMaterial({color:'#101c30',metalness:.75,roughness:.3}),black=new THREE.MeshStandardMaterial({color:'#020712',roughness:.6}),cyan=new THREE.MeshBasicMaterial({color:'#7adfd0'}),amber=new THREE.MeshBasicMaterial({color:'#ffd2a1'})
  const box=(parent,w,h,d,material,x,y,z)=>{const m=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,Math.min(.06,h/4)),material);m.position.set(x,y,z);parent.add(m);return m}
  const ports=(parent,n,y=0)=>{for(let i=0;i<n;i++){const x=(i-(n-1)/2)*.3;box(parent,.25,.2,.04,metal,x,y,.61);box(parent,.19,.14,.05,black,x,y,.645);for(let j=0;j<8;j++)box(parent,.009,.033,.008,amber,x-.067+j*.019,y+.025,.675);box(parent,.014,.014,.02,cyan,x+.105,y+.14,.63)}}
  const nodes=Array.from({length:6},(_,i)=>{const g=new THREE.Group();g.position.set(i*4.8,0,i%2?-.35:.35);rig.add(g);return g})
  // Internet, then five tangible devices. All geometry is original artwork.
  const planet=new THREE.Mesh(new THREE.SphereGeometry(.65,48,32),new THREE.MeshPhysicalMaterial({color:'#467aa0',metalness:.6,roughness:.22,transparent:true,opacity:.8}));nodes[0].add(planet)
  for(let i=0;i<3;i++){const ring=new THREE.Mesh(new THREE.TorusGeometry(.78,.008,6,100),cyan);ring.rotation.set(i*.6,i*.8,0);nodes[0].add(ring)}
  box(nodes[1],1.65,1.3,1.15,dark,0,.35,0);box(nodes[1],1.7,.09,1.18,metal,0,1.01,0);ports(nodes[1],4,.05);for(let i=0;i<3;i++)box(nodes[1],1.28,.035,.025,amber,0,.55+i*.13,.59)
  for(let i=2;i<=3;i++){box(nodes[i],2,.38,1.18,dark,0,0,0);box(nodes[i],2.04,.04,1.2,metal,0,-.15,0);ports(nodes[i],6);for(let j=0;j<10;j++)box(nodes[i],.01,.006,.38,black,-.75+j*.16,.193,-.05)}
  for(const side of [-1,1]){const antenna=new THREE.Mesh(new THREE.CylinderGeometry(.03,.045,.9,12),dark);antenna.position.set(side*.82,.48,-.35);antenna.rotation.z=side*-.25;nodes[2].add(antenna)}
  for(let i=0;i<3;i++){box(nodes[4],1.8,.4,1.25,dark,0,i*.48,0);box(nodes[4],1.83,.035,1.28,metal,0,i*.48-.15,0);for(let j=0;j<5;j++)box(nodes[4],.22,.21,.04,metal,-.62+j*.3,i*.48,.65);box(nodes[4],.027,.027,.03,cyan,.72,i*.48+.13,.68)}
  box(nodes[5],1.9,1.25,.12,dark,0,.52,0);box(nodes[5],1.72,1.06,.025,new THREE.MeshPhysicalMaterial({color:'#246576',emissive:'#174c5d',emissiveIntensity:.5,metalness:.25,roughness:.15}),0,.54,.074);box(nodes[5],.12,.5,.14,metal,0,-.28,0);box(nodes[5],.8,.07,.5,metal,0,-.55,.1);box(nodes[5],1.3,.035,.4,dark,0,-.53,.6)
  const curves=[]
  for(let i=0;i<5;i++){const a=nodes[i].position,b=nodes[i+1].position;const curve=new THREE.CatmullRomCurve3([new THREE.Vector3(a.x,-.08,a.z+.68),new THREE.Vector3(a.x+.55,-.35,1.3),new THREE.Vector3(a.x+2.4,-.55,1.65),new THREE.Vector3(b.x-.55,-.35,1.3),new THREE.Vector3(b.x,-.08,b.z+.68)]);curves.push(curve);rig.add(new THREE.Mesh(new THREE.TubeGeometry(curve,100,.035,8,false),new THREE.MeshStandardMaterial({color:i%2?'#7978b8':'#42828d',roughness:.3,metalness:.35})))}
  const packet=new THREE.Mesh(new THREE.SphereGeometry(.075,16,12),new THREE.MeshBasicMaterial({color:'#fff0cc'}));rig.add(packet)
  const trailGeometry=new THREE.BufferGeometry(),trailPositions=new Float32Array(24*3);trailGeometry.setAttribute('position',new THREE.BufferAttribute(trailPositions,3));const trail=new THREE.Line(trailGeometry,new THREE.LineBasicMaterial({color:'#ffe6ae',transparent:true,opacity:.65}));rig.add(trail)
  let lastW=0,lastH=0
  const render=(progress,seconds,pointer,still)=>{
    const w=canvas.clientWidth,h=canvas.clientHeight;if(!w||!h)return
    if(w!==lastW||h!==lastH){renderer.setSize(w,h,false);camera.aspect=w/h;camera.updateProjectionMatrix();lastW=w;lastH=h}
    const mobile=w<650,focus=progress*24,offset=mobile?0:2.6
    camera.position.set(focus-offset+(still?0:pointer.x*.25),mobile?4.4:3.2,mobile?11.5:9.8);camera.lookAt(focus-offset,.05,0)
    camera.setViewOffset(w,h,0,mobile?-h*.08:0,w,h)
    glow.position.set(focus,2,3);rig.position.y=mobile?-.65:0
    nodes.forEach((g,i)=>{g.rotation.y=.12+(!still?Math.sin(seconds*.3+i)*.015:0);g.scale.setScalar(1-Math.min(.15,Math.abs(i-progress*5)*.035))})
    const route=Math.min(4.99999,progress*5),index=Math.floor(route),t=route-index;packet.position.copy(curves[index].getPoint(t))
    for(let j=0;j<24;j++){const sample=Math.max(0,route-j*.009),k=Math.min(4,Math.floor(sample));curves[k].getPoint(sample-k).toArray(trailPositions,j*3)}trailGeometry.attributes.position.needsUpdate=true
    renderer.render(world,camera)
  }
  const lost=()=>{controller.ready=false};canvas.addEventListener('webglcontextlost',lost)
  const controller={ready:true,render,dispose(){canvas.removeEventListener('webglcontextlost',lost);world.traverse(o=>{o.geometry?.dispose();o.material?.dispose()});environment.dispose();renderer.dispose()}}
  return controller
}
