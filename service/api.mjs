// Worker entry for the encrypted room and opt-in pilot API. The D1 schema is in schema.sql.
const pagesOrigin = 'https://foxfordkz-cyber.github.io';
const roomPath = /^\/v1\/rooms\/([A-Za-z0-9_-]{43})$/;
const cipherLimit = 1400000;
const tasks = ['food-a', 'food-b', 'transport-a', 'transport-b', 'income-a', 'income-b'];

function fail(status, message) {
  throw Object.assign(new Error(message), { status });
}
function onlyKeys(value, keys) {
  return value !== null && typeof value === 'object' && !Array.isArray(value) &&
    Object.keys(value).length === keys.length && keys.every(k => Object.hasOwn(value, k));
}
async function readBody(request, limit) {
  if (!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')) fail(415, 'json_required');
  if (Number(request.headers.get('Content-Length')) > limit) fail(413, 'too_large');
  const reader = request.body?.getReader();
  if (!reader) fail(400, 'missing_body');
  const decoder = new TextDecoder();
  let size = 0, body = '';
  for (;;) {
    const chunk = await reader.read();
    if (chunk.done) break;
    size += chunk.value.length;
    if (size > limit) { await reader.cancel(); fail(413, 'too_large'); }
    body += decoder.decode(chunk.value, { stream: true });
  }
  try { return JSON.parse(body + decoder.decode()); } catch { fail(400, 'invalid_json'); }
}
async function digest(text) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text));
  return Array.from(new Uint8Array(bytes), n => n.toString(16).padStart(2, '0')).join('');
}
function checkBox(box) {
  if (!onlyKeys(box, ['iv', 'ciphertext']) || typeof box.iv !== 'string' || !/^[\w-]{16}$/.test(box.iv) ||
      typeof box.ciphertext !== 'string' || box.ciphertext.length < 22 || box.ciphertext.length > cipherLimit ||
      !/^[\w-]+$/.test(box.ciphertext)) fail(422, 'invalid_encrypted_box');
}
const json = (value, status = 200) => Response.json(value, { status });

async function room(request, url, db, id) {
  const match = /^Bearer ([A-Za-z0-9_-]{43})$/.exec(request.headers.get('Authorization') || '');
  if (!match) fail(401, 'room_key_required');
  const hash = await digest(match[1]);
  if (request.method === 'POST') {
    const body = await readBody(request, cipherLimit + 240);
    if (!onlyKeys(body, ['box'])) fail(422, 'invalid_create');
    checkBox(body.box);
    const inserted = await db.prepare(
      'INSERT OR IGNORE INTO rooms (id,token_hash,revision,box,created_at) SELECT ?,?,1,?,unixepoch() WHERE (SELECT COUNT(*) FROM rooms WHERE created_at >= unixepoch()-3600) < 300'
    ).bind(id, hash, JSON.stringify(body.box)).run();
    if (inserted.meta.changes) return json({ rev: 1 }, 201);
    const existing = await db.prepare('SELECT revision FROM rooms WHERE id=? AND token_hash=?').bind(id, hash).first();
    if (existing) return json({ rev: existing.revision });
    fail(429, 'room_creation_unavailable');
  }
  const current = await db.prepare('SELECT revision FROM rooms WHERE id=? AND token_hash=?').bind(id, hash).first();
  if (!current) fail(404, 'room_unavailable');
  if (request.method === 'GET') {
    if (url.searchParams.get('since') === String(current.revision)) return new Response(null, { status: 304 });
    const row = await db.prepare('SELECT revision,box FROM rooms WHERE id=? AND token_hash=?').bind(id, hash).first();
    if (!row) fail(404, 'room_unavailable');
    return json({ rev: row.revision, box: JSON.parse(row.box) });
  }
  if (request.method === 'DELETE') {
    await db.prepare('DELETE FROM rooms WHERE id=? AND token_hash=?').bind(id, hash).run();
    return new Response(null, { status: 204 });
  }
  if (request.method !== 'PUT') fail(405, 'method_not_allowed');
  const body = await readBody(request, cipherLimit + 240);
  if (!onlyKeys(body, ['rev', 'box']) || !Number.isSafeInteger(body.rev) || body.rev < 1) fail(422, 'invalid_revision');
  checkBox(body.box);
  const changed = await db.prepare('UPDATE rooms SET box=?,revision=revision+1 WHERE id=? AND token_hash=? AND revision=?')
    .bind(JSON.stringify(body.box), id, hash, body.rev).run();
  if (!changed.meta.changes) fail(409, 'revision_changed');
  return json({ rev: body.rev + 1 });
}
function validatePilot(body) {
  if (!onlyKeys(body, ['version','runId','order','trials']) || body.version !== 1 ||
      typeof body.runId !== 'string' || !/^[0-9a-f]{8}-[0-9a-f]{4}-4[0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(body.runId) ||
      !['manual-first','ai-first'].includes(body.order) || !Array.isArray(body.trials) || body.trials.length !== 6) fail(422, 'invalid_run');
  const first = body.order === 'manual-first' ? 'manual' : 'ai';
  const seen = new Set(), pairs = new Set(), times = { manual: [], ai: [] }, wrong = { manual: 0, ai: 0 };
  let corrected = 0;
  for (const [i, trial] of body.trials.entries()) {
    const mode = i < 3 ? first : first === 'ai' ? 'manual' : 'ai';
    if (!onlyKeys(trial, ['taskId','mode','activeMs','wrongAttempts','correctedFields']) || trial.mode !== mode ||
        !tasks.includes(trial.taskId) || seen.has(trial.taskId) ||
        !Number.isInteger(trial.activeMs) || trial.activeMs < 1 || trial.activeMs > 86400000 ||
        !Number.isInteger(trial.wrongAttempts) || trial.wrongAttempts < 0 || trial.wrongAttempts > 1000 ||
        !Number.isInteger(trial.correctedFields) || trial.correctedFields < 0 || trial.correctedFields > (mode === 'ai' ? 4 : 0)) fail(422, 'invalid_trial');
    const pair = mode + ':' + trial.taskId.split('-')[0];
    if (pairs.has(pair)) fail(422, 'unbalanced_tasks');
    pairs.add(pair); seen.add(trial.taskId); times[mode].push(trial.activeMs); wrong[mode] += trial.wrongAttempts;
    corrected += trial.correctedFields;
  }
  const median = a => a.sort((x, y) => x - y)[1];
  return { manual: median(times.manual), ai: median(times.ai), wrong, corrected };
}
async function submitPilot(request, url, db) {
  const body = await readBody(request, 8000);
  const stats = validatePilot(body);
  if (url.searchParams.get('dryRun') === '1') return json({ valid: true, stored: false });
  const fingerprint = await digest(JSON.stringify([body.order, ...body.trials.map(t => [t.taskId,t.mode,t.activeMs,t.wrongAttempts,t.correctedFields])]));
  const inserted = await db.prepare(
    'INSERT OR IGNORE INTO pilot_runs (id,fingerprint,trial_order,manual_ms,ai_ms,manual_wrong,ai_wrong,corrected,created_at) SELECT ?,?,?,?,?,?,?,?,unixepoch() WHERE (SELECT COUNT(*) FROM pilot_runs WHERE created_at >= unixepoch()-3600) < 1000'
  ).bind(body.runId, fingerprint, body.order, stats.manual, stats.ai, stats.wrong.manual, stats.wrong.ai, stats.corrected).run();
  if (inserted.meta.changes) return json({ accepted: true }, 201);
  const existing = await db.prepare('SELECT fingerprint FROM pilot_runs WHERE id=?').bind(body.runId).first();
  if (!existing) fail(429, 'try_later');
  if (existing.fingerprint !== fingerprint) fail(409, 'run_id_reused');
  return json({ accepted: true });
}
async function pilotSummary(db) {
  // The two independent rankings compute the median of each participant's within-arm median.
  const row = await db.prepare("WITH ranked AS (SELECT *,ROW_NUMBER() OVER (ORDER BY manual_ms) m,ROW_NUMBER() OVER (ORDER BY ai_ms) a,COUNT(*) OVER () n FROM pilot_runs) SELECT COUNT(*) sessions, AVG(CASE WHEN m IN ((n+1)/2,(n+2)/2) THEN manual_ms END) manualMedianMs, AVG(CASE WHEN a IN ((n+1)/2,(n+2)/2) THEN ai_ms END) aiMedianMs, COALESCE(SUM(manual_wrong),0) manualWrongAttempts, COALESCE(SUM(ai_wrong),0) aiWrongAttempts, COALESCE(SUM(corrected),0) aiCorrectedFields, COUNT(CASE WHEN trial_order='manual-first' THEN 1 END) manualFirst FROM ranked").first();
  const { manualFirst, ...summary } = row;
  return json({ ...summary, orders: { 'manual-first': manualFirst, 'ai-first': row.sessions - manualFirst } });
}
export async function handleBudgetApi(request, db) {
  const url = new URL(request.url), origin = request.headers.get('Origin');
  const local = /^https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?$/;
  const permitted = !origin || origin === pagesOrigin || origin === url.origin || (local.test(url.origin) && local.test(origin));
  const headers = { 'Cache-Control': 'no-store', 'Vary': 'Origin', 'X-Content-Type-Options':'nosniff' };
  if (origin && permitted) {
    headers['Access-Control-Allow-Origin'] = origin;
    headers['Access-Control-Allow-Headers'] = 'Authorization, Content-Type';
    headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS';
    headers['Access-Control-Max-Age'] = '600';
  }
  let result;
  try {
    if (!permitted) fail(403, 'origin_not_allowed');
    if (request.method === 'OPTIONS') result = new Response(null, { status: 204 });
    else if (!db) fail(503, 'database_unavailable');
    else if (url.pathname === '/v1/health' && request.method === 'GET') {
      await db.prepare('SELECT revision FROM rooms LIMIT 1').first(); result = json({ ok: true, version: 1 });
    } else if (roomPath.test(url.pathname)) result = await room(request, url, db, roomPath.exec(url.pathname)[1]);
    else if (url.pathname === '/v1/pilot/results' && request.method === 'POST') result = await submitPilot(request, url, db);
    else if (url.pathname === '/v1/pilot/summary' && request.method === 'GET') result = await pilotSummary(db);
    else fail(404, 'not_found');
  } catch (e) {
    result = json({ error: e.status ? e.message : 'service_unavailable' }, e.status || 503);
  }
  Object.entries(headers).forEach(([key,value]) => result.headers.set(key,value));
  return result;
}
