export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const { name, phone, company, service, msg } = req.body;
  if (!name || !phone) return res.status(400).json({error: 'Имя и контакт обязательны'});

  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TG_CHAT  = process.env.TELEGRAM_CHAT_ID;

  const text = [
    '🔔 *Новая заявка — luna*',
    '',
    `👤 *Имя:* ${name}`,
    `📱 *Контакт:* ${phone}`,
    company ? `🏢 *Компания:* ${company}` : null,
    service ? `🎯 *Услуга:* ${service}` : null,
    msg ? `\n💬 *Сообщение:*\n${msg}` : null,
    '',
    `🕐 ${new Date().toLocaleString('ru', {timeZone: 'Europe/Moscow'})}`,
  ].filter(Boolean).join('\n');

  // Try Telegram
  if (TG_TOKEN && TG_CHAT) {
    try {
      const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
        method: 'POST',
        headers: {'Content-Type': 'application/json'},
        body: JSON.stringify({
          chat_id: TG_CHAT,
          text,
          parse_mode: 'Markdown'
        })
      });
      const data = await r.json();
      if (data.ok) return res.status(200).json({ok: true, via: 'telegram'});
      console.error('TG error:', data);
    } catch(e) {
      console.error('TG fetch error:', e.message);
    }
  }

  // Fallback — log to Vercel console at minimum
  console.log('=== NEW LEAD (no TG configured) ===');
  console.log(text);
  console.log('===================================');

  // Return ok so user sees success — check Vercel logs for leads
  return res.status(200).json({ok: true, via: 'log'});
}
