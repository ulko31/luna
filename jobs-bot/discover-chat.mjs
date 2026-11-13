// Print only group IDs from Telegram updates. Never log token or message text.
const token=process.env.TELEGRAM_BOT_TOKEN;
if(!token)throw Error('Missing OOOPS_JOBS_BOT_TOKEN secret');
const res=await fetch('https://api.telegram.org/bot'+token+'/getUpdates',{method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify({timeout:0,limit:100,allowed_updates:['message']})});
const data=await res.json();
if(!data.ok)throw Error('getUpdates failed: '+(data.description||'unknown error'));
const groups=new Map();
for(const event of data.result||[]){
 const chat=event.message?.chat;
 if(chat&&['group','supergroup'].includes(chat.type))groups.set(chat.id,chat.title||'Telegram group');
}
if(!groups.size)console.log('No group found. Add the bot to the target group and send /start or /chatid to it, then rerun discovery.');
for(const [id,title] of groups)console.log('group: '+id+' | '+title);
