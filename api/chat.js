import Anthropic from '@anthropic-ai/sdk';
import { readFileSync } from 'fs';
import { join, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dirname = dirname(fileURLToPath(import.meta.url));

let FULL_CONTEXT = '';
try {
  FULL_CONTEXT = readFileSync(join(__dirname, 'context.txt'), 'utf-8');
  console.log(`Context loaded: ${Math.round(FULL_CONTEXT.length / 1024)}KB`);
} catch (err) {
  console.error('Could not load context.txt:', err.message);
}

const SYSTEM = `Eres un experto en la historia del CD Castellón con acceso a su base de datos histórica completa desde 1922 hasta 2026. Tienes acceso a TODOS los goles marcados y TODOS los partidos oficiales del club. Responde siempre en español de forma directa y precisa. Los datos excluyen amistosos y Liga Consolación. GF/GC están desde la perspectiva del CD Castellón.`;

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  if (!process.env.ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: 'API key no configurada' });
  }

  let body;
  try {
    body = typeof req.body === 'string' ? JSON.parse(req.body) : req.body;
  } catch (e) {
    return res.status(400).json({ error: 'JSON inválido' });
  }

  const { messages } = body || {};
  if (!messages?.length) return res.status(400).json({ error: 'No messages' });

  const client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });

  try {
    // Without prompt caching first to test basic functionality
    const response = await client.messages.create({
      model: 'claude-haiku-4-5-20251001',
      max_tokens: 1024,
      system: SYSTEM + '\n\nDATOS HISTÓRICOS COMPLETOS:\n' + FULL_CONTEXT,
      messages: messages.slice(-1),
    });
    return res.status(200).json({ reply: response.content[0].text });
  } catch (err) {
    console.error('Anthropic error:', JSON.stringify({
      status: err?.status,
      message: err?.message,
      error: err?.error,
    }));
    return res.status(500).json({
      error: 'Error Anthropic',
      detail: err?.message || String(err),
      status: err?.status,
    });
  }
}
