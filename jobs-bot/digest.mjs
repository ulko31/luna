// OOOPS Jobs: public channel discovery, rules-based scoring, digest to Telegram.
// No access to private groups and no scraping of authenticated sessions.
const CHANNELS = [
  'zakaz_design','GetClient','FreeVacanciesIT','frilans',
  'Koteyka_Freelancer','vacancysmm','designer_jobs','uxui_jobs',
  'jobgeeks','fordev','python_jobs','dprofilefreelance'
];
const PORTFOLIO_URL='https://ooops-portfolio.vercel.app/';
const CATEGORIES = [
  {name:'Автоматизация / интеграции',weight:6,rx:/автоматизац|интеграц|api\b|crm\b|workflow|n8n|make\.com|zapier|парсинг|парсер|скрипт|бота?\b|bot\b|webhook|рутинн|процесс[а-я]* бизнес/i},
  {name:'Разработка / сайты',weight:5,rx:/разработ|frontend|backend|fullstack|фронтенд|бэкенд|вёрстк|верстк|лендинг|landing|сайт|веб.?сервис|web.app|react|next\.js|node\.js|python|javascript|typescript|telegram mini|mini app|mvp\b/i},
  {name:'UX/UI и исследование',weight:4,rx:/ux\b|ui\b|figma|прототип|дизайн интерфейс|исследовани[яе] пользовател|юзабилити|user.?flow|пользовательск.*сценари|ai.?сервис/i},
  {name:'Презентации / графика',weight:4,rx:/презентаци|powerpoint|google slides|питч.?дек|инфографик|баннер|креатив|графическ.*дизайн|дизайн\w*.*карточ|дизайнер\w*.*карточ|карточ\w*.*(?:товар|маркетплейс)|иллюстрац/i},
  {name:'Брендинг / айдентика',weight:3,rx:/брендинг|айдентик|фирменн.*стил|логотип|визуальн.*стил|упаковк/i},
  {name:'Контент / SMM / видео',weight:3,rx:/smm\b|соцсет|контент|reels|монтаж|видео|анимаци|motion|рилс|съёмк|съемк|таргетолог|копирайтер|менеджер\w*.*реклам|закупк\w*.*реклам|медиаплан/i},
  {name:'Данные / аналитика',weight:3,rx:/аналитик|дашборд|dashboard|sql\b|данных|data analyst|визуализац.*данн/i}
];
const POSITIVE = /ищем|нужен|нужна|требует|заказ|проект|ищу|тз\b|задач|бюджет|оплата|удал[её]н|фриланс|сотрудничеств|looking for|hiring|freelance/i;
const NEGATIVE = /предлагаю свои услуги|ищу работу|мо[её] портфолио|резюме кандидата|#резюме\b|#помогу\b|окажу услуги|возьму.*заказ|есть идея или задача|ищу заказчиков|ищем клиентов|ищу (?:экспертов|бренды|блогеров|предпринимателей|проекты)|которые хотят (?:увеличить|продвинуть)|(?:^|[.!?\n])\s*я\s+.{0,45}(?:креатор|маркетолог|дизайнер|специалист)|вы работаете с .{0,50}не знаете|где искать заказы|лид.?магнит|подпишитесь|бесплатн.*(?:гайд|вебинар)|курсы обучения|стажировк.*без оплаты|вакансия закрыта/i;
const FULLTIME = /строго в офисе|только офис|полная занятость.*офис|5\/2 в офисе/i;
const RISKY = /оплат[аи] доступ|взнос|первоначальн.*оплат|депозит для работы|без оплаты|работа за идею|проект.*энтузиазм|казино|ставки на спорт|букмекер|вейп|никотин|оружие|наркотик/i;
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

export function findContact(text,rawHtml='') {
  const href=[...rawHtml.matchAll(/href=["']https:\/\/t\.me\/([A-Za-z0-9_]{5,32})(?:[/?][^"']*)?["']/gi)]
    .map(match=>match[1])[0];
  const mention=text.match(/(?:^|[\s(])@([A-Za-z0-9_]{5,32})\b/)?.[1];
  const telegram=href||mention;
  if(telegram)return {type:'telegram',value:telegram};
  const email=text.match(/\b[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}\b/i)?.[0];
  if(email)return {type:'email',value:email};
  return null;
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
    const links=[...block.matchAll(/href=["'](https:\/\/(?:www\.)?dprofile\.ru\/job\/\d+\/[a-zA-Z0-9-]+)[^"']*["']/gi)]
      .map(match=>match[1]);
    const directJob=channel==='dprofilefreelance'?links[0]:null;
    posts.push({id,source:channel,date:time?new Date(time):null,text,
      url:directJob||'https://t.me/'+id,contact:findContact(text,raw||'')});
  }
  return posts;
}

export function assess(post,now=new Date()) {
  const text=post.text.replace(/\s+/g,' ').slice(0,5000);
  if (NEGATIVE.test(text) || FULLTIME.test(text) || RISKY.test(text)) return null;
  const directDprofile=post.source==='dprofilefreelance'&&/^https:\/\/(?:www\.)?dprofile\.ru\/job\/\d+\//.test(post.url);
  if (!POSITIVE.test(text) && !directDprofile) return null;
  const matched=CATEGORIES.filter(c=>c.rx.test(text));
  const lead=text.slice(0,700);
  const headline=lead.slice(0,240);
  const named=name=>matched.find(category=>category.name===name);
  const rolePrimary=
    (/ux\b|ui\b|дизайн\p{L}*.*интерфейс|интерфейс.*дизайн/iu.test(lead)&&named('UX/UI и исследование'))||
    (/бренд.?дизайнер|айдентик|фирменн\p{L}*.*стил|логотип/iu.test(lead)&&named('Брендинг / айдентика'))||
    (/(?:графическ|визуальн)\p{L}*\s+дизайнер|(?:#дизайнер\p{L}*|ищ\p{L}*\s+дизайнер|дизайнер\p{L}*.*(?:карточ|материал|презентац|баннер|обложк|полиграф))|карточ\p{L}*.*(?:товар|маркетплейс)/iu.test(headline)&&named('Презентации / графика'))||
    (/(?:tilda|сделать\s+сайт|разработ\p{L}*\s+(?:сайт|лендинг)|лендинг|web.?сервис)/iu.test(lead)&&named('Разработка / сайты'))||
    (/(?:графическ|визуальн)\p{L}*\s+дизайнер|(?:#дизайнер\p{L}*|ищ\p{L}*\s+дизайнер|дизайнер\p{L}*.*(?:карточ|материал|презентац|баннер|обложк|полиграф))|карточ\p{L}*.*(?:товар|маркетплейс)/iu.test(lead)&&named('Презентации / графика'))||
    (/(?:smm\b|таргетолог|копирайтер|монтаж[её]р|менеджер\p{L}*.*реклам|закупк\p{L}*.*реклам|медиаплан)/iu.test(lead)&&named('Контент / SMM / видео'));
  const primary=rolePrimary||[...matched].sort((a,b)=>{
    const ai=lead.search(a.rx),bi=lead.search(b.rx);
    return (ai<0?9999:ai)-(bi<0?9999:bi)||b.weight-a.weight;
  })[0];
  const categories=primary?[primary,...matched.filter(c=>c!==primary)]:[];
  if (!categories.length)return null;
  const age=post.date?(now-post.date)/3600000:null;
  if(age!==null&&(age>48||age< -2))return null;
  const scores=categories.reduce((a,c)=>a+c.weight,0);
  const boost=(/бюджет|₽|руб|\$|оплат/i.test(text)?2:0)+(/на проект|проектн|разов|фриланс|удал[её]н/i.test(text)?2:0);
  const score=Math.min(20,scores+boost);
  if(score<(directDprofile?4:5))return null;
  const budgetText=text.replace(/(?<=\d)\.(?=\d{3}(?:\D|$))/g,' ');
  const budgetRaw=budgetText.match(/(?:^|[\s,.;(])(?:бюджет|оплата|стоимость|доход|ставка|зарплата)(?=$|[\s:—-])\s*[:—-]?\s*([^\n.!]{3,90})/iu)?.[1]?.trim();
  const money=budgetRaw?.match(/(?:от\s+)?\d[\d\s]*(?:[.,]\d+)?(?:\s*[–—-]\s*\d[\d\s]*(?:[.,]\d+)?)?\s*(?:₽|руб(?:\.|лей|ля)?|\$|€|тыс(?:\.|яч)?(?:\s*₽)?)/iu)?.[0]?.trim();
  const budget=money||(budgetRaw&&/договор/iu.test(budgetRaw)?'договорная':'не указан');
  const summary=text.split(/\n|[.!?](?=\s)/).map(x=>x.trim()).filter(x=>x.length>20)[0]||text;
  return {...post,categories:categories.map(c=>c.name),score,budget:budget.slice(0,70),summary:summary.slice(0,190)};
}

function escapeHtml(s) {return String(s).replace(/&/g,'&amp;').replace(/</g,'&lt;').replace(/>/g,'&gt;').replace(/"/g,'&quot;');}

export function buildReplyDraft(post) {
  const text=String(post.summary||post.text||'').replace(/\s+/g,' ').trim();
  const category=post.categories?.[0]||'';
  let task='вашей задаче',solution='уточнить детали и предложить подходящее решение';
  if(category==='Презентации / графика'&&/карточ/i.test(text)){
    task='дизайну карточек';
    solution='продумать визуальную систему и собрать карточки в едином стиле';
  }else if(category==='Презентации / графика'&&/презентаци|питч.?дек|powerpoint|google slides/i.test(text)){
    task='дизайну презентации';solution='выстроить структуру и оформить понятную визуальную подачу';
  }else if(category==='Презентации / графика'){
    task='графическому дизайну';solution='разработать визуальную систему и подготовить нужные материалы';
  }else if(category==='Брендинг / айдентика'){
    task='брендингу';solution='собрать целостную айдентику под продукт и аудиторию';
  }else if(category==='UX/UI и исследование'){
    task='UX/UI-дизайну';solution='проработать пользовательский путь и собрать интерфейс в Figma';
  }else if(category==='Разработка / сайты'){
    task='разработке сайта или сервиса';solution='спроектировать решение и довести его до работающего запуска';
  }else if(category==='Автоматизация / интеграции'){
    task='автоматизации';solution='разобрать процесс и собрать рабочую автоматизацию';
  }else if(category==='Контент / SMM / видео'){
    task='контенту и продвижению';solution='собрать понятную концепцию и подготовить материалы';
  }else if(category==='Данные / аналитика'){
    task='аналитике';solution='разобрать данные и подготовить понятный результат';
  }
  const draft='Здравствуйте! Увидели ваш запрос по '+task+'. Можем подключиться: '+solution+'. Подскажите, задача ещё актуальна? Если да, уточним объём и предложим сроки и стоимость. Работы: '+PORTFOLIO_URL;
  if(draft.length<=256)return draft;
  const compact='Здравствуйте! Увидели ваш запрос по '+task+'. Можем подключиться: '+solution+'. Задача ещё актуальна? Уточним объём, сроки и стоимость. Работы: '+PORTFOLIO_URL;
  return compact.length<=256?compact:compact.slice(0,252).replace(/\s+\S*$/,'')+'…';
}

export function buildReplyButtons(posts) {
  const inline_keyboard=[];
  posts.forEach((post,index)=>{
    const number=index+1,draft=buildReplyDraft(post);
    const copy={text:'📋 Текст '+number,copy_text:{text:draft}};
    if(post.contact?.type==='telegram'){
      inline_keyboard.push([
        {text:'✍️ Отклик '+number,url:'https://t.me/'+post.contact.value+'?text='+encodeURIComponent(draft)},
        copy
      ]);
    }else{
      inline_keyboard.push([copy,{text:'🔗 Объявление '+number,url:post.url}]);
    }
  });
  return inline_keyboard.length?{inline_keyboard}:null;
}

export function splitReplyBatches(posts,size=3) {
  if(!Number.isInteger(size)||size<1)throw new Error('Reply batch size must be a positive integer');
  const batches=[];
  for(let i=0;i<posts.length;i+=size)batches.push(posts.slice(i,i+size));
  return batches;
}

export function renderDigest(posts,now=new Date(),sourceNotice='') {
  const date=new Intl.DateTimeFormat('ru-RU',{day:'numeric',month:'long',timeZone:'Europe/Moscow'}).format(now);
  let text='<b>OOOPS Jobs · '+escapeHtml(date)+'</b>\n';
  text+='Подборка заказов по всем направлениям студии. Откликаться только после проверки условий.\n\n';
  if(sourceNotice)text+='⚠️ '+escapeHtml(sourceNotice)+'\n\n';
  if(!posts.length)return text+'Подходящих свежих объявлений не нашлось. Проверьте источники вручную.';
  for(let i=0;i<posts.length;i++){
    const p=posts[i];
    text+='<b>'+(i+1)+'. '+escapeHtml(p.categories[0])+'</b> · '+p.score+'/20\n';
    text+=escapeHtml(p.summary).slice(0,220)+'\n';
    text+='Бюджет: '+escapeHtml(p.budget)+'\n';
    text+='<a href="'+p.url+'">Объявление / контакт</a> · #'+escapeHtml(p.source)+'\n\n';
  }
  text+='«Отклик» открывает Telegram-контакт с готовым черновиком. «Текст» копирует его для других площадок. Отправка всегда вручную.\n\n';
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
    if(!html.includes('tgme_widget_message'))throw new Error('No Telegram message markup (source may be blocked or empty)');
    const posts=extractPosts(html,channel);
    process.stderr.write('[source] '+channel+': '+posts.length+' public messages; '+(posts.length?'OK':'EMPTY')+'\n');
    return {channel,status:posts.length?'ok':'empty',posts};
  }catch(e){
    const reason=e.name==='AbortError'?'timeout':e.message;
    process.stderr.write('[source] '+channel+': UNAVAILABLE ('+reason+')\n');
    return {channel,status:'unavailable',reason,posts:[]};
  }finally{clearTimeout(timer)}
}

async function sendToTelegram(message,replyMarkup=null){
  const token=process.env.TELEGRAM_BOT_TOKEN,chat_id=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat_id)throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in repository Actions secrets');
  const threadRaw=process.env.TELEGRAM_THREAD_ID?.trim();
  if(threadRaw && !/^[1-9]\d*$/.test(threadRaw))throw new Error('TELEGRAM_THREAD_ID must be a positive numeric Telegram topic ID');
  const payload={chat_id,text:message,parse_mode:'HTML',disable_web_page_preview:true};
  if(threadRaw)payload.message_thread_id=Number(threadRaw);
  if(replyMarkup)payload.reply_markup=replyMarkup;
  const res=await fetch('https://api.telegram.org/bot'+token+'/sendMessage',{
    method:'POST',headers:{'content-type':'application/json'},body:JSON.stringify(payload)
  });
  const body=await res.json();
  if(!res.ok||!body.ok)throw Error('Telegram sendMessage failed: '+JSON.stringify(body).slice(0,250));
  return body.result?.message_id;
}

async function main(){
  const now=new Date();
  const channels=(process.env.CHANNELS||CHANNELS.join(',')).split(',').map(x=>x.trim().replace(/^@/,'')).filter(x=>/^[A-Za-z0-9_]{5,32}$/.test(x));
  const sources=await Promise.all(channels.map(fetchPosts));
  const unique=new Map(sources.flatMap(source=>source.posts).map(p=>[p.id,p]));
  const candidates=[...unique.values()].map(p=>assess(p,now)).filter(Boolean)
    .sort((a,b)=>b.score-a.score||(b.date||0)-(a.date||0));
  const sourceSummary=sources.map(x=>x.channel+': '+x.status+' ('+x.posts.length+')').join(' | ');
  process.stderr.write('[sources] '+sourceSummary+'\n');
  const dprofileSource=sources.find(x=>x.channel==='dprofilefreelance');
  if(dprofileSource && dprofileSource.status!=='ok'){
    process.stderr.write('[warning] Dprofile feed '+dprofileSource.status+'; this does not mean Dprofile.ru is down.\n');
  }
  if(candidates.length===0)process.stderr.write('[warning] No matched posts. Check per-source status, freshness window and job filters.\n');
  const selected=[],counts=new Map();
  for(const p of candidates){
    const cat=p.categories[0],n=counts.get(cat)||0;
    if(n>=3)continue;
    selected.push(p);counts.set(cat,n+1);
    if(selected.length>=8)break;
  }
  const sourceNotice=dprofileSource?.status==='unavailable'
    ?'Источник Dprofile временно недоступен боту. Остальные каналы проверены независимо.'
    :dprofileSource?.status==='empty'
    ?'Из канала Dprofile не удалось извлечь объявления. Сайт Dprofile может при этом работать.'
    :'';
  const batches=selected.length?splitReplyBatches(selected):[[]];
  if(process.env.DRY_RUN==='1'){
    batches.forEach((batch,index)=>{
      const notice=index===0?sourceNotice:'';
      console.log(renderDigest(batch,now,notice));
      console.log('\n[reply-buttons '+(index+1)+'/'+batches.length+'] '+JSON.stringify(buildReplyButtons(batch)));
    });
    return;
  }
  for(let i=0;i<batches.length;i++){
    const batch=batches[i],notice=i===0?sourceNotice:'';
    const messageId=await sendToTelegram(renderDigest(batch,now,notice),buildReplyButtons(batch));
    console.log('Telegram message '+(i+1)+'/'+batches.length+' ID: '+messageId);
  }
  console.log('Sent '+selected.length+' public job postings in '+batches.length+' Telegram message(s) with reply drafts');
}

if(process.argv[1]&&import.meta.url===new URL('file://'+process.argv[1]).href){main().catch(e=>{console.error(e.message);process.exitCode=1})}
