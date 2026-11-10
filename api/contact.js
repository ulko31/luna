import {load,save} from './admin.js';
import {randomBytes} from 'node:crypto';
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
 const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)return res.status(403).json({error:'Origin rejected'})}catch{return res.status(403).json({error:'Origin rejected'})}}
 const {name,phone,company,service,msg}=req.body||{};
 const clean=(s,n)=>String(s||'').trim().slice(0,n);
 if(!clean(name,100)||!clean(phone,150))return res.status(400).json({error:'Имя и контакт обязательны'});
 if(clean(msg,2000).length>2000)return res.status(400).json({error:'Слишком длинное сообщение'});
 const lead={id:randomBytes(10).toString('hex'),name:clean(name,100),phone:clean(phone,150),company:clean(company,150),service:clean(service,150),msg:clean(msg,2000),status:'new',note:'',createdAt:new Date().toISOString(),source:'site'};
 let stored=false,shouldNotify=true;try{const {data,etag}=await load();if(data?.settings?.telegramNotify===false)shouldNotify=false;if(data){data.leads.unshift(lead);data.leads=data.leads.slice(0,2000);await save(data,etag);stored=true}}catch(e){console.error('OOOPS lead save:',e.message)}
 const text=['🔔 Новая заявка — OOOPS','', 'Имя: '+lead.name,'Контакт: '+lead.phone,lead.company?'Компания: '+lead.company:null,lead.service?'Услуга: '+lead.service:null,lead.msg?'Сообщение: '+lead.msg:null].filter(Boolean).join('\n');
 const TG_TOKEN=process.env.TELEGRAM_BOT_TOKEN,TG_CHAT=process.env.TELEGRAM_CHAT_ID;
 let notified=false;if(shouldNotify&&TG_TOKEN&&TG_CHAT){try{const response=await fetch('https://api.telegram.org/bot'+TG_TOKEN+'/sendMessage',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({chat_id:TG_CHAT,text})});notified=response.ok;if(!response.ok)console.error('OOOPS notification HTTP',response.status)}catch(e){console.error('OOOPS notify:',e.message)}}
 if(!stored&&!notified)return res.status(503).json({error:'Не удалось доставить заявку'});
 return res.status(200).json({ok:true,id:lead.id,stored,notified});
}