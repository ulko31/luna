export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error:'Method not allowed'});

  const accountId = process.env.CF_ACCOUNT_ID;
  const apiToken  = process.env.CF_API_TOKEN;

  if (!accountId || !apiToken) {
    console.error('Cloudflare credentials not set');
    return res.status(200).json({choices:[{message:{content:null}}]});
  }

  const { messages } = req.body;

  try {
    const r = await fetch(
      `https://api.cloudflare.com/client/v4/accounts/${accountId}/ai/run/@cf/mistral/mistral-7b-instruct-v0.1`,
      {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ messages, max_tokens: 350 })
      }
    );

    const data = await r.json();
    console.log('CF response:', JSON.stringify(data).slice(0, 300));

    if (data.success && data.result?.response) {
      return res.status(200).json({
        choices: [{ message: { content: data.result.response.trim() } }]
      });
    }

    console.error('CF error:', data.errors);
    return res.status(200).json({choices:[{message:{content:null}}]});

  } catch(e) {
    console.error('CF fetch error:', e.message);
    return res.status(200).json({choices:[{message:{content:null}}]});
  }
}
