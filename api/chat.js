export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({error: 'Method not allowed'});

  const hfToken = process.env.HF_TOKEN;
  if (!hfToken) {
    console.error('HF_TOKEN not set');
    return res.status(200).json({choices:[{message:{content:null}}]});
  }

  const { messages } = req.body;

  // Build prompt from messages
  const systemMsg = messages.find(m => m.role === 'system');
  const userMessages = messages.filter(m => m.role !== 'system');
  
  let prompt = systemMsg ? systemMsg.content + '\n\n' : '';
  userMessages.forEach(m => {
    if (m.role === 'user') prompt += 'Пользователь: ' + m.content + '\n';
    if (m.role === 'assistant') prompt += 'Ассистент: ' + m.content + '\n';
  });
  prompt += 'Ассистент:';

  // Try models in order
  const models = [
    'mistralai/Mistral-7B-Instruct-v0.3',
    'HuggingFaceH4/zephyr-7b-beta',
    'mistralai/Mixtral-8x7B-Instruct-v0.1',
  ];

  for (const model of models) {
    try {
      const r = await fetch(
        `https://api-inference.huggingface.co/models/${model}`,
        {
          method: 'POST',
          headers: {
            'Authorization': `Bearer ${hfToken}`,
            'Content-Type': 'application/json',
          },
          body: JSON.stringify({
            inputs: prompt,
            parameters: {
              max_new_tokens: 300,
              temperature: 0.7,
              return_full_text: false,
              stop: ['Пользователь:', '\nПользователь']
            }
          })
        }
      );

      const data = await r.json();
      console.log(`Model ${model} response:`, JSON.stringify(data).slice(0, 200));

      if (data.error) {
        if (data.error.includes('loading') || data.estimated_time) {
          // Model is loading, try next
          console.log(`${model} is loading, trying next...`);
          continue;
        }
        console.error(`${model} error:`, data.error);
        continue;
      }

      let answer = '';
      if (Array.isArray(data) && data[0]?.generated_text) {
        answer = data[0].generated_text;
      } else if (data.generated_text) {
        answer = data.generated_text;
      }

      // Clean up the answer
      answer = answer
        .replace(/Пользователь:.*/gs, '')
        .replace(/^Ассистент:\s*/i, '')
        .trim();

      if (answer) {
        return res.status(200).json({
          choices: [{ message: { content: answer } }]
        });
      }
    } catch(e) {
      console.error(`${model} fetch error:`, e.message);
      continue;
    }
  }

  // All failed — return null so frontend uses fallback
  return res.status(200).json({choices:[{message:{content:null}}]});
}
