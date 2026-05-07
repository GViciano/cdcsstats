import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');

  // Check API key
  const hasKey = !!process.env.ANTHROPIC_API_KEY;

  // Check context file
  let ctxStatus = 'not loaded';
  let ctxSize = 0;
  try {
    const ctx = readFileSync(join(__dirname, 'context.txt'), 'utf-8');
    ctxSize = Math.round(ctx.length / 1024);
    ctxStatus = `loaded (${ctxSize}KB)`;
  } catch (err) {
    ctxStatus = 'ERROR: ' + err.message;
  }

  // Test Anthropic with minimal call
  let anthropicTest = 'not tested';
  if (hasKey) {
    try {
      const { default: Anthropic } = await import('@anthropic-ai/sdk');
      const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
      const response = await client.messages.create({
        model: 'claude-haiku-4-5-20251001',
        max_tokens: 10,
        messages: [{ role: 'user', content: 'Di ok' }],
      });
      anthropicTest = '✓ ' + response.content[0].text;
    } catch (err) {
      anthropicTest = 'ERROR: ' + err.message;
    }
  }

  res.status(200).json({
    hasAnthropicKey: hasKey,
    contextFile: ctxStatus,
    anthropicTest,
    nodeVersion: process.version,
  });
}
