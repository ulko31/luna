import {load} from './admin.js';
import {stories} from './case-stories.js';
import {portfolioResources, portfolioResourceUrl, portfolioPageUrl} from './portfolio-resources.js';
const esc=s=>String(s??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
const asMedia=u=>typeof u==='string'&&u.startsWith('media/')?'/api/media?key='+encodeURIComponent(u):u;
const safeImg=u=>{const s=asMedia(u);return typeof s==='string'&&(/^(\/assets\/|\/api\/media\?key=|https:\/\/raw\.githubusercontent\.com\/ulko31\/sofe\/main\/images\/)/.test(s))?s:''};
const style=`
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@400;500;600;700;800&display=swap');
:root{font-family:'DM Sans',Arial,sans-serif;color:#1c1a1d;background:#f5f3ef;--purple:#8527ed;--ink:#1c1a1d;--line:#d9d5cf}
*{box-sizing:border-box}html{scroll-behavior:smooth}body{margin:0}button{font:inherit}a{color:inherit}
nav{display:flex;align-items:center;justify-content:space-between;gap:18px;padding:21px clamp(20px,5vw,78px);border-bottom:1px solid var(--line);background:#f5f3efe8;position:sticky;top:0;z-index:10;backdrop-filter:blur(18px)}
.brand{font-family:Manrope,sans-serif;font-size:28px;font-weight:900;text-decoration:none;letter-spacing:-.1em}.brand em{color:var(--purple);font-style:normal}
.navlinks{display:flex;gap:24px;align-items:center}.navlinks a{text-decoration:none;font-size:13px;font-weight:700}.navlinks a:hover{color:var(--purple)}
.wrap{max-width:1400px;padding-left:clamp(20px,5vw,78px);padding-right:clamp(20px,5vw,78px);margin:auto}
.overline{font-size:11px;font-weight:800;letter-spacing:.15em;text-transform:uppercase}.muted{color:#6b676b}
.hero{padding-top:clamp(56px,8vw,120px);padding-bottom:65px}.hero-top{display:flex;flex-wrap:wrap;align-items:center;gap:13px}.pill{border:1px solid #c9c4bf;border-radius:40px;padding:9px 14px;font-size:11px;font-weight:700}
h1{font-family:Manrope,Arial,sans-serif;font-size:clamp(54px,9vw,126px);line-height:.98;letter-spacing:-.09em;margin:24px 0 28px;overflow-wrap:anywhere}
.hero-description{font-size:clamp(20px,3vw,37px);line-height:1.32;max-width:1050px;letter-spacing:-.035em}.hero-footer{display:flex;align-items:center;justify-content:space-between;gap:18px;flex-wrap:wrap;margin-top:52px}
.interactive-cover{width:min(100%,1080px);height:clamp(380px,55vw,650px);border-radius:15px;overflow:hidden;border:1px solid #21151f33;background:#fff;box-shadow:0 18px 36px #20101f22;display:flex;flex-direction:column;}
.interactive-cover .browser-bar{display:flex;align-items:center;gap:7px;height:43px;padding:0 17px;border-bottom:1px solid #e2dde1;background:#fcfafc}
.browser-bar i{width:8px;height:8px;border-radius:50%;background:#bbb3ba}.browser-bar span{font-size:10px;font-weight:800;letter-spacing:.08em;color:#655b65;margin-left:auto}
.interactive-cover iframe,.interactive-cover video{border:0;width:100%;flex:1;min-height:0;background:#fff}
.big-visual:has(.interactive-cover){padding:clamp(12px,2vw,24px)}
.big-visual:has(.interactive-cover) .corner{display:none}
.source-note{padding:14px 0 0;font-size:12px;color:#69636b}
.source-note a{font-weight:700}
.original-pdf{height:clamp(400px,59vw,710px);width:min(100%,1120px);border:1px solid #ddd8cf;border-radius:12px;overflow:hidden;box-shadow:0 18px 35px #0002;background:#fff}
.original-pdf iframe{width:100%;height:100%;border:0;background:#fff}
.case-original-link{font-size:14px;display:inline-flex;gap:9px;margin-top:15px;font-weight:700;text-decoration:underline;text-underline-offset:5px}
.big-visual{background:var(--caseColor,#d5c4fa);border-radius:16px;min-height:clamp(280px,44vw,570px);overflow:hidden;position:relative;display:flex;align-items:center;justify-content:center;padding:clamp(22px,5vw,65px)}
.big-visual img{max-width:100%;width:auto;max-height:540px;object-fit:contain;object-position:center;box-shadow:0 17px 38px #0002;border-radius:8px}
.big-visual .type-cover{font-family:Manrope,Arial,sans-serif;font-size:clamp(46px,8vw,110px);letter-spacing:-.09em;line-height:1;font-weight:900;text-align:center;max-width:900px;overflow-wrap:anywhere}
.big-visual .corner{position:absolute;bottom:22px;left:26px;font-size:12px;font-weight:700}
.index-row{display:flex;flex-wrap:wrap;gap:14px;margin:0;padding:24px 0;list-style:none}.index-row a{text-decoration:none;border-bottom:1px solid transparent;font-size:12px;font-weight:700}.index-row a:hover{border-color:var(--ink)}
.section{padding-top:clamp(68px,8vw,125px);padding-bottom:clamp(68px,8vw,125px);border-bottom:1px solid var(--line)}
.cols{display:grid;grid-template-columns:minmax(160px,.38fr) minmax(0,1fr);gap:clamp(24px,5vw,95px)}
h2{font-family:Manrope,Arial,sans-serif;font-size:clamp(34px,5.5vw,71px);letter-spacing:-.07em;line-height:1.07;margin:0 0 24px}h3{font-family:Manrope,Arial,sans-serif;letter-spacing:-.04em}
.bodycopy{max-width:830px;font-size:clamp(17px,2.1vw,23px);line-height:1.65;white-space:pre-line;margin:0}
.deliverables{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:13px;list-style:none;padding:0;margin:24px 0 0}
.deliverables li{background:#fff;border-radius:11px;padding:25px;font-size:17px;font-weight:650;min-height:116px;display:flex;align-items:flex-end}
.deliverables li:before{content:'↗';display:block;align-self:flex-start;margin-right:15px;color:var(--purple)}
.impact{background:#d9fb48;padding:clamp(33px,6vw,80px);border-radius:17px}.impact h2{max-width:800px}.insight{margin-top:35px;padding-top:24px;border-top:1px solid #9996;display:flex;gap:15px;align-items:baseline}
.preview{background:#f0eee9;border:1px solid #dedbd5;border-radius:18px;overflow:hidden;padding:18px}
.previewbar{display:flex;align-items:center;gap:7px;padding:9px 12px 17px;font-size:12px;color:#645e62}.dot{width:8px;height:8px;background:#c9c5c3;border-radius:50%}.previewbar strong{margin-left:auto;font-size:11px;font-weight:700}
.preview iframe{width:100%;height:635px;border:1px solid #ddd9d2;border-radius:12px;background:white;display:block}
.preview-note{font-size:13px;line-height:1.5;color:#666;margin:15px 3px 0}
.walk{background:#fff;border:1px solid #dedbd5;border-radius:16px;padding:clamp(20px,4vw,45px);min-height:330px;display:flex;flex-direction:column;justify-content:space-between;gap:25px;margin-top:22px}
.walk-top,.walk-bottom{display:flex;justify-content:space-between;align-items:center;gap:15px;font-size:11px;font-weight:800;letter-spacing:.07em;color:#777}.walk-top span:first-child{color:#8527ed}.walk-body h3{font-size:clamp(27px,3vw,42px);margin:0 0 18px}.walk-body p{max-width:700px;font-size:17px;line-height:1.65;white-space:pre-line;margin:0}.walk-bottom>div{display:flex;gap:8px}
.gallery-stage{display:flex;flex-direction:column;gap:16px}.gallery-display{display:flex;align-items:center;justify-content:center;border:1px solid #e3ded7;border-radius:14px;background:#e9e5df;overflow:hidden;min-height:clamp(230px,40vw,560px);padding:15px}
.gallery-display img{max-width:100%;max-height:550px;object-fit:contain;display:block}
.gallery-bar{display:flex;align-items:center;justify-content:space-between;gap:18px}
.arrow{border:1px solid #bbb5ae;background:#fff;border-radius:40px;padding:12px 19px;cursor:pointer;font-weight:750}.arrow:hover{background:#d9fb48}.counter{font-size:13px;color:#6f6b65}
.end{padding-top:100px;padding-bottom:105px}.end h2{font-size:clamp(42px,7vw,90px)}.button{display:inline-flex;gap:12px;background:var(--ink);color:white;padding:16px 25px;text-decoration:none;border-radius:8px;font-weight:750}.button:hover{background:var(--purple)}
footer{border-top:1px solid var(--line);padding:30px clamp(20px,5vw,78px);font-size:12px;color:#777}
@media(max-width:740px){.cols{grid-template-columns:1fr}.deliverables{grid-template-columns:1fr}.deliverables li{min-height:80px}.navlinks{gap:12px}.preview{padding:9px}.preview iframe{height:640px}.hero-footer{margin-top:35px}.section{padding-top:65px;padding-bottom:65px}}
`;
export default async function handler(req,res){
 res.setHeader('Content-Type','text/html; charset=utf-8');res.setHeader('Cache-Control','no-store');
 if(req.method!=='GET')return res.status(405).end();
 const id=String(req.query.id||'').trim();
 if(!/^[a-zA-Z0-9_-]{1,100}$/.test(id))return res.status(404).send('Проект не найден');
 let data;try{({data}=await load())}catch(e){console.error('Case load:',e.message);return res.status(503).send('Временно недоступно')}
 const source=portfolioResources[id];
 const p=data?.projects?.find(x=>x.id===id&&x.published) || (source?{id,title:source.title,category:source.category,description:source.description,color:source.color,cover:'',images:[],published:true}:null);
 if(!p)return res.status(404).send('Проект не найден');
 const built=stories[id]||{};
 const story={...built,...(p.story||{})};
 const headline=story.headline||p.description||'Визуальная история проекта';
 const sourceEmbed=source?portfolioResourceUrl(source):'';
 const localPdf=source?.localParts?'/pdf-viewer.html?key='+encodeURIComponent(id):(['brics','espachicas'].includes(id)?'/pdf-viewer.html?key='+encodeURIComponent(id):'');
 const localVideo=/^media\/[a-f0-9]{32}\.mp4$/.test(p.video||'')?asMedia(p.video):(source?.localVideo||'');
 const sourceLink=source?portfolioPageUrl(source):'';
 const challenge=story.challenge||p.details||p.description||'Исходная задача проекта.';
 const approach=story.approach||p.details||p.description||'Работа с идеей, структурой и визуальным решением.';
 const outcome=story.impact||'Результат — подготовленный проектный материал; количественные показатели не заявляются.';
 const deliverables=(Array.isArray(story.deliverables)&&story.deliverables.length?story.deliverables:['Структура проекта','Дизайн и ключевые экраны','Проверка основных сценариев']).slice(0,10);
 const url='https://ooops.agency/portfolio/'+encodeURIComponent(id);
 const isArchive=String(story.kind||'').toLowerCase().includes('архив');
 const title=p.title+(isArchive?' — дизайн-портфолио OOOPS':' — кейс digital-студии OOOPS');
 const desc=String(p.description||headline).slice(0,160);
 const cover=safeImg(p.cover);
 const images=(id==='sofe'?[]:(Array.isArray(p.images)?p.images:[])).map(x=>({url:safeImg(x.url),caption:x.caption||p.title})).filter(x=>x.url);
 const schema=JSON.stringify({'@context':'https://schema.org','@type':'CreativeWork',name:p.title,description:desc,url,creator:{'@type':'Organization',name:'OOOPS',url:'https://ooops.agency/'}}).replace(/</g,'\\u003c');
 const accent=/^#[0-9a-fA-F]{6}$/.test(p.color||'')?p.color:'#d5c4fa';
 const demo=['sofe','tutor','dvor'].includes(story.demo)?story.demo:'';
 const pdf=typeof story.sourcePdf==='string'&&story.sourcePdf.startsWith('/assets/portfolio/')&&story.sourcePdf.endsWith('.pdf')?story.sourcePdf:'';
 const live=id==='alfa_credit'?'https://alpha-scenario-demo-web.onrender.com/':(['https://sofe-jade.vercel.app/','https://time-lab-english.wintry-moss-6546.chatgpt.site/','https://just-calendar-livid.vercel.app/','https://xn--b1ad5ai.xn--d1acj3b/'].includes(story.liveUrl)?story.liveUrl:'');
 const externalPreview=['sofe','calendar'].includes(id)?live:'';

 const gallery=images.length>0?`<section class="wrap section" id="gallery"><div class="cols"><div class="overline">05 / МАТЕРИАЛЫ</div><div><h2>Макеты и детали</h2><p class="muted">Переключайте изображения, чтобы посмотреть материалы проекта в удобном размере.</p><div class="gallery-stage"><div class="gallery-display"><img id="gallery-image" src="${esc(images[0].url)}" alt="${esc(images[0].caption)}"></div><div class="gallery-bar"><button type="button" class="arrow" id="prev-image" aria-label="Предыдущее изображение">← Назад</button><span class="counter" id="gallery-counter">1 / ${images.length}</span><button type="button" class="arrow" id="next-image" aria-label="Следующее изображение">Далее →</button></div></div></div></div></section>`:'';
 const items=JSON.stringify(images).replace(/</g,'\\u003c');
 const galleryScript=images.length>0?`<script>const slides=${items};let i=0;const view=document.getElementById('gallery-image'),counter=document.getElementById('gallery-counter');const set=n=>{i=(n+slides.length)%slides.length;view.src=slides[i].url;view.alt=slides[i].caption;counter.textContent=(i+1)+' / '+slides.length};document.getElementById('prev-image').onclick=()=>set(i-1);document.getElementById('next-image').onclick=()=>set(i+1);</script>`:'';
 const presentation=JSON.stringify([{label:'Задача',title:'Зачем проекту это решение?',body:challenge},{label:'Подход',title:'Как мы искали направление',body:approach},{label:'Что сделали',title:'Из чего состоит работа',body:deliverables.join(' · ')},{label:'Результат',title:'Что получилось',body:outcome}]).replace(/</g,'\\u003c');
 const walkthrough=`<section class="wrap section" id="walkthrough"><div class="cols"><div class="overline">СМОТРЕТЬ ИСТОРИЮ</div><div><h2>Проект от идеи до результата</h2><p class="muted">Это интерактивная история проекта. Переключайте этапы — не нужно прокручивать длинную галерею скриншотов.</p><div class="walk"><div class="walk-top"><span id="walk-label">01 / Задача</span><span>OOOPS CASE GUIDE</span></div><div class="walk-body"><h3 id="walk-heading">Зачем проекту это решение?</h3><p id="walk-text">${esc(challenge)}</p></div><div class="walk-bottom"><span id="walk-progress">01 / 04</span><div><button id="walk-prev" type="button" class="arrow" aria-label="Предыдущий этап">←</button><button id="walk-next" type="button" class="arrow" aria-label="Следующий этап">→</button></div></div></div></div></div></section>`;
 const walkScript=`<script>const caseSteps=${presentation};let currentStep=0;const updateWalk=()=>{let a=caseSteps[currentStep];document.getElementById('walk-label').textContent=String(currentStep+1).padStart(2,'0')+' / '+a.label;document.getElementById('walk-heading').textContent=a.title;document.getElementById('walk-text').textContent=a.body;document.getElementById('walk-progress').textContent=String(currentStep+1).padStart(2,'0')+' / 04'};document.getElementById('walk-prev').onclick=()=>{currentStep=(currentStep+3)%4;updateWalk()};document.getElementById('walk-next').onclick=()=>{currentStep=(currentStep+1)%4;updateWalk()};</script>`;
 const browserLabel=demo==='sofe'?'SOFE · WELLNESS':demo==='tutor'?'TIME LAB · STUDENT & TEACHER':demo==='dvor'?'ДВОР.ДЕТИ · WEB EXPERIENCE':'WEB EXPERIENCE';
 const heroWidget=id==='stankevich'?`<div class="original-pdf" style="height:clamp(620px,82vh,1100px);width:100%;border:0;box-shadow:none;background:transparent"><iframe title="Полный PDF макет — Кружок Станкевича" loading="eager" src="/pdf-viewer.html?key=stankevich" style="width:100%;height:100%;border:0"></iframe></div>`:id==='alfa_credit'?`<div class="interactive-cover" style="height:clamp(560px,74vw,900px)"><div class="browser-bar"><i></i><i></i><i></i><span>АЛЬФА-СЦЕНАРИЙ · ОРИГИНАЛЬНЫЙ ПРОДУКТ</span></div><iframe title="Оригинальное интерактивное приложение с картой возможностей" loading="eager" src="https://alpha-scenario-demo-web.onrender.com/"></iframe></div>`:id==='tutor'?`<div class="interactive-cover"><div class="browser-bar"><i></i><i></i><i></i><span>TIME LAB · ОТКРЫТАЯ ДЕМОНСТРАЦИЯ</span></div><iframe title="Time Lab — демонстрация без входа" loading="eager" src="/demo/time-lab.html"></iframe></div>`:localVideo?`<div class="interactive-cover"><div class="browser-bar"><i></i><i></i><i></i><span>ВИДЕОДЕМОНСТРАЦИЯ / OOOPS</span></div><video controls playsinline preload="metadata" style="height:100%;width:100%;object-fit:contain;background:#faf8f4" src="${esc(localVideo)}">Для просмотра видео нужен браузер с поддержкой HTML5.</video></div>`:localPdf?`<div class="interactive-cover" style="height:clamp(460px,69vw,820px)"><div class="browser-bar"><i></i><i></i><i></i><span>${id==='stankevich'?'ОРИГИНАЛЬНЫЙ PDF · ПОЛНЫЙ МАКЕТ':'ПОЛНЫЙ ДИЗАЙН · ПРОКРУТКА'}</span></div><iframe title="${esc(p.title)} — оригинальный PDF" loading="eager" src="${esc(localPdf)}"></iframe></div>`:sourceEmbed?`<div class="interactive-cover" style="background:#eae5dc;align-items:center;justify-content:center;padding:35px;text-align:center"><div><strong style="font-size:24px;display:block;margin-bottom:14px">Оригинальные материалы проекта</strong><p>Исходный файл временно доступен отдельной ссылкой. Просмотр без Google Drive готовится.</p><a class="button" target="_blank" rel="noopener noreferrer" href="${esc(sourceLink)}">Открыть PDF или видео ↗</a></div></div>`:externalPreview?`<div class="interactive-cover"><div class="browser-bar"><i></i><i></i><i></i><span>${browserLabel} / ORIGINAL SITE</span></div><iframe title="Интерактивное превью ${esc(p.title)}" loading="eager" src="${esc(externalPreview)}"></iframe></div>`:pdf?`<div class="original-pdf"><iframe title="Оригинальный дизайн-макет ${esc(p.title)}" loading="eager" src="${esc(pdf)}#view=FitH&toolbar=0&navpanes=0"></iframe></div>`:cover?`<img src="${esc(cover)}" alt="Макет ${esc(p.title)}" loading="eager">`:`<div class="type-cover">${esc(p.title)}</div>`;
 const sourceHtml=pdf?`<p class="source-note">Оригинальный дизайн из портфолио — листайте макет прямо в окне. <a href="${esc(pdf)}" target="_blank" rel="noopener noreferrer">Развернуть полный макет ↗</a></p>`:'';
 const sourceFileHtml=id==='stankevich'?'':sourceLink?`<p class="source-note">Материалы проекта из портфолио. Если встроенный просмотр недоступен, <a class="case-original-link" href="${esc(sourceLink)}" target="_blank" rel="noopener noreferrer">откройте исходный файл в Google Диске ↗</a></p>`:'';
 const alfaDemo=id==='alfa_credit'?\`<p class="source-note">Оригинальный React-продукт с расчётами FastAPI, картой возможностей и прогнозом. Нажмите «Попробовать без входа» для отдельного синтетического гостевого профиля. <a class="case-original-link" href="https://alpha-scenario-demo-web.onrender.com/" target="_blank" rel="noopener noreferrer">Открыть полноэкранную демоверсию ↗</a>. Не является официальным сервисом банка или кредитным предложением.</p>\`:'';
 const guidedDemo=id==='tutor'?`<p class="source-note">Выше — открытая демонстрация учебных сценариев без регистрации и доступа к данным реальных учеников. <a class="case-original-link" href="${esc(live)}" target="_blank" rel="noopener noreferrer">Открыть оригинальное приложение Time Lab ↗</a> (личный кабинет потребует входа).</p>`:'';
 const liveHtml=live?`<p class="source-note">${id==='sofe'?'Здесь встроено настоящее приложение SOFE с Vercel, а не набор скриншотов. Если некоторые разделы ограничены экраном, откройте полную версию в отдельной вкладке.':'Выше показан исходный интерфейс, если сайт разрешает встраивание. Для персональных функций может потребоваться вход.'} <a class="case-original-link" href="${esc(live)}" target="_blank" rel="noopener noreferrer">${id==='sofe'?'Открыть полное приложение SOFE ↗':'Открыть исходный сайт или приложение ↗'}</a></p>`:'';
 return res.status(200).send(`<!doctype html><html lang="ru"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><meta name="theme-color" content="#f5f3ef"><meta name="robots" content="index,follow,max-image-preview:large"><title>${esc(title)}</title><meta name="description" content="${esc(desc)}"><link rel="canonical" href="${url}"><meta property="og:type" content="article"><meta property="og:site_name" content="OOOPS"><meta property="og:title" content="${esc(title)}"><meta property="og:description" content="${esc(desc)}"><meta property="og:url" content="${url}"><link rel="icon" type="image/svg+xml" href="/favicon.svg"><script type="application/ld+json">${schema}</script><style>${style}</style></head><body>
<nav><a class="brand" href="/">OOO<em>PS!</em></a><div class="navlinks"><a href="/#work">Портфолио</a><a href="/#contact">Обсудить проект ↗</a></div></nav>
<main>
<header class="hero wrap"><div class="hero-top"><span class="overline">OOOPS / CASE STUDY</span><span class="pill">${esc(id==='glasses'?'Веб-дизайн':story.kind||p.category||'Проект')}</span><span class="pill">${esc(id==='glasses'?'Дизайн сайта':story.label||'Портфолио')}</span></div><h1>${esc(p.title)}</h1><p class="hero-description">${esc(headline)}</p><div class="hero-footer"><a class="button" href="#challenge">Исследовать кейс ↓</a><span class="muted" style="font-size:12px">Идея · Процесс · Решение · Результат</span></div></header>
<div class="wrap"><div class="big-visual" style="--caseColor:${accent}">${heroWidget}<span class="corner">OOOPS! / ${esc(p.title)}</span></div>${sourceHtml}${sourceFileHtml}${guidedDemo}${liveHtml}<div class="index-row"><a href="#challenge">Задача</a><a href="#approach">Подход</a><a href="#solution">Что сделали</a>${images.length?'<a href="#gallery">Макеты</a>':''}<a href="#outcome">Результат</a></div></div>
<section class="wrap section" id="challenge"><div class="cols"><div class="overline">01 / ЗАДАЧА</div><div><h2>С чего всё началось</h2><p class="bodycopy">${esc(challenge)}</p></div></div></section>
<section class="wrap section" id="approach"><div class="cols"><div class="overline">02 / ПОДХОД</div><div><h2>Мысль за решением</h2><p class="bodycopy">${esc(approach)}</p></div></div></section>
<section class="wrap section" id="solution"><div class="cols"><div class="overline">03 / РЕШЕНИЕ</div><div><h2>Что сделано</h2><ul class="deliverables">${deliverables.map(x=>'<li>'+esc(x)+'</li>').join('')}</ul></div></div></section>
${gallery}
<section class="wrap section" id="outcome"><div class="impact"><span class="overline">РЕЗУЛЬТАТ</span><h2 style="margin-top:20px">Что получилось</h2><p class="bodycopy">${esc(outcome)}</p>${story.insight?'<div class="insight"><strong>Главная мысль:</strong><span>'+esc(story.insight)+'</span></div>':''}</div></section>
<section class="wrap end"><span class="overline">NEXT / OOOPS!</span><h2>Есть похожая<br>задача?</h2><p class="bodycopy" style="margin-bottom:28px">Расскажите, что хотите создать. Мы поможем определить направление и следующий шаг.</p><a class="button" href="/#contact">Обсудить проект ↗</a><p style="margin-top:35px"><a href="/#work">← Вернуться ко всем кейсам</a></p></section>
</main><footer>© 2026 OOOPS! · Digital product & creative studio</footer>${galleryScript}</body></html>`);
}
