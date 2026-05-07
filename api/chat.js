import Anthropic from '@anthropic-ai/sdk';

const SYSTEM = `Eres un experto en la historia del CD Castellón con acceso a su base de datos histórica completa desde 1922 hasta 2026. Responde siempre en español de forma directa y precisa. Cuando los datos no sean suficientes para una respuesta exacta, indícalo claramente. Los datos excluyen amistosos y Liga Consolación. Categorías: Primera División, Segunda División, Segunda B (también llamada 2ªB), 1ª RFEF, Tercera División, Regional.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada en Vercel' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  const { messages, context } = body || {};
  if (!messages?.length) return res.status(400).json({ error: 'No messages' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM + (context ? '\n\nDATOS:\n' + context : ''),
      messages: messages.slice(-10),
    });
    return res.status(200).json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Anthropic error:', err?.status, err?.message);
    return res.status(500).json({
      error: 'Error Anthropic: ' + (err?.message || String(err))
    });
  }
}
