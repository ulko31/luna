// OOOPS Jobs: public channel discovery, rules-based scoring, digest to Telegram.
// No access to private groups and no scraping of authenticated sessions.
const CHANNELS = [
  'zakaz_design','GetClient','FreeVacanciesIT','frilans',
  'Koteyka_Freelancer','vacancysmm','designer_jobs','uxui_jobs',
  'jobgeeks','fordev','python_jobs','dprofilefreelance',
  'smmlancer','freelancetaverna','golubin_channel','program_job',
  'digitaltender','uiux_jobs_resumes'
];
const PORTFOLIO_URL='https://ooops-portfolio.vercel.app/';
const FRESHNESS_HOURS=72;
const MAX_DIGEST_POSTS=18;
const MAX_PER_CATEGORY=5;
const CATEGORIES = [
  {name:'Автоматизация / интеграции',weight:6,rx:/автоматизац|интеграц|api\b|crm\b|workflow|n8n|make\.com|zapier|парсинг|парсер|скрипт|бота?\b|bot\b|webhook|рутинн|процесс[а-я]* бизнес/i},
  {name:'Разработка / сайты',weight:5,rx:/разработ|frontend|backend|fullstack|фронтенд|бэкенд|вёрстк|верстк|лендинг|landing|сайт|веб.?сервис|web.app|react|next\.js|node\.js|python|javascript|typescript|telegram mini|mini app|mvp\b/i},
  {name:'UX/UI и исследование',weight:4,rx:/ux\b|ui\b|figma|прототип|дизайн интерфейс|исследовани[яе] пользовател|юзабилити|user.?flow|пользовательск.*сценари|ai.?сервис/i},
  {name:'Презентации / графика',weight:4,rx:/презентаци|powerpoint|google slides|питч.?дек|инфографик|баннер|креатив|графическ.*дизайн|дизайн\w*.*карточ|дизайнер\w*.*карточ|карточ\w*.*(?:товар|маркетплейс)|иллюстрац/i},
  {name:'Брендинг / айдентика',weight:3,rx:/брендинг|айдентик|фирменн.*стил|логотип|визуальн.*стил|упаковк/i},
  {name:'Контент / SMM / видео',weight:3,rx:/smm\b|соцсет|контент.?план|контент.?мейкер|reels|монтаж|видео|анимаци|motion|рилс|съёмк|съемк|таргетолог|менеджер\w*.*реклам|закупк\w*.*реклам|медиаплан/i},
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
  const unsafe=username=>/(?:bot|chat|group|channel)$/i.test(username)||CHANNELS.some(channel=>channel.toLowerCase()===username.toLowerCase());
  const mentions=[...text.matchAll(/(?:^|[\s(])@([A-Za-z0-9_]{5,32})\b/g)];
  const mention=mentions.map(match=>({username:match[1],index:(match.index||0)+match[0].indexOf('@')})).find(candidate=>{
    const context=text.slice(Math.max(0,candidate.index-90),candidate.index+candidate.username.length+40);
    return /пиш|связ|контакт|отклик|личк|\bлс\b|директ/i.test(context)&&!unsafe(candidate.username);
  })?.username;
  const linked=[...rawHtml.matchAll(/(?:пиш|связ|контакт|отклик|личк|\bлс\b)[\s\S]{0,180}?href=["']https:\/\/t\.me\/([A-Za-z0-9_]{5,32})(?:[/?][^"']*)?["']/gi)]
    .map(match=>match[1]).find(username=>!unsafe(username));
  const telegram=mention||linked;
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
  const copywritingOnly=/копирайтер|редактор\p{L}*|написани\p{L}*\s+(?:текст|стат|пост)/iu.test(text)&&
    !/smm\b|контент.?план|контент.?мейкер|reels|рилс|монтаж|видео|съёмк|съемк|таргет|медиаплан|дизайн|сайт|разработ|автоматизац|интеграц/iu.test(text);
  if(copywritingOnly)return null;
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
    (/(?:smm\b|таргетолог|монтаж[её]р|контент.?мейкер|менеджер\p{L}*.*реклам|закупк\p{L}*.*реклам|медиаплан)/iu.test(lead)&&named('Контент / SMM / видео'));
  const primary=rolePrimary||[...matched].sort((a,b)=>{
    const ai=lead.search(a.rx),bi=lead.search(b.rx);
    return (ai<0?9999:ai)-(bi<0?9999:bi)||b.weight-a.weight;
  })[0];
  const categories=primary?[primary,...matched.filter(c=>c!==primary)]:[];
  if (!categories.length)return null;
  const age=post.date?(now-post.date)/3600000:null;
  if(age!==null&&(age>FRESHNESS_HOURS||age< -2))return null;
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
  // Use the whole vacancy, not only its first summary sentence: the details
  // about formats, source materials and expected result make the reply useful.
  const text=String(post.text||post.summary||'').replace(/\s+/g,' ').trim();
  const category=post.categories?.[0]||'';
  let role='исполнителя на эту задачу',offer='Разберём ТЗ и предложим конкретный план работы';
  const hasDevelopment=post.categories?.includes('Разработка / сайты');
  const hasAutomation=post.categories?.includes('Автоматизация / интеграции');
  if(hasDevelopment&&hasAutomation&&/сайт|лендинг|web.?сервис/i.test(text)&&/бот|crm|api\b|интеграц|автоматизац/i.test(text)){
    role='команды для сайта и автоматизации заявок';
    offer='Разработаем сайт и свяжем формы с CRM, API или Telegram-ботом в одном рабочем сценарии';
  }else if(category==='Презентации / графика'&&/карточ/i.test(text)){
    role='дизайнера карточек';
    offer='Соберём единую визуальную систему, инфографику и адаптации под площадку';
  }else if(category==='Презентации / графика'&&/презентаци|питч.?дек|powerpoint|google slides/i.test(text)){
    role='дизайнера презентации';offer='Выстроим структуру слайдов и оформим понятную визуальную подачу';
  }else if(category==='Презентации / графика'){
    role='графического дизайнера';offer='Разработаем визуальную систему и подготовим нужные форматы без разрозненного стиля';
  }else if(category==='Брендинг / айдентика'){
    role='дизайнера айдентики';offer='Соберём концепцию, ключевые носители и правила визуального стиля под аудиторию';
  }else if(category==='UX/UI и исследование'){
    role='UX/UI-дизайнера';offer='Проработаем сценарии, прототип и интерфейс в Figma с состояниями и адаптивами';
  }else if(category==='Разработка / сайты'&&/telegram mini|mini app|мини.?прилож/i.test(text)){
    role='разработчика Telegram Mini App';offer='Спроектируем интерфейс, разработаем Mini App и подключим нужный backend/API';
  }else if(category==='Разработка / сайты'&&/интернет.?магазин|корзин|оплат|e.?commerce/i.test(text)){
    role='разработчика интернет-магазина';offer='Соберём каталог, корзину и оплату, проверим мобильный сценарий покупки';
  }else if(category==='Разработка / сайты'&&/tilda/i.test(text)){
    role='разработчика сайта на Tilda';offer='Соберём адаптивные блоки, формы и интеграции и подготовим сайт к запуску';
  }else if(category==='Разработка / сайты'&&/wordpress|вордпресс/i.test(text)){
    role='разработчика WordPress';offer='Соберём адаптивный сайт, настроим нужные формы и передадим удобное редактирование';
  }else if(category==='Разработка / сайты'&&/лендинг|landing/i.test(text)){
    role='разработчика лендинга';offer='Продумаем структуру, соберём адаптив и подключим формы и аналитику';
  }else if(category==='Разработка / сайты'){
    role='разработчика сайта или сервиса';offer='Спроектируем решение, соберём адаптив и доведём проект до рабочего запуска';
  }else if(category==='Автоматизация / интеграции'&&/telegram|телеграм|бота?\b|bot\b/i.test(text)){
    role='разработчика Telegram-бота';offer='Соберём сценарии бота, подключим API и предусмотрим удобное управление';
  }else if(category==='Автоматизация / интеграции'&&/crm|amo.?crm|api\b|n8n|make\.com|zapier|webhook/i.test(text)){
    role='специалиста по интеграциям';offer='Свяжем сервисы через API, настроим передачу данных и обработку ошибок';
  }else if(category==='Автоматизация / интеграции'&&/парсинг|парсер/i.test(text)){
    role='разработчика парсера';offer='Настроим сбор, очистку и выгрузку данных с контролем дублей и ошибок';
  }else if(category==='Автоматизация / интеграции'){
    role='специалиста по автоматизации';offer='Разберём текущий процесс и автоматизируем конкретные ручные этапы';
  }else if(category==='Контент / SMM / видео'){
    if(/монтаж|видеомонтаж|reels|shorts|рилс|youtube|подкаст/i.test(text)){
      if(/reels|shorts|рилс|вертикальн|tiktok/i.test(text)){
        role='монтажёра Reels/Shorts';offer='Смонтируем ролики из исходников: темп, субтитры, музыка и аккуратные эффекты';
      }else if(/подкаст|интервью|youtube|длинн/i.test(text)){
        role='монтажёра длинных видео';offer='Соберём выпуск, почистим паузы и добавим звук, графику и нужные вставки';
      }else{
        role='видеомонтажёра';offer='Соберём ролики по ТЗ, выстроим темп и аккуратно оформим звук, титры и графику';
      }
    }else if(/таргетолог|таргетирован|рекламн.*кабинет/i.test(text)){
      role='таргетолога';offer='Подготовим гипотезы и креативы, настроим кампании и прозрачную аналитику';
    }else if(/закупк\p{L}*.*реклам|медиаплан|посев|блогер/iu.test(text)){
      role='менеджера по рекламе';offer='Подберём площадки, соберём медиаплан и проконтролируем размещения и результаты';
    }else if(/контент.?мейкер|съёмк|съемк|фото.*видео/i.test(text)){
      role='контент-мейкера';offer='Соберём рубрики и производство фото/видео под регулярный выход контента';
    }else{
      role='SMM-специалиста';offer='Соберём рубрики, контент-план и выпуск постов/Reels с анализом результатов';
    }
  }else if(category==='Данные / аналитика'){
    role='аналитика';offer='Соберём данные, проверим метрики и подготовим понятный отчёт или дашборд';
  }
  const draft='Здравствуйте! Актуален поиск '+role+'? '+offer+'. Пришлём подходящие примеры и оценим сроки и стоимость. Портфолио: '+PORTFOLIO_URL;
  if(draft.length<=256)return draft;
  const compact='Здравствуйте! Актуален поиск '+role+'? '+offer+'. Уточним объём, сроки и стоимость. Портфолио: '+PORTFOLIO_URL;
  return compact.length<=256?compact:compact.slice(0,252).replace(/\s+\S*$/,'')+'…';
}

export function selectDigestPosts(candidates,maxPosts=MAX_DIGEST_POSTS,maxPerCategory=MAX_PER_CATEGORY){
  if(!Number.isInteger(maxPosts)||maxPosts<1||!Number.isInteger(maxPerCategory)||maxPerCategory<1){
    throw new Error('Digest limits must be positive integers');
  }
  const selected=[],counts=new Map();
  for(const post of candidates){
    const category=post.categories?.[0]||'Без категории';
    const count=counts.get(category)||0;
    if(count>=maxPerCategory)continue;
    selected.push(post);counts.set(category,count+1);
    if(selected.length>=maxPosts)break;
  }
  return selected;
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

export function parseMessageIds(value='') {
  if(!value.trim())return [];
  const ids=value.split(',').map(item=>Number(item.trim()));
  if(ids.some(id=>!Number.isSafeInteger(id)||id<1))throw new Error('TELEGRAM_EDIT_MESSAGE_IDS must contain positive numeric IDs separated by commas');
  return ids;
}

async function editTelegramReplyMarkup(messageId,replyMarkup){
  const token=process.env.TELEGRAM_BOT_TOKEN,chat_id=process.env.TELEGRAM_CHAT_ID;
  if(!token||!chat_id)throw new Error('Set TELEGRAM_BOT_TOKEN and TELEGRAM_CHAT_ID in repository Actions secrets');
  const res=await fetch('https://api.telegram.org/bot'+token+'/editMessageReplyMarkup',{
    method:'POST',headers:{'content-type':'application/json'},
    body:JSON.stringify({chat_id,message_id:messageId,reply_markup:replyMarkup})
  });
  const body=await res.json();
  if(!res.ok||!body.ok)throw Error('Telegram editMessageReplyMarkup failed: '+JSON.stringify(body).slice(0,250));
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
  const selected=selectDigestPosts(candidates);
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
  const editIds=parseMessageIds(process.env.TELEGRAM_EDIT_MESSAGE_IDS||'');
  if(editIds.length){
    if(editIds.length!==batches.length)throw new Error('Telegram edit ID count must match reply batch count');
    for(let i=0;i<batches.length;i++){
      await editTelegramReplyMarkup(editIds[i],buildReplyButtons(batches[i]));
      console.log('Updated Telegram message '+editIds[i]+' reply buttons');
    }
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
