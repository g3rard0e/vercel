import * as THREE from 'three'
import { RoundedBoxGeometry } from 'three/addons/geometries/RoundedBoxGeometry.js'
import { RoomEnvironment } from 'three/addons/environments/RoomEnvironment.js'

export function mountNetworkCore(host) {
  const canvas=document.createElement('canvas');canvas.setAttribute('aria-hidden','true');host.append(canvas)
  let renderer
  try{renderer=new THREE.WebGLRenderer({canvas,alpha:true,antialias:true,powerPreference:'low-power'})}catch{canvas.remove();return()=>{}}
  renderer.setPixelRatio(Math.min(devicePixelRatio||1,1.5));renderer.outputColorSpace=THREE.SRGBColorSpace;renderer.toneMapping=THREE.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15
  const world=new THREE.Scene(),camera=new THREE.PerspectiveCamera(32,1,.1,30);camera.position.set(0,2.3,5.8);camera.lookAt(0,0,0)
  const pmrem=new THREE.PMREMGenerator(renderer),room=new RoomEnvironment(),env=pmrem.fromScene(room,.04);world.environment=env.texture;room.dispose();pmrem.dispose()
  world.add(new THREE.AmbientLight('#c5cfff',1));const key=new THREE.DirectionalLight('#ffffff',4);key.position.set(-3,5,4);world.add(key)
  const blue=new THREE.PointLight('#66d9ff',18,10);blue.position.set(2,1,2);world.add(blue)
  const core=new THREE.Group();world.add(core)
  const graphite=new THREE.MeshStandardMaterial({color:'#202e47',metalness:.85,roughness:.28}),metal=new THREE.MeshStandardMaterial({color:'#9facc3',metalness:.9,roughness:.25}),black=new THREE.MeshStandardMaterial({color:'#040911',roughness:.55}),gold=new THREE.MeshStandardMaterial({color:'#dfb36d',metalness:.85,roughness:.3})
  const box=(w,h,d,mat,x,y,z,round=.035)=>{const mesh=new THREE.Mesh(new RoundedBoxGeometry(w,h,d,3,round),mat);mesh.position.set(x,y,z);core.add(mesh);return mesh}
  box(2.4,.4,1.18,graphite,0,0,0,.075);box(2.45,.045,1.2,metal,0,-.16,0,.018)
  // A physical six-port switch: recessed RJ45 sockets, contacts and status LEDs.
  for(let i=0;i<6;i++){const x=-.92+i*.365;box(.29,.23,.035,metal,x,-.015,.61,.015);box(.235,.17,.04,black,x,-.015,.637,.008);for(let k=0;k<8;k++)box(.012,.046,.008,gold,x-.084+k*.024,.033,.662,.002);box(.017,.017,.018,new THREE.MeshBasicMaterial({color:i%2?'#67ecb9':'#fbc16b'}),x+.115,.14,.63,.005)}
  for(let i=0;i<12;i++)box(.008,.005,.42,black,-.88+i*.16,.204,-.12,.002)
  const labelCanvas=document.createElement('canvas');labelCanvas.width=512;labelCanvas.height=128;const ctx=labelCanvas.getContext('2d');ctx.fillStyle='#dbe3f3';ctx.font='500 60px sans-serif';ctx.textAlign='center';ctx.fillText('GEAMY',256,83);const labelTexture=new THREE.CanvasTexture(labelCanvas);labelTexture.colorSpace=THREE.SRGBColorSpace;const label=new THREE.Mesh(new THREE.PlaneGeometry(.72,.18),new THREE.MeshBasicMaterial({map:labelTexture,transparent:true}));label.rotation.x=-Math.PI/2;label.position.set(.45,.208,.25);core.add(label)
  const curves=[[-.92,'#7779d9',-1],[.175,'#49b7bb',1],[.905,'#dfb978',1]].map(([x,color,side],i)=>{
    const points=[new THREE.Vector3(x,0,.68),new THREE.Vector3(x,-.02,1.15),new THREE.Vector3(side*(1.1+i*.25),-.33,1.55),new THREE.Vector3(side*(1.72+i*.13),-.42,.25),new THREE.Vector3(side*(1.85+i*.15),.16,-.82),new THREE.Vector3(side*.8,.45,-1.1)]
    const curve=new THREE.CatmullRomCurve3(points);core.add(new THREE.Mesh(new THREE.TubeGeometry(curve,120,.047,10,false),new THREE.MeshStandardMaterial({color,metalness:.2,roughness:.32})));box(.19,.15,.25,new THREE.MeshPhysicalMaterial({color:'#b6c9d6',metalness:.1,roughness:.15,transparent:true,opacity:.75}),x,0,.8,.015)
    const packet=new THREE.Mesh(new THREE.SphereGeometry(.06,12,8),new THREE.MeshBasicMaterial({color:'#e9ffff'}));core.add(packet);return {curve,packet,index:i}
  })
  let alive=true,visible=false,frame=0,last=0,time=0,px=0,py=0,tx=0,ty=0;const media=matchMedia('(prefers-reduced-motion: reduce)'),events=new AbortController()
  const lost=()=>{alive=false;cancelAnimationFrame(frame);canvas.remove()};canvas.addEventListener('webglcontextlost',lost)
  const paint=t=>{if(!alive||!visible||document.hidden)return;frame=requestAnimationFrame(paint);if(t-last<32)return;const frozen=media.matches||document.documentElement.dataset.motion==='off',dt=Math.min(t-last,50);last=t;if(!frozen)time+=dt;px+=(frozen?0:tx-px)*.08;py+=(frozen?0:ty-py)*.08;core.rotation.set(.13+py,.3+px,0);core.position.y=frozen?0:Math.sin(time/1900)*.035;curves.forEach(c=>c.packet.position.copy(c.curve.getPoint(frozen?.45:(time/(4400+c.index*600)+c.index*.3)%1)));renderer.render(world,camera)}
  const resize=()=>{const r=host.getBoundingClientRect();if(!r.width||!r.height)return;renderer.setSize(r.width,r.height,false);camera.aspect=r.width/r.height;camera.updateProjectionMatrix();renderer.render(world,camera)}
  const ro=new ResizeObserver(resize);ro.observe(host);const io=new IntersectionObserver(([e])=>{visible=e.isIntersecting;cancelAnimationFrame(frame);if(visible){last=performance.now();frame=requestAnimationFrame(paint)}});io.observe(host)
  host.parentElement.addEventListener('pointermove',e=>{if(e.pointerType==='touch')return;const r=host.getBoundingClientRect();tx=(e.clientX-r.left-r.width/2)/r.width*.3;ty=(e.clientY-r.top-r.height/2)/r.height*.15},{signal:events.signal,passive:true});host.parentElement.addEventListener('pointerleave',()=>{tx=ty=0},{signal:events.signal})
  document.addEventListener('visibilitychange',()=>{cancelAnimationFrame(frame);if(visible&&!document.hidden){last=performance.now();frame=requestAnimationFrame(paint)}},{signal:events.signal});resize()
  return()=>{canvas.removeEventListener('webglcontextlost',lost);alive=false;cancelAnimationFrame(frame);events.abort();ro.disconnect();io.disconnect();world.traverse(o=>{o.geometry?.dispose();if(o.material)o.material.dispose()});labelTexture.dispose();env.dispose();renderer.dispose();canvas.remove()}
}
