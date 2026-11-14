// OOOPS Jobs: public channel discovery, rules-based scoring, digest to Telegram.
// No access to private groups and no scraping of authenticated sessions.
const CHANNELS = [
  'zakaz_design','GetClient','FreeVacanciesIT','frilans',
  'Koteyka_Freelancer','vacancysmm','designer_jobs','uxui_jobs',
  'jobgeeks','fordev','python_jobs','dprofilefreelance'
];
const CATEGORIES = [
  {name:'Автоматизация / интеграции',weight:6,rx:/автоматизац|интеграц|api\b|crm\b|workflow|n8n|make\.com|zapier|парсинг|парсер|скрипт|бота?\b|bot\b|webhook|рутинн|процесс[а-я]* бизнес/i},
  {name:'Разработка / сайты',weight:5,rx:/разработ|frontend|backend|fullstack|фронтенд|бэкенд|вёрстк|верстк|лендинг|landing|сайт|веб.?сервис|web.app|react|next\.js|node\.js|python|javascript|typescript|telegram mini|mini app|mvp\b/i},
  {name:'UX/UI и исследование',weight:4,rx:/ux\b|ui\b|figma|прототип|дизайн интерфейс|исследовани[яе] пользовател|юзабилити|user.?flow|пользовательск.*сценари|ai.?сервис/i},
  {name:'Презентации / графика',weight:4,rx:/презентаци|powerpoint|google slides|питч.?дек|инфографик|баннер|креатив|графическ.*дизайн|иллюстрац/i},
  {name:'Брендинг / айдентика',weight:3,rx:/брендинг|айдентик|фирменн.*стил|логотип|визуальн.*стил|упаковк/i},
  {name:'Контент / SMM / видео',weight:3,rx:/smm\b|соцсет|контент|reels|монтаж|видео|анимаци|motion|рилс|съёмк|съемк/i},
  {name:'Данные / аналитика',weight:3,rx:/аналитик|дашборд|dashboard|sql\b|данных|data analyst|визуализац.*данн/i}
];
const POSITIVE = /ищем|нужен|нужна|требует|заказ|проект|ищу|тз\b|задач|бюджет|оплата|удал[её]н|фриланс|сотрудничеств|looking for|hiring|freelance/i;
const NEGATIVE = /предлагаю свои услуги|ищу работу|мо[её] портфолио|резюме кандидата|ищу заказчиков|ищем клиентов|бесплатный вебинар|курсы обучения|стажировк.*без оплаты|вакансия закрыта/i;
const FULLTIME = /строго в офисе|только офис|полная занятость.*офис|5\/2 в офисе/i;
const RISKY = /оплат[аи] доступ|взнос|первоначальн.*оплат|депозит для работы|казино|ставки на спорт|букмекер|вейп|никотин|оружие|наркотик/i;
const seen = new Set();

function decodeEntities(s) {
  return s.replace(/&nbsp;|&#160;/gi,' ').replace(/&amp;/gi,'&')
    .replace(/&quot;/gi,'"').replace(/&#39;|&apos;/gi,"'")
    .replace(/&lt;/gi,'<').replace(/&gt;/gi,'>')
    .replace(/&#(\d+);/g,(_,n)=>String.fromCodePoint(Number(n)))
    .replace(/&#x([\da-f]+);/gi,(_,n)=>String.fromCodePoint(parseInt(n,16)));
}
function cleanHtml(s) {
  return decodeEntities(s.replace(/<br\s*\/?\s*>/gi,'\n')
    .replace(/<\/(p|div)>/gi,'\n').replace(/<[^>]*>/g,' ')
    .replace(/[ \t]+/g,' ').replace(/\n\s*\n+/g,'\n').trim());
}
export function extractPosts(html,channel) {
  const blocks = html.split(/(?=<div\s+class="tgme_widget_message\s)/i);
  const posts=[];
  for (const block of blocks) {
    const id = block.match(/data-post=["']([A-Za-z0-9_]+\/\d+)["']/)?.[1];
    if (!id || !id.startsWith(channel+'/')) continue;
    const time = block.match(/<time[^>]*datetime=["']([^"']+)["']/)?.[1];
    const raw = block.match(/<div[^>]*class=["'][^"']*tgme_widget_message_text[^"']*["'][^>]*>([\s\S]*?)<\/div>/i)?.[1];
    const text=raw?cleanHtml(raw):'';
    if(!text || text.length<35 || seen.has(id))continue;
    seen.add(id);
    // Official Dprofile orders channel: prefer the original public job page
    // over a Telegram repost when it contains an explicit Dprofile job link.
    const links=[...block.matchAll(/href=["'](https:\/\/(?:www\.)?dprofile\.ru\/job\/\d+\/[a-zA-Z0-9-]+)[^"']*["']/gi)]
      .map(match=>match[1]);
    const directJob=channel==='dprofilefreelance'?links[0]:null;
    posts.push({id,source:channel,date:time?new Date(time):null,text,
      url:directJob||'https://t.me/'+id});
  }
  return posts;
}
export function assess(post,now=new Date()) {
  const text=post.text.replace(/\s+/g,' ').slice(0,5000);
  if (NEGATIVE.test(text) || FULLTIME.test(text) || RISKY.test(text)) return null;
  // Dprofile's editorial posts can be titled as briefs rather than "Ищем...".
  // Only relax the wording requirement for a verified-looking direct job link
  // from the official orders channel; all category and exclusion checks stay.
  const directDprofile=post.source==='dprofilefreelance'&&/^https:\/\/(?:www\.)?dprofile\.ru\/job\/\d+\//.test(post.url);
  if (!POSITIVE.test(text) && !directDprofile) return null;
  const categories=CATEGORIES.filter(c=>c.rx.test(text));
  if (!categories.length)return null;
  const age=post.date?(now-post.date)/3600000:null;
  if(age!==null&&(age>48||age< -2))return null;
  const scores=categories.reduce((a,c)=>a+c.weight,0);
  const boost=(/бюджет|₽|руб|\$|оплат/i.test(text)?2:0)+(/на проект|проектн|разов|фриланс|удал[её]н/i.test(text)?2:0);
  const score=Math.min(20,scores+boost);
  if(score<5)return null;
  const budget=text.match(/(?:бюджет|оплата|стоимость)\s*[:—-]?\s*([^\n.!]{3,65})/i)?.[1]?.trim()||'не указан';
  const summary=text.split(/\n|[.!?](?=\s)/).map(x=>x.trim()).filter(x=>x.length>20)[0]||text;
  return {...post,categories:categories.map(c=>c.name),score,budget:budget.slice(0,70),summary:summary.slice(0,190)};
}
function escapeHtml(s) {return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}
export function renderDigest(posts,now=new Date()) {
  const date=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'}).format(now);
  let text='<b>OOOPS Jobs · '+escapeHtml(date)+'</b>\n';
  text+='Подборка заказов по всем направлениям студии. Откликаться только после проверки условий.\n\n';
  if(!posts.length)return text+'Подходящих свежих объявлений не нашлось. Проверьте источники вручную.';
  for(let i=0;i<posts.length;i++){
    const p=posts[i];
    text+='<b>'+(i+1)+'. '+escapeHtml(p.categories[0])+'</b> · '+p.score+'/20\n';
    text+=escapeHtml(p.summary).slice(0,220)+'\n';
    text+='Бюджет: '+escapeHtml(p.budget)+'\n';
    text+='<a href="'+p.url+'">Объявление / контакт</a> · #'+escapeHtml(p.source)+'\n\n';
  }
  text+='Проверяйте дату, репутацию заказчика, оплату и актуальность. Рейтинг — эвристика, не гарантия заказа.';
  return text.slice(0,3950);
}
async function fetchPosts(channel) {
  const url='https://t.me/s/'+channel;
  const ac=new AbortController(),timer=setTimeout(()=>ac.abort(),14000);
  try{
    const res=await fetch(url,{signal:ac.signal,headers:{'User-Agent':'Mozilla/5.0 (compatible; OOOPSJobs/1.0)'}});
    if(!res.ok)throw new Error('HTTP '+res.status);
    const html=await res.text();
    const posts=extractPosts(html,channel);
    process.stderr.write(channel+': '+posts.length+' public messages\n');
    return posts;
  }catch(e){process.stderr.write(channel+': '+e.message+'\n');return []}
  finally{clearTimeout(timer)}
}
async function sendToTelegram(message){
  const token=process.env.TELEGRAM_BOT_TOKEN,chat_id=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat_id)throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in repository Actions secrets');
  const threadRaw=process.env.TELEGRAM_THREAD_ID?.trim();
  if(threadRaw && !/^[1-9]\d*$/.test(threadRaw))throw new Error('TELEGRAM_THREAD_ID must be a positive numeric Telegram topic ID');
  const payload={chat_id,text:message,parse_mode:'HTML',disable_web_page_preview:true};
  if(threadRaw)payload.message_thread_id=Number(threadRaw);
  const res=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify(payload)
  });
  const body=await res.json();
  if(!res.ok||!body.ok)throw Error('Telegram sendMessage failed: '+JSON.stringify(body).slice(0,250));
}
async function main(){
  const now=new Date();
  const channels=(process.env.CHANNELS||CHANNELS.join(',')).split(',').map(x=>x.trim().replace(/^@/,'')).filter(x=>/^[A-Za-z0-9_]{5,32}$/.test(x));
  const groups=await Promise.all(channels.map(fetchPosts));
  const unique=new Map(groups.flat().map(p=>[p.id,p]));
  const candidates=[...unique.values()].map(p=>assess(p,now)).filter(Boolean)
    .sort((a,b)=>b.score-a.score||(b.date||0)-(a.date||0));
  // Cap repetitive categories to keep the feed diverse.
  const selected=[],counts=new Map();
  for(const p of candidates){
    const cat=p.categories[0],n=counts.get(cat)||0;
    if(n>=3)continue;
    selected.push(p);counts.set(cat,n+1);
    if(selected.length>=8)break;
  }
  const digest=renderDigest(selected,now);
  if(process.env.DRY_RUN==='1'){console.log(digest);return}
  await sendToTelegram(digest);
  console.log('Sent '+selected.length+' public job postings to the configured Telegram chat');
}
if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){main().catch(e=>{console.error(e.message);process.exitCode=1})}
