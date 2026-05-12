// Proxy para FotMob API — evita bloqueos CORS
// Cache en memoria de 6 horas para no sobrecargar FotMob

const CACHE = {};
const CACHE_TTL = 6 * 60 * 60 * 1000; // 6h

const FOTMOB_BASE = 'https://www.fotmob.com/api';

const HEADERS = {
  'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0.0.0 Safari/537.36',
  'Accept': 'application/json',
  'Accept-Language': 'es-ES,es;q=0.9',
  'Referer': 'https://www.fotmob.com/',
  'Origin': 'https://www.fotmob.com',
};

function cached(key) {
  const e = CACHE[key];
  if (e && Date.now() - e.ts < CACHE_TTL) return e.data;
  return null;
}

function setCache(key, data) {
  CACHE[key] = { ts: Date.now(), data };
}

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
  if (req.method === 'OPTIONS') return res.status(200).end();
  if (req.method !== 'GET') return res.status(405).json({ error: 'GET only' });

  const { endpoint, ...params } = req.query;
  if (!endpoint) return res.status(400).json({ error: 'endpoint param required' });

  // Allowed endpoints whitelist
  const ALLOWED = ['teams', 'leagues', 'matchDetails', 'playerData', 'playerStats'];
  if (!ALLOWED.includes(endpoint)) {
    return res.status(400).json({ error: 'endpoint not allowed' });
  }

  // Build FotMob URL
  const qs = new URLSearchParams(params).toString();
  const url = `${FOTMOB_BASE}/${endpoint}${qs ? '?' + qs : ''}`;
  const cacheKey = url;

  // Return cached if available
  const hit = cached(cacheKey);
  if (hit) {
    res.setHeader('X-Cache', 'HIT');
    return res.status(200).json(hit);
  }

  try {
    const r = await fetch(url, { headers: HEADERS });
    if (!r.ok) {
      return res.status(r.status).json({ error: `FotMob returned ${r.status}` });
    }
    const data = await r.json();
    setCache(cacheKey, data);
    res.setHeader('X-Cache', 'MISS');
    return res.status(200).json(data);
  } catch (err) {
    console.error('FotMob proxy error:', err.message);
    return res.status(502).json({ error: 'FotMob unreachable', detail: err.message });
  }
}
