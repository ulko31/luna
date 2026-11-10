import {get,put} from '@vercel/blob';
const PATH='ooops/private/analytics-v1.json';
const allowed=new Set(['page_view','case_view','contact_click','lead_submitted','ai_open']);
const sourceSet=new Set(['direct','search','social','referral','internal']);
const paths=new Set(['/','/case.html']);
function fresh(){return {version:1,days:{}}}
export async function loadAnalytics(){try{const b=await get(PATH,{access:'private'});if(!b)return {data:fresh(),etag:null};return {data:JSON.parse(await new Response(b.stream).text()),etag:b.etag||null}}catch(e){if(e?.status===404||e?.code==='not_found'||/not found/i.test(String(e?.message)))return {data:fresh(),etag:null};throw e}}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='POST')return res.status(405).end();
 const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).end()}catch{return res.status(403).end()}}
 const event=String(req.body?.event||'');if(!allowed.has(event))return res.status(400).end();
 const path=String(req.body?.path||'/');if(!paths.has(path))return res.status(400).end();
 const source=sourceSet.has(req.body?.source)?req.body.source:'direct';
 const today=new Date().toISOString().slice(0,10);
 try{
  for(let n=0;n<3;n++){
   const {data,etag}=await loadAnalytics();
   data.days??={};data.days[today]??={total:0,events:{},sources:{},paths:{}};
   const day=data.days[today];day.total=(day.total||0)+1;
   day.events[event]=(day.events[event]||0)+1;
   day.sources[source]=(day.sources[source]||0)+1;
   day.paths[path]=(day.paths[path]||0)+1;
   const dateLimit=new Date(Date.now()-92*86400000).toISOString().slice(0,10);
   for(const key of Object.keys(data.days))if(key<dateLimit)delete data.days[key];
   try{const opts={access:'private',allowOverwrite:true,contentType:'application/json'};if(etag)opts.ifMatch=etag;await put(PATH,JSON.stringify(data),opts);return res.status(204).end()}catch(e){if(n===2)throw e}
  }
 }catch(e){console.error('OOOPS aggregated statistics:',e?.message);return res.status(503).end()}
}