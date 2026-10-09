import test from 'node:test'
import assert from 'node:assert/strict'
import { createNetworkHandler, normalizeRadar } from '../lib/network.js'
import { parseRoutingMessage } from '../src/components/live-network.js'
const timestamp=Date.now()/1000
const message={type:'ris_message',data:{type:'UPDATE',host:'rrc00.ripe.net',timestamp,path:[202365,3356,1501],announcements:[{prefixes:['155.20.24.0/24']}]}}
test('routing accepts recent announcements and preserves logical AS paths',()=>{
 assert.deepEqual(parseRoutingMessage(JSON.stringify(message)).path,[202365,3356,1501]);assert.equal(parseRoutingMessage(JSON.stringify(message)).host,'rrc00')
})
test('routing rejects stale, unknown, malformed and oversized observations',()=>{
 for(const raw of ['bad','x'.repeat(65537),JSON.stringify({...message,data:{...message.data,timestamp:timestamp-121}}),JSON.stringify({...message,data:{...message.data,host:'unknown'}}),JSON.stringify({...message,data:{...message.data,path:[{}]}})])assert.equal(parseRoutingMessage(raw),null)
})
const now=Date.now(), date=new Date(now).toISOString()
const fixture={success:true,result:{meta:{normalization:'PERCENTAGE',lastUpdated:date,dateRange:[{startTime:new Date(now-86400000).toISOString(),endTime:date}],confidenceInfo:{level:5}},top_0:[{originCountryAlpha2:'US',originCountryName:'United States',value:'12.34'}]}}
test('Radar preserves percentages and the observation window',()=>{
 const data=normalizeRadar(fixture);assert.equal(data.locations[0].share,12.34);assert.equal(data.lastUpdated,date);assert.equal(data.confidence,5)
 assert.throws(()=>normalizeRadar({success:false}));assert.throws(()=>normalizeRadar({...fixture,result:{...fixture.result,meta:{...fixture.result.meta,normalization:'RAW_VALUES'}}}))
})
test('unconfigured API performs no upstream request and invents no attacks',async()=>{
 const handle=createNetworkHandler({fetchImpl:()=>assert.fail('upstream requested')})
 const res=await handle(new Request('https://example.com/api/network'),{});assert.equal(res.status,200);assert.equal(res.headers.get('cache-control'),'no-store');assert.deepEqual(await res.json(),{state:'unconfigured',locations:[]})
 const post=await handle(new Request('https://example.com/api/network',{method:'POST'}),{});assert.equal(post.status,405)
})
test('Radar coalesces requests, caches, fixes upstream and keeps token private',async()=>{
 let calls=0;const handle=createNetworkHandler({now:()=>now,fetchImpl:async(url,options)=>{calls++;assert.match(url,/^https:\/\/api.cloudflare.com\/client\/v4\/radar\/attacks\/layer3\/top\/locations\/origin\?/);assert.equal(options.headers.Authorization,'Bearer private-token');assert.equal(options.redirect,'error');return Response.json(fixture)}})
 const results=await Promise.all([1,2,3].map(()=>handle(new Request('https://example.com/api/network?url=https://evil.test'),{RADAR_API_TOKEN:'private-token'})))
 assert.equal(calls,1);assert.equal(results[0].status,200);assert.doesNotMatch(await results[0].text(),/private-token|Authorization/)
 await handle(new Request('https://example.com/api/network'),{RADAR_API_TOKEN:'private-token'});assert.equal(calls,1)
})
test('Radar fails closed and backs off on errors or old datasets',async()=>{
 for(const fetchImpl of [async()=>new Response('secret failure',{status:429}),async()=>Response.json({...fixture,result:{...fixture.result,meta:{...fixture.result.meta,lastUpdated:new Date(now-7200000).toISOString()}}}),async()=>new Response('x'.repeat(131073))]){
 let calls=0;const handle=createNetworkHandler({now:()=>now,fetchImpl:(...args)=>{calls++;return fetchImpl(...args)}})
 const res=await handle(new Request('https://example.com/api/network'),{RADAR_API_TOKEN:'private-token'});assert.equal(res.status,503);assert.deepEqual(await res.json(),{state:'unavailable',locations:[]});await handle(new Request('https://example.com/api/network'),{RADAR_API_TOKEN:'private-token'});assert.equal(calls,1)
 }
})
