import {load} from './admin.js';
const STUDIO_CONTEXT = [
  'Ты — ассистент студии OOOPS! digital product & creative studio',
  'Отвечай только на вопросы об услугах, портфолио и формате сотрудничества',
  'Студия разрабатывает веб-приложения, Telegram Mini Apps, MVP, сайты, интерфейсы, айдентику, контент и креативы',
  'Кейсы: SOFE — wellness-приложение с питанием и дневником активности; Кружок Станкевича — дизайн сайта; АртКорпус — графический проект; Двор.Дети — сайт; Место СПБ — рекомендательный сервис',
  'Команда: Ульяна — продукт и разработка, Алия — дизайн, Илона — соцсети, Алина — видеопродакшн (проектное участие)',
  'Для расчёта сроков и стоимости нужно связаться с командой: Telegram @ulko_31, email ooopsagency@outlook.com',
  'Не придумывай цены, точные сроки, отзывы, статистику, гарантии, клиентов и готовые функции. Не обещай интеграции до оценки',
  'ОБЯЗАТЕЛЬНО: отвечай исключительно на русском языке, даже если клиент спрашивает по-английски. Названия брендов и продуктов можно оставлять без перевода',
  'Пиши по-русски, дружелюбно, кратко: 1-4 предложения. Не запрашивай секретные сведения и не делай вид, что ты человек',
  'Если вопрос не о студии, мягко верни разговор к услугам и проектам'
].join('. ');
const FAQ = [
  {intent:'contact',rx:/обсуд|сотруднич|связат|написат|заказат|оставить заяв|начать проект|хочу проект|бриф|контакт|телеграм|telegram|почт|email/i,
   answer:'Обсудить проект можно через кнопку «Обсудить проект» на сайте — заполните короткую форму, и мы свяжемся с вами. Или напишите напрямую в Telegram @ulko_31 либо на почту ooopsagency@outlook.com. Опишите вашу задачу и желаемые сроки, чтобы мы могли предложить следующий шаг.'},
  {intent:'price',rx:/цен|стоим|бюджет|сколько стоит|тариф|оплат/i,
   answer:'Стоимость рассчитываем индивидуально: она зависит от задачи, объёма и сроков. Расскажите о проекте через форму на сайте или в Telegram @ulko_31 — обсудим формат и подготовим оценку.'},
  {intent:'timeline',rx:/срок|долго|недел|месяц|быстро|успеете/i,
   answer:'Срок зависит от объёма и сложности проекта. Сначала уточним задачи и приоритеты, а затем предложим этапы и реалистичный график. Напишите о проекте через форму на сайте или в Telegram @ulko_31.'},
  {intent:'portfolio',rx:/кейс|портфолио|примеры работ|готовые проект|покажите работ/i,
   answer:'В нашем портфолио есть SOFE — wellness-приложение, «Кружок Станкевича» — дизайн сайта, «АртКорпус» — графический проект и «Двор.Дети» — сайт. Посмотреть работы и изображения можно в разделе «Проекты», а затем открыть интересующий кейс.'},
  {intent:'services',rx:/услуг|что делаете|направлен|умеете|сайт|разработ|дизайн|брендинг|контент|приложени|mvp/i,
   answer:'OOOPS создаёт сайты, веб-приложения, Telegram Mini Apps, MVP, брендинг и контент. Расскажите, что хотите запустить, и мы подскажем подходящий формат и с чего лучше начать.'}
];
function referenceAnswer(question){
  const match=FAQ.find(item=>item.rx.test(question));
  return match?.answer||'Помогу разобраться в услугах, портфолио и сотрудничестве с OOOPS. Расскажите о своей задаче, или откройте раздел «Контакты», чтобы написать команде напрямую.';
}
const isRussian=text=>(String(text).match(/[А-Яа-яЁё]/g)||[]).length>=12;
function cleanAnswer(answer){
 return String(answer||'').replace(/^(assistant|ассистент)\s*:\s*/i,'').trim().slice(0,1100);
}
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const question=typeof req.body?.question==='string'?req.body.question.trim():'';
  if(!question||question.length>450)return res.status(400).json({error:'Invalid question'});
  try{const {data}=await load();if(data?.settings?.aiEnabled===false)return res.status(503).json({error:'Assistant disabled by administrator'});}catch{}
  // Answer the most common commercial questions consistently before consulting a generative model.
  if(FAQ.some(item=>item.rx.test(question)))return res.status(200).json({answer:referenceAnswer(question),source:'studio'});
  const accountId=process.env.CF_ACCOUNT_ID,token=process.env.CF_API_TOKEN;
  if(!accountId||!token)return res.status(200).json({answer:referenceAnswer(question),source:'studio'});
  try{
    const controller=new AbortController();
    const timeout=setTimeout(()=>controller.abort(),9000);
    let upstream;
    try{
      upstream=await fetch('https://api.cloudflare.com/client/v4/accounts/'+encodeURIComponent(accountId)+'/ai/run/@cf/mistral/mistral-7b-instruct-v0.1',{
        method:'POST',
        headers:{Authorization:'Bearer '+token,'Content-Type':'application/json'},
        body:JSON.stringify({messages:[{role:'system',content:STUDIO_CONTEXT},{role:'user',content:question}],max_tokens:230}),
        signal:controller.signal
      });
    }finally{clearTimeout(timeout)}
    if(!upstream.ok)return res.status(200).json({answer:referenceAnswer(question),source:'studio'});
    const data=await upstream.json();
    const answer=typeof data?.result?.response==='string'?data.result.response.trim():'';
    if(!data.success||!answer)return res.status(200).json({answer:referenceAnswer(question),source:'studio'});
    // Cloudflare's model occasionally ignores language instructions: never show an English reply.
    return res.status(200).json({answer:isRussian(answer)?cleanAnswer(answer):referenceAnswer(question),source:isRussian(answer)?'model':'studio'});
  }catch(err){
    console.error('OOOPS assistant request failed:',err?.message);
    return res.status(200).json({answer:referenceAnswer(question),source:'studio'});
  }
}