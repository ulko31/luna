import {loadAnalytics} from './track.js';
import {get,put,head} from '@vercel/blob';
import {randomBytes,createHmac,scryptSync,timingSafeEqual} from 'node:crypto';
const PATH='ooops/private/state-v1.json', TTL=12*3600;
const bootstrap=[
{id:'sofe',title:'SOFE',category:'Приложение / MVP',description:'Wellness-приложение: продуктовая концепция, UX, разработка и MVP.',details:'SOFE — продукт для питания и активности.',color:'#eea1c7',cover:'https://raw.githubusercontent.com/ulko31/sofe/main/images/main.png',images:[{id:'sofe-original',url:'https://raw.githubusercontent.com/ulko31/sofe/main/images/main.png'}],posX:50,posY:50,zoom:100,coverFit:'contain',published:true},
{id:'stankevich',title:'Кружок Станкевича',category:'Сайт / Образование',description:'Дизайн сайта образовательного проекта.',details:'Работа из дизайн-портфолио.',color:'#9cc9f5',cover:'/assets/cases/stankevich.svg',images:[{id:'stank-original',url:'/assets/cases/stankevich.svg'}],posX:50,posY:50,zoom:100,published:true},
{id:'artcorpus',title:'АртКорпус',category:'Графика / Дизайн',description:'Графический проект из дизайн-портфолио.',details:'Визуальная коммуникация за пределами интерфейсов.',color:'#272727',cover:'/assets/cases/artcorpus.svg',images:[{id:'art-original',url:'/assets/cases/artcorpus.svg'}],posX:50,posY:50,zoom:100,published:true},
{id:'dvor',title:'Двор.Дети',category:'Сайт',description:'Сайт проекта «Двор.Дети».',details:'',color:'#f8d375',cover:'/assets/cases/dvor.svg',images:[{id:'dvor-original',url:'/assets/cases/dvor.svg'}],posX:50,posY:50,zoom:100,published:true}
];
const defaultTeam=[
{id:'ulyana',name:'Ульяна',role:'Продукт и разработка',duties:'Продуктовая стратегия · Разработка · Контент',photo:'/assets/team/ulyana.svg',posX:50,posY:50,zoom:100,visible:true},
{id:'aliya',name:'Алия',role:'Дизайн и digital',duties:'UI/UX · Брендинг · Дизайн сайтов',photo:'/assets/team/aliya.svg',posX:50,posY:50,zoom:100,visible:true},
{id:'ilona',name:'Илона',role:'Соцсети и контент',duties:'Контент-план · Публикации · Координация',photo:'/assets/team/ilona.svg',posX:50,posY:50,zoom:100,visible:true},
{id:'alina',name:'Алина',role:'Видеопродакшн',duties:'Съёмка · Видео · Проектное участие',photo:'/assets/team/alina.svg',posX:50,posY:50,zoom:100,visible:true}
];
const defaultSite={heroCaption:'Придумываем\nпроектируем\nзапускаем',introTitle:'Идея — это начало. Дальше — дело',introText:'Разрабатываем цифровые продукты, проектируем сайты и создаём визуальные решения. От пользовательской логики до деталей, которые формируют впечатление.',servicesIntro:'Три направления, одна команда. Подберём формат под задачу, а не наоборот.',portfolioIntro:'Разные задачи и разные форматы. Ссылки ведут на исходные материалы, когда они доступны.',teamIntro:'Небольшая команда и проектные специалисты. Личные роли без громких должностей.',teamFootnote:'Формируем состав проекта под конкретную задачу. Видеопродакшн подключаем при необходимости.',aboutText:'Продуктовое мышление встречается с дизайном и контентом — поэтому каждый проект мы видим целиком, а не как набор отдельных задач',contactIntro:'Расскажите, что планируете создать — предложим подход, этапы и следующий шаг',contactTelegram:'https://t.me/ulko_31',contactEmail:'ooopsagency@outlook.com',seoDescription:'OOOPS — digital-студия в Санкт-Петербурге: разработка сайтов, веб-приложений и Telegram Mini Apps, UX/UI-дизайн, брендинг и контент для бизнеса.'};
const additionalSiteDefaults={
heroBottom:'От идеи и дизайна до работающего продукта и контента',
service1Title:'Продукты и сервисы',service1Text:'Идея, продуктовая логика, UX/UI и разработка. Веб-приложения, Telegram Mini Apps, MVP и интерактивные сервисы.',
service2Title:'Брендинг и сайты',service2Text:'Айдентика, лендинги и сайты. Делаем не просто красивые экраны, а понятный путь от первого впечатления до действия.',
service3Title:'Контент и креатив',service3Text:'Контент-концепции, съёмки, короткие видео, креативы и визуальное сопровождение запуска.',
process1Title:'Разбираемся в задаче',process1Text:'Знакомимся с проектом, аудиторией и целями',
process2Title:'Ищем концепцию',process2Text:'Формируем идею, структуру и стиль',
process3Title:'Собираем решение',process3Text:'Дизайн, код, видео — всё, что нужно проекту',
process4Title:'Передаём результат',process4Text:'Проверяем, показываем и обсуждаем развитие',
footerText:'Сайты / Продукты / Дизайн / Контент'
};
Object.assign(defaultSite,additionalSiteDefaults);
const defaults=()=>({version:2,users:[],projects:bootstrap,leads:[],teamProfiles:defaultTeam,siteContent:defaultSite,settings:{telegramNotify:true,aiEnabled:true},events:[]});
const publicTeam=d=>(d.teamProfiles||defaultTeam).filter(x=>x.visible).map(x=>({id:x.id,name:x.name,role:x.role,duties:x.duties,photo:x.photo,posX:x.posX,posY:x.posY,zoom:x.zoom}));
const publicSite=d=>{const content={...defaultSite,...(d.siteContent||{})};if(content.contactEmail==='uly.kozmenko@gmail.com')content.contactEmail='ooopsagency@outlook.com';return content;};
export {publicTeam,publicSite};

export async function load(){try{const blob=await get(PATH,{access:'private'});if(!blob)return {data:null,etag:null};const data=JSON.parse(await new Response(blob.stream).text());const oldDvor=data.projects?.find(p=>p.id==='dvor');if(oldDvor&&/^Двор детям$/i.test(oldDvor.title||'')){oldDvor.title='Двор.Дети';if(oldDvor.description==='Сайт проекта «Двор детям».')oldDvor.description='Сайт проекта «Двор.Дети».';}return {data,etag:blob.etag||null};}catch(e){if(e?.status===404||e?.code==='not_found'||/not found/i.test(String(e.message)))return {data:null,etag:null};throw e}}
export async function save(data,etag){const opts={access:'private',contentType:'application/json',allowOverwrite:true};if(etag)opts.ifMatch=etag;return put(PATH,JSON.stringify(data),opts)}
export function secret(){return process.env.OOOPS_SESSION_SECRET||''}
function hash(pwd,salt){return scryptSync(pwd,salt,64).toString('hex')}
function safeEqual(a,b){let A=Buffer.from(String(a)),B=Buffer.from(String(b));return A.length===B.length&&timingSafeEqual(A,B)}
function sign(v){return createHmac('sha256',secret()).update(v).digest('base64url')}
function session(req,data){const cookie=(req.headers.cookie||'').split(';').map(x=>x.trim()).find(x=>x.startsWith('ooops_session='));if(!cookie||!secret())return null;const raw=decodeURIComponent(cookie.slice(14)),p=raw.lastIndexOf('.');if(p<1)return null;const payload=raw.slice(0,p),sig=raw.slice(p+1);if(!safeEqual(sign(payload),sig))return null;try{const obj=JSON.parse(Buffer.from(payload,'base64url').toString('utf8'));if(obj.exp<Date.now())return null;const user=data?.users.find(x=>x.id===obj.uid&&x.version===obj.version&&x.active);return user||null}catch{return null}}
function setCookie(res,u){const p=Buffer.from(JSON.stringify({uid:u.id,version:u.version,exp:Date.now()+TTL*1000})).toString('base64url');res.setHeader('Set-Cookie','ooops_session='+p+'.'+sign(p)+'; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age='+TTL)}
const cleanUser=u=>({id:u.id,email:u.email,role:u.role,active:u.active});
const canEdit=u=>['owner','editor'].includes(u.role);
const reply=(res,status,body)=>res.status(status).json(body);
function safeProject(x,existing){
 const str=(v,n)=>typeof v==='string'?v.trim().slice(0,n):'';
 const id=existing?.id||randomBytes(8).toString('hex');
 const urls=(Array.isArray(x.images)?x.images:[]).slice(0,40).map(im=>({id:str(im.id,100)||randomBytes(8).toString('hex'),url:str(im.url,1000),caption:str(im.caption,140)})).filter(im=>/^(\/assets\/cases\/|https:\/\/raw\.githubusercontent\.com\/ulko31\/sofe\/main\/images\/|media\/)/.test(im.url));
 const cover=str(x.cover,1000);
 return {id,title:str(x.title,100)||'Без названия',category:str(x.category,90),description:str(x.description,600),details:str(x.details,5000),color:/^#[0-9a-f]{6}$/i.test(x.color)?x.color:'#d7adff',cover:urls.some(i=>i.url===cover)?cover:(urls[0]?.url||''),images:urls,posX:Math.max(0,Math.min(100,Number(x.posX)||50)),posY:Math.max(0,Math.min(100,Number(x.posY)||50)),zoom:Math.max(60,Math.min(200,Number(x.zoom)||100)),coverFit:x.coverFit==='cover'?'cover':'contain',coverPresentation:x.coverPresentation==='framed'?'framed':'clean',published:existing?.published??false};
}
function log(d,user,action){d.events.unshift({action,by:user.email,at:new Date().toISOString()});d.events=d.events.slice(0,150)}
export default async function handler(req,res){
 res.setHeader('Cache-Control','no-store');res.setHeader('X-Content-Type-Options','nosniff');
 if(!process.env.BLOB_READ_WRITE_TOKEN||!secret())return reply(res,503,{error:'Storage/auth configuration missing'});
 const action=String(req.query.action||'');
 if(req.method!=='GET'&&req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 if(req.method==='POST'){const origin=req.headers.origin;if(origin){try{if(new URL(origin).host!==req.headers.host)return reply(res,403,{error:'Invalid origin'})}catch{return reply(res,403,{error:'Invalid origin'})}}}
 let data,etag;try{({data,etag}=await load())}catch(e){console.error('OOOPS state read:',e.message);return reply(res,503,{error:'Database temporarily unavailable'})}
 if(action==='session'&&req.method==='GET')return reply(res,200,{setupRequired:!data?.users?.length,user:session(req,data)?cleanUser(session(req,data)):null});
 if(action==='setup'&&req.method==='POST'){
   if(data?.users?.length)return reply(res,409,{error:'Already configured'});
   if(!process.env.OOOPS_SETUP_SECRET||!safeEqual(req.body?.setupSecret,process.env.OOOPS_SETUP_SECRET))return reply(res,403,{error:'Incorrect setup key'});
   const email=String(req.body?.email||'').trim().toLowerCase(),password=String(req.body?.password||'');
   if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||password.length<12||password.length>128)return reply(res,400,{error:'Email and password of 12+ chars required'});
   const salt=randomBytes(16).toString('hex'),u={id:randomBytes(12).toString('hex'),email,salt,hash:hash(password,salt),role:'owner',active:true,version:1};
   const next=defaults();next.users.push(u);try{await save(next,null)}catch{return reply(res,409,{error:'Setup race; refresh'});}
   setCookie(res,u);return reply(res,200,{user:cleanUser(u)});
 }
 if(action==='login'&&req.method==='POST'){
   const email=String(req.body?.email||'').trim().toLowerCase(),p=String(req.body?.password||'');
   const u=data?.users.find(x=>x.email===email&&x.active);if(!u||!safeEqual(hash(p,u.salt),u.hash))return reply(res,401,{error:'Неверная почта или пароль'});
   setCookie(res,u);return reply(res,200,{user:cleanUser(u)});
 }
 if(action==='logout'){res.setHeader('Set-Cookie','ooops_session=; HttpOnly; Secure; SameSite=Strict; Path=/; Max-Age=0');return reply(res,200,{ok:true})}
 const user=session(req,data);if(!user)return reply(res,401,{error:'Требуется вход'});
 if(action==='state'&&req.method==='GET'){let analytics={version:1,days:{}};try{analytics=(await loadAnalytics()).data}catch(e){console.error('Analytics read:',e?.message)}return reply(res,200,{user:cleanUser(user),projects:data.projects,leads:data.leads,teamProfiles:data.teamProfiles||defaultTeam,siteContent:publicSite(data),analytics,settings:data.settings,users:user.role==='owner'?data.users.map(cleanUser):[],events:data.events.slice(0,60)});}
 if(req.method!=='POST')return reply(res,405,{error:'Method not allowed'});
 try{
 let itemId=null;
 if(action==='project-save'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const x=req.body?.project||{},idx=data.projects.findIndex(p=>p.id===x.id),prev=idx<0?null:data.projects[idx];const item=safeProject(x,prev);itemId=item.id;if(idx<0)data.projects.push(item);else data.projects[idx]=item;log(data,user,'Обновление кейса '+item.title);}
 else if(action==='project-reorder'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const ids=Array.isArray(req.body?.ids)?req.body.ids:[];if(ids.length!==data.projects.length||new Set(ids).size!==ids.length||!data.projects.every(p=>ids.includes(p.id)))return reply(res,400,{error:'Неверный порядок'});data.projects=ids.map(id=>data.projects.find(p=>p.id===id));log(data,user,'Изменение порядка кейсов');}
 else if(action==='project-publish'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const x=data.projects.find(p=>p.id===req.body?.id);if(!x)return reply(res,404,{error:'Кейс не найден'});x.published=!!req.body.published;log(data,user,(x.published?'Публикация ':'Скрытие ')+x.title);}
 else if(action==='project-delete'){if(user.role!=='owner')return reply(res,403,{error:'Только владелец'});data.projects=data.projects.filter(p=>p.id!==req.body?.id);log(data,user,'Удаление кейса');}
 else if(action==='team-profile-save'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const x=req.body?.profile||{},profiles=data.teamProfiles||structuredClone(defaultTeam);const id=typeof x.id==='string'&&x.id.length<80?x.id:'',index=profiles.findIndex(p=>p.id===id);const safeText=(v,max)=>String(v||'').trim().slice(0,max);const photo=safeText(x.photo,1000);if(photo&&!(/^(media\/[a-f0-9]{32}\.(jpg|png|webp)|\/assets\/team\/[a-z0-9-]+\.svg)$/.test(photo)))return reply(res,400,{error:'Недопустимое фото'});const item={id:index>=0?id:randomBytes(8).toString('hex'),name:safeText(x.name,85),role:safeText(x.role,140),duties:safeText(x.duties,500),photo,posX:Math.max(0,Math.min(100,Number(x.posX)||50)),posY:Math.max(0,Math.min(100,Number(x.posY)||50)),zoom:Math.max(100,Math.min(200,Number(x.zoom)||100)),visible:!!x.visible};if(!item.name)return reply(res,400,{error:'Укажите имя'});if(index>=0)profiles[index]=item;else if(profiles.length<24)profiles.push(item);else return reply(res,400,{error:'Максимум 24 профиля'});data.teamProfiles=profiles;itemId=item.id;log(data,user,'Изменение команды '+item.name);}
 else if(action==='team-profile-delete'){if(user.role!=='owner')return reply(res,403,{error:'Только владелец'});data.teamProfiles=(data.teamProfiles||defaultTeam).filter(p=>p.id!==req.body?.id);log(data,user,'Удаление профиля');}
 else if(action==='team-profile-reorder'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const ids=Array.isArray(req.body?.ids)?req.body.ids:[],profiles=data.teamProfiles||defaultTeam;if(ids.length!==profiles.length||new Set(ids).size!==ids.length||!profiles.every(p=>ids.includes(p.id)))return reply(res,400,{error:'Некорректный порядок'});data.teamProfiles=ids.map(id=>profiles.find(p=>p.id===id));log(data,user,'Порядок карточек команды');}
 else if(action==='site-save'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const proposed=req.body?.content||{},site=publicSite(data);for(const [key,original] of Object.entries(defaultSite)){if(typeof proposed[key]!=='string')continue;const value=proposed[key].trim().slice(0,key==='introText'?1500:600);if(key==='contactTelegram'){if(!/^https:\/\/t\.me\/[a-zA-Z0-9_]{5,}$/.test(value))return reply(res,400,{error:'Telegram-ссылка должна быть t.me/...'});}else if(key==='contactEmail'){if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value))return reply(res,400,{error:'Некорректный email'});}site[key]=value;}data.siteContent=site;log(data,user,'Редактирование текстов сайта');}
 else if(action==='lead-update'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const lead=data.leads.find(x=>x.id===req.body?.id);if(!lead)return reply(res,404,{error:'Заявка не найдена'});lead.status=['new','in-progress','proposal','done'].includes(req.body?.status)?req.body.status:lead.status;lead.note=String(req.body?.note||'').slice(0,1500);log(data,user,'Обновление заявки');}
 else if(action==='team-add'){if(user.role!=='owner')return reply(res,403,{error:'Только владелец'});const email=String(req.body?.email||'').trim().toLowerCase(),role=String(req.body?.role||'editor');if(!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)||data.users.some(u=>u.email===email)||!['editor','viewer'].includes(role))return reply(res,400,{error:'Проверьте email или роль'});const password=randomBytes(18).toString('base64url'),salt=randomBytes(16).toString('hex');data.users.push({id:randomBytes(12).toString('hex'),email,hash:hash(password,salt),salt,role,version:1,active:true});log(data,user,'Добавление участника');await save(data,etag);return reply(res,200,{ok:true,temporaryPassword:password});}
 else if(action==='team-reset'){if(user.role!=='owner')return reply(res,403,{error:'Только владелец'});const target=data.users.find(x=>x.id===req.body?.id&&x.role!=='owner');if(!target)return reply(res,404,{error:'Участник не найден'});const password=randomBytes(18).toString('base64url');target.salt=randomBytes(16).toString('hex');target.hash=hash(password,target.salt);target.version++;log(data,user,'Сброс пароля участника');await save(data,etag);return reply(res,200,{ok:true,temporaryPassword:password});}
 else if(action==='team-toggle'){if(user.role!=='owner')return reply(res,403,{error:'Только владелец'});const u=data.users.find(x=>x.id===req.body?.id&&x.role!=='owner');if(!u)return reply(res,404,{error:'Участник не найден'});u.active=!!req.body.active;u.version++;log(data,user,'Изменение доступа');}
 else if(action==='settings'){if(user.role!=='owner')return reply(res,403,{error:'Только владелец'});data.settings={telegramNotify:!!req.body?.telegramNotify,aiEnabled:!!req.body?.aiEnabled};log(data,user,'Настройки сайта');}
 else if(action==='password'){const pwd=String(req.body?.password||'');if(pwd.length<12||pwd.length>128)return reply(res,400,{error:'Пароль от 12 символов'});user.salt=randomBytes(16).toString('hex');user.hash=hash(pwd,user.salt);user.version++;log(data,user,'Смена пароля');}
 else if(action==='upload'){if(!canEdit(user))return reply(res,403,{error:'Нет прав'});const mime=String(req.body?.mime||''),raw=String(req.body?.data||'');if(!/^image\/(jpeg|png|webp)$/.test(mime)||raw.length>3e6)return reply(res,400,{error:'JPEG/PNG/WebP до 2 МБ'});const bytes=Buffer.from(raw,'base64');if(bytes.length>2200000||bytes.length<20)return reply(res,400,{error:'Неверный размер'});const path='media/'+randomBytes(16).toString('hex')+({ 'image/jpeg':'.jpg','image/png':'.png','image/webp':'.webp'}[mime]);await put(path,bytes,{access:'private',contentType:mime});return reply(res,200,{url:path});}
 else return reply(res,404,{error:'Unknown action'});
 await save(data,etag);return reply(res,200,{ok:true,projectId:action==='project-save'?itemId:null,profileId:action==='team-profile-save'?itemId:null});
 }catch(e){console.error('OOOPS admin write:',e.message);return reply(res,409,{error:'Не удалось сохранить. Обновите данные и повторите.'})}
}
