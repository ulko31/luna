import {load} from './admin.js';
import {stories} from './case-stories.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).end();
 try{
 const {data}=await load();
 if(!data)return res.status(200).json({projects:[],configured:false});
 const projects=data.projects.filter(p=>p.published).map(p=>{
  const {id,title,category,description,details,color,cover,images,posX,posY,zoom,coverFit,coverPresentation}=p;
  const fallback=stories[id]||{};
  const story={...fallback,...(p.story||{})};
  return {id,title,category,description,details,color,cover,images,posX,posY,zoom,coverFit:coverFit||'contain',coverPresentation:coverPresentation==='framed'?'framed':'clean',story};
 });
 return res.status(200).json({configured:true,projects});
 }catch(e){console.error('Public projects:',e.message);return res.status(503).json({error:'Content temporarily unavailable'})}
}