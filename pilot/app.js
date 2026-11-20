(function () {
  'use strict';
  var study = window.QarzhyPilotStudy;
  var $ = function (id) { return document.getElementById(id); };
  var params = new URLSearchParams(location.search);
  if ('serviceWorker' in navigator && /^https?:$/.test(location.protocol)) navigator.serviceWorker.register('../sw.js').catch(function () {});
  var qa = params.get('qa') === '1';
  var group = ['A', 'B'].includes(params.get('group')) ? params.get('group') : '';
  var key = 'otbasy-budget:pilot:v1:' + (qa ? 'qa' : 'participant') + ':' + (group || 'random');
  var state = null, clock = null, sending = false;
  var views = ['intro', 'task', 'rest', 'results', 'summary'];
  var fieldNames = { type: 'Жазба түрін', amount: 'Соманы', member: 'Отбасы мүшесінің атын', category: 'Санатты' };
  var fields = Object.keys(fieldNames);
  var fmt = new Intl.NumberFormat('kk-KZ', { minimumFractionDigits: 1, maximumFractionDigits: 1 });
  function seconds(ms) { return fmt.format(ms / 1000) + ' секунд'; }
  function modeText(mode) { return mode === 'ai' ? 'ЖИ көмегімен' : 'Қолмен'; }
  function uuid() {
    if (crypto.randomUUID) return crypto.randomUUID();
    var bytes = crypto.getRandomValues(new Uint8Array(16));
    bytes[6] = (bytes[6] & 15) | 64; bytes[8] = (bytes[8] & 63) | 128;
    var hex = Array.from(bytes, b => b.toString(16).padStart(2, '0')).join('');
    return [hex.slice(0, 8), hex.slice(8, 12), hex.slice(12, 16), hex.slice(16, 20), hex.slice(20)].join('-');
  }
  function show(view, heading) {
    views.forEach(function (name) { $('pilot-' + name).hidden = name !== view; });
    if (heading) $(heading).focus({ preventScroll: true });
    window.scrollTo(0, 0);
  }
  function save() {
    if (!state) return;
    if (state.stage === 'task' && clock) state.current.activeMs = clock.read();
    try { sessionStorage.setItem(key, JSON.stringify(state)); } catch (e) {}
  }
  function restore() {
    try {
      var s = JSON.parse(sessionStorage.getItem(key));
      if (!s || s.version !== 1 || !['task', 'rest', 'results'].includes(s.stage) ||
          !['manual-first', 'ai-first'].includes(s.order) || !['ru', 'kk'].includes(s.language) ||
          typeof s.runId !== 'string' || !Array.isArray(s.plan) || s.plan.length !== 6 ||
          !s.plan.every(p => Object.prototype.hasOwnProperty.call(study.TASKS, p.taskId) && ['manual', 'ai'].includes(p.mode)) ||
          !Array.isArray(s.trials) || s.trials.length > 6 ||
          !s.trials.every((t, i) => t.taskId === s.plan[i].taskId && t.mode === s.plan[i].mode &&
            Number.isSafeInteger(t.activeMs) && t.activeMs > 0 && Number.isSafeInteger(t.wrongAttempts) && t.wrongAttempts >= 0 &&
            Number.isInteger(t.correctedFields) && t.correctedFields >= 0 && t.correctedFields <= 4) ||
          (s.stage === 'results') !== (s.trials.length === 6) ||
          (s.stage === 'task' && (!s.current || !Number.isFinite(s.current.activeMs) || s.current.activeMs < 0 ||
            !Number.isInteger(s.current.wrongAttempts) || s.current.wrongAttempts < 0))) return null;
      return s;
    } catch (e) { return null; }
  }
  function assignment() { return state.plan[state.trials.length]; }
  function task() { return study.TASKS[assignment().taskId]; }
  function checked(name) {
    var input = document.querySelector('#pilot-record input[name="' + name + '"]:checked');
    return input ? input.value : null;
  }
  function setChoice(name, value) {
    document.querySelectorAll('#pilot-record input[name="' + name + '"]').forEach(function (input) {
      input.checked = input.value === value;
    });
  }
  function syncType() {
    var income = checked('type') === 'income';
    $('field-category').hidden = income;
    if (income) setChoice('category', null);
  }
  function setErrors(errors) {
    fields.forEach(function (field) {
      var bad = errors.includes(field);
      var input = field === 'type' || field === 'category' ? $('field-' + field) : $('pilot-' + field);
      if (bad) input.setAttribute('aria-invalid', 'true'); else input.removeAttribute('aria-invalid');
      $('error-' + field).hidden = !bad;
      $('error-' + field).textContent = bad ? fieldNames[field] + ' тапсырма шартымен салыстырыңыз.' : '';
    });
  }
  function startClock() { if (clock && !document.hidden) clock.start(); }
  function renderTask(resumed) {
    var item = assignment(), isAI = item.mode === 'ai';
    var n = state.trials.length;
    $('pilot-progress').textContent = 'Тапсырма ' + (n + 1) + ' / 6';
    $('pilot-meter').value = n;
    $('pilot-heading').textContent = isAI ? 'Жазбаны ЖИ көмегімен енгізіңіз' : 'Жазбаны қолмен енгізіңіз';
    $('pilot-scenario').textContent = task()[state.language];
    $('pilot-scenario').lang = state.language;
    $('pilot-scenario').dataset.taskId = item.taskId;
    $('pilot-scenario').dataset.mode = item.mode;
    $('pilot-composer').reset();
    $('pilot-record').reset();
    setChoice('type', isAI ? null : 'expense'); setChoice('category', null); syncType();
    $('pilot-composer').hidden = !isAI; $('pilot-record').hidden = isAI;
    $('pilot-model').textContent = ''; $('pilot-feedback').textContent = '';
    if (resumed) {
      (isAI ? $('pilot-model') : $('pilot-feedback')).textContent = 'Тапсырманы жалғастыра аласыз. Бұған дейін жұмсаған уақытыңыз есепке алынды.';
    }
    setErrors([]);
    show('task', 'pilot-heading');
    clock = study.createClock(function () { return performance.now(); }, state.current.activeMs);
    startClock();
  }
  function beginTask() {
    state.stage = 'task';
    state.current = { activeMs: 0, wrongAttempts: 0, initialCorrections: null };
    clock = null; save(); renderTask(false);
  }
  function renderRest() {
    var n = state.trials.length, next = assignment();
    $('pilot-rest-count').textContent = 'Орындалғаны ' + n + ' / 6. Келесі жазбаны ' + (next.mode === 'ai' ? 'ЖИ көмегімен енгізесіз.' : 'қолмен енгізесіз.');
    show('rest', 'rest-title');
  }
  function startStudy() {
    if (!window.OtbasyAI || typeof OtbasyAI.parsePhrase !== 'function') {
      $('pilot-start').textContent = 'Модель жүктелмеді. Бетті жаңартыңыз.'; return;
    }
    var first = group ? group === 'A' : Math.random() < 0.5;
    var order = first ? 'manual-first' : 'ai-first';
    state = { version: 1, runId: uuid(), order: order, language: document.querySelector('input[name="language"]:checked').value,
      plan: study.makePlan(order, Math.random), trials: [], submitted: false };
    beginTask();
  }
  function evaluatePhrase(ev) {
    ev.preventDefault();
    if (!state || state.stage !== 'task' || assignment().mode !== 'ai') return;
    var input = $('pilot-phrase'), phrase = input.value.trim();
    if (!phrase) { $('pilot-model').textContent = 'Алдымен сөйлем жазыңыз.'; input.focus(); return; }
    var parsed = OtbasyAI.parsePhrase(phrase, study.MEMBERS);
    if (state.current.initialCorrections === null) state.current.initialCorrections = study.differingFields(parsed, task().gold).length;
    setChoice('type', parsed.type);
    $('pilot-amount').value = parsed.amount || '';
    $('pilot-member').value = parsed.member || '';
    setChoice('category', parsed.category); syncType();
    setErrors([]); $('pilot-feedback').textContent = '';
    $('pilot-model').textContent = 'Ұсынылған мәндерді тексеріп, бос өрістерді толтырыңыз.';
    $('pilot-record').hidden = false;
    save();
  }
  function confirmRecord(ev) {
    ev.preventDefault();
    if (!state || state.stage !== 'task' || $('pilot-record').hidden) return;
    var type = checked('type'), amount = $('pilot-amount').value.trim().replace(/[\s\u202f]/g, '');
    var value = { type: type, amount: /^\d+$/.test(amount) ? Number(amount) : null,
      member: $('pilot-member').value, category: type === 'income' ? null : checked('category') };
    var errors = study.differingFields(value, task().gold);
    setErrors(errors);
    if (errors.length) {
      state.current.wrongAttempts++;
      $('pilot-feedback').textContent = 'Жазба тапсырма шартына сәйкес келмейді. Белгіленген өрістерді түзетіңіз.';
      var field = errors[0];
      var focus = field === 'type' || field === 'category' ? $('field-' + field).querySelector('input') : $('pilot-' + field);
      focus.focus(); save(); return;
    }
    clock.pause();
    var item = assignment();
    state.trials.push({ taskId: item.taskId, mode: item.mode, activeMs: Math.max(1, clock.read()),
      wrongAttempts: state.current.wrongAttempts, correctedFields: item.mode === 'ai' ? state.current.initialCorrections : 0 });
    clock = null; state.current = null;
    state.stage = state.trials.length === state.plan.length ? 'results' : 'rest';
    save();
    if (state.stage === 'results') renderResults(); else renderRest();
  }
  function report() {
    return { version: 1, runId: state.runId, order: state.order, trials: state.trials.map(function (t) {
      return { taskId: t.taskId, mode: t.mode, activeMs: t.activeMs, wrongAttempts: t.wrongAttempts, correctedFields: t.correctedFields };
    }) };
  }
  function api(path) {
    var config = window.QarzhyService;
    if (!config || typeof config.apiBase !== 'string') return null;
    try {
      var url = new URL(config.apiBase || location.origin, location.href);
      if (!['https:', 'http:'].includes(url.protocol)) return null;
      return url.href.replace(/\/+$/, '') + path;
    } catch (e) { return null; }
  }
  function updateSend() {
    var unavailable = sending || state.submitted || qa || !api('/v1/pilot/results');
    $('pilot-consent').disabled = !!unavailable;
    $('pilot-send').disabled = !!unavailable || !$('pilot-consent').checked;
  }
  function renderResults() {
    var manual = study.summarize(state.trials, 'manual'), ai = study.summarize(state.trials, 'ai');
    $('pilot-manual-time').textContent = seconds(manual.medianMs);
    $('pilot-ai-time').textContent = seconds(ai.medianMs);
    $('pilot-manual-errors').textContent = 'Сәтсіз растаулар саны — ' + manual.wrongAttempts;
    $('pilot-ai-errors').textContent = 'Сәтсіз растаулар саны — ' + ai.wrongAttempts;
    $('pilot-corrections').textContent = 'ЖИ алғаш ұсынған 12 өрістің ' + ai.correctedFields + ' өрісін түзету қажет болды.';
    var list = $('pilot-measurements'); list.replaceChildren();
    state.trials.forEach(function (trial) {
      var row = document.createElement('li');
      row.textContent = modeText(trial.mode) + ' · ' + seconds(trial.activeMs) + ' · ' + study.TASKS[trial.taskId][state.language];
      list.appendChild(row);
    });
    $('pilot-consent').checked = state.submitted;
    $('pilot-send-status').textContent = state.submitted ? 'Есеп жіберілді.' : qa ? 'Бұл — техникалық тексеріс.' :
      !api('/v1/pilot/results') ? 'Қазір есепті жіберу мүмкін емес. Оны жүктеп алуға немесе көшіруге болады.' : '';
    updateSend(); show('results', 'results-title');
  }
  async function request(url, options) {
    var controller = new AbortController();
    var timeout = setTimeout(function () { controller.abort(); }, 12000);
    try {
      var response = await fetch(url, Object.assign({ credentials: 'omit', referrerPolicy: 'no-referrer', cache: 'no-store', signal: controller.signal }, options));
      if (!response.ok) throw new Error('http ' + response.status);
      return response;
    } finally { clearTimeout(timeout); }
  }
  async function submitReport() {
    var url = api('/v1/pilot/results');
    if (!state || state.stage !== 'results' || state.submitted || qa || sending || !$('pilot-consent').checked || !url) return;
    sending = true; updateSend(); $('pilot-send-status').textContent = 'Есеп жіберіліп жатыр…';
    try {
      await request(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(report()) });
      state.submitted = true; save(); $('pilot-send-status').textContent = 'Есеп жіберілді.';
    } catch (e) { $('pilot-send-status').textContent = 'Есептің қабылданғаны расталмады. Қайта жіберіңіз немесе есепті сақтаңыз.'; }
    finally { sending = false; updateSend(); }
  }
  function exportText() {
    var data = report();
    if (qa) data.technicalRun = true;
    return JSON.stringify(data, null, 2);
  }
  async function copyReport() {
    var text = exportText();
    try {
      await navigator.clipboard.writeText(text);
      $('pilot-export-status').textContent = 'Есеп көшірілді.';
    } catch (e) {
      $('pilot-export').hidden = false; $('pilot-export').value = text;
      $('pilot-export').focus(); $('pilot-export').select();
      $('pilot-export-status').textContent = 'Белгіленген мәтінді қолмен көшіруге болады.';
    }
  }
  function downloadReport() {
    var url = URL.createObjectURL(new Blob([exportText()], { type: 'application/json' }));
    var link = document.createElement('a');
    link.href = url; link.download = (qa ? 'qarzhy-qa-' : 'qarzhy-pilot-') + state.runId + '.json';
    document.body.appendChild(link); link.click(); link.remove();
    setTimeout(function () { URL.revokeObjectURL(url); }, 2000);
  }
  async function loadSummary() {
    var url = api('/v1/pilot/summary'), status = $('summary-status');
    $('summary-data').hidden = true;
    if (!url) { status.textContent = 'Нәтижелер сервисі қазір қолжетімсіз.'; return; }
    $('summary-refresh').disabled = true;
    status.textContent = 'Нәтижелер жүктеліп жатыр…';
    try {
      var summary = await (await request(url)).json();
      if (!summary || !Number.isSafeInteger(summary.sessions) || summary.sessions < 0 || !summary.orders) throw new Error('invalid response');
      var counts = [summary.manualWrongAttempts, summary.aiWrongAttempts, summary.aiCorrectedFields, summary.orders['manual-first'], summary.orders['ai-first']];
      if (!counts.every(v => Number.isSafeInteger(v) && v >= 0)) throw new Error('invalid counts');
      if (summary.sessions > 0 && ![summary.manualMedianMs, summary.aiMedianMs].every(v => Number.isFinite(v) && v >= 0)) throw new Error('invalid duration');
      $('summary-count').textContent = 'Нәтижесі жіберілген сынақтар саны — ' + summary.sessions + '.';
      $('summary-measures').hidden = summary.sessions === 0;
      if (summary.sessions) {
        $('summary-manual').textContent = seconds(summary.manualMedianMs); $('summary-ai').textContent = seconds(summary.aiMedianMs);
        $('summary-manual-errors').textContent = 'Сәтсіз растаулар саны — ' + summary.manualWrongAttempts;
        $('summary-ai-errors').textContent = 'Сәтсіз растаулар саны — ' + summary.aiWrongAttempts;
        $('summary-corrections').textContent = 'Барлық сынақта ЖИ алғаш ұсынған жазбаларда түзетуді қажет еткен өрістер саны — ' + summary.aiCorrectedFields + '.';
        $('summary-orders').textContent = 'Қолмен енгізуден басталған сынақтар — ' + summary.orders['manual-first'] + ', ЖИ-ден басталғаны — ' + summary.orders['ai-first'] + '.';
      }
      $('summary-data').hidden = false; status.textContent = '';
    } catch (e) { status.textContent = 'Нәтижелер жүктелмеді. Интернет байланысын тексеріп, бетті жаңартыңыз.'; }
    finally { $('summary-refresh').disabled = false; }
  }
  $('pilot-qa').hidden = !qa;
  $('summary-invite').addEventListener('click', async function () {
    var message = '«Отбасы бюджеті» қосымшасын сынап көріңіз. Алты оқу жазбасының үшеуін қолмен, үшеуін ЖИ көмегімен енгізесіз. Соңында жұмсаған уақытыңызды көресіз. Қаласаңыз, анонимді нәтижені жоба тобына жібере аласыз. ' + new URL('./', location.href).href;
    try {
      await navigator.clipboard.writeText(message); $('summary-invite-status').textContent = 'Шақыру мәтіні көшірілді.';
    } catch (e) {
      var box = $('summary-invite-text'); box.hidden = false; box.value = message; box.focus(); box.select();
      $('summary-invite-status').textContent = 'Мәтін белгіленді. Оны көшіріп, қатысушыға жіберіңіз.';
    }
  });
  $('summary-refresh').addEventListener('click', loadSummary);
  if (params.get('results') === '1') { show('summary', 'summary-title'); loadSummary(); return; }
  study.MEMBERS.forEach(function (name) { var opt = document.createElement('option'); opt.value = name; $('pilot-names').appendChild(opt); });
  $('pilot-start').addEventListener('click', startStudy);
  $('pilot-next').addEventListener('click', function () { if (state.stage === 'rest') beginTask(); });
  $('pilot-composer').addEventListener('submit', evaluatePhrase);
  $('pilot-phrase').addEventListener('input', function () { $('pilot-record').hidden = true; $('pilot-model').textContent = ''; });
  $('pilot-record').addEventListener('submit', confirmRecord);
  document.querySelectorAll('input[name=type]').forEach(function (el) { el.addEventListener('change', syncType); });
  $('pilot-consent').addEventListener('change', updateSend);
  $('pilot-send').addEventListener('click', submitReport);
  $('pilot-copy').addEventListener('click', copyReport);
  $('pilot-download').addEventListener('click', downloadReport);
  $('pilot-again').addEventListener('click', function () {
    if (sending) return;
    state = null;
    try { sessionStorage.removeItem(key); } catch (e) {}
    $('pilot-export').hidden = true; $('pilot-export').value = ''; $('pilot-export-status').textContent = '';
    show('intro'); $('pilot-start').focus({ preventScroll: true });
  });
  function pauseClock() { if (clock) { clock.pause(); save(); } }
  document.addEventListener('visibilitychange', function () { if (document.hidden) pauseClock(); else startClock(); });
  window.addEventListener('pagehide', pauseClock);
  window.addEventListener('pageshow', startClock);
  state = restore();
  if (state) {
    if (state.stage === 'results') renderResults();
    else if (state.stage === 'rest') renderRest();
    else renderTask(true);
  }
})();
