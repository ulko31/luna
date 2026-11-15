import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPosts,assess,renderDigest,findContact,buildReplyDraft,buildReplyButtons,splitReplyBatches} from './digest.mjs';

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
 assert.match(draft,/разработке сайта или сервиса/);
 assert.match(draft,/Задача ещё актуальна/);
 assert.match(draft,/ooops\.agency/);
 const keyboard=buildReplyButtons([post]);
 assert.match(keyboard.inline_keyboard[0][0].url,/https:\/\/t\.me\/clientname\?text=/);
 assert.equal(keyboard.inline_keyboard[0][1].copy_text.text,draft);
});

test('prioritizes a card-design hashtag over unrelated automation wording',()=>{
 const post=assess({...sample,text:'#дизайнеркарточек Ищут специалиста по визуалу карточек товара. В компании также внедряют автоматизацию процессов. Проектная работа, бюджет 30 000 руб.'},now);
 assert.equal(post.categories[0],'Презентации / графика');
 const draft=buildReplyDraft(post);
 assert.match(draft,/запрос по дизайну карточек/);
 assert.match(draft,/визуальную систему/);
 assert.doesNotMatch(draft,/запрос по автоматизации/);
});

test('rejects freelancer self-promotion hashtags',()=>{
 assert.equal(assess({...sample,text:'#резюме #помогу #дизайн Есть идея или задача? Создам сайт, графику и автоматизацию.'},now),null);
});

test('treats educational course materials as graphic design, not video',()=>{
 const post=assess({...sample,text:'#дизайнеробразовательныхпродуктов Для видеокурсов ищут дизайнера дополнительных материалов: гайды, презентации, баннеры и обложки. Проектная работа, оплата 30 000 руб.'},now);
 assert.equal(post.categories[0],'Презентации / графика');
 assert.match(buildReplyDraft(post),/графическому дизайну|дизайну презентации/);
});

test('treats advertising manager roles as content and promotion',()=>{
 const post=assess({...sample,text:'#менеджерпорекламе Ищут менеджера по закупке рекламы в Instagram и Telegram: медиаплан, анализ блогеров, контроль интеграций. Удалённая проектная работа, доход 50 000 руб.'},now);
 assert.equal(post.categories[0],'Контент / SMM / видео');
 assert.match(buildReplyDraft(post),/контенту и продвижению/);
 assert.match(post.budget,/50 000/);
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
