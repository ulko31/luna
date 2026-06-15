export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const apiKey = process.env.OPENROUTER_API_KEY;
  if (!apiKey) {
    console.error('OPENROUTER_API_KEY not set');
    return res.status(500).json({error: 'API key not configured', choices: [{message:{content:'ИИ не настроен. Напишите нам: @ulko_31'}}]});
  }

  try {
    const { messages } = req.body;

    // Try multiple free models in order
    const models = [
      'mistralai/mistral-7b-instruct:free',
      'meta-llama/llama-3.2-3b-instruct:free',
      'google/gemma-2-9b-it:free',
      'qwen/qwen-2.5-7b-instruct:free',
    ];

    let lastError = null;
    for (const model of models) {
      try {
        const response = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${apiKey}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://luna-agency.ru',
            'X-Title': 'luna AI'
          },
          body: JSON.stringify({
            model,
            messages,
            max_tokens: 350,
            temperature: 0.7
          })
        });

        const data = await response.json();

        if (data.error) {
          console.error(`Model ${model} error:`, data.error.message);
          lastError = data.error.message;
          continue; // try next model
        }

        if (data.choices && data.choices[0]) {
          console.log(`Success with model: ${model}`);
          return res.status(200).json(data);
        }
      } catch(e) {
        console.error(`Model ${model} fetch error:`, e.message);
        lastError = e.message;
        continue;
      }
    }

    // All models failed
    console.error('All models failed. Last error:', lastError);
    return res.status(200).json({
      choices: [{message:{content: 'Сервис временно недоступен. Напишите нам напрямую: @ulko_31 или uly.kozmenko@gmail.com'}}]
    });

  } catch(e) {
    console.error('Handler error:', e.message);
    return res.status(200).json({
      choices: [{message:{content: 'Ошибка сервера. Напишите нам: @ulko_31'}}]
    });
  }
}
