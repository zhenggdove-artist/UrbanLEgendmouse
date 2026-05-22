const DEFAULT_ALLOWED_ORIGIN = 'https://zhenggdove-artist.github.io';
const DEFAULT_MAX_SCORE = 10000000;
const DEFAULT_MAX_ROWS = 200;
const TOP_LIMIT = 20;

function json(payload, status = 200, extraHeaders = {}) {
  return new Response(JSON.stringify(payload), {
    status,
    headers: {
      'Content-Type': 'application/json; charset=utf-8',
      ...extraHeaders,
    },
  });
}

function parseAllowedOrigins(env) {
  return String(env.ALLOWED_ORIGIN || DEFAULT_ALLOWED_ORIGIN)
    .split(',')
    .map((origin) => origin.trim())
    .filter(Boolean);
}

function corsHeaders(request, env) {
  const origin = request.headers.get('Origin') || '';
  const allowed = parseAllowedOrigins(env);
  if (!origin) return {};
  if (!allowed.includes(origin)) return null;
  return {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, Accept',
    'Access-Control-Max-Age': '86400',
  };
}

function withCors(request, env, response) {
  const cors = corsHeaders(request, env);
  if (!cors) return response;
  const headers = new Headers(response.headers);
  for (const [key, value] of Object.entries(cors)) headers.set(key, value);
  return new Response(response.body, {
    status: response.status,
    statusText: response.statusText,
    headers,
  });
}

function getMaxScore(env) {
  const value = Number(env.MAX_SCORE || DEFAULT_MAX_SCORE);
  return Number.isSafeInteger(value) && value > 0 ? value : DEFAULT_MAX_SCORE;
}

function getMaxRows(env) {
  const value = Number(env.MAX_ROWS || DEFAULT_MAX_ROWS);
  return Number.isSafeInteger(value) && value >= TOP_LIMIT ? value : DEFAULT_MAX_ROWS;
}

function sanitizeName(input) {
  const text = String(input || 'ANON RAT')
    .normalize('NFKC')
    .replace(/[\u0000-\u001f\u007f<>]/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
  return [...(text || 'ANON RAT')].slice(0, 18).join('') || 'ANON RAT';
}

function parseBoundedInt(value, field, min, max) {
  if (typeof value === 'string' && !/^\d+$/.test(value.trim())) {
    throw new Error(`${field} must be a non-negative integer`);
  }
  const number = Number(value);
  if (!Number.isSafeInteger(number) || number < min || number > max) {
    throw new Error(`${field} must be an integer from ${min} to ${max}`);
  }
  return number;
}

async function readTopEntries(env) {
  const rows = await env.DB.prepare(
    `SELECT name, score, chaos, rats, created_at
       FROM leaderboard
      ORDER BY score DESC, chaos DESC, created_at ASC
      LIMIT ?`
  ).bind(TOP_LIMIT).all();
  return (rows.results || []).map((row) => ({
    name: row.name,
    score: row.score,
    chaos: row.chaos,
    rats: row.rats,
    date: row.created_at,
  }));
}

async function pruneRows(env) {
  await env.DB.prepare(
    `DELETE FROM leaderboard
      WHERE id NOT IN (
        SELECT id FROM leaderboard
         ORDER BY score DESC, chaos DESC, created_at ASC
         LIMIT ?
      )`
  ).bind(getMaxRows(env)).run();
}

async function handleGet(env) {
  return json({ ok: true, entries: await readTopEntries(env) });
}

async function handlePost(request, env) {
  const bodyText = await request.text();
  if (bodyText.length > 1024) return json({ ok: false, error: 'Payload too large' }, 413);

  let payload;
  try {
    payload = JSON.parse(bodyText || '{}');
  } catch {
    return json({ ok: false, error: 'Invalid JSON' }, 400);
  }

  let entry;
  try {
    entry = {
      name: sanitizeName(payload.name),
      score: parseBoundedInt(payload.score, 'score', 0, getMaxScore(env)),
      chaos: parseBoundedInt(payload.chaos ?? 0, 'chaos', 0, 100),
      rats: parseBoundedInt(payload.rats ?? 0, 'rats', 0, 1000000),
    };
  } catch (error) {
    return json({ ok: false, error: error.message }, 400);
  }

  await env.DB.prepare(
    `INSERT INTO leaderboard (name, score, chaos, rats)
     VALUES (?, ?, ?, ?)`
  ).bind(entry.name, entry.score, entry.chaos, entry.rats).run();
  await pruneRows(env);

  return json({ ok: true, entries: await readTopEntries(env) }, 201);
}

export default {
  async fetch(request, env) {
    const cors = corsHeaders(request, env);
    if (request.headers.get('Origin') && !cors) {
      return json({ ok: false, error: 'Origin not allowed' }, 403);
    }
    if (request.method === 'OPTIONS') {
      return withCors(request, env, new Response(null, { status: 204 }));
    }
    if (!env.DB) {
      return withCors(request, env, json({ ok: false, error: 'D1 binding missing' }, 500));
    }

    const url = new URL(request.url);
    let response;
    try {
      if (url.pathname === '/health') {
        response = json({ ok: true });
      } else if (url.pathname === '/api/leaderboard' && request.method === 'GET') {
        response = await handleGet(env);
      } else if (url.pathname === '/api/leaderboard' && request.method === 'POST') {
        response = await handlePost(request, env);
      } else if (url.pathname === '/api/leaderboard') {
        response = json({ ok: false, error: 'Method not allowed' }, 405);
      } else {
        response = json({ ok: false, error: 'Not found' }, 404);
      }
    } catch (error) {
      response = json({ ok: false, error: error?.message || 'Server error' }, 500);
    }
    return withCors(request, env, response);
  },
};
