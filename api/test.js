export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  const hasKey = !!process.env.GEMINI_API_KEY;
  const keyPrefix = hasKey ? process.env.GEMINI_API_KEY.slice(0, 8) + '...' : 'NO KEY';

  // Try a minimal Gemini call without context
  let geminiTest = 'not tested';
  if (hasKey) {
    try {
      const { GoogleGenerativeAI } = await import('@google/generative-ai');
      const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
      const model = genAI.getGenerativeModel({ model: 'gemini-2.0-flash' });
      const result = await model.generateContent('Di "ok" en una sola palabra');
      geminiTest = result.response.text().trim();
    } catch (err) {
      geminiTest = 'ERROR: ' + err.message;
    }
  }

  res.status(200).json({
    status: 'ok',
    hasGeminiKey: hasKey,
    keyPrefix,
    geminiTest,
    nodeVersion: process.version,
  });
}
