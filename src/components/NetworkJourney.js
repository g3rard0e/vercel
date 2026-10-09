import { NetworkScene, STAGES, clamp } from './network-scene.js'

class NetworkJourney extends HTMLElement {
  connectedCallback() {
    if (this.abort) return
    this.preview = this.tagName === 'NETWORK-PREVIEW'
    this.innerHTML = this.preview ? '<canvas class="nj-preview-canvas" aria-hidden="true"></canvas>' : `
      <section class="nj-film" aria-label="Interactive network journey">
        <div class="nj-viewport">
          <canvas class="nj-canvas" aria-hidden="true"></canvas>
          <div class="nj-top"><span>GEAMY / INSIDE THE CONNECTION</span><span class="nj-simulation">INTERACTIVE SIMULATION</span></div>
          <div class="nj-story"><span class="nj-kicker">ONE SIGNAL. SIX LAYERS.</span>
            <p class="nj-chapter">01 / 06</p><h2 class="nj-title"></h2><p class="nj-description"></p><p class="nj-tags"></p>
          </div>
          <div class="nj-bottom">
            <div class="nj-controls"><span class="nj-instruction">Scroll to travel. Move to explore.</span>
              <button type="button" class="nj-motion" aria-pressed="false">Reduce motion</button><a href="#services" class="nj-skip">Skip experience &darr;</a>
            </div>
            <div class="nj-stages" role="group" aria-label="Choose a network stage">${STAGES.map((s,i) => `<button type="button" data-stage="${i}" aria-pressed="${i===0}"><span>0${i+1}</span>${s.name}</button>`).join('')}</div>
            <div class="nj-track" aria-hidden="true"><span></span></div>
          </div>
          <p class="nj-live sr-only" aria-live="polite"></p>
        </div>
      </section>`
    this.abort = new AbortController()
    if (!this.preview) {
      this.webglCanvas = document.createElement('canvas')
      this.webglCanvas.className = 'nj-webgl'; this.webglCanvas.setAttribute('aria-hidden','true')
      this.querySelector('.nj-viewport').prepend(this.webglCanvas)
      const signal = this.abort.signal
      import('./journey-webgl.js').then(({createJourney}) => {
        if (signal.aborted) return
        this.accelerated = createJourney(this.webglCanvas); this.paint(); this.schedule()
      }).catch(() => {})
    }
    this.media = matchMedia('(prefers-reduced-motion: reduce)')
    this.still = this.media.matches || document.documentElement.dataset.motion === 'off'
    this.target = this.preview ? .38 : 0; this.progress = this.target; this.pointer = { x:0, y:0 }
    this.active = -1; this.visible = false; this.lastFrame = 0
    this.canvas = this.querySelector('.nj-canvas, .nj-preview-canvas'); this.scene = new NetworkScene(this.canvas, this.preview)
    const on = (target, type, fn, options = {}) => target.addEventListener(type, fn, { ...options, signal:this.abort.signal })
    on(window, 'scroll', () => { if (!this.preview && !this.still) this.readScroll() }, { passive:true })
    on(window, 'resize', () => { this.scene.resize(); this.readScroll(); this.paint() }, { passive:true })
    on(document, 'visibilitychange', () => this.schedule())
    on(this.media, 'change', e => this.setStill(e.matches))
    on(window, 'geamy-motion', e => this.setStill(Boolean(e.detail.paused)))
    on(this.canvas, 'pointermove', e => {
      if (this.still || e.pointerType === 'touch') return
      const rect=this.canvas.getBoundingClientRect()
      this.pointer = { x:clamp((e.clientX-rect.left)/rect.width)*2-1, y:clamp((e.clientY-rect.top)/rect.height)*2-1 }
      this.schedule()
    }, { passive:true })
    on(this.canvas, 'pointerleave', () => { this.pointer={x:0,y:0}; this.schedule() })
    if (!this.preview) {
      on(this.canvas, 'click', e => {
        const rect=this.canvas.getBoundingClientRect(), x=e.clientX-rect.left,y=e.clientY-rect.top
        if (this.accelerated?.ready) return
        const hit = this.scene.hitAreas.find(p => Math.hypot(p.x-x,p.y-y)<p.radius)
        if (hit) this.go(hit.index)
      })
      this.querySelectorAll('[data-stage]').forEach(button => on(button,'click',() => this.go(Number(button.dataset.stage))))
      on(this.querySelector('.nj-motion'),'click',() => {
        const paused=!this.still
        document.documentElement.dataset.motion=paused ? 'off' : 'on'
        window.dispatchEvent(new CustomEvent('geamy-motion',{detail:{paused}}))
      })
      on(this.querySelector('.nj-skip'),'click',e => {
        const target=document.getElementById('services')
        if (target) { e.preventDefault(); target.scrollIntoView({behavior:'auto'}); target.setAttribute('tabindex','-1'); target.focus({preventScroll:true}) }
      })
    }
    this.resizeObserver = new ResizeObserver(() => { this.scene.resize(); this.paint() })
    this.resizeObserver.observe(this.canvas)
    this.intersection = new IntersectionObserver(([entry]) => { this.visible=entry.isIntersecting; this.schedule() })
    this.intersection.observe(this.preview ? this : this.querySelector('.nj-viewport'))
    this.setStill(this.still); this.readScroll(); this.paint()
    if (!this.scene.ctx) this.dataset.fallback='true'
  }
  readScroll() {
    if (this.preview || this.still) return
    const rect=this.getBoundingClientRect(), distance=Math.max(1,this.offsetHeight-innerHeight)
    this.target=clamp(-rect.top/distance); this.schedule()
  }
  go(index) {
    this.target=clamp(index/5)
    if (this.still) { this.progress=this.target; this.paint(); return }
    const top=this.getBoundingClientRect().top+scrollY
    window.scrollTo({ top:top+this.target*Math.max(1,this.offsetHeight-innerHeight), behavior:'smooth' })
  }
  setStill(value) {
    value = value || this.media.matches || document.documentElement.dataset.motion === 'off'
    this.still=value; this.toggleAttribute('data-still',value)
    this.pointer={x:0,y:0}
    if (!this.preview) {
      const button=this.querySelector('.nj-motion')
      button.disabled=this.media.matches
      button.setAttribute('aria-pressed',String(value)); button.textContent=value ? 'Enable motion' : 'Reduce motion'
      this.querySelector('.nj-instruction').textContent=value ? 'Choose a device to explore at your pace.' : 'Scroll to travel. Move to explore.'
    }
    this.scene?.resize(); this.progress=this.target; this.paint(); this.schedule()
  }
  schedule() {
    if (this.raf || !this.visible || document.hidden || this.still) return
    this.raf=requestAnimationFrame(time => {
      this.raf=0
      if (!this.visible || document.hidden || this.still || !this.isConnected) return
      if (time-this.lastFrame > 25) {
        this.progress+=(this.target-this.progress)*.14
        this.paint(time/1000); this.lastFrame=time
      }
      this.schedule()
    })
  }
  paint(seconds=0) {
    if (!this.scene) return
    if (this.accelerated?.ready) {
      this.canvas.style.opacity='0'; this.webglCanvas.style.opacity='1'
      this.accelerated.render(this.progress,seconds,this.pointer,this.still)
    } else {
      this.canvas.style.opacity='1'; if(this.webglCanvas)this.webglCanvas.style.opacity='0'
      this.scene.draw(this.progress,seconds,this.pointer,this.still)
    }
    if (this.preview) return
    const index=Math.min(5,Math.round(this.progress*5)), stage=STAGES[index]
    this.querySelector('.nj-track span').style.transform=`scaleX(${this.progress})`
    if (index===this.active) return
    this.active=index
    this.querySelector('.nj-title').textContent=stage.title
    this.querySelector('.nj-description').textContent=stage.copy
    this.querySelector('.nj-tags').textContent=stage.tags
    this.querySelector('.nj-chapter').textContent=`0${index+1} / 06`
    this.querySelector('.nj-live').textContent=`Stage ${index+1}: ${stage.name}. ${stage.title}`
    this.querySelectorAll('[data-stage]').forEach((button,i)=>button.setAttribute('aria-pressed',String(i===index)))
  }
  disconnectedCallback() {
    this.accelerated?.dispose(); this.accelerated=null
    this.abort?.abort(); this.abort=null; this.intersection?.disconnect(); this.resizeObserver?.disconnect(); cancelAnimationFrame(this.raf); this.raf=0
  }
}
if (!customElements.get('network-journey')) customElements.define('network-journey',NetworkJourney)
if (!customElements.get('network-preview')) customElements.define('network-preview',class extends NetworkJourney {})
