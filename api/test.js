export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  if (!process.env.GEMINI_API_KEY) {
    return res.status(200).json({ error: 'No GEMINI_API_KEY' });
  }

  const models = ['gemini-1.5-flash', 'gemini-1.5-flash-latest', 'gemini-1.5-flash-001',
                  'gemini-1.5-flash-002', 'gemini-pro', 'gemini-1.0-pro',
                  'gemini-2.0-flash-lite', 'gemini-2.5-flash-preview-05-20'];
  const results = {};

  const { GoogleGenerativeAI } = await import('@google/generative-ai');
  const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

  for (const m of models) {
    try {
      const model = genAI.getGenerativeModel({ model: m });
      const result = await model.generateContent('Di "ok"');
      results[m] = '✓ ' + result.response.text().trim().slice(0, 20);
      break; // stop at first working model
    } catch (err) {
      results[m] = err.message.slice(0, 80);
    }
  }

  res.status(200).json({ results });
}
