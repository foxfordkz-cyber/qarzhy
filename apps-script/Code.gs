/**
 * Otbasy Budget — Gemini proxy on Google Apps Script.
 *
 * The site never sees the Gemini API key: it calls this web app, and this script calls Gemini.
 * Setup (5 minutes, see apps-script/README.md):
 *   1. script.google.com → New project → paste this file.
 *   2. Project Settings → Script properties:
 *        GEMINI_API_KEY = <key from aistudio.google.com>
 *        GEMINI_MODEL   = gemini-2.5-flash   (optional; any model available to the key)
 *   3. Deploy → New deployment → Web app → Execute as: Me, Who has access: Anyone → copy the /exec URL.
 *   4. On the site: Параметрлер → Жасанды интеллект (Gemini) → paste the URL → Сақтау және тексеру.
 *
 * Personal mode sends the entered phrase or the question and budget totals when enabled.
 * Demo and transaction lookups run locally. The proxy does not store requests.
 */

var PROPS = PropertiesService.getScriptProperties();
var MAX_PER_MINUTE = 40;

function doGet() { return json({ ok: !!PROPS.getProperty('GEMINI_API_KEY'), model: model_() }); }

function doPost(e) {
  try {
    var req = JSON.parse((e && e.postData && e.postData.contents) || '{}');
    if (!rateOk_()) return json({ error: 'rate_limited' });
    if (req.task === 'ping') {
      var reply = gemini_('Answer briefly.', 'Say OK.', null, 512);
      return json({ ok: !!reply.trim(), model: model_() });
    }
    if (req.task === 'parse') return json(parse_(String(req.text || '').slice(0, 200), (req.names || []).slice(0, 10)));
    if (req.task === 'ask') return json(ask_(String(req.question || '').slice(0, 300), req.context || {}));
    return json({ error: 'unknown_task' });
  } catch (err) {
    return json({ error: String(err && err.message || err) });
  }
}

function model_() { return PROPS.getProperty('GEMINI_MODEL') || 'gemini-2.5-flash'; }

function json(obj) { return ContentService.createTextOutput(JSON.stringify(obj)).setMimeType(ContentService.MimeType.JSON); }

function rateOk_() {
  var lock = LockService.getScriptLock();
  if (!lock.tryLock(300)) return false;
  try {
    var cache = CacheService.getScriptCache();
    var key = 'rate_' + Math.floor(Date.now() / 60000);
    var n = Number(cache.get(key) || 0);
    if (n >= MAX_PER_MINUTE) return false;
    cache.put(key, String(n + 1), 120);
    return true;
  } finally { lock.releaseLock(); }
}

function gemini_(system, user, schema, maxTokens) {
  var key = PROPS.getProperty('GEMINI_API_KEY');
  if (!key) throw new Error('GEMINI_API_KEY is not set in Script properties');
  var body = {
    systemInstruction: { parts: [{ text: system }] },
    contents: [{ role: 'user', parts: [{ text: user }] }],
    generationConfig: { temperature: 0.2, maxOutputTokens: maxTokens || 1024 }
  };
  if (schema) { body.generationConfig.responseMimeType = 'application/json'; body.generationConfig.responseSchema = schema; }
  var res = UrlFetchApp.fetch('https://generativelanguage.googleapis.com/v1beta/models/' + encodeURIComponent(model_()) + ':generateContent', {
    method: 'post', contentType: 'application/json', headers: { 'x-goog-api-key': key },
    payload: JSON.stringify(body), muteHttpExceptions: true
  });
  if (res.getResponseCode() !== 200) throw new Error('gemini_http_' + res.getResponseCode());
  var data = JSON.parse(res.getContentText());
  var parts = (data.candidates && data.candidates[0] && data.candidates[0].content && data.candidates[0].content.parts) || [];
  return parts.map(function (p) { return p.text || ''; }).join('');
}

var PARSE_SCHEMA = {
  type: 'OBJECT',
  properties: {
    type: { type: 'STRING', enum: ['income', 'expense'] },
    amount: { type: 'INTEGER' },
    member: { type: 'STRING' },
    category: { type: 'STRING', enum: ['food', 'transport', 'home', 'other', 'none'] },
    note: { type: 'STRING' }
  },
  required: ['type', 'amount', 'category', 'member', 'note']
};

function parse_(text, names) {
  var system = [
    'You turn one short phrase about a family\'s money (Kazakh, Russian or mixed) into a budget record.',
    'Return JSON only.',
    'type: "income" for salary, scholarship, benefits, bonuses, money received or sold items; otherwise "expense".',
    'amount: integer in tenge. "мың"/"тыс"/"к" = thousand, "млн" = million. 0 if there is no amount.',
    'member: the family member\'s first name in nominative case without Kazakh case endings (Айгүлге → Айгүл, Арманның → Арман).',
    'Prefer one of the known names if it matches: ' + JSON.stringify(names) + '. Empty string if no name.',
    'category for expenses: food (groceries, cafes, food delivery), transport (taxi, fuel, public transport, car, tickets),',
    'home (rent, utilities, internet, mobile, furniture, repairs, mortgage), other (health, education, kindergarten, clothes, sport, gifts, fun).',
    'For income use "none".',
    'note: 2–5 words in the phrase\'s language describing what it was, without the amount and the name.'
  ].join('\n');
  var out = JSON.parse(gemini_(system, text, PARSE_SCHEMA, 512));
  if (out.category === 'none') out.category = null;
  out.model = model_();
  return out;
}

function ask_(question, context) {
  var system = [
    'Сен — «Отбасы бюджеті» сайтындағы отбасылық қаржы көмекшісісің.',
    'Жауапты пайдаланушы жазған тілде бер (қазақша немесе орысша), 3–6 сөйлем, қарапайым тілмен.',
    'Отбасының таңдалған айдағы деректері берілген (сомалар теңгемен). Нақты цифрларға сүйен, ойдан сан шығарма.',
    'Инвестициялық, салықтық немесе заңгерлік кепілдік берме; керек болса маманға жүгінуге кеңес бер.',
    'Банк картасының деректерін, SMS-кодты, құпиясөзді ешқашан сұрама.'
  ].join('\n');
  var user = 'Отбасы деректері: ' + JSON.stringify(context) + '\n\nСұрақ: ' + question;
  return { answer: gemini_(system, user, null, 700), model: model_() };
}
