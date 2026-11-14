import test from 'node:test';
import assert from 'node:assert/strict';
import {extractPosts,assess,renderDigest} from './digest.mjs';
const now=new Date('2026-11-14T06:17:00Z');
const sample={id:'GetClient/111',source:'GetClient',url:'https://t.me/GetClient/111',date:new Date('2026-11-14T05:00:00Z'),text:'Ищем исполнителя для разработки сайта и автоматизации обработки заявок, CRM API и Telegram-бота. Проектная работа, бюджет 35 000 руб. Пишите в личку.'};
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
test('parses Telegram public message blocks',()=>{
 const html='<div class="tgme_widget_message text_not_supported_wrap" data-post="GetClient/123"><div class="tgme_widget_message_text js-message_text" dir="auto">Ищем разработчика сайта!<br>Бюджет 40 000 руб. Оплата по проекту.</div><time datetime="2026-11-14T04:00:00+00:00">04:00</time></div>';
 const p=extractPosts(html,'GetClient');assert.equal(p.length,1);
 assert.match(p[0].text,/разработчика сайта/);
 assert.equal(p[0].url,'https://t.me/GetClient/123');
});
test('creates safe Telegram HTML and original deep links',()=>{
 const message=renderDigest([assess(sample,now)],now);
 assert.match(message,/https:\/\/t\.me\/GetClient\/111/);
 assert.match(message,/Автоматизация/);
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
