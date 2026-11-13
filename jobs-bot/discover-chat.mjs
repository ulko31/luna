// Discover numeric Telegram group / forum topic IDs without logging tokens or messages.
const token=process.env.TELEGRAM_BOT_TOKEN;
if(!token)throw Error('Missing OOOPS_JOBS_BOT_TOKEN secret');
const res=await fetch('https://api.telegram.org/bot'+token+'/getUpdates',{
  method:'POST',headers:{'content-type':'application/json'},
  body:JSON.stringify({timeout:0,limit:100,allowed_updates:['message']})
});
const data=await res.json();
if(!data.ok)throw Error('getUpdates failed: '+(data.description||'unknown error'));
const groups=new Map();
const topics=new Map();
for(const event of data.result||[]){
  const message=event.message;
  const chat=message?.chat;
  if(!chat||!['group','supergroup'].includes(chat.type))continue;
  groups.set(chat.id,chat.title||'Telegram group');
  // A command sent inside a forum topic carries message_thread_id.
  // Never print a message body or sender details.
  if(Number.isSafeInteger(message.message_thread_id)){
    const key=chat.id+':'+message.message_thread_id;
    topics.set(key,{chatId:chat.id,threadId:message.message_thread_id,title:chat.title||'Telegram group'});
  }
}
if(!groups.size)console.log('No group found. Send /chatid@your_bot_username inside the target Telegram topic and rerun discover.');
for(const [id,title] of groups)console.log('group: '+id+' | '+title);
if(!topics.size)console.log('No topic thread found yet. Open the target topic, send /chatid@your_bot_username (no spaces) and rerun discover.');
for(const t of topics.values())console.log('topic: group='+t.chatId+' | thread='+t.threadId+' | '+t.title);
