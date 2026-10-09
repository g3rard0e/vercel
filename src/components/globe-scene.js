import { continents, hubs, links, countryCenters } from './internet-world-scene'
import { collectors } from './live-network'
import { globeProjection } from './world-camera'

function inside(lon, lat, polygon) {
  let result=false
  for(let i=0,j=polygon.length-1;i<polygon.length;j=i++) {
    const [x,y]=polygon[i], [px,py]=polygon[j]
    if ((y>lat)!==(py>lat) && lon<(px-x)*(lat-y)/(py-y)+x) result=!result
  }
  return result
}
// Original continent outlines sampled once; no external textures or map tiles.
const land=[]
for(let lat=-57;lat<82;lat+=2.2) for(let lon=-180;lon<180;lon+=2.2/Math.max(.3,Math.cos(lat*Math.PI/180))) {
  if(continents.some(p=>inside(lon,lat,p))) land.push([lon,lat])
}
const cartesian=n=>{const lon=n.lon*Math.PI/180,lat=n.lat*Math.PI/180;return [Math.cos(lat)*Math.sin(lon),Math.sin(lat),Math.cos(lat)*Math.cos(lon)]}
const routes=links.map(([a,b],i)=>{
  const from=cartesian(hubs[a]),to=cartesian(hubs[b]);const dot=Math.max(-.9999,Math.min(.9999,from.reduce((s,v,j)=>s+v*to[j],0))),angle=Math.acos(dot)
  return {a,b,color:['#68e5d3','#9b96ef','#6daddd'][i%3],points:Array.from({length:49},(_,j)=>{
    const t=j/48,s=Math.sin(angle),p=from.map((v,k)=>(v*Math.sin((1-t)*angle)+to[k]*Math.sin(t*angle))/s)
    return [Math.atan2(p[0],p[2])*180/Math.PI,Math.atan2(p[1],Math.hypot(p[0],p[2]))*180/Math.PI,Math.sin(t*Math.PI)*(12+i%4*3)]
  })}
})

export function drawGlobe(ctx,w,h,scene,still) {
  ctx.clearRect(0,0,w,h)
  const project=globeProjection(w,h,scene),radius=Math.min(w*.39,h*.35)*scene.zoom,cx=w*.5+scene.x,cy=h*.5+scene.y
  ctx.fillStyle='#050b15';ctx.fillRect(0,0,w,h)
  for(let i=0;i<90;i++){ctx.fillStyle=`rgba(157,180,210,${.15+i%4*.08})`;ctx.fillRect((i*137.7%997)/997*w,(i*67.3%991)/991*h,1,1)}
  const atmosphere=ctx.createRadialGradient(cx,cy,radius*.85,cx,cy,radius*1.24);atmosphere.addColorStop(0,'#3b92b700');atmosphere.addColorStop(.55,'#57c5e82c');atmosphere.addColorStop(1,'#4ca5e000')
  ctx.fillStyle=atmosphere;ctx.beginPath();ctx.arc(cx,cy,radius*1.24,0,Math.PI*2);ctx.fill()
  const ocean=ctx.createRadialGradient(cx-radius*.4,cy-radius*.4,0,cx,cy,radius);ocean.addColorStop(0,'#213b54');ocean.addColorStop(.6,'#0d2034');ocean.addColorStop(1,'#060f20')
  ctx.fillStyle=ocean;ctx.beginPath();ctx.arc(cx,cy,radius,0,Math.PI*2);ctx.fill();ctx.strokeStyle='#6ad8e85c';ctx.lineWidth=1;ctx.stroke()
  const stroke=(points,color,width=1)=>{ctx.beginPath();let pen=false;for(const p of points){if(p[2]<0){pen=false;continue}if(pen)ctx.lineTo(p[0],p[1]);else ctx.moveTo(p[0],p[1]);pen=true}ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  for(let lat=-60;lat<=60;lat+=30)stroke(Array.from({length:121},(_,i)=>project(i*3-180,lat)),'#6fa5bb20')
  for(let lon=-180;lon<180;lon+=30)stroke(Array.from({length:61},(_,i)=>project(lon,i*3-90)),'#6fa5bb20')
  for(const [lon,lat] of land){const [x,y,z]=project(lon,lat);if(z<0)continue;ctx.fillStyle=`rgba(144,211,204,${.23+z*.55})`;ctx.beginPath();ctx.arc(x,y,Math.max(.65,radius*.0035),0,Math.PI*2);ctx.fill()}
  for(const route of routes){const points=route.points.map(p=>project(...p));stroke(points,'#030811aa',3);stroke(points,route.color+'85',1.1)
    if(scene.illustrative){const step=still?20:Math.floor((scene.time/35+route.a*11)%48),p=points[step];if(p[2]>.01){ctx.shadowColor='#ffd298';ctx.shadowBlur=9;ctx.fillStyle='#ffdfad';ctx.beginPath();ctx.arc(p[0],p[1],1.7,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0}}
  }
  const now=Date.now(),recent=new Map();scene.pulses.forEach(p=>{if(now-p.created<4500)recent.set(p.host,p)})
  collectors.forEach(c=>{const p=project(c.lon,c.lat,2);if(p[2]<.05)return;const selected=c.id===scene.selected||c.id===scene.hovered,color=selected?'#ffd39b':'#83f1d7'
    ctx.fillStyle=color;ctx.shadowColor=color;ctx.shadowBlur=12;ctx.beginPath();ctx.arc(p[0],p[1],3,0,Math.PI*2);ctx.fill();ctx.shadowBlur=0
    if(recent.has(c.id)&&(scene.selected==='all'||c.id===scene.selected)){const t=still?.35:(now-recent.get(c.id).created)/4500;ctx.strokeStyle=`rgba(114,255,211,${1-t*.7})`;ctx.beginPath();ctx.arc(p[0],p[1],7+t*20,0,Math.PI*2);ctx.stroke()}
    ctx.font='10px monospace';ctx.fillStyle=color;const dx=c.id==='rrc01'?-75:12,dy=c.id==='rrc01'?22:-16;ctx.fillText(c.name.toUpperCase(),p[0]+dx,p[1]+dy)
  })
  scene.attacks.forEach(a=>{const location=countryCenters[a.code];if(!location)return;const p=project(...location,2);if(p[2]<.05)return;ctx.strokeStyle='#ff715d';ctx.beginPath();ctx.arc(p[0],p[1],5+Math.sqrt(a.share),0,Math.PI*2);ctx.stroke();ctx.font='10px monospace';ctx.fillStyle='#ffac9e';ctx.fillText(`${a.code} ${a.share.toFixed(1)}%`,p[0]+12,p[1])})
}
