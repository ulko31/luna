export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const TG_TOKEN = process.env.TELEGRAM_BOT_TOKEN;
  const TG_CHAT  = process.env.TELEGRAM_CHAT_ID;
  if (!TG_TOKEN || !TG_CHAT) return res.status(500).json({error: 'Telegram not configured'});

  const { name, phone, company, service, msg } = req.body;

  const text = `🔔 *Новая заявка — luna*\n\n` +
    `👤 *Имя:* ${name}\n` +
    `📱 *Контакт:* ${phone}\n` +
    (company ? `🏢 *Компания:* ${company}\n` : '') +
    (service ? `🎯 *Услуга:* ${service}\n` : '') +
    (msg ? `\n💬 *Сообщение:*\n${msg}` : '') +
    `\n\n🕐 ${new Date().toLocaleString('ru')}`;

  try {
    const r = await fetch(`https://api.telegram.org/bot${TG_TOKEN}/sendMessage`, {
      method: 'POST',
      headers: {'Content-Type': 'application/json'},
      body: JSON.stringify({chat_id: TG_CHAT, text, parse_mode: 'Markdown'})
    });
    const data = await r.json();
    if (!data.ok) throw new Error(data.description);
    return res.status(200).json({ok: true});
  } catch(e) {
    return res.status(500).json({error: e.message});
  }
}
