import {load} from './admin.js';
import {stories} from './case-stories.js';
import {portfolioResources} from './portfolio-resources.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).end();
 try{
 const {data}=await load();
 if(!data)return res.status(200).json({projects:Object.entries(portfolioResources).map(([id,p])=>({id,title:p.title,category:p.category,description:p.description,color:p.color,cover:'',images:[],story:stories[id]||{}})),configured:false});
 const projects=data.projects.filter(p=>p.published).map(p=>{
  const {id,title,category,description,details,color,cover,images,posX,posY,zoom,coverFit,coverPresentation}=p;
  const fallback=stories[id]||{};
  const story={...fallback,...(p.story||{})};
  return {id,title,category,description,details,color,cover,images,posX,posY,zoom,coverFit:coverFit||'contain',coverPresentation:coverPresentation==='framed'?'framed':'clean',story};
 });
 for(const [id,source] of Object.entries(portfolioResources)) {
  if(!projects.some(p=>p.id===id)) projects.push({id,title:source.title,category:source.category,description:source.description,color:source.color,cover:'',images:[],story:stories[id]||{}});
 }
 return res.status(200).json({configured:true,projects});
 }catch(e){console.error('Public projects:',e.message);return res.status(503).json({error:'Content temporarily unavailable'})}
}