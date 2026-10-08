// Original product illustrations and finite, local-only demos. No live systems are contacted.
// Template markup comes exclusively from the static catalog below, never from visitor input.
const paths = {
  network: '<rect x="3" y="4" width="18" height="6" rx="2"/><path d="M12 10v5M5 15h14M5 15v5m7-5v5m7-5v5"/>',
  cloud: '<path d="M6 18h12a4 4 0 0 0 .3-8A6.5 6.5 0 0 0 5.7 9 4.5 4.5 0 0 0 6 18Z"/><path d="m9 13 3-3 3 3m-3-3v10"/>',
  security: '<path d="M12 2 3 6v6c0 5 9 10 9 10s9-5 9-10V6Z"/><path d="m8 12 3 3 5-6"/>',
  cameras: '<path d="m3 6 14-3 3 9-14 3Z"/><circle cx="15" cy="9" r="2"/><path d="m7 15-1 5H2m4-2h7v-4"/>',
  web: '<rect x="2" y="3" width="20" height="18" rx="3"/><path d="M2 8h20M6 5.5h.1M9 5.5h.1m-1 7-3 3 3 3m8-6 3 3-3 3m-3-7-2 8"/>',
  automation: '<rect x="2" y="3" width="7" height="6" rx="1"/><rect x="15" y="15" width="7" height="6" rx="1"/><path d="M9 6h9v5m-3-3 3 3 3-3M5 9v9h6m-3-3 3 3-3 3"/>',
  backup: '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5v14c0 4 18 4 18 0V5M3 12c0 4 18 4 18 0"/>',
  support: '<path d="M3 13v-2a9 9 0 0 1 18 0v2M5 19H3V11h4v8Zm14 0h2v-8h-4v8Zm2 0c0 3-4 3-8 3"/>',
  pc: '<rect x="2" y="3" width="20" height="14" rx="2"/><path d="M12 17v4m-5 0h10M6 7h8M6 10h12"/>',
  file: '<path d="M5 2h9l5 5v15H5Zm9 0v6h5M8 12h8m-8 4h6"/>',
  lock: '<rect x="5" y="10" width="14" height="12" rx="2"/><path d="M8 10V6a4 4 0 0 1 8 0v4m-4 6v2"/>',
  arrow: '<path d="M5 19 19 5M5 5h14v14"/>',
  check: '<path d="m4 12 5 5L20 6"/>',
}
const icon = (name, cls = '') => `<svg class="gx-icon ${cls}" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">${paths[name] || paths.network}</svg>`
const catalog = [
  { id: 'network', name: 'Network infrastructure', tag: '01 / CONNECT', title: 'The connections behind your next move.', copy: 'From the first cable to the last access point. Routing, switching, Wi-Fi and secure site connections, designed to work together.', benefit: 'Bring order to the network. Give your team room to grow.', tags: ['FortiGate', 'Meraki', 'Ubiquiti', 'VLANs & VPNs'], color: '#5de5fc' },
  { id: 'cloud', name: 'Microsoft 365 & cloud', tag: '02 / MODERNIZE', title: 'Your office. Without the walls.', copy: 'Move email, files and collaboration into Microsoft 365 and Azure. Connect identity, applications and managed devices around the way your people work.', benefit: 'A planned migration. A more connected working day.', tags: ['Microsoft 365', 'Azure', 'Intune', 'Google Workspace'], color: '#ae93ff' },
  { id: 'security', name: 'Security & endpoints', tag: '03 / PROTECT', title: 'Let the right things in.', copy: 'Firewalls, endpoint protection and access policies form a layered defense. We configure the controls and help reduce the paths a threat can take.', benefit: 'Protect the work, not just the perimeter.', tags: ['EDR', 'ThreatLocker', 'Sophos', 'Firewall policies'], color: '#b4f779' },
  { id: 'cameras', name: 'CCTV & physical security', tag: '04 / SEE', title: 'A better view of what matters.', copy: 'IP cameras, recording, remote viewing and access control. A system planned around your entrances, workspaces and the places you need to see.', benefit: 'The right camera. The right angle. One connected view.', tags: ['IP cameras', 'NVR', 'Remote viewing', 'Access control'], color: '#ffb48a' },
  { id: 'web', name: 'Websites, domains & hosting', tag: '05 / CREATE', title: 'Make your first impression move.', copy: 'Give your business a digital front door. We connect web design, domain registration, DNS and hosting into a practical path from idea to launch.', benefit: 'A presence that explains what you do and invites the next step.', tags: ['Web design', 'Domains', 'DNS', 'Hosting'], color: '#f7a0ee' },
  { id: 'automation', name: 'Automation & workflows', tag: '06 / SIMPLIFY', title: 'Less repetition. More momentum.', copy: 'Connect the repetitive parts of IT with scripts and purposeful workflows. Turn events into actions, with clear checks and human approval where it belongs.', benefit: 'Let the routine move. Keep your team in control.', tags: ['PowerShell', 'NinjaRMM', 'ConnectWise', 'Workflows'], color: '#ffdc80' },
  { id: 'backup', name: 'Backup & disaster recovery', tag: '07 / RECOVER', title: 'A way back. A way forward.', copy: 'Protected copies, retention and recovery planning for the data your business depends on. We help build and test a path back from disruption.', benefit: 'Plan the recovery before you need the recovery.', tags: ['Veeam', 'Acronis', 'Cloud backup', 'Recovery planning'], color: '#7de6cc' },
  { id: 'support', name: 'IT support & helpdesk', tag: '08 / SUPPORT', title: 'Back to the work that matters.', copy: 'Remote and on-site troubleshooting, hardware installation and everyday IT support. Real technical help for the people behind your business.', benefit: 'One point of contact. A clearer next step.', tags: ['Remote support', 'On-site', 'Hardware', 'Maintenance'], color: '#8fbbff' },
]
const badge = text => `<span class="gx-badge">${text}</span>`
const control = (action, text, extra = '') => `<button type="button" class="gx-control" data-action="${action}" ${extra}>${text}</button>`
const lines = '<svg class="gx-traces" viewBox="0 0 600 400" preserveAspectRatio="none" aria-hidden="true"><path d="M70 310V230Q70 210 90 210H270Q300 210 300 180V80M530 310V230Q530 210 510 210H330Q300 210 300 180M170 320V270H430V320"/><path class="gx-flow" d="M70 310V230Q70 210 90 210H270Q300 210 300 180V80M530 310V230Q530 210 510 210H330Q300 210 300 180"/></svg>'

function networkArt() {
  return `<div class="gx-art gx-net" data-mode="staff">${lines}
    <div class="gx-hardware gx-gateway"><div class="gx-ports">${'<i></i>'.repeat(8)}</div><span>MANAGED SWITCH</span></div>
    <div class="gx-net-policy">${icon('lock')}<span>SEGMENTED BY DESIGN</span></div>
    ${['STAFF', 'GUEST', 'VOICE'].map((name, i) => `<div class="gx-endpoint ep-${i}">${icon('pc')}<span>${name}</span><i></i></div>`).join('')}
    <div class="gx-float-tag gx-net-tag">01 / PACKET IN TRANSIT ${icon('arrow')}</div>
    </div><div class="gx-demo-controls" role="group" aria-label="Choose a network segment">${['staff','guest','voice'].map(x => control('segment', x, `data-value="${x}" aria-pressed="${x === 'staff'}"`)).join('')}</div>`
}
function cloudArt() {
  return `<div class="gx-art gx-cloud" data-phase="0"><div class="gx-orbit orbit-a"></div><div class="gx-orbit orbit-b"></div>
    <div class="gx-cloud-core">${icon('cloud')}<span>MICROSOFT CLOUD</span></div>
    ${['MAIL','FILES','TEAMS','DEVICES'].map((x,i) => `<div class="gx-app app-${i}">${icon(i === 3 ? 'pc' : 'file')}<span>${x}</span></div>`).join('')}
    <div class="gx-office">${icon('network')}<span>YOUR OFFICE</span></div><div class="gx-cloud-line"></div>
    <div class="gx-data-cubes"><i></i><i></i><i></i><i></i></div><span class="gx-float-tag cloud-tag">IDENTITY CONNECTS THE EXPERIENCE</span></div>
    <div class="gx-demo-controls">${control('migrate','Simulate a migration '+icon('arrow'))}<div class="gx-meter" role="progressbar" aria-label="Demo migration progress" aria-valuemin="0" aria-valuemax="100" aria-valuenow="0"><span></span></div></div>`
}
function securityArt() {
  return `<div class="gx-art gx-security" data-phase="0"><div class="gx-radar"></div><div class="gx-defense-ring"></div><div class="gx-defense-ring ring-2"></div>
    <div class="gx-shield">${icon('security')}<span>LAYERED DEFENSE</span></div>
    ${['NETWORK','IDENTITY','ENDPOINT'].map((x,i)=>`<span class="gx-layer layer-${i}">${icon('lock')}${x}</span>`).join('')}
    <div class="gx-threat t-1">!</div><div class="gx-threat t-2">!</div><div class="gx-threat t-3">!</div>
    <div class="gx-security-result">${icon('check')}<span>DEMO THREAT BLOCKED</span></div></div>
    <div class="gx-demo-controls">${control('threat','Run a threat demo '+icon('arrow'))}<span class="gx-hint">See three layers respond.</span></div>`
}
function camerasArt() {
  return `<div class="gx-art gx-cameras" data-camera="0" data-night="false">
    <div class="gx-floor"><svg viewBox="0 0 560 350" aria-hidden="true"><path class="floor-base" d="M45 80 340 30 510 165 205 305Z"/><path class="floor-wall" d="M45 80V40L340 0v30M340 0l170 125v40M45 40l160 215 305-130M205 255v50"/><path class="floor-room" d="m140 65 75 82 150-25m-65-83 10 145M115 160l185-29M365 122l-10 110"/><path class="floor-desk" d="m200 86 38-7 28 21-39 8Zm156 83 38-8 28 22-39 8ZM174 196l45-9 35 27-46 10Z"/><path class="gx-fov fov-0" d="m120 80 62 115 85-113Z"/><path class="gx-fov fov-1" d="m360 90-125 51 134 72Z"/><path class="gx-fov fov-2" d="m205 255 151-106-161-28Z"/></svg>
    ${[0,1,2].map(i=>`<button class="gx-camera-pin cam-${i}" type="button" data-action="camera" data-value="${i}" aria-label="Select ${['lobby','warehouse','office'][i]} camera" aria-pressed="${i===0}">${icon('cameras')}</button>`).join('')}</div>
    <div class="gx-monitor"><div class="gx-monitor-bar"><span class="gx-record">SIMULATED VIEW</span><span class="gx-cam-name">01 / LOBBY</span></div><div class="gx-feed"><i class="feed-door"></i><i class="feed-window"></i><i class="feed-person"></i><div class="gx-tracking"><span>MOTION ZONE</span></div><div class="gx-scanline"></div></div><div class="gx-feed-footer"><span>NVR / REMOTE ACCESS</span><span>DEMO</span></div></div></div>
    <div class="gx-demo-controls">${control('night','Night view','aria-pressed="false"')}<span class="gx-hint">Select a camera on the floor plan.</span></div>`
}
function webArt() {
  return `<div class="gx-art gx-web" data-layout="desktop" data-phase="1" style="--demo-color:#c3a3ff">
    <div class="gx-browser"><div class="gx-browser-bar"><i></i><i></i><i></i><span>YOUR NEXT WEBSITE / PREVIEW</span></div><div class="gx-browser-page"><div class="gx-mini-nav"><b>STUDIO.</b><span>WORK &nbsp; ABOUT &nbsp; CONTACT</span></div><div class="gx-mini-layout"><div><span class="gx-mini-kicker">IDEAS INTO EXPERIENCES</span><h4>Make<br/>something<br/><em>remarkable.</em></h4><div class="gx-mini-lines"></div><span class="gx-mini-button">EXPLORE &nearr;</span></div><div class="gx-sculpture"><i></i><i></i><i></i></div></div><div class="gx-mini-cards"><i></i><i></i><i></i></div></div></div>
    <span class="gx-float-tag web-tag">DESIGN &rarr; BUILD &rarr; LAUNCH</span><span class="gx-code-tag">&lt;possibility /&gt;</span></div>
    <div class="gx-demo-controls"><div role="group" aria-label="Preview screen size">${control('layout','Desktop','data-value="desktop" aria-pressed="true"')}${control('layout','Mobile','data-value="mobile" aria-pressed="false"')}</div><div class="gx-swatches" role="group" aria-label="Preview color palette">${['violet','coral','aqua'].map((x,i)=>`<button type="button" class="swatch ${x}" data-action="palette" data-value="${i}" aria-label="${x} palette" aria-pressed="${i===0}"></button>`).join('')}</div>${control('build','Build preview')}</div>`
}
function automationArt() {
  return `<div class="gx-art gx-automation" data-phase="0"><svg class="gx-workflow-wires" viewBox="0 0 600 400" aria-hidden="true"><path d="M65 110H245Q270 110 270 135V210H510M270 210v95h150"/><path class="gx-flow" d="M65 110H245Q270 110 270 135V210H510"/></svg>
    ${[['EVENT','Alert received'],['TICKET','Create a record'],['SCRIPT','Run the routine'],['REVIEW','Human approval'],['DONE','Document result']].map((x,i)=>`<div class="gx-workflow-node wn-${i}"><span>0${i+1}</span>${icon(i===3?'lock':i===4?'check':'automation')}<b>${x[0]}</b><small>${x[1]}</small></div>`).join('')}
    <span class="gx-branch-label">CHECK &amp; APPROVE</span><div class="gx-workflow-orb"></div></div>
    <div class="gx-demo-controls">${control('workflow','Run demo workflow '+icon('arrow'))}${control('approve','Approve demo action','hidden')}<span class="gx-hint">Automation with a human checkpoint.</span></div>`
}
function backupArt() {
  return `<div class="gx-art gx-backup" data-phase="0"><div class="gx-backup-orbit"></div>
    <div class="gx-primary"><div class="gx-drive-top">PRIMARY SYSTEM</div>${[0,1,2,3].map(i=>`<div class="gx-drive"><i></i><span></span><span></span><b>0${i+1}</b></div>`).join('')}<span class="gx-primary-label">SAMPLE DATA</span></div>
    <div class="gx-backup-transfer"><i></i><i></i><i></i></div><div class="gx-vault">${icon('backup')}<span>PROTECTED COPY</span><small>RECOVERY SCENARIO</small></div><div class="gx-restored">${icon('check')} DEMO RESTORED</div></div>
    <div class="gx-demo-controls">${control('outage','Simulate an outage')}${control('restore','Restore demo','disabled')}<span class="gx-hint">No real files are changed.</span></div>`
}
function supportArt() {
  return `<div class="gx-art gx-support" data-phase="0"><div class="gx-support-ring"></div><div class="gx-support-core">${icon('support')}<span>GEAMY / SUPPORT</span></div>
    ${[0,1,2].map(i=>`<div class="gx-support-device sd-${i}">${icon('pc')}<i></i></div>`).join('')}
    <div class="gx-ticket"><div class="gx-ticket-top"><span>SAMPLE TICKET</span><span>#0042</span></div><h4 class="gx-ticket-title">Wi-Fi connection</h4><div class="gx-ticket-steps"><span>DIAGNOSE</span><span>RESOLVE</span><span>DOCUMENT</span></div><div class="gx-ticket-meter"><span></span></div></div></div>
    <div class="gx-demo-controls"><label class="gx-issue-label">Demo issue<select aria-label="Choose a demo support issue" data-issue><option>Wi-Fi connection</option><option>Account sign-in</option><option>Printer connection</option></select></label>${control('support','Resolve demo ticket '+icon('arrow'))}</div>`
}
const artwork = { network:networkArt, cloud:cloudArt, security:securityArt, cameras:camerasArt, web:webArt, automation:automationArt, backup:backupArt, support:supportArt }

class GeamyExperiences extends HTMLElement {
  connectedCallback() {
    if (this.controller) return
    this.innerHTML = `<header class="gx-intro"><div><span class="gx-eyebrow">THE GEAMY EXPERIENCE / EIGHT WAYS FORWARD</span><h2>Complex technology.<br/><em>Simple possibilities.</em></h2></div><p>Don't just read what we do.<br/>See it. Try it. Imagine it working for you.</p></header>
      <nav class="gx-index" aria-label="Explore our services">${catalog.map(s=>`<a href="#service-${s.id}" style="--world:${s.color}">${icon(s.id)}<span>${s.name}</span></a>`).join('')}</nav>
      <div class="gx-worlds">${catalog.map((s,i)=>`<article class="gx-world gx-${s.id}-world" id="service-${s.id}" style="--world:${s.color}" data-world="${s.id}"><div class="gx-world-copy"><span class="gx-eyebrow">${s.tag}</span><h3>${s.title}</h3><p>${s.copy}</p><p class="gx-benefit">${s.benefit}</p><div class="gx-tags">${s.tags.map(badge).join('')}</div><a href="#contact" class="gx-world-cta">Let's talk ${s.id==='cameras'?'camera systems':s.id==='web'?'websites':s.id==='backup'?'recovery':s.id} ${icon('arrow')}</a></div><div class="gx-world-visual"><div class="gx-visual-bar"><span>${icon(s.id)} ${s.name.toUpperCase()}</span><span>0${i+1} / 08</span></div><div class="gx-art-wrap" data-tilt>${artwork[s.id]()}</div><div class="gx-demo-footer"><span>ILLUSTRATIVE DEMO / NOT A LIVE SYSTEM</span><p class="gx-demo-status" role="status">${s.id==='network'?'Staff segment selected.':s.id==='cameras'?'Lobby camera selected.':'Explore the controls above.'}</p></div></div></article>`).join('')}</div>
      <section class="gx-finale"><span class="gx-eyebrow">DESIGNED AS ONE CONNECTED SYSTEM</span><h2>One partner.<br/><em>Your entire technology stack.</em></h2><div class="gx-process">${['Discover','Design','Deploy','Support'].map((s,i)=>`<span><i>0${i+1}</i>${s}</span>`).join('')}</div><a href="#contact" class="gx-big-cta">What could we build for you? ${icon('arrow')}</a></section>`
    this.controller = new AbortController(); this.timers = new Map(); this.visible = new Set()
    const on = (target,event,fn,options={}) => target.addEventListener(event,fn,{...options,signal:this.controller.signal})
    this.cards = [...this.querySelectorAll('.gx-world')]
    this.observer = new IntersectionObserver(entries => entries.forEach(e=>{
      e.target.classList.toggle('is-playing',e.isIntersecting)
      if (e.isIntersecting) { e.target.classList.add('was-seen'); this.visible.add(e.target) } else this.visible.delete(e.target)
    }),{threshold:.06})
    this.cards.forEach(c=>this.observer.observe(c))
    on(this,'click',e=>{const button=e.target.closest('[data-action]');if(button && this.contains(button))this.act(button)})
    on(this,'change',e=>{if(e.target.matches('[data-issue]')){const c=e.target.closest('.gx-world'); c.querySelector('.gx-ticket-title').textContent=e.target.value; this.setPhase(c,0); this.status(c,'New sample issue selected.')}})
    on(this,'pointermove',e=>{
      if (e.pointerType==='touch' || this.reduced()) return
      const wrap=e.target.closest('[data-tilt]'); if(!wrap) return
      const r=wrap.getBoundingClientRect(); wrap.style.setProperty('--rx',`${-(e.clientY-r.top-r.height/2)/r.height*4}deg`);wrap.style.setProperty('--ry',`${(e.clientX-r.left-r.width/2)/r.width*5}deg`)
    },{passive:true})
    on(this,'pointerout',e=>{const wrap=e.target.closest('[data-tilt]');if(wrap&&!wrap.contains(e.relatedTarget)){wrap.style.setProperty('--rx','0deg');wrap.style.setProperty('--ry','0deg')}})
    on(document,'visibilitychange',()=>document.documentElement.classList.toggle('gx-tab-hidden',document.hidden))
    // A single, event-driven frame updates the nearby scenes; no idle JS animation loop.
    on(window,'scroll',()=>{if(this.frame||this.reduced())return;this.frame=requestAnimationFrame(()=>{this.frame=0;for(const c of this.visible){const r=c.getBoundingClientRect();c.style.setProperty('--scroll-turn',`${Math.max(-3,Math.min(3,(innerHeight/2-r.top-r.height/2)/innerHeight*5))}deg`)}})},{passive:true})
  }
  reduced() { return matchMedia('(prefers-reduced-motion: reduce)').matches || document.documentElement.dataset.motion==='off' }
  status(card,text) { card.querySelector('.gx-demo-status').textContent=text }
  setPhase(card,value) { card.querySelector('.gx-art').dataset.phase=String(value) }
  cancel(card) { (this.timers.get(card)||[]).forEach(clearTimeout);this.timers.delete(card) }
  sequence(card,steps,finish) {
    this.cancel(card)
    const button=card.querySelector('[data-action="'+({cloud:'migrate',security:'threat',web:'build',automation:'workflow',backup:'restore',support:'support'}[card.dataset.world])+'"]')
    if(button)button.disabled=true
    const next=(index)=>{
      if(!this.isConnected)return
      const [phase,text]=steps[index];this.setPhase(card,phase);this.status(card,text)
      if(card.dataset.world==='cloud'){const meter=card.querySelector('.gx-meter'),value=Math.round(phase/4*100);meter.setAttribute('aria-valuenow',String(value));meter.firstElementChild.style.width=value+'%'}
      if(index<steps.length-1){const timer=setTimeout(()=>next(index+1),this.reduced()?0:800);this.timers.set(card,[timer])}
      else {if(button)button.disabled=false;this.timers.delete(card);finish?.()}
    };next(0)
  }
  act(button) {
    const card=button.closest('.gx-world');if(!card||button.disabled)return
    const art=card.querySelector('.gx-art'),action=button.dataset.action
    if(action==='segment') {art.dataset.mode=button.dataset.value;card.querySelectorAll('[data-action="segment"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));this.status(card,`${button.dataset.value[0].toUpperCase()+button.dataset.value.slice(1)} segment selected. Separate traffic, one managed network.`)}
    if(action==='migrate')this.sequence(card,[[1,'Demo: inventory and identity preparation.'],[2,'Demo: moving sample mail and files.'],[3,'Demo: connecting apps and managed devices.'],[4,'Demo migration complete. A real migration is planned for your environment.']])
    if(action==='threat')this.sequence(card,[[1,'Demo: suspicious connection detected.'],[2,'Demo: identity and endpoint checks applied.'],[3,'Demo: connection isolated and blocked. No real attack was performed.']])
    if(action==='camera') {const i=Number(button.dataset.value);art.dataset.camera=String(i);card.querySelector('.gx-cam-name').textContent=`0${i+1} / ${['LOBBY','WAREHOUSE','OFFICE'][i]}`;card.querySelectorAll('[data-action="camera"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));this.status(card,`${['Lobby','Warehouse','Office'][i]} camera selected. This is an illustrated preview, not a live feed.`)}
    if(action==='night') {const night=art.dataset.night!=='true';art.dataset.night=String(night);button.setAttribute('aria-pressed',String(night));button.textContent=night?'Day view':'Night view';this.status(card,`${night?'Night':'Day'} viewing demo selected.`)}
    if(action==='layout') {art.dataset.layout=button.dataset.value;card.querySelectorAll('[data-action="layout"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));this.status(card,`${button.dataset.value==='mobile'?'Mobile':'Desktop'} design preview selected.`)}
    if(action==='palette') {art.style.setProperty('--demo-color',['#c3a3ff','#ffa38b','#78ead6'][Number(button.dataset.value)]);card.querySelectorAll('[data-action="palette"]').forEach(b=>b.setAttribute('aria-pressed',String(b===button)));this.status(card,'Preview palette updated.')}
    if(action==='build')this.sequence(card,[[0,'Demo: laying out the wireframe.'],[1,'Demo: adding typography and color.'],[2,'Demo: composing the responsive experience.'],[3,'Preview ready. No site has been deployed by this demo.']])
    if(action==='workflow'){card.querySelector('[data-action="approve"]').hidden=true;this.sequence(card,[[1,'Demo: event received and ticket created.'],[2,'Demo: routine prepared for review.'],[3,'Demo paused: approve the next action.']],()=>{button.disabled=true;card.querySelector('[data-action="approve"]').hidden=false})}
    if(action==='approve'){button.hidden=true;this.setPhase(card,4);card.querySelector('[data-action="workflow"]').disabled=false;this.status(card,'Demo approved and documented. No external action was executed.')}
    if(action==='outage'){this.cancel(card);this.setPhase(card,1);button.disabled=true;card.querySelector('[data-action="restore"]').disabled=false;this.status(card,'Demo primary system offline. The protected sample copy remains available.')}
    if(action==='restore')this.sequence(card,[[2,'Demo: selecting the protected copy.'],[3,'Demo: rebuilding the sample system.'],[4,'Demo restored. Actual recovery time depends on the environment.']],()=>{button.disabled=true;card.querySelector('[data-action="outage"]').disabled=false})
    if(action==='support'){card.querySelector('[data-issue]').disabled=true;this.sequence(card,[[1,'Demo: reviewing the selected issue.'],[2,'Demo: applying a sample resolution.'],[3,'Demo: resolution documented. No real device was accessed.']],()=>{card.querySelector('[data-issue]').disabled=false})}
  }
  disconnectedCallback() { this.controller?.abort();this.controller=null;this.observer?.disconnect();this.timers?.forEach(t=>t.forEach(clearTimeout));this.timers?.clear();cancelAnimationFrame(this.frame);this.frame=0 }
}

class GeamyUniverse extends HTMLElement {
  connectedCallback() {
    if(this.controller)return
    this.innerHTML=`<div class="gx-universe"><div class="gx-universe-halo"></div><div class="gx-universe-ring ur-1"></div><div class="gx-universe-ring ur-2"></div><svg class="gx-universe-wires" viewBox="0 0 600 540" preserveAspectRatio="none" aria-hidden="true">${catalog.map((s,i)=>{const a=i*Math.PI/4-Math.PI/2,x=300+Math.cos(a)*235,y=265+Math.sin(a)*195;return `<path d="M300 265Q${x} 265 ${x} ${y}"/>`}).join('')}</svg><div class="gx-prism" aria-hidden="true"><div class="gx-cube"><i class="cube-front">G<span>GEAMY</span></i><i class="cube-back"></i><i class="cube-left"></i><i class="cube-right"></i><i class="cube-top"></i><i class="cube-bottom"></i></div></div>${catalog.map((s,i)=>`<a class="gx-satellite sat-${i}" href="#service-${s.id}" style="--world:${s.color};--delay:${-i*.65}s">${icon(s.id)}<span>${['NETWORK','CLOUD','SECURITY','CAMERAS','WEB','AUTOMATE','BACKUP','SUPPORT'][i]}</span></a>`).join('')}<span class="gx-universe-note">EIGHT SPECIALTIES. ONE CONNECTED BUSINESS.</span><span class="gx-orbit-label">EXPLORE YOUR POSSIBILITIES</span></div>`
    this.controller=new AbortController();const signal=this.controller.signal
    this.addEventListener('pointermove',e=>{if(e.pointerType==='touch'||matchMedia('(prefers-reduced-motion: reduce)').matches||document.documentElement.dataset.motion==='off')return;const r=this.getBoundingClientRect();this.style.setProperty('--ux',`${(e.clientX-r.left-r.width/2)/r.width*9}deg`);this.style.setProperty('--uy',`${-(e.clientY-r.top-r.height/2)/r.height*6}deg`)},{passive:true,signal})
    this.addEventListener('pointerleave',()=>{this.style.setProperty('--ux','0deg');this.style.setProperty('--uy','0deg')},{signal})
    this.observer=new IntersectionObserver(([e])=>this.classList.toggle('is-playing',e.isIntersecting));this.observer.observe(this)
  }
  disconnectedCallback(){this.controller?.abort();this.controller=null;this.observer?.disconnect()}
}
class GeamyMotion extends HTMLElement {
  connectedCallback(){if(this.controller)return;this.controller=new AbortController();this.media=matchMedia('(prefers-reduced-motion: reduce)');this.innerHTML='<button type="button" class="gx-motion-switch" aria-pressed="false"></button>';const signal=this.controller.signal;this.querySelector('button').addEventListener('click',()=>{const paused=document.documentElement.dataset.motion!=='off';document.documentElement.dataset.motion=paused?'off':'on';window.dispatchEvent(new CustomEvent('geamy-motion',{detail:{paused}}))},{signal});window.addEventListener('geamy-motion',()=>this.render(),{signal});this.media.addEventListener('change',()=>this.render(),{signal});this.render()}
  render(){const button=this.querySelector('button'),paused=this.media.matches||document.documentElement.dataset.motion==='off';button.textContent=this.media.matches?'Motion reduced by system':paused?'Enable animations':'Pause animations';button.setAttribute('aria-pressed',String(paused));button.disabled=this.media.matches}
  disconnectedCallback(){this.controller?.abort();this.controller=null}
}
if(!customElements.get('geamy-experiences'))customElements.define('geamy-experiences',GeamyExperiences)
if(!customElements.get('geamy-universe'))customElements.define('geamy-universe',GeamyUniverse)
if(!customElements.get('geamy-motion'))customElements.define('geamy-motion',GeamyMotion)
