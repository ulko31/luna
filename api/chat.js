const STUDIO_CONTEXT = [
  'Ты — ассистент студии OOOPS! digital product & creative studio',
  'Отвечай только на вопросы об услугах, портфолио и формате сотрудничества',
  'Студия разрабатывает веб-приложения, Telegram Mini Apps, MVP, сайты, интерфейсы, айдентику, контент и креативы',
  'Кейсы: SOFE — wellness-приложение с питанием и дневником активности; Кружок Станкевича — дизайн сайта; АртКорпус — графический проект; Двор детям — сайт, подробности в подготовке; Место СПБ — рекомендательный сервис',
  'Команда: Ульяна — продукт и разработка, Алия — дизайн, Илона — соцсети, Алина — видеопродакшн (проектное участие)',
  'Для расчёта сроков и стоимости нужно связаться с командой: Telegram @ulko_31, email uly.kozmenko@gmail.com',
  'Не придумывай цены, точные сроки, отзывы, статистику, гарантии, клиентов и готовые функции. Не обещай интеграции до оценки',
  'ОБЯЗАТЕЛЬНО: отвечай исключительно на русском языке, даже если клиент спрашивает по-английски. Названия брендов и продуктов можно оставлять без перевода',
  'Пиши по-русски, дружелюбно, кратко: 1-4 предложения. Не запрашивай секретные сведения и не делай вид, что ты человек',
  'Если вопрос не о студии, мягко верни разговор к услугам и проектам'
].join('. ');
export default async function handler(req,res){
  res.setHeader('Cache-Control','no-store');
  if(req.method!=='POST')return res.status(405).json({error:'Method not allowed'});
  const question=typeof req.body?.question==='string'?req.body.question.trim():'';
  if(!question||question.length>450)return res.status(400).json({error:'Invalid question'});
  const accountId=process.env.CF_ACCOUNT_ID,token=process.env.CF_API_TOKEN;
  if(!accountId||!token)return res.status(503).json({error:'Assistant temporarily unavailable'});
  const isRussian = text => (text.match(/[А-Яа-яЁё]/g)||[]).length >= 12;
  const russianFallback = 'Мы создаём сайты, цифровые продукты, дизайн и контент. Среди наших проектов — SOFE, Кружок Станкевича, АртКорпус и Место СПБ. Расскажите подробнее о вашей задаче или напишите нам в Telegram @ulko_31 — подскажем, с чего начать.';
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
    if(!upstream.ok)return res.status(503).json({error:'Model unavailable'});
    const data=await upstream.json();
    const answer=typeof data?.result?.response==='string'?data.result.response.trim():'';
    if(!data.success||!answer)return res.status(503).json({error:'Model unavailable'});
    // Cloudflare's model occasionally ignores language instructions: never show an English reply.
    return res.status(200).json({answer:(isRussian(answer)?answer:russianFallback).slice(0,2200)});
  }catch(err){
    console.error('OOOPS assistant request failed:',err?.message);
    return res.status(503).json({error:'Assistant temporarily unavailable'});
  }
}