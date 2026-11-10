import {load,publicTeam,publicSite} from './admin.js';
export default async function handler(req,res){
 res.setHeader('Cache-Control','public, max-age=0, s-maxage=30');
 if(req.method!=='GET')return res.status(405).end();
 try{const {data}=await load();if(!data)return res.status(200).json({configured:false});
 return res.status(200).json({configured:true,team:publicTeam(data),content:publicSite(data)})}
 catch(e){console.error('Public site content:',e.message);return res.status(503).json({error:'Site content unavailable'})}
}