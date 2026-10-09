const TTL = 300000
const HEADERS = { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store', 'X-Content-Type-Options': 'nosniff', 'X-Frame-Options': 'DENY', 'Content-Security-Policy': "default-src 'none'; frame-ancestors 'none'", 'Referrer-Policy': 'no-referrer', 'Strict-Transport-Security': 'max-age=31536000', 'Permissions-Policy': 'camera=(), microphone=(), geolocation=()' }
const isoDate = value => typeof value === 'string' && value.length < 40 && Number.isFinite(Date.parse(value)) ? new Date(value).toISOString() : null
export function normalizeRadar(data) {
  const result = data?.result, range = result?.meta?.dateRange?.[0]
  const startTime = isoDate(range?.startTime), endTime = isoDate(range?.endTime), lastUpdated = isoDate(result?.meta?.lastUpdated)
  if (data?.success !== true || !Array.isArray(result.top_0) || !startTime || !endTime || !lastUpdated || result.meta.normalization !== 'PERCENTAGE') throw new Error('Invalid dataset')
  const locations = result.top_0.slice(0, 20).flatMap(item => {
    const share = Number(item.value)
    if (!/^[A-Z]{2}$/.test(item.originCountryAlpha2) || typeof item.originCountryName !== 'string' || item.originCountryName.length > 100 || !Number.isFinite(share) || share < 0 || share > 100) return []
    return [{ code: item.originCountryAlpha2, name: item.originCountryName, share }]
  })
  return { state: 'ready', source: 'Cloudflare Radar', metric: 'Layer 3 attack origin share', locations, startTime, endTime, lastUpdated, confidence: Number.isFinite(result.meta.confidenceInfo?.level) ? result.meta.confidenceInfo.level : null }
}
export function createNetworkHandler({ fetchImpl = fetch, now = Date.now } = {}) {
  let cached, expires = 0, pending, backoff = 0
  const reply = (data,status=200) => new Response(JSON.stringify(data),{status,headers:HEADERS})
  return async (request,env) => {
    if(request.method!=='GET') return new Response(JSON.stringify({state:'unavailable'}),{status:405,headers:{...HEADERS,Allow:'GET'}})
    if(!env.RADAR_API_TOKEN) return reply({state:'unconfigured',locations:[]})
    if(cached && now()<expires) return reply(cached)
    if(now()<backoff) return reply({state:'unavailable',locations:[]},503)
    if(!pending) pending=(async()=>{
      const controller=new AbortController(),timer=setTimeout(()=>controller.abort(),8000)
      try {
        const response=await fetchImpl('https://api.cloudflare.com/client/v4/radar/attacks/layer3/top/locations/origin?dateRange=1d&limit=20&format=JSON',{headers:{Authorization:`Bearer ${env.RADAR_API_TOKEN}`},signal:controller.signal,redirect:'error'})
        if(!response.ok)throw new Error('Upstream unavailable')
        const reader=response.body.getReader();let bytes=0,chunks=[]
        try{while(true){const part=await reader.read();if(part.done)break;bytes+=part.value.byteLength;if(bytes>131072){await reader.cancel();throw new Error('Dataset too large')}chunks.push(part.value)}}finally{reader.releaseLock()}
        const buffer=new Uint8Array(bytes);let offset=0;for(const chunk of chunks){buffer.set(chunk,offset);offset+=chunk.length}
        const data=normalizeRadar(JSON.parse(new TextDecoder('utf-8',{fatal:true}).decode(buffer)))
        if(now()-Date.parse(data.lastUpdated)>3600000 || Date.parse(data.lastUpdated)>now()+60000)throw new Error('Stale dataset')
        cached=data;expires=now()+TTL;return data
      }catch{backoff=now()+TTL;throw new Error('Data unavailable')}finally{clearTimeout(timer)}
    })().finally(()=>{pending=null})
    try{return reply(await pending)}catch{return reply({state:'unavailable',locations:[]},503)}
  }
}
