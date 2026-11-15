import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPosts,assess,renderDigest,findContact,buildReplyDraft,buildReplyButtons,splitReplyBatches,parseMessageIds,selectDigestPosts} from './digest.mjs';

const now=new Date('2026-11-14T06:17:00Z');
const sample={
  id:'GetClient/111',source:'GetClient',url:'https://t.me/GetClient/111',
  date:new Date('2026-11-14T05:00:00Z'),contact:{type:'telegram',value:'clientname'},
  text:'Ищем исполнителя для разработки сайта и автоматизации обработки заявок, CRM API и Telegram-бота. Проектная работа, бюджет 35 000 руб. Пишите @clientname.'
};

test('detects development and automation requests',()=>{
 const x=assess(sample,now); assert.ok(x);
 assert.ok(x.categories.some(n=>n.includes('Автоматизация')));
 assert.ok(x.categories.some(n=>n.includes('Разработка')));
});

test('does not treat applicant self-promotion as jobs',()=>{
 assert.equal(assess({...sample,text:'Ищу работу, предлагаю свои услуги по разработке сайта и автоматизации.'},now),null);
});

test('ignores obsolete posts',()=>{
 assert.equal(assess({...sample,date:new Date('2026-11-09T00:00:00Z')},now),null);
});

test('rejects suspicious upfront fee requests',()=>{
 assert.equal(assess({...sample,text:'Ищем разработчика сайта, для работы нужен первоначальный взнос.'},now),null);
});

test('parses Telegram public message blocks and contacts',()=>{
 const html='<div class="tgme_widget_message text_not_supported_wrap" data-post="GetClient/123"><div class="tgme_widget_message_text js-message_text" dir="auto">Ищем разработчика сайта!<br>Бюджет 40 000 руб. Оплата по проекту. Пишите <a href="https://t.me/project_owner">заказчику</a>.</div><time datetime="2026-11-14T04:00:00+00:00">04:00</time></div>';
 const p=extractPosts(html,'GetClient');assert.equal(p.length,1);
 assert.match(p[0].text,/разработчика сайта/);
 assert.equal(p[0].url,'https://t.me/GetClient/123');
 assert.deepEqual(p[0].contact,{type:'telegram',value:'project_owner'});
});

test('extracts Telegram mentions and email fallback',()=>{
 assert.deepEqual(findContact('Пишите @great_client по задаче'),{type:'telegram',value:'great_client'});
 assert.deepEqual(findContact('Пишите на job@example.com'),{type:'email',value:'job@example.com'});
});

test('does not treat Telegram bots or source channels as client contacts',()=>{
 assert.equal(findContact('Откликнуться через @order_helper_bot'),null);
 assert.equal(findContact('Подробности и отклик в канале @vacancysmm'),null);
 assert.equal(findContact('Для отклика переходите в @freelance_rabota_chat'),null);
 assert.equal(findContact('Отклик по ссылке','Отклик: <a href="https://t.me/freelancetaverna">перейти</a>'),null);
});

test('rejects copywriting-only work but keeps broader SMM projects',()=>{
 assert.equal(assess({...sample,text:'Ищем копирайтера: писать SEO-статьи и тексты для блога. Оплата 500 рублей за текст.'},now),null);
 const smm=assess({...sample,text:'Ищем SMM-специалиста: контент-план, Reels, посты и аналитика. Удалённо, бюджет 40 000 руб.'},now);
 assert.ok(smm);
 assert.equal(smm.categories[0],'Контент / SMM / видео');
});

test('creates safe Telegram HTML and original deep links',()=>{
 const message=renderDigest([assess(sample,now)],now);
 assert.match(message,/https:\/\/t\.me\/GetClient\/111/);
 assert.match(message,/Разработка \/ сайты/);
 assert.match(message,/Отправка всегда вручную/);
});

test('builds a short personalized reply and Telegram deep link',()=>{
 const post=assess(sample,now);
 const draft=buildReplyDraft(post);
 assert.ok(draft.length<=256);
 assert.match(draft,/команды для сайта и автоматизации заявок/);
 assert.match(draft,/свяжем формы с CRM, API или Telegram-ботом/);
 assert.match(draft,/ooops-portfolio\.vercel\.app/);
 const keyboard=buildReplyButtons([post]);
 assert.match(keyboard.inline_keyboard[0][0].url,/https:\/\/t\.me\/clientname\?text=/);
 assert.equal(keyboard.inline_keyboard[0][1].copy_text.text,draft);
});

test('prioritizes a card-design hashtag over unrelated automation wording',()=>{
 const post=assess({...sample,text:'#дизайнеркарточек Ищут специалиста по визуалу карточек товара. В компании также внедряют автоматизацию процессов. Проектная работа, бюджет 30 000 руб.'},now);
 assert.equal(post.categories[0],'Презентации / графика');
 const draft=buildReplyDraft(post);
 assert.match(draft,/дизайнера карточек/);
 assert.match(draft,/визуальную систему/);
 assert.doesNotMatch(draft,/специалиста по автоматизации/);
});

test('rejects freelancer self-promotion hashtags',()=>{
 assert.equal(assess({...sample,text:'#резюме #помогу #дизайн Есть идея или задача? Создам сайт, графику и автоматизацию.'},now),null);
});

test('treats educational course materials as graphic design, not video',()=>{
 const post=assess({...sample,text:'#дизайнеробразовательныхпродуктов Для видеокурсов ищут дизайнера дополнительных материалов: гайды, презентации, баннеры и обложки. Проектная работа, оплата 30 000 руб.'},now);
 assert.equal(post.categories[0],'Презентации / графика');
 assert.match(buildReplyDraft(post),/графического дизайнера|дизайнера презентации/);
});

test('treats advertising manager roles as content and promotion',()=>{
 const post=assess({...sample,text:'#менеджерпорекламе Ищут менеджера по закупке рекламы в Instagram и Telegram: медиаплан, анализ блогеров, контроль интеграций. Удалённая проектная работа, доход 50 000 руб.'},now);
 assert.equal(post.categories[0],'Контент / SMM / видео');
 assert.match(buildReplyDraft(post),/менеджера по рекламе/);
 assert.match(buildReplyDraft(post),/медиаплан/);
 assert.match(post.budget,/50 000/);
});

test('treats a Tilda build as website development',()=>{
 const post=assess({...sample,text:'#вебдизайнер Нужно сделать сайт на Tilda. Проектная работа, бюджет 45 000 руб.'},now);
 assert.equal(post.categories[0],'Разработка / сайты');
 assert.match(buildReplyDraft(post),/разработчика сайта на Tilda/);
 assert.match(buildReplyDraft(post),/адаптивные блоки/);
});

test('does not turn an art director role into a presentation reply',()=>{
 const post=assess({...sample,text:'#артдиректор Ищем арт-директора: концепты сайтов и сервисов, контроль дизайна, ревью и клиентские презентации. Проектная удалённая работа, бюджет 90 000 руб.'},now);
 assert.equal(post.categories[0],'Разработка / сайты');
 assert.doesNotMatch(buildReplyDraft(post),/дизайну презентации/);
});

test('normalizes dot-separated thousands in salary',()=>{
 const post=assess({...sample,text:'Требуется графический дизайнер. Удалённо, проектная работа. Зарплата: 70.000–85.000₽.'},now);
 assert.match(post.budget,/70 000–85 000₽/);
});

test('does not include the next sentence in the budget',()=>{
 const post=assess({...sample,text:'Ищем графического дизайнера. Зарплата: 70.000–85.000₽. Ищем человека в команду для оперативной работы.'},now);
 assert.equal(post.budget,'70 000–85 000₽');
});

test('rejects enthusiasm-only projects',()=>{
 assert.equal(assess({...sample,text:'Ищем графического дизайнера, проект развивается на энтузиазме. Нужны баннеры и карточки.'},now),null);
});

test('recognizes Russian adjective endings in graphic designer roles',()=>{
 const post=assess({...sample,text:'Вакансия: Графический дизайнер / SMM-менеджер. Ищем визуального дизайнера для соцсетей. Иногда нужна разработка сайта. Оплата 50 000 руб.'},now);
 assert.equal(post.categories[0],'Презентации / графика');
});

test('rejects disguised creator lead-generation ads',()=>{
 assert.equal(assess({...sample,text:'ИЩУ экспертов, бренды и блогеров, которые хотят увеличить продажи с помощью ИИ контента. Я Оля, AI-креатор и маркетолог.'},now),null);
});

test('rejects marketplace lead-magnet ads',()=>{
 assert.equal(assess({...sample,text:'Вы работаете с WB или Ozon и не знаете где искать заказы? Забирайте бесплатный лид-магнит и подпишитесь на бота автоматизации.'},now),null);
});

test('uses copy and source buttons when direct Telegram contact is missing',()=>{
 const post=assess({...sample,contact:null},now);
 const keyboard=buildReplyButtons([post]);
 assert.equal(keyboard.inline_keyboard[0][0].copy_text.text,buildReplyDraft(post));
 assert.equal(keyboard.inline_keyboard[0][1].url,post.url);
});

test('splits reply keyboards into Telegram-safe batches',()=>{
 const post=assess(sample,now);
 const posts=Array.from({length:8},(_,index)=>({...post,id:'GetClient/'+(200+index)}));
 const batches=splitReplyBatches(posts);
 assert.deepEqual(batches.map(batch=>batch.length),[3,3,2]);
 for(const batch of batches)assert.ok(buildReplyButtons(batch).inline_keyboard.length<=3);
});

test('writes a concrete Reels editing reply instead of generic promotion copy',()=>{
 const post=assess({...sample,text:'Ищем монтажёра Reels. Сценарии и исходники готовы: нужно собрать динамичные ролики, добавить субтитры, музыку и эффекты. Удалённо, оплата за ролик.'},now);
 assert.equal(post.categories[0],'Контент / SMM / видео');
 const draft=buildReplyDraft(post);
 assert.match(draft,/монтажёра Reels\/Shorts/);
 assert.match(draft,/исходников: темп, субтитры, музыка/);
 assert.doesNotMatch(draft,/контенту и продвижению|подготовить материалы/);
 assert.ok(draft.length<=256);
});

test('keeps SMM and video editing offers different',()=>{
 const post=assess({...sample,text:'Ищем SMM-специалиста для ведения Instagram и Telegram: рубрики, контент-план, посты и аналитика. Удалённо, бюджет 40 000 руб.'},now);
 const draft=buildReplyDraft(post);
 assert.match(draft,/SMM-специалиста/);
 assert.match(draft,/рубрики, контент-план/);
 assert.doesNotMatch(draft,/монтажёра/);
});

test('selects up to 18 jobs with no more than five per direction',()=>{
 const categories=['Разработка / сайты','Контент / SMM / видео','Презентации / графика','Автоматизация / интеграции'];
 const candidates=Array.from({length:24},(_,index)=>({id:String(index),categories:[categories[Math.floor(index/6)]]}));
 const selected=selectDigestPosts(candidates);
 assert.equal(selected.length,18);
 const counts=selected.reduce((map,post)=>map.set(post.categories[0],(map.get(post.categories[0])||0)+1),new Map());
 for(const count of counts.values())assert.ok(count<=5);
});

test('reserves digest places for eligible Dprofile jobs',()=>{
 const candidates=[
  ...Array.from({length:18},(_,index)=>({id:'general-'+index,source:'GetClient',score:20-index,categories:['Разработка / сайты']})),
  {id:'dprofile-1',source:'dprofilefreelance',score:6,categories:['UX/UI и исследование']},
  {id:'dprofile-2',source:'dprofilefreelance',score:5,categories:['Презентации / графика']}
 ];
 const selected=selectDigestPosts(candidates);
 assert.equal(selected.length,7);
 assert.deepEqual(selected.filter(post=>post.source==='dprofilefreelance').map(post=>post.id),['dprofile-1','dprofile-2']);
 assert.equal(new Set(selected.map(post=>post.id)).size,selected.length);
});

test('parses Telegram message IDs for in-place button updates',()=>{
 assert.deepEqual(parseMessageIds('76, 77,78'),[76,77,78]);
 assert.deepEqual(parseMessageIds(''),[]);
 assert.throws(()=>parseMessageIds('76,nope'));
});

test('Dprofile official channel passes through direct job links',()=>{
 const html='<div class="tgme_widget_message text_not_supported_wrap" data-post="dprofilefreelance/9999">'+
 '<div class="tgme_widget_message_text js-message_text">UX/UI дизайнер — обновление интерфейсов. <a href="https://dprofile.ru/job/1702/ux-audit">Откликнуться</a></div>'+
 '<time datetime="2026-11-14T04:00:00+00:00">04:00</time></div>';
 const found=extractPosts(html,'dprofilefreelance');
 assert.equal(found.length,1);
 assert.equal(found[0].url,'https://dprofile.ru/job/1702/ux-audit');
 const picked=assess(found[0],now);
 assert.ok(picked);
 assert.ok(picked.categories.some(c=>c.includes('UX/UI')));
 assert.match(renderDigest([picked],now),/dprofile\.ru\/job\/1702/);
});

test('unavailable Dprofile source produces a clear digest warning',()=>{
 const notice='Источник Dprofile временно недоступен боту. Остальные каналы проверены независимо.';
 const digest=renderDigest([assess(sample,now)],now,notice);
 assert.match(digest,/Dprofile временно недоступен/);
 assert.match(digest,/GetClient\/111/);
});
