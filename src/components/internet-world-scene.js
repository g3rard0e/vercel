import { collectors } from './live-network'
// Original low-detail geographic illustration. All links are schematic.
const continents = [
  [[-168,65],[-140,71],[-123,61],[-110,69],[-90,73],[-60,53],[-55,46],[-80,25],[-88,15],[-105,23],[-117,32],[-130,52],[-168,65]],
  [[-73,60],[-52,60],[-20,75],[-42,83],[-65,80]],
  [[-82,12],[-67,10],[-50,1],[-35,-6],[-45,-23],[-62,-55],[-75,-45],[-81,-5]],
  [[-10,36],[-9,51],[9,54],[5,71],[30,71],[44,54],[28,42],[14,36]],
  [[-18,32],[10,37],[34,31],[43,12],[51,10],[36,-12],[24,-35],[14,-30],[8,-6],[-16,13]],
  [[28,42],[44,54],[32,71],[70,77],[120,71],[170,58],[145,45],[130,31],[105,12],[98,2],[79,8],[69,26],[45,29]],
  [[112,-12],[135,-11],[153,-23],[146,-39],[115,-35]],
  [[95,5],[120,1],[141,-9],[129,-9],[104,-6]], [[46,-13],[50,-15],[46,-26],[43,-23]], [[166,-35],[178,-40],[170,-47]],
]
const hubs = [...collectors, ...[
  [-122,37,'West coast'],[-80,26,'Miami'],[-99,19,'Mexico'],[-70,-33,'Santiago'],[-77,-12,'Lima'],[-58,-34,'Buenos Aires'],
  [2,49,'Paris'],[8,50,'Frankfurt'],[18,59,'Stockholm'],[-9,39,'Lisbon'],[37,56,'Moscow'],[31,30,'Cairo'],[3,7,'Lagos'],[37,-1,'Nairobi'],[55,25,'Dubai'],[73,19,'Mumbai'],[77,29,'Delhi'],[104,1,'Singapore'],[114,22,'Hong Kong'],[121,31,'Shanghai'],[127,37,'Seoul'],[151,-34,'Sydney'],[115,-32,'Perth'],[174,-37,'Auckland'],[-21,64,'Reykjavik'],[-123,49,'Vancouver'],[-79,44,'Toronto'],[-74,5,'Bogotá']
].map(([lon,lat,name]) => ({lon,lat,name}))]
const links = hubs.flatMap((n,i) => [1,3,7].filter(step => i + step < hubs.length).map(step => [i,i+step]))
const countryCenters = {US:[-98,39],GB:[-2,54],NL:[5,52],DE:[10,51],FR:[2,47],BR:[-52,-10],JP:[138,37],ZA:[25,-29],CN:[104,35],IN:[79,22],RU:[100,60],CA:[-105,56],AU:[134,-25],SG:[104,1],HK:[114,22],KR:[128,36],ID:[118,-3],TR:[35,39],VN:[106,16],IR:[54,32],UA:[32,49],PL:[19,52],IT:[12,43],ES:[-4,40],MX:[-102,24],AR:[-64,-35],CL:[-71,-33],CO:[-74,4],TH:[101,15],PK:[69,30],BD:[90,24],TW:[121,24],SE:[16,62],NO:[9,61],FI:[26,64],CH:[8,47],IE:[-8,53],AE:[54,24],SA:[45,24],EG:[30,27],NG:[8,10],KE:[38,0],IL:[35,31],RO:[25,46],CZ:[15,50],PT:[-8,40],BE:[4,51],AT:[14,48],PH:[122,12],MY:[102,4],NZ:[173,-41]}
export function drawWorld(ctx,w,h,scene,still) {
  ctx.clearRect(0,0,w,h)
  const scale = Math.min(w/380,h/215) * scene.zoom
  const angle = -.11 + (still ? 0 : Math.sin(scene.time/22000)*.025)
  const project = (lon,lat,z=0) => {
    const x=lon*scale, y=-lat*scale*1.15
    return [w*.5+scene.x+x*Math.cos(angle)-y*Math.sin(angle), h*.55+scene.y+(x*Math.sin(angle)+y*Math.cos(angle))*.8-z*scale]
  }
  const gradient=ctx.createRadialGradient(w*.5,h*.5,0,w*.5,h*.5,w*.7)
  gradient.addColorStop(0,'#102c36'); gradient.addColorStop(1,'#040c14'); ctx.fillStyle=gradient; ctx.fillRect(0,0,w,h)
  const line = (points,color,width=1) => {ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
  // Floating geographic plate and coordinate mesh.
  const plate=[[-180,-65],[180,-65],[180,85],[-180,85],[-180,-65]].map(p=>project(...p,-5))
  ctx.fillStyle='#071722';ctx.beginPath();plate.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.fill();line(plate,'#29404b',2)
  for(let lon=-180;lon<=180;lon+=15)line([project(lon,-65),project(lon,85)],'#18303b',.6)
  for(let lat=-60;lat<=80;lat+=15)line([project(-180,lat),project(180,lat)],'#18303b',.6)
  for(const polygon of continents){const points=polygon.map(p=>project(...p));ctx.beginPath();points.forEach((p,i)=>i?ctx.lineTo(...p):ctx.moveTo(...p));ctx.closePath();ctx.fillStyle='#173f47';ctx.fill();ctx.strokeStyle='#39727b';ctx.lineWidth=1;ctx.stroke();line(points.map(p=>[p[0],p[1]+5]),'#0a2632',3)}
  // Two-stroke tubing and lifted Bezier bridges, deliberately schematic.
  links.forEach(([i,j],index)=>{
    const a=project(hubs[i].lon,hubs[i].lat,3),b=project(hubs[j].lon,hubs[j].lat,3)
    const lift=Math.min(70,Math.hypot(a[0]-b[0],a[1]-b[1])*.2)
    const c=[(a[0]+b[0])/2,(a[1]+b[1])/2-lift]
    const cable=(color,width)=>{ctx.beginPath();ctx.moveTo(...a);ctx.quadraticCurveTo(...c,...b);ctx.strokeStyle=color;ctx.lineWidth=width;ctx.stroke()}
    cable('#06121b',5);cable(index%3===0?'#477f83':'#295263',1.2)
    if(scene.illustrative){const t=still?.45:(scene.time/8000+index*.137)%1;const x=(1-t)**2*a[0]+2*(1-t)*t*c[0]+t*t*b[0], y=(1-t)**2*a[1]+2*(1-t)*t*c[1]+t*t*b[1];ctx.fillStyle='#ffb65f';ctx.fillRect(x-1.7,y-1.7,3.4,3.4)}
  })
  const now=Date.now()
  hubs.forEach((n,i)=>{
    const p=project(n.lon,n.lat,4),base=project(n.lon,n.lat)
    line([base,p],'#89c6c5',1)
    ctx.fillStyle=i<6?'#66e8d1':'#416d80';ctx.fillRect(p[0]-4,p[1]-5,8,6);ctx.fillStyle='#122d3b';ctx.fillRect(p[0]-4,p[1]+1,8,5)
    if(i<6){ctx.strokeStyle=scene.selected===n.id?'#ffb65f':'#57b7b4';ctx.strokeRect(p[0]-7,p[1]-8,14,16);ctx.font='10px monospace';ctx.fillStyle='#b7dedb';ctx.fillText(n.name.toUpperCase(),p[0]+9,p[1]-5)}
  })
  scene.pulses.forEach(p=>{
    if(scene.selected!=='all'&&p.host!==scene.selected)return
    const c=collectors.find(n=>n.id===p.host);if(!c)return
    if(now-p.created>=4500)return
    const pos=project(c.lon,c.lat,4), progress=still?.5:Math.min(1,(now-p.created)/4500)
    if(progress>=1)return
    ctx.beginPath();ctx.ellipse(...pos,8+progress*32,(8+progress*32)*.65,0,0,Math.PI*2);ctx.strokeStyle=`rgba(101,255,215,${1-progress})`;ctx.lineWidth=2;ctx.stroke()
    ctx.fillStyle='#adffed';ctx.fillRect(pos[0]-3,pos[1]-3,6,6)
  })
  scene.attacks.forEach(a=>{const c=countryCenters[a.code];if(!c)return;const p=project(...c,6);ctx.beginPath();ctx.arc(...p,5+Math.sqrt(a.share),0,Math.PI*2);ctx.fillStyle='#ff685238';ctx.fill();ctx.strokeStyle='#ff6852';ctx.stroke();ctx.fillStyle='#ffb7ab';ctx.font='11px monospace';ctx.fillText(`${a.code} ${a.share.toFixed(1)}%`,p[0]+10,p[1])})
}
