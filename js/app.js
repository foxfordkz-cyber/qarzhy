(function () {
  'use strict';
  document.documentElement.lang = 'kk';

  /* ---------- constants ---------- */
  var KEY = 'otbasy-budget:v1:records';
  var THEME_KEY = 'otbasy-budget:v1:theme';
  var GOAL_KEY = 'otbasy-budget:v1:goal';
  var FLAGS_KEY = 'otbasy-budget:v1:flags';
  var MAX_AMOUNT = 100000000;
  var HIST_PAGE = window.matchMedia('(max-width: 719px)').matches ? 8 : 30;
  var NB = ' ';
  var MONTHS = ['Қаңтар', 'Ақпан', 'Наурыз', 'Сәуір', 'Мамыр', 'Маусым', 'Шілде', 'Тамыз', 'Қыркүйек', 'Қазан', 'Қараша', 'Желтоқсан'];
  var CAT_ORDER = ['food', 'transport', 'home', 'other'];
  var CATS = {
    food: { name: 'Азық-түлік', color: 'var(--c-food)' },
    transport: { name: 'Көлік', color: 'var(--c-transport)' },
    home: { name: 'Үй', color: 'var(--c-home)' },
    other: { name: 'Басқа', color: 'var(--c-other)' }
  };
  var P = {
    food: '<path d="M5.5 8.5h13l-1 10.6a2 2 0 0 1-2 1.9h-7a2 2 0 0 1-2-1.9l-1-10.6z"/><path d="M9 10.5V7.5a3 3 0 0 1 6 0v3"/>',
    transport: '<path d="M5 16.5v-4l1.7-4.2A2 2 0 0 1 8.6 7h6.8a2 2 0 0 1 1.9 1.3l1.7 4.2v4z"/><path d="M5 12.5h14"/><path d="M7 16.5V19M17 16.5V19"/><path d="M8.5 14.5h.01M15.5 14.5h.01"/>',
    home: '<path d="M4 11.5 12 5l8 6.5"/><path d="M6.5 10v9.5h11V10"/><path d="M10 19.5v-5h4v5"/>',
    other: '<path d="M6.5 12h.01M12 12h.01M17.5 12h.01" stroke-width="3"/>',
    income: '<path d="M12 4v10"/><path d="m7.5 9.5 4.5 4.5 4.5-4.5"/><path d="M5 19.5h14"/>',
    expense: '<path d="M12 19.5v-10"/><path d="m7.5 14 4.5-4.5 4.5 4.5"/><path d="M5 4.5h14"/>',
    trash: '<path d="M4.5 7h15"/><path d="M10 11v6M14 11v6"/><path d="M6.5 7l.8 11.2A2 2 0 0 0 9.3 20h5.4a2 2 0 0 0 2-1.8L17.5 7"/><path d="M9.5 7V5.5a1 1 0 0 1 1-1h3a1 1 0 0 1 1 1V7"/>',
    people: '<circle cx="9" cy="8.5" r="3"/><path d="M3.5 19a5.5 5.5 0 0 1 11 0"/><path d="M15.5 5.8a3 3 0 0 1 0 5.4M17.5 14a5.5 5.5 0 0 1 3 5"/>',
    list: '<path d="M8 6.5h12M8 12h12M8 17.5h12"/><path d="M4 6.5h.01M4 12h.01M4 17.5h.01" stroke-width="2.6"/>',
    check: '<path d="m5 12.5 4.5 4.5L19 7.5"/>',
    wallet: '<path d="M18.5 7.5V6a2 2 0 0 0-2-2H6a2 2 0 0 0-2 2v12a2 2 0 0 0 2 2h12.5a1 1 0 0 0 1-1v-3"/><path d="M20 8.5h-5a3.5 3.5 0 0 0 0 7h5a1 1 0 0 0 1-1v-5a1 1 0 0 0-1-1z"/><path d="M15.5 12h.01" stroke-width="2.6"/>',
    target: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="4.5"/><path d="M12 12h.01" stroke-width="3"/>',
    cart: '<path d="M3.5 4.5h2l2.2 10.2a1.6 1.6 0 0 0 1.6 1.3h7.6a1.6 1.6 0 0 0 1.6-1.2l1.5-6.3H6.4"/><circle cx="10" cy="19.5" r="1.2"/><circle cx="17" cy="19.5" r="1.2"/>',
    percent: '<path d="M18.5 5.5l-13 13"/><circle cx="7.5" cy="7.5" r="2.5"/><circle cx="16.5" cy="16.5" r="2.5"/>',
    shield: '<path d="M12 3.5 19 6v5.5c0 4.4-3 7.9-7 9-4-1.1-7-4.6-7-9V6z"/><path d="m9 12 2.2 2.2L15.5 10"/>',
    calc: '<rect x="5" y="3" width="14" height="18" rx="2.5"/><path d="M8.5 7h7"/><path d="M8.5 11.5h.01M12 11.5h.01M15.5 11.5h.01M8.5 15h.01M12 15h.01M15.5 15h.01M8.5 18h.01M12 18h.01" stroke-width="2.4"/>',
    bell: '<path d="M6 16.5V11a6 6 0 0 1 12 0v5.5l1.5 2H4.5z"/><path d="M10 20.5a2 2 0 0 0 4 0"/>',
    calendar: '<rect x="4" y="5" width="16" height="15.5" rx="2.5"/><path d="M4 9.5h16M8.5 3v4M15.5 3v4"/><path d="M8.5 13.5h.01M12 13.5h.01M15.5 13.5h.01M8.5 17h.01M12 17h.01" stroke-width="2.4"/>',
    card: '<rect x="3" y="5.5" width="18" height="13" rx="2.5"/><path d="M3 10h18"/><path d="M7 15h4"/>',
    bulb: '<path d="M9 18h6M10 21h4"/><path d="M8.5 14.5A6 6 0 1 1 15.5 14.5c-.8.7-1.2 1.4-1.3 2.5h-4.4c-.1-1.1-.5-1.8-1.3-2.5z"/>',
    book: '<path d="M5 4.5A1.5 1.5 0 0 1 6.5 3H19v15H6.5A1.5 1.5 0 0 0 5 19.5z"/><path d="M5 19.5A1.5 1.5 0 0 0 6.5 21H19v-3"/><path d="M9 7.5h6"/>',
    gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2.8v2.4M12 18.8v2.4M2.8 12h2.4M18.8 12h2.4M5.5 5.5l1.7 1.7M16.8 16.8l1.7 1.7M5.5 18.5l1.7-1.7M16.8 7.2l1.7-1.7"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.5a2.5 2.5 0 0 1 4.9.7c0 1.7-2.4 2.3-2.4 3.8"/><path d="M12 17h.01" stroke-width="2.6"/>',
    chart: '<path d="M4 4v16h16"/><path d="m7.5 14.5 3.5-4 3 2.5 5-6"/>',
    search: '<circle cx="11" cy="11" r="6.5"/><path d="m20 20-4.2-4.2"/>',
    menu: '<path d="M4 7h16M4 12h16M4 17h16"/>',
    x: '<path d="M6 6l12 12M18 6 6 18"/>',
    send: '<path d="M5 12h13"/><path d="m13 6 6 6-6 6"/>',
    arrow: '<path d="M5 12h14M13 6l6 6-6 6"/>',
    lock: '<rect x="5" y="10.5" width="14" height="10" rx="2.5"/><path d="M8 10.5V8a4 4 0 0 1 8 0v2.5"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="2.8"/>',
    moon: '<path d="M19.5 14.2A7.8 7.8 0 0 1 9.8 4.5a7.8 7.8 0 1 0 9.7 9.7z"/>',
    sprout: '<path d="M12 20v-8"/><path d="M12 12c0-3.9 2.6-6.4 7-6.4 0 4.1-2.8 6.4-7 6.4z"/><path d="M12 14.6c0-2.9-2-4.9-5.4-4.9 0 3.1 2.2 4.9 5.4 4.9z"/>',
    plus: '<path d="M12 5v14M5 12h14"/>'
  };
  function icon(name, size) {
    size = size || 20;
    return '<svg viewBox="0 0 24 24" width="' + size + '" height="' + size + '" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (P[name] || '') + '</svg>';
  }

  /* ---------- helpers ---------- */
  var $ = function (id) { return document.getElementById(id); };
  function h(tag, attrs) {
    var el = document.createElement(tag);
    if (attrs) {
      Object.keys(attrs).forEach(function (k) {
        var v = attrs[k];
        if (v == null || v === false) return;
        if (k === 'class') el.className = v;
        else if (k === 'style') el.style.cssText = v;
        else if (k === 'html') el.innerHTML = v; /* static markup only */
        else if (k.slice(0, 2) === 'on') el.addEventListener(k.slice(2), v);
        else el.setAttribute(k, v === true ? '' : v);
      });
    }
    for (var i = 2; i < arguments.length; i++) {
      var kid = arguments[i];
      if (kid == null || kid === false) continue;
      [].concat(kid).forEach(function (c) {
        if (c == null || c === false) return;
        el.appendChild(c instanceof Node ? c : document.createTextNode(String(c)));
      });
    }
    return el;
  }
  function fmtNum(n) { return String(Math.round(Math.abs(n))).replace(/\B(?=(\d{3})+(?!\d))/g, NB); }
  function money(n) { return (n < 0 ? '−' : '') + fmtNum(n) + NB + '₸'; }
  function pct(part, whole) {
    if (!whole) return 0;
    var p = part / whole * 100;
    if (p > 0 && p < 1) return '<1';
    return Math.round(p);
  }
  function pad(n) { return (n < 10 ? '0' : '') + n; }
  function lower(s) { try { return s.toLocaleLowerCase('kk'); } catch (e) { return s.toLowerCase(); } }
  function upperFirst(s) { var f = s.charAt(0); try { f = f.toLocaleUpperCase('kk'); } catch (e) { f = f.toUpperCase(); } return f + s.slice(1); }
  function monthKey(d) { return d.getFullYear() * 12 + d.getMonth(); }
  function sameDay(a, b) { return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate(); }
  function dayLabel(d) { return d.getDate() + ' ' + lower(MONTHS[d.getMonth()]); }
  function whenLabel(d) {
    var now = new Date(), t = pad(d.getHours()) + ':' + pad(d.getMinutes());
    if (sameDay(d, now)) return 'Бүгін, ' + t;
    var y = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 1);
    if (sameDay(d, y)) return 'Кеше, ' + t;
    var s = dayLabel(d);
    if (d.getFullYear() !== now.getFullYear()) s += ' ' + d.getFullYear();
    return s + ', ' + t;
  }
  function uid() { return Date.now().toString(36) + Math.random().toString(36).slice(2, 8); }
  function setLong(el, text, limit) { el.textContent = text; el.classList.toggle('is-long', text.length > limit); }
  function digits(v) { return parseInt(String(v).replace(/\D/g, ''), 10) || 0; }
  function fillIcons() {
    [].forEach.call(document.querySelectorAll('[data-icon]'), function (el) {
      el.innerHTML = icon(el.dataset.icon, +el.dataset.size || 18);
      if (!el.className) el.style.display = 'inline-grid';
    });
  }

  /* ---------- storage ---------- */
  var storageOk = true;
  function readJSON(key, fallback) { try { var raw = localStorage.getItem(key); return raw ? JSON.parse(raw) : fallback; } catch (e) { return fallback; } }
  function writeJSON(key, val) {
    try { localStorage.setItem(key, JSON.stringify(val)); storageOk = true; } catch (e) { storageOk = false; }
    $('storageWarn').hidden = storageOk;
  }
  function isValid(r) {
    return r && typeof r === 'object' && typeof r.id === 'string' &&
      (r.type === 'income' || r.type === 'expense') &&
      typeof r.amount === 'number' && isFinite(r.amount) && r.amount > 0 &&
      typeof r.member === 'string' && r.member.length > 0 &&
      typeof r.createdAt === 'string' && !isNaN(Date.parse(r.createdAt)) &&
      (r.type === 'income' || Object.prototype.hasOwnProperty.call(CATS, r.category));
  }
  function readStore() { var arr = readJSON(KEY, []); return Array.isArray(arr) ? arr.filter(isValid) : []; }
  function readGoal() { var g = readJSON(GOAL_KEY, null); return g && typeof g.name === 'string' && g.target > 0 ? g : null; }
  function readFlags() { var f = readJSON(FLAGS_KEY, {}); return f && typeof f === 'object' ? f : {}; }
  (function probe() { try { localStorage.setItem(KEY + ':probe', '1'); localStorage.removeItem(KEY + ':probe'); } catch (e) { storageOk = false; } })();

  /* ---------- demo data (kept apart from personal data, rebuilt on every visit) ---------- */
  function buildDemo() {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth(), today = now.getDate();
    var monthStart = new Date(y, m, 1).getTime();
    var cur = [
      [0.00, 9, 40, 'expense', 'Ерлан', 180000, 'home', 'Пәтерақы'],
      [0.03, 10, 15, 'income', 'Ерлан', 450000, null, 'Жалақы'],
      [0.08, 19, 5, 'expense', 'Мәдина', 38500, 'food', 'Апталық азық-түлік'],
      [0.10, 8, 30, 'expense', 'Мәдина', 35000, 'other', 'Балабақша'],
      [0.15, 18, 20, 'expense', 'Ерлан', 18000, 'transport', 'Жанармай, АИ-92'],
      [0.25, 13, 10, 'expense', 'Ерлан', 24000, 'food', 'Базардан ет'],
      [0.30, 20, 45, 'expense', 'Ерлан', 27800, 'home', 'Коммуналдық төлемдер'],
      [0.35, 11, 0, 'income', 'Мәдина', 320000, null, 'Жалақы'],
      [0.40, 21, 30, 'expense', 'Мәдина', 2400, 'transport', 'Такси'],
      [0.45, 17, 50, 'expense', 'Мәдина', 6200, 'food', 'Нан, сүт, жеміс'],
      [0.50, 7, 15, 'expense', 'Ерлан', 15000, 'other', 'Спортзал абонементі'],
      [0.55, 12, 25, 'expense', 'Мәдина', 9990, 'home', 'Интернет және ұялы байланыс'],
      [0.60, 16, 40, 'expense', 'Ерлан', 3500, 'transport', 'Көлік жуу'],
      [0.70, 15, 5, 'income', 'Мәдина', 45000, null, 'Торт тапсырыстары'],
      [0.75, 19, 35, 'expense', 'Мәдина', 5600, 'other', 'Дәріхана'],
      [0.85, 18, 55, 'expense', 'Мәдина', 41300, 'food', 'Апталық азық-түлік']
    ];
    var prev = [
      [0.02, 9, 30, 'expense', 'Ерлан', 180000, 'home', 'Пәтерақы'],
      [0.05, 10, 0, 'income', 'Ерлан', 450000, null, 'Жалақы'],
      [0.30, 19, 10, 'expense', 'Мәдина', 44800, 'food', 'Апталық азық-түлік'],
      [0.40, 11, 20, 'income', 'Мәдина', 320000, null, 'Жалақы'],
      [0.55, 18, 0, 'expense', 'Ерлан', 20000, 'transport', 'Жанармай, АИ-92'],
      [0.80, 14, 30, 'expense', 'Мәдина', 32000, 'other', 'Күзгі киім']
    ];
    var out = [], prevDays = new Date(y, m, 0).getDate();
    function mk(id, r, d) { return { id: id, type: r[3], member: r[4], amount: r[5], category: r[6], note: r[7], createdAt: d.toISOString() }; }
    prev.forEach(function (r, i) { out.push(mk('demo-p' + i, r, new Date(y, m - 1, 1 + Math.round(r[0] * (prevDays - 1)), r[1], r[2]))); });
    cur.forEach(function (r, i) {
      var d = new Date(y, m, 1 + Math.round(r[0] * (today - 1)), r[1], r[2]);
      if (d > now) d = new Date(Math.max(monthStart + (i + 1) * 60000, now.getTime() - (cur.length - i) * 17 * 60000));
      out.push(mk('demo-c' + i, r, d));
    });
    return out;
  }

  /* ---------- state ---------- */
  var state = {
    mode: 'personal',
    personal: readStore(),
    demo: [],
    goal: readGoal(),
    demoGoal: null,
    flags: readFlags(),
    demoFlags: {},
    query: '',
    activeCat: null,
    histLimit: HIST_PAGE,
    flashId: null,
    pendingDelete: null,
    scenPct: 20,
    tipIdx: 0,
    articleIdx: 0,
    editingGoal: false
  };
  function isDemo() { return state.mode === 'demo'; }
  function records() { return isDemo() ? state.demo : state.personal; }
  function goal() { return isDemo() ? state.demoGoal : state.goal; }
  function flags() { return isDemo() ? state.demoFlags : state.flags; }
  function setFlag(k) {
    if (isDemo()) state.demoFlags[k] = true;
    else if (!state.flags[k]) { state.flags[k] = true; writeJSON(FLAGS_KEY, state.flags); }
    renderAchievements(summarize());
  }
  function commit() { if (!isDemo()) writeJSON(KEY, state.personal); render(); }

  function knownNames() {
    var counts = {}, display = {};
    records().forEach(function (r) { var k = lower(r.member); counts[k] = (counts[k] || 0) + 1; if (!display[k]) display[k] = r.member; });
    return Object.keys(counts).sort(function (a, b) { return counts[b] - counts[a] || a.localeCompare(b, 'kk'); }).map(function (k) { return display[k]; });
  }
  function normalizeName(raw) {
    var s = raw.trim().replace(/\s+/g, ' ');
    if (!s) return '';
    var k = lower(s), hit = knownNames().filter(function (n) { return lower(n) === k; })[0];
    return hit || upperFirst(s);
  }

  function summarize() {
    var key = monthKey(new Date());
    var s = { inc: 0, exp: 0, incN: 0, expN: 0, byCat: { food: 0, transport: 0, home: 0, other: 0 }, members: [], allBal: 0 };
    var mem = {};
    records().forEach(function (r) {
      s.allBal += r.type === 'income' ? r.amount : -r.amount;
      if (monthKey(new Date(r.createdAt)) !== key) return;
      if (r.type === 'income') { s.inc += r.amount; s.incN++; return; }
      s.exp += r.amount; s.expN++;
      s.byCat[r.category] += r.amount;
      var k = lower(r.member);
      if (!mem[k]) mem[k] = { name: r.member, sum: 0, n: 0 };
      mem[k].sum += r.amount; mem[k].n++;
    });
    s.bal = s.inc - s.exp;
    s.share = s.inc > 0 ? s.bal / s.inc : null;
    s.members = Object.keys(mem).map(function (k) { return mem[k]; }).sort(function (a, b) { return b.sum - a.sum || a.name.localeCompare(b.name, 'kk'); });
    s.topCat = CAT_ORDER.slice().sort(function (a, b) { return s.byCat[b] - s.byCat[a]; })[0];
    return s;
  }

  /* ---------- render ---------- */
  var lastSummary = null;
  function render() {
    var now = new Date(), monthName = MONTHS[now.getMonth()], s = summarize();
    lastSummary = s;
    $('statusSub').textContent = monthName + ' ' + now.getFullYear();
    $('catSub').textContent = monthName + ' · санаттар бойынша шығыс';
    $('memSub').textContent = monthName + ' · әр адамның шығысы';
    $('mbarLabel').textContent = isDemo() ? 'Қалдық' : 'Қалдық · ' + monthName;
    renderStatus(s);
    renderDonut(s);
    renderMembers(s);
    renderHistory();
    renderNameChips();
    renderGoal(s);
    renderScenario(s);
    renderAchievements(s);
    renderReminders();
    var demo = isDemo();
    $('demoBanner').hidden = !demo;
    [].forEach.call(document.querySelectorAll('[data-action="demo"]'), function (b) { b.hidden = demo; });
    $('mbarDemo').hidden = !demo;
    $('familyName').textContent = demo ? 'Ерлан мен Мәдина' : 'Біздің отбасы';
    $('familySub').textContent = demo ? 'Мысал отбасы' : 'Жеке бюджет';
  }

  function renderStatus(s) {
    setLong($('kIncome'), money(s.inc), 11);
    setLong($('kExpense'), money(s.exp), 11);
    setLong($('kBalance'), money(s.bal), 11);
    setLong($('mBalance'), money(s.bal), 12);
    $('mBalance').classList.toggle('is-neg', s.bal < 0);
    $('kBalanceCard').classList.toggle('is-neg', s.bal < 0);
    $('kIncomeNote').textContent = s.incN ? s.incN + ' түсім' : 'әзірге жоқ';
    $('kExpenseNote').textContent = s.expN ? s.expN + ' жазба' : 'әзірге жоқ';
    $('kBalanceNote').textContent = s.bal < 0 ? 'асып кетті' : '';
    var arc = $('ringArc'), C = 314.16, share = s.share == null ? 0 : Math.max(0, Math.min(1, s.share));
    arc.style.strokeDashoffset = (C * (1 - share)).toFixed(2);
    arc.setAttribute('stroke', s.bal < 0 ? 'var(--neg)' : 'var(--accent)');
    var rv = $('ringVal');
    rv.textContent = s.share == null ? '—' : (s.share < 0 ? '0%' : pct(s.bal, s.inc) + '%');
    rv.classList.toggle('is-neg', s.bal < 0);
    var text, cls = '';
    if (!s.inc && !s.exp) text = 'Бастау үшін айдың алғашқы кірісін жазыңыз.';
    else if (!s.inc) { text = 'Бұл айдың кірісі әлі жазылмаған.'; cls = 'is-warn'; }
    else if (s.bal < 0) { text = 'Шығыс кірістен ' + money(-s.bal) + ' асып кетті. Ең үлкен санатты қарап шығыңыз.'; cls = 'is-bad'; }
    else if (s.share >= 0.2) text = 'Жақсы нәтиже! Кірістің 20%-ынан көбі қалып тұр.';
    else { text = 'Кірістің кемінде 20%-ын сақтап қалуға тырысыңыз.'; cls = 'is-warn'; }
    $('statusHint').className = 'hint ' + cls;
    $('statusHintText').textContent = text;
  }

  var SVGNS = 'http://www.w3.org/2000/svg';
  function arcPath(cx, cy, r, a0, a1) {
    var x0 = cx + r * Math.cos(a0), y0 = cy + r * Math.sin(a0), x1 = cx + r * Math.cos(a1), y1 = cy + r * Math.sin(a1);
    return 'M' + x0.toFixed(3) + ' ' + y0.toFixed(3) + ' A' + r + ' ' + r + ' 0 ' + ((a1 - a0) > Math.PI ? 1 : 0) + ' 1 ' + x1.toFixed(3) + ' ' + y1.toFixed(3);
  }
  function renderDonut(s) {
    var g = $('donutSegs');
    g.textContent = '';
    var R = 80, W = 22, total = s.exp;
    var items = CAT_ORDER.map(function (k) { return { k: k, v: s.byCat[k] }; });
    var drawn = items.filter(function (i) { return i.v > 0; }).sort(function (a, b) { return b.v - a.v; });
    if (state.activeCat && !s.byCat[state.activeCat]) state.activeCat = null;
    function seg(el, k) {
      el.setAttribute('fill', 'none'); el.setAttribute('stroke', CATS[k].color); el.setAttribute('stroke-width', W);
      el.setAttribute('class', 'seg-path'); el.dataset.cat = k;
      el.addEventListener('pointerenter', function () { setActiveCat(k); });
      el.addEventListener('pointerleave', function () { setActiveCat(null); });
      el.addEventListener('click', function () { setActiveCat(state.activeCat === k ? null : k); });
      g.appendChild(el);
    }
    if (drawn.length === 1) {
      var c = document.createElementNS(SVGNS, 'circle');
      c.setAttribute('cx', 100); c.setAttribute('cy', 100); c.setAttribute('r', R);
      seg(c, drawn[0].k);
    } else if (drawn.length > 1) {
      var gap = 2.6 / R, a = -Math.PI / 2;
      drawn.forEach(function (it) {
        var sweep = it.v / total * Math.PI * 2, a0 = a + gap / 2, a1 = a + sweep - gap / 2;
        if (a1 - a0 > 0.002) { var p = document.createElementNS(SVGNS, 'path'); p.setAttribute('d', arcPath(100, 100, R, a0, a1)); seg(p, it.k); }
        a += sweep;
      });
    }
    var legend = $('legend');
    legend.textContent = '';
    items.slice().sort(function (a, b) { return b.v - a.v || CAT_ORDER.indexOf(a.k) - CAT_ORDER.indexOf(b.k); }).forEach(function (it) {
      var b = h('button', { class: 'leg' + (it.v ? '' : ' is-zero'), type: 'button', 'data-cat': it.k, style: '--c:' + CATS[it.k].color, 'aria-label': CATS[it.k].name + ': ' + money(it.v) + ', ' + pct(it.v, total) + '%' },
        h('span', { class: 'sw', 'aria-hidden': 'true' }),
        h('span', { class: 'leg-name' }, CATS[it.k].name),
        h('span', { class: 'leg-val' }, money(it.v)),
        h('span', { class: 'leg-pct' }, total ? pct(it.v, total) + '%' : '—'));
      if (it.v) {
        b.addEventListener('pointerenter', function () { setActiveCat(it.k); });
        b.addEventListener('pointerleave', function () { setActiveCat(null); });
        b.addEventListener('focus', function () { setActiveCat(it.k); });
        b.addEventListener('blur', function () { setActiveCat(null); });
        b.addEventListener('click', function () { setActiveCat(state.activeCat === it.k ? null : it.k); });
      }
      legend.appendChild(h('li', null, b));
    });
    paintDonutCenter(s);
  }
  function setActiveCat(k) { state.activeCat = k; paintDonutCenter(lastSummary || summarize()); }
  function paintDonutCenter(s) {
    var k = state.activeCat;
    $('donut').classList.toggle('has-active', !!k);
    [].forEach.call($('donutSegs').children, function (el) { el.classList.toggle('is-on', el.dataset.cat === k); });
    [].forEach.call($('legend').querySelectorAll('.leg'), function (el) { el.classList.toggle('is-on', el.dataset.cat === k); });
    if (k) {
      $('dcLabel').textContent = CATS[k].name;
      setLong($('dcValue'), money(s.byCat[k]), 10);
      $('dcSub').textContent = 'шығыстың ' + pct(s.byCat[k], s.exp) + '%-ы';
    } else {
      $('dcLabel').textContent = 'Шығыс';
      setLong($('dcValue'), money(s.exp), 10);
      $('dcSub').textContent = s.exp ? MONTHS[new Date().getMonth()] : 'Әзірге жоқ';
    }
  }

  function emptyState(iconKey, title, text, action) {
    return h('div', { class: 'empty' }, h('span', { class: 'empty-ico', html: icon(iconKey, 22) }), h('strong', null, title), text ? h('p', null, text) : null, action || null);
  }

  function renderMembers(s) {
    var box = $('members');
    box.textContent = '';
    if (!s.members.length) { box.appendChild(emptyState('people', 'Бұл айда шығыс әлі жоқ', 'Шығыс жазылғанда, мұнда әр адамның жұмсаған сомасы көрінеді.')); return; }
    var max = s.members[0].sum, ul = h('ul', { class: 'mems' });
    s.members.forEach(function (m) {
      ul.appendChild(h('li', { class: 'mem' },
        h('div', { class: 'mem-top' },
          h('span', { class: 'ava', 'aria-hidden': 'true' }, upperFirst(m.name.charAt(0))),
          h('span', { class: 'mem-name' }, m.name, h('small', null, m.n + ' шығыс')),
          h('span', { class: 'mem-val' }, money(m.sum))),
        h('div', { class: 'mem-bar-row', 'aria-hidden': 'true' },
          h('div', { class: 'bar' }, h('span', { style: 'width:' + (m.sum / max * 100).toFixed(1) + '%' })),
          h('span', { class: 'mem-pct' }, pct(m.sum, s.exp) + '%'))));
    });
    box.appendChild(ul);
    var lead = s.members[0];
    var note = s.members.length > 1
      ? 'Ең көп жұмсаған — ' + lead.name + ': отбасы шығысының ' + pct(lead.sum, s.exp) + '%-ы.'
      : 'Бұл айда шығысты тек ' + lead.name + ' жазды.';
    box.appendChild(h('div', { class: 'card-foot' }, h('div', { class: 'hint', style: 'margin-top:0' }, h('span', { html: icon('people', 18), style: 'display:inline-grid' }), h('span', null, note))));
  }

  function matches(r, q) {
    if (!q) return true;
    var hay = [r.note || '', r.member, r.type === 'income' ? 'кіріс' : 'шығыс ' + CATS[r.category].name, String(r.amount)].join(' ');
    return lower(hay).indexOf(q) !== -1;
  }
  function renderHistory() {
    var box = $('history');
    box.textContent = '';
    var q = lower(state.query.trim());
    var all = records().slice().sort(function (a, b) { return Date.parse(b.createdAt) - Date.parse(a.createdAt); });
    var list = all.filter(function (r) { return matches(r, q); });
    $('histCount').textContent = list.length;
    $('filterPill').hidden = !q;
    if (q) $('filterText').textContent = '«' + state.query.trim() + '» · ' + list.length + ' жазба';
    if (!all.length) {
      box.appendChild(emptyState('list', 'Әзірге жазба жоқ', 'Алғашқы кірісті немесе шығысты қосыңыз. Сайттың қалай жұмыс істейтінін көру үшін мысалды ашыңыз.',
        h('div', { class: 'chips' },
          h('button', { class: 'btn btn-primary', type: 'button', onclick: openEntry }, 'Жазба қосу'),
          h('button', { class: 'btn btn-ghost', type: 'button', onclick: enterDemo }, 'Мысалды көру'))));
      $('moreBtn').hidden = true;
      return;
    }
    if (!list.length) { box.appendChild(emptyState('search', 'Ештеңе табылмады', 'Басқа сөзбен іздеп көріңіз: есім, санат немесе сипаттама.')); $('moreBtn').hidden = true; return; }
    var shown = list.slice(0, state.histLimit), groups = [], totals = {};
    shown.forEach(function (r) {
      var d = new Date(r.createdAt), k = monthKey(d), g = groups[groups.length - 1];
      if (!g || g.k !== k) { g = { k: k, label: MONTHS[d.getMonth()] + ' ' + d.getFullYear(), items: [] }; groups.push(g); }
      g.items.push(r);
    });
    list.forEach(function (r) { var k = monthKey(new Date(r.createdAt)); totals[k] = (totals[k] || 0) + 1; });
    groups.forEach(function (g) {
      var ul = h('ul', { class: 'ops' });
      g.items.forEach(function (r) { ul.appendChild(opRow(r)); });
      box.appendChild(h('div', { class: 'hgroup' }, h('div', { class: 'hgroup-head' }, h('span', null, g.label), h('span', null, totals[g.k] + ' жазба')), ul));
    });
    var rest = list.length - shown.length;
    $('moreBtn').hidden = rest <= 0;
    $('moreBtn').textContent = 'Тағы көрсету (' + rest + ')';
    state.flashId = null;
  }
  function opRow(r) {
    var isInc = r.type === 'income', cat = isInc ? null : CATS[r.category];
    var title = r.note || (isInc ? 'Кіріс' : cat.name);
    return h('li', { class: 'op' + (r.id === state.flashId ? ' is-new' : ''), style: cat ? '--c:' + cat.color : null },
      h('span', { class: 'op-ico' + (isInc ? ' is-income' : ''), html: icon(isInc ? 'income' : r.category, 20) }),
      h('span', { class: 'op-title' }, title),
      h('span', { class: 'op-amt' + (isInc ? ' pos' : '') }, (isInc ? '+' : '−') + fmtNum(r.amount) + NB + '₸'),
      h('span', { class: 'op-meta' },
        isInc ? h('span', { class: 'tag is-income' }, h('i'), 'Кіріс') : h('span', { class: 'tag' }, h('i'), cat.name),
        h('span', { class: 'op-who' }, r.member + ' · ' + whenLabel(new Date(r.createdAt)))),
      h('button', { class: 'icon-btn op-del', type: 'button', title: 'Жою', 'aria-label': 'Жазбаны жою: ' + title + ', ' + fmtNum(r.amount) + ' теңге', html: icon('trash', 18), onclick: function () { askDelete(r); } }));
  }
  function renderNameChips() {
    var box = $('nameChips');
    box.textContent = '';
    var names = knownNames().slice(0, 6), cur = lower($('member').value.trim());
    names.forEach(function (n) {
      box.appendChild(h('button', { class: 'chip' + (lower(n) === cur ? ' is-on' : ''), type: 'button', onclick: function () { $('member').value = n; clearErr('member'); renderNameChips(); } }, n));
    });
    box.hidden = !names.length;
  }

  /* ---------- reminders ---------- */
  function reminderItems() {
    var now = new Date(), y = now.getFullYear(), m = now.getMonth();
    var util = now.getDate() <= 25 ? new Date(y, m, 25) : new Date(y, m + 1, 25);
    return [
      { icon: 'calendar', title: 'Айлық бюджетті тексеру', when: now.getHours() < 20 ? 'Бүгін, 20:00' : 'Ертең, 20:00' },
      { icon: 'bell', title: 'Коммуналдық төлемдер', when: dayLabel(util), warn: true },
      { icon: 'card', title: 'Айдың қорытындысы', when: dayLabel(new Date(y, m + 1, 0)) }
    ];
  }
  function renderReminders() {
    [$('reminders'), $('bellList')].forEach(function (ul) {
      ul.textContent = '';
      reminderItems().forEach(function (it) {
        ul.appendChild(h('li', null, h('span', { class: 'rem-ico' + (it.warn ? ' warn' : ''), html: icon(it.icon, 18) }), h('span', null, h('span', { class: 'rem-title' }, it.title), h('span', { class: 'rem-when' }, it.when))));
      });
    });
  }

  /* ---------- tools ---------- */
  var TOOLS = [
    { id: 'budget', name: 'Бюджет калькуляторы', icon: 'wallet' },
    { id: 'goal', name: 'Мақсатқа жету есебі', icon: 'target' },
    { id: 'buy', name: 'Сатып алу шешімі', icon: 'cart' },
    { id: 'loan', name: 'Несие калькуляторы', icon: 'percent' },
    { id: 'fraud', name: 'Алаяқтықты анықтау', icon: 'shield' }
  ];
  function renderTools() {
    var box = $('tools');
    TOOLS.forEach(function (t) {
      box.appendChild(h('button', { class: 'tool', type: 'button', 'data-tool': t.id },
        t.soon ? h('span', { class: 'soon' }, 'Жақында') : null,
        h('span', { class: 'tool-ico', html: icon(t.icon, 22) }), t.name));
    });
  }
  function moneyField(label, value) {
    var id = 'f' + uid();
    var input = h('input', { class: 'input', id: id, inputmode: 'numeric', autocomplete: 'off', placeholder: '0' });
    if (value) input.value = fmtNum(value);
    input.addEventListener('input', function () { var d = this.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10); this.value = d ? fmtNum(+d) : ''; });
    return { el: h('div', { class: 'field' }, h('label', { for: id }, label), h('div', { class: 'suffix-wrap' }, input, h('span', { class: 'cur' }, '₸'))), input: input, get: function () { return digits(input.value); } };
  }
  function numField(label, suffix, max) {
    var id = 'f' + uid();
    var input = h('input', { class: 'input', id: id, inputmode: 'decimal', autocomplete: 'off', placeholder: '0' });
    input.addEventListener('input', function () { this.value = this.value.replace(',', '.').replace(/[^\d.]/g, ''); });
    return { el: h('div', { class: 'field' }, h('label', { for: id }, label), h('div', { class: 'suffix-wrap' }, input, h('span', { class: 'cur' }, suffix))), input: input, get: function () { var n = parseFloat(input.value); return isFinite(n) ? Math.min(n, max) : 0; } };
  }
  function row(label, value, note, cls) { return h('div', { class: 'calc-row' + (cls ? ' ' + cls : '') }, h('span', null, label), h('b', null, value), note ? h('small', null, note) : null); }
  function bindCalc(fields, out, fn) { fields.forEach(function (f) { f.input.addEventListener('input', function () { out.textContent = ''; fn(); }); }); fn(); }
  function monthsSpan(n) { var y = Math.floor(n / 12), mo = n % 12; return ((y ? y + ' жыл ' : '') + (mo ? mo + ' ай' : '')).trim(); }
  function monthsLabel(n) { var d = new Date(); d.setMonth(d.getMonth() + n); return monthsSpan(n) + ' · ' + MONTHS[d.getMonth()] + ' ' + d.getFullYear(); }

  var FRAUD = [
    'Сізден SMS-код, CVV немесе PIN-код сұрайды.',
    '«Банк қызметкерімін», «полициямын» деп өзі хабарласып, шұғыл әрекет талап етеді.',
    'Тым жоғары табыс немесе «тез ақша» уәде етеді.',
    'Бейтаныс сілтемені ашуды немесе қосымша орнатуды сұрайды.',
    'Туысым деп жазып, ақша аударуды өтінеді, бірақ қоңырау шалуға болмайды дейді.',
    'Ұтыс немесе несие үшін алдын ала төлем, «комиссия» сұрайды.'
  ];
  var TIPS = [
    ['SMS-кодты ешкімге бермеңіз!', 'Банк қызметкерлері де сізден код сұрамайды.'],
    ['Бейтаныс сілтемені ашпаңыз', 'Ұтыс пен жеңілдік туралы хабарламалар көбіне алаяқтардан келеді.'],
    ['Күмәндансаңыз, қоңырауды үзіңіз', 'Банктің картаңыздағы ресми нөміріне өзіңіз хабарласыңыз.'],
    ['Картаның суретін жібермеңіз', 'Карта нөмірі мен оның артындағы код — ақшаңыздың кілті.']
  ];
  function openTool(id) {
    var s = summarize(), t = TOOLS.filter(function (x) { return x.id === id; })[0];
    if (!t) return;
    if (t.soon) { toast('«' + t.name + '» жақында қосылады'); return; }
    var body = [], out = h('div', { class: 'calc-out', 'aria-live': 'polite' });
    if (id === 'budget') {
      var inc = moneyField('Айлық кіріс', s.inc);
      body.push(h('p', { class: 'dlg-lead' }, 'Кірісті үш бөлікке бөлудің қарапайым тәсілі. Бұл айдың кірісі өзі қойылды, қаласаңыз өзгертіңіз.'), inc.el, out);
      bindCalc([inc], out, function () {
        var v = inc.get();
        if (!v) { out.appendChild(h('p', { class: 'muted' }, 'Кірісті жазыңыз: біз оны 50/30/20 ережесімен бөлеміз.')); return; }
        out.appendChild(row('Міндетті шығыстар · 50%', money(v * .5), 'Үй, азық-түлік, көлік, коммуналдық төлемдер'));
        out.appendChild(row('Қалаулар · 30%', money(v * .3), 'Демалыс, кафе, киім, сыйлықтар'));
        out.appendChild(row('Жинақ · 20%', money(v * .2), 'Қаржы жастығы, мақсат, қарызды ерте өтеу', 'hl'));
        if (s.inc && v === s.inc && s.exp) {
          out.appendChild(h('p', { class: 'dlg-note' }, 'Бұл айда кірістің ' + pct(s.exp, s.inc) + '%-ы жұмсалды. ' + (s.exp / s.inc <= 0.8 ? 'Жинаққа кемінде 20% қалады, ереже орындалып тұр.' : 'Жинаққа 20%-дан аз қалады: қалаулар бөлігін қысқартып көріңіз.')));
        }
      });
    } else if (id === 'goal') {
      var g = goal();
      var tgt = moneyField('Мақсат сомасы', g ? g.target : 0), have = moneyField('Қазір жиналғаны', Math.max(0, s.allBal)), per = moneyField('Айына қанша сала аласыз', s.bal > 0 ? Math.round(s.bal / 1000) * 1000 : 0);
      body.push(h('p', { class: 'dlg-lead' }, 'Мақсатқа қашан жететініңізді есептейміз.'), h('div', { class: 'grid2' }, tgt.el, have.el), per.el, out);
      bindCalc([tgt, have, per], out, function () {
        var T = tgt.get(), H = have.get(), M = per.get();
        if (!T) { out.appendChild(h('p', { class: 'muted' }, 'Мақсат сомасын жазыңыз.')); return; }
        if (H >= T) { out.appendChild(row('Нәтиже', 'Жеттіңіз!', 'Жиналған сома мақсаттан асады', 'hl')); return; }
        if (!M) { out.appendChild(h('p', { class: 'muted' }, 'Айына қанша сала алатыныңызды жазыңыз.')); return; }
        var n = Math.ceil((T - H) / M);
        out.appendChild(row('Қажет уақыт', monthsSpan(n), 'Шамамен ' + monthsLabel(n).split(' · ')[1] + '. Тағы ' + money(T - H) + ' жинау керек.', 'hl'));
        out.appendChild(row('Екі есе тез жету үшін', money(M * 2) + ' / ай', 'Сонда ' + monthsSpan(Math.ceil(n / 2))));
      });
    } else if (id === 'buy') {
      var price = moneyField('Тауардың бағасы', 0);
      body.push(h('p', { class: 'dlg-lead' }, 'Сатып алу бюджетке қалай әсер ететінін көрсетеміз.'), price.el, out);
      bindCalc([price], out, function () {
        var v = price.get();
        if (!v) { out.appendChild(h('p', { class: 'muted' }, 'Бағаны жазыңыз.')); return; }
        if (s.inc > 0) out.appendChild(row('Кірістің неше күні', Math.max(1, Math.round(v / (s.inc / 30))) + ' күн', 'Бұл айдың кірісі бойынша есептелді'));
        if (s.bal > 0) {
          var share = v / s.bal;
          out.appendChild(row('Айдың қалдығынан', pct(v, s.bal) + '%', 'Қалдық: ' + money(s.bal), share > 1 ? 'bad' : (share > .5 ? '' : 'hl')));
          out.appendChild(h('p', { class: 'dlg-note' }, share > 1 ? 'Қалдық жетпейді. Сатып алуды кейінге қалдырып, бірнеше ай жинаған дұрыс.' : share > .5 ? 'Қалдықтың жартысынан көбі. 24 сағат ойланып, сосын шешім қабылдаңыз.' : 'Бюджетке әсері аз: қалдық жеткілікті.'));
        } else {
          out.appendChild(h('p', { class: 'dlg-note' }, 'Бұл айда бос қалдық жоқ. Алдымен кіріс пен шығысты жазыңыз.'));
        }
      });
    } else if (id === 'loan') {
      var sum = moneyField('Несие сомасы', 0), rate = numField('Жылдық мөлшерлеме', '%', 200), term = numField('Мерзімі', 'ай', 600);
      body.push(h('p', { class: 'dlg-lead' }, 'Аннуитет бойынша ай сайынғы төлемді есептейміз.'), sum.el, h('div', { class: 'grid2' }, rate.el, term.el), out);
      bindCalc([sum, rate, term], out, function () {
        var Pv = sum.get(), r = rate.get(), n = Math.round(term.get());
        if (!Pv || !n) { out.appendChild(h('p', { class: 'muted' }, 'Соманы, мөлшерлемені және мерзімді жазыңыз.')); return; }
        var i = r / 1200, pay = i ? Pv * i / (1 - Math.pow(1 + i, -n)) : Pv / n;
        out.appendChild(row('Ай сайынғы төлем', money(pay), null, 'hl'));
        out.appendChild(row('Артық төлем', money(pay * n - Pv), 'Жалпы төлем: ' + money(pay * n)));
        if (s.inc) { var heavy = pay / s.inc > 1 / 3; out.appendChild(row('Кірістің үлесі', pct(pay, s.inc) + '%', heavy ? 'Үштен бірінен асады: тәуекел жоғары' : 'Үштен бірінен аспайды', heavy ? 'bad' : '')); }
        out.appendChild(h('p', { class: 'dlg-note' }, 'Есеп шамамен. Нақты шартты банктің СЖТМ бойынша тексеріңіз.'));
      });
    } else if (id === 'fraud') {
      setFlag('safety');
      body.push(h('p', { class: 'dlg-lead' }, 'Мына белгілердің бірі болса, тоқтаңыз: бұл алаяқ болуы мүмкін.'));
      body.push(h('ul', { class: 'checklist' }, FRAUD.map(function (f) { return h('li', null, h('span', { class: 'n', html: icon('x', 16) }), h('span', null, f)); })));
      body.push(row('Не істеу керек', 'Қоңырауды үзіңіз', 'Банктің картаңыздағы ресми нөміріне өзіңіз хабарласыңыз', 'hl'));
    }
    openPanel(t.name, '', body);
  }

  /* ---------- goal ---------- */
  var HOUSE_SVG = '<svg viewBox="0 0 120 100" aria-hidden="true"><ellipse cx="60" cy="94" rx="54" ry="6" fill="var(--ill-shadow)"/><circle cx="100" cy="66" r="13" fill="var(--ill-leaf-2)"/><rect x="98" y="74" width="4" height="20" rx="1" fill="var(--ill-leaf-3)"/><rect x="22" y="50" width="64" height="44" rx="3" fill="var(--surface)"/><path d="M14 54 L54 22 L94 54 Z" fill="var(--accent)"/><path d="M14 54 L54 22 L94 54" stroke="var(--accent-hover)" stroke-width="3" fill="none" stroke-linejoin="round"/><rect x="46" y="68" width="16" height="26" rx="2" fill="var(--ill-coin-d)"/><rect x="29" y="62" width="12" height="12" rx="2" fill="var(--ill-sky)"/><rect x="67" y="62" width="12" height="12" rx="2" fill="var(--ill-sky)"/><rect x="70" y="30" width="8" height="14" fill="var(--accent-hover)"/></svg>';
  function renderGoal(s) {
    var box = $('goalBox');
    box.textContent = '';
    var g = goal();
    if (state.editingGoal) { box.appendChild(goalForm(g)); return; }
    var art = h('div', { class: 'goal-art', html: HOUSE_SVG });
    if (!g) {
      box.appendChild(h('div', { class: 'goal' }, art, h('div', null, h('p', { class: 'goal-name' }, 'Мақсат қойыңыз'), h('p', { class: 'goal-meta', style: 'margin-top:4px' }, 'Үй, көлік, демалыс немесе қаржы жастығы. Жиналған қалдықты мақсатқа санаймыз.'))));
      box.appendChild(h('div', { class: 'card-foot' }, h('button', { class: 'btn btn-soft btn-block', type: 'button', onclick: function () { state.editingGoal = true; renderGoal(summarize()); } }, 'Мақсат қою')));
      return;
    }
    var saved = Math.max(0, s.allBal), p = Math.min(100, Math.round(saved / g.target * 100)), left = g.target - saved, eta;
    if (left <= 0) eta = 'Мақсатқа жеттіңіз!';
    else if (s.bal > 0) eta = 'Қалған уақыт: шамамен ' + monthsSpan(Math.ceil(left / s.bal));
    else eta = 'Қалдық болған айда мерзімін есептейміз';
    box.appendChild(h('div', { class: 'goal' }, art, h('div', { style: 'min-width:0' },
      h('p', { class: 'goal-name' }, g.name),
      h('p', { class: 'goal-target' }, money(g.target)),
      h('div', { class: 'prog-row' }, h('div', { class: 'prog', role: 'progressbar', 'aria-valuenow': p, 'aria-valuemin': 0, 'aria-valuemax': 100, 'aria-label': 'Мақсатқа жету' }, h('span', { style: 'width:' + p + '%' })), h('span', { class: 'prog-pct' }, p + '%')),
      h('p', { class: 'goal-meta' }, eta))));
    box.appendChild(h('div', { class: 'goal-stats' },
      h('div', null, h('span', null, 'Жиналғаны'), h('b', null, money(saved))),
      h('div', null, h('span', null, left > 0 ? 'Қалғаны' : 'Артығы'), h('b', null, money(Math.abs(left))))));
    box.appendChild(h('p', { class: 'goal-meta', style: 'margin-top:10px' }, 'Барлық айлардың қалдығы мақсатқа есептеледі.'));
    box.appendChild(h('div', { class: 'card-foot' }, h('button', { class: 'btn btn-soft btn-block', type: 'button', onclick: function () { state.editingGoal = true; renderGoal(summarize()); } }, 'Жоспарды өзгерту')));
  }
  function goalForm(g) {
    var name = h('input', { class: 'input', id: 'goalName', maxlength: '40', placeholder: 'Мысалы, үй алу', value: g ? g.name : '' });
    var amt = moneyField('Сомасы', g ? g.target : 0);
    var err = h('p', { class: 'err', hidden: true });
    var f = h('form', { class: 'goal-form', novalidate: true },
      h('div', { class: 'field' }, h('label', { for: 'goalName' }, 'Мақсат'), name), amt.el, err,
      h('div', { class: 'row2' },
        h('button', { class: 'btn btn-ghost', type: 'button', onclick: function () { state.editingGoal = false; renderGoal(summarize()); } }, 'Болдырмау'),
        h('button', { class: 'btn btn-primary', type: 'submit' }, 'Сақтау')),
      g ? h('button', { class: 'link', type: 'button', style: 'align-self:center;color:var(--neg)', onclick: function () { saveGoal(null); } }, 'Мақсатты өшіру') : null);
    f.addEventListener('submit', function (e) {
      e.preventDefault();
      var n = name.value.trim().replace(/\s+/g, ' '), v = amt.get();
      if (!n || !v) { err.textContent = !n ? 'Мақсаттың атын жазыңыз' : 'Соманы жазыңыз'; err.hidden = false; return; }
      saveGoal({ name: upperFirst(n), target: Math.min(v, MAX_AMOUNT * 10) });
    });
    setTimeout(function () { name.focus(); }, 30);
    return f;
  }
  function saveGoal(g) {
    state.editingGoal = false;
    if (isDemo()) state.demoGoal = g;
    else { state.goal = g; try { if (g) localStorage.setItem(GOAL_KEY, JSON.stringify(g)); else localStorage.removeItem(GOAL_KEY); } catch (e) {} }
    render();
    toast(g ? 'Мақсат сақталды' : 'Мақсат өшірілді');
  }

  /* ---------- scenario ---------- */
  function renderScenario(s) {
    var chips = $('scenChips');
    if (!chips.children.length) {
      [10, 20, 30].forEach(function (v) {
        chips.appendChild(h('button', { class: 'chip', type: 'button', 'data-pct': v, onclick: function () { state.scenPct = v; renderScenario(summarize()); } }, v + '%-ға азайса'));
      });
    }
    [].forEach.call(chips.children, function (c) { var on = +c.dataset.pct === state.scenPct; c.classList.toggle('is-on', on); c.setAttribute('aria-pressed', String(on)); });
    var out = $('scenOut');
    out.textContent = '';
    if (!s.inc) { out.appendChild(h('span', null, 'Есептеу үшін алдымен айдың кірісін жазыңыз.')); return; }
    var newInc = s.inc * (1 - state.scenPct / 100), newBal = newInc - s.exp;
    out.appendChild(h('span', null, 'Кіріс ' + money(newInc) + ' болса, қалдық:'));
    out.appendChild(h('span', { class: 'big ' + (newBal < 0 ? 'is-neg' : 'is-pos') }, money(newBal)));
    if (newBal >= 0) out.appendChild(h('span', null, 'Бюджет төтеп береді.'));
    else out.appendChild(h('span', null, 'Жетпейді. Ең үлкен санат — ', h('strong', null, CATS[s.topCat].name), ': оны ' + money(-newBal) + '-ге қысқарту керек.'));
  }

  /* ---------- safety tips ---------- */
  function renderTip() {
    var t = TIPS[state.tipIdx];
    $('safeTitle').textContent = t[0];
    $('safeText').textContent = t[1];
    var d = $('safeDots'); d.textContent = '';
    TIPS.forEach(function (_, i) { d.appendChild(h('i', { class: i === state.tipIdx ? 'on' : null })); });
  }
  $('nextTip').addEventListener('click', function () { state.tipIdx = (state.tipIdx + 1) % TIPS.length; renderTip(); });

  /* ---------- achievements ---------- */
  var ACH = [
    { name: 'Білімгер', icon: 'book', how: '«Пайдалы ақпараттан» бір мақала оқыңыз', test: function (s, f) { return !!f.read; } },
    { name: 'Үнемшіл', icon: 'wallet', how: 'Айда кірістің 20%-ынан көбін сақтап қалыңыз', test: function (s) { return s.share != null && s.share >= 0.2; } },
    { name: 'Мақсаткер', icon: 'target', how: 'Қаржылық мақсат қойыңыз', test: function () { return !!goal(); } },
    { name: 'Қауіпсіз пайдаланушы', icon: 'shield', how: 'Алаяқтық белгілерімен танысыңыз', test: function (s, f) { return !!f.safety; } }
  ];
  function shieldSvg(on, iconName) {
    var fill = on ? 'var(--accent)' : 'var(--line-strong)', inner = on ? 'var(--accent-hover)' : 'var(--line)', ink = on ? '#ffffff' : 'var(--ink-3)';
    return '<svg class="shield" viewBox="0 0 48 52" aria-hidden="true"><path d="M24 2 44 9v15c0 13-9 22-20 26C13 46 4 37 4 24V9z" fill="' + fill + '"/><path d="M24 7 39 12.5v11.5c0 10-7 17.2-15 20.5C16 41.2 9 34 9 24V12.5z" fill="' + inner + '" opacity=".55"/>' +
      '<svg x="14" y="15" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="' + ink + '" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + (on ? P[iconName] : P.lock) + '</svg></svg>';
  }
  function renderAchievements(s) {
    var box = $('badges'), f = flags();
    box.textContent = '';
    ACH.forEach(function (a) {
      var on = a.test(s, f);
      box.appendChild(h('div', { class: 'badge' + (on ? '' : ' is-locked'), title: on ? a.name : a.how },
        h('span', { html: shieldSvg(on, a.icon) }), h('span', { class: 'badge-name' }, a.name), h('span', { class: 'badge-state' }, on ? 'Ашылды' : a.how)));
    });
  }
  $('allAch').addEventListener('click', function () {
    var s = summarize(), f = flags();
    openPanel('Жетістіктер', 'Сайтты қолданған сайын жаңа белгілер ашылады', [h('div', { class: 'list-btns' }, ACH.map(function (a) {
      var on = a.test(s, f);
      return h('div', { class: 'ach-row' }, h('span', { html: shieldSvg(on, a.icon) }), h('span', null, h('b', null, a.name), h('small', null, a.how)), h('span', { class: 'st' + (on ? ' ok' : '') }, on ? 'Ашылды' : 'Жабық'));
    }))]);
  });

  /* ---------- articles ---------- */
  var ART = {
    coins: '<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="82" rx="44" ry="5" fill="var(--ill-shadow)"/><ellipse cx="44" cy="76" rx="18" ry="6" fill="var(--ill-coin-d)"/><rect x="26" y="66" width="36" height="10" fill="var(--ill-coin-d)"/><ellipse cx="44" cy="66" rx="18" ry="6" fill="var(--ill-coin)"/><rect x="26" y="56" width="36" height="10" fill="var(--ill-coin-d)"/><ellipse cx="44" cy="56" rx="18" ry="6" fill="var(--ill-coin)"/><ellipse cx="78" cy="78" rx="18" ry="6" fill="var(--ill-coin-d)"/><rect x="60" y="62" width="36" height="16" fill="var(--ill-coin-d)"/><ellipse cx="78" cy="62" rx="18" ry="6" fill="var(--ill-coin)"/><rect x="60" y="48" width="36" height="14" fill="var(--ill-coin-d)"/><ellipse cx="78" cy="48" rx="18" ry="6" fill="var(--ill-coin)"/><path d="M78 46 V24" stroke="var(--ill-leaf-3)" stroke-width="3" stroke-linecap="round"/><path d="M78 32 C 78 20, 86 12, 98 12 C 98 24, 90 32, 78 32 Z" fill="var(--ill-leaf-2)"/><path d="M78 36 C 78 27, 72 21, 62 21 C 62 30, 68 36, 78 36 Z" fill="var(--ill-leaf-3)"/></svg>',
    pie: '<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="82" rx="40" ry="5" fill="var(--ill-shadow)"/><circle cx="60" cy="44" r="30" fill="var(--ill-leaf)"/><path d="M60 44 V14 A30 30 0 0 1 60 74 Z" fill="var(--accent)"/><path d="M60 44 L60 74 A30 30 0 0 1 31.5 53.3 Z" fill="var(--ill-coin)"/><circle cx="60" cy="44" r="12" fill="var(--surface)"/></svg>',
    shield: '<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="82" rx="40" ry="5" fill="var(--ill-shadow)"/><path d="M60 10 86 19v20c0 18-11 30-26 36-15-6-26-18-26-36V19z" fill="var(--accent)"/><path d="M60 17 79 24v15c0 14-8 23-19 28-11-5-19-14-19-28V24z" fill="var(--accent-hover)" opacity=".5"/><text x="60" y="52" text-anchor="middle" font-size="24" font-weight="700" font-family="Onest, Arial, sans-serif" fill="#ffffff">₸</text></svg>',
    card: '<svg viewBox="0 0 120 90" aria-hidden="true"><ellipse cx="60" cy="82" rx="40" ry="5" fill="var(--ill-shadow)"/><rect x="22" y="22" width="76" height="50" rx="8" fill="var(--ill-dark-2)" transform="rotate(-8 60 47)"/><rect x="26" y="26" width="76" height="50" rx="8" fill="var(--accent)"/><rect x="34" y="38" width="14" height="10" rx="2" fill="var(--ill-coin)"/><rect x="34" y="60" width="40" height="5" rx="2.5" fill="#ffffff" opacity=".7"/><circle cx="90" cy="62" r="13" fill="var(--surface)"/><text x="90" y="67" text-anchor="middle" font-size="14" font-weight="700" font-family="Onest, Arial, sans-serif" fill="var(--accent-ink)">%</text></svg>'
  };
  var ARTICLES = [
    { title: 'Инфляция деген не және ол бізге қалай әсер етеді?', date: '24 қазан 2026', art: 'coins', body: [
      'Инфляция — тауарлар мен қызметтер бағасының уақыт өте келе өсуі. Баға өскенде, сол бір мың теңгеге бұрынғыдан аз нәрсе сатып аласыз.',
      'Отбасы бюджеті үшін бұл екі нәрсені білдіреді: күнделікті шығыстар біртіндеп өседі, ал үйде жатқан қолма-қол ақша құнсызданады.',
      'Не істеуге болады: шығысты жүйелі жазып отырыңыз, сонда бағаның өсуін бірден байқайсыз. Жинақты қолма-қол емес, депозитте ұстаңыз. Ірі сатып алуды алдын ала жоспарлаңыз.'] },
    { title: '50/30/20 ережесі: кірісті қалай бөлуге болады?', date: '17 қазан 2026', art: 'pie', body: [
      'Бұл — кірісті үш бөлікке бөлудің қарапайым тәсілі. 50% — міндетті шығыстар: тұрғын үй, азық-түлік, көлік, коммуналдық төлемдер.',
      '30% — қалаулар: демалыс, кафе, киім, сыйлықтар. 20% — жинақ және қарызды мерзімінен бұрын өтеу.',
      'Пропорцияны отбасыңызға қарай өзгертуге болады. Ең бастысы — жинаққа арналған бөлікті айлық түскен күні бірден бөліп қою. Мұны «Бюджет калькуляторы» құралымен есептеп көріңіз.'] },
    { title: 'Қаржы жастығы: неге 3–6 айлық шығыс керек?', date: '9 қазан 2026', art: 'shield', body: [
      'Қаржы жастығы — жұмыстан айырылу, ауру немесе кенеттен болған жөндеу сияқты күтпеген жағдайға арналған қор.',
      'Оның көлемі әдетте отбасының 3–6 айлық міндетті шығысына тең. Мысалы, айына 300 000 ₸ жұмсасаңыз, мақсат — 900 000 ₸-ден 1 800 000 ₸-ге дейін.',
      'Жастықты бірден жинау міндетті емес: айына кірістің 5–10%-ын бөлек шотқа салудан бастаңыз және бұл ақшаны күнделікті шығысқа жұмсамаңыз.'] },
    { title: 'Несие алмас бұрын нені тексеру керек?', date: '2 қазан 2026', art: 'card', body: [
      'Жарнамадағы мөлшерлемеге емес, сыйақының жылдық тиімді мөлшерлемесіне (СЖТМ) қараңыз: онда барлық комиссиялар ескеріледі.',
      'Ай сайынғы төлем отбасы кірісінің үштен бірінен аспағаны жөн. Әйтпесе кез келген күтпеген шығыс бюджетті бірден бұзады.',
      'Келісімшартқа қол қоймас бұрын мерзімінен бұрын өтеу шарттарын, айыппұлдарды және сақтандыру міндетті ме екенін сұраңыз. Төлемді «Несие калькуляторымен» алдын ала есептеп алыңыз.'] }
  ];
  function renderArticle() {
    var a = ARTICLES[state.articleIdx], slot = $('articleSlot');
    slot.textContent = '';
    slot.appendChild(h('button', { class: 'article', type: 'button', onclick: function () { openArticle(state.articleIdx); } },
      h('span', { class: 'article-art', html: ART[a.art] }),
      h('span', null, h('span', { class: 'article-title' }, a.title), h('span', { class: 'article-date' }, a.date))));
    slot.appendChild(h('p', { class: 'article-ex' }, a.body[0]));
    slot.appendChild(h('button', { class: 'link article-more', type: 'button', onclick: function () { openArticle(state.articleIdx); } }, 'Оқу', h('span', { html: icon('arrow', 14), style: 'display:inline-grid' })));
    var dots = $('articleDots');
    dots.textContent = '';
    ARTICLES.forEach(function (_, i) {
      dots.appendChild(h('button', { type: 'button', class: i === state.articleIdx ? 'on' : null, 'aria-pressed': String(i === state.articleIdx), 'aria-label': (i + 1) + '-мақала', onclick: function () { state.articleIdx = i; renderArticle(); } }));
    });
  }
  function openArticle(i) {
    var a = ARTICLES[i];
    setFlag('read');
    openPanel(a.title, a.date, [h('div', { class: 'prose' }, a.body.map(function (p) { return h('p', null, p); }))]);
  }
  $('allArticles').addEventListener('click', function () {
    openPanel('Пайдалы ақпарат', 'Отбасы қаржысы туралы қысқа мақалалар', [h('div', { class: 'list-btns' }, ARTICLES.map(function (a, i) {
      return h('button', { class: 'list-btn', type: 'button', onclick: function () { openArticle(i); } }, h('span', { class: 'th', html: ART[a.art] }), h('span', null, h('b', null, a.title), h('small', null, a.date)));
    }))]);
  });

  /* ---------- assistant: rule-based answers, works without a server ---------- */
  var SUGS = ['Жинағымды қалай көбейтемін?', 'Қайсысы тиімді: несие немесе жинақ?', 'Қаржылық қауіпсіздік туралы айтшы'];
  function answer(q) {
    var t = lower(q), s = summarize();
    var top = s.exp ? CATS[s.topCat].name + ' (' + money(s.byCat[s.topCat]) + ', шығыстың ' + pct(s.byCat[s.topCat], s.exp) + '%-ы)' : null;
    if (/несие|кредит|қарыз/.test(t)) return 'Негізгі айырмашылық — мөлшерлеме. Несиенің СЖТМ-і әдетте депозит табысынан жоғары, сондықтан шұғыл қажеттілік болмаса, алдымен жинаған тиімді.\nНесие алсаңыз, ай сайынғы төлем кірістің үштен бірінен аспағаны жөн. Оны «Несие калькуляторымен» есептеп көріңіз.';
    if (/қауіп|алаяқ|код|карта|сілтеме/.test(t)) { setFlag('safety'); return 'Үш басты ереже:\n1) SMS-кодты, CVV мен PIN-кодты ешкімге айтпаңыз, банк қызметкеріне де.\n2) Бейтаныс сілтемені ашпаңыз, қосымшаны тек ресми дүкеннен орнатыңыз.\n3) Күмәндансаңыз, қоңырауды үзіп, банктің ресми нөміріне өзіңіз хабарласыңыз.'; }
    if (/жина|үнем|көбейт/.test(t)) {
      return (s.inc ? 'Бұл айда кірістің ' + (s.share > 0 ? pct(s.bal, s.inc) : 0) + '%-ы қалды. ' : '') +
        'Жинақты көбейтудің үш жолы:\n1) Айлық түскен күні оның 10–20%-ын бірден бөлек шотқа салыңыз.\n2) Ең үлкен санатты қараңыз' + (top ? ': қазір бұл — ' + top : '') + '.\n3) Ұсақ шығыстарды аптасына бір рет тексеріп отырыңыз.';
    }
    if (/қайда|санат|шығыс|жұмса/.test(t)) return top ? 'Бұл айда ең көп шығын — ' + top + '. Барлық шығыс: ' + money(s.exp) + '.' : 'Бұл айда әзірге шығыс жазылмаған.';
    if (/қалдық|қанша|кіріс|баланс/.test(t)) return s.inc || s.exp ? 'Бұл айда кіріс ' + money(s.inc) + ', шығыс ' + money(s.exp) + ', қалдық ' + money(s.bal) + '.' : 'Бұл айда әзірге жазба жоқ.';
    if (/сәлем|салем/.test(t)) return 'Сәлеметсіз бе! Жинақ, несие, қауіпсіздік немесе айдың шығыстары туралы сұраңыз.';
    return 'Мен әзірге бета-нұсқадамын және мына тақырыптарда жауап беремін: жинақ, несие, қаржылық қауіпсіздік, айдың шығыстары мен қалдығы.';
  }
  function pushMsg(text, who) { var c = $('chat'), m = h('div', { class: 'msg ' + who }, text); c.appendChild(m); c.scrollTop = c.scrollHeight; return m; }
  function ask(q) {
    q = q.trim(); if (!q) return;
    pushMsg(q, 'me');
    var typing = pushMsg('Жазып жатыр…', 'bot typing');
    setTimeout(function () { typing.remove(); pushMsg(answer(q), 'bot'); }, 550);
  }
  function initChat() {
    pushMsg('Сәлем! Қандай сұрағыңыз бар?', 'bot');
    SUGS.forEach(function (q) { $('sugs').appendChild(h('button', { class: 'sug', type: 'button', onclick: function () { ask(q); } }, q)); });
    $('chatForm').addEventListener('submit', function (e) { e.preventDefault(); var v = $('chatInput').value; $('chatInput').value = ''; ask(v); });
  }

  /* ---------- generic panel dialog ---------- */
  var panel = $('panelDlg');
  function openPanel(title, sub, nodes) {
    $('panelTitle').textContent = title;
    $('panelSub').textContent = sub || '';
    $('panelSub').hidden = !sub;
    var b = $('panelBody');
    b.textContent = '';
    nodes.forEach(function (n) { b.appendChild(n); });
    if (!panel.open) { if (typeof panel.showModal === 'function') panel.showModal(); else panel.setAttribute('open', ''); }
    var first = b.querySelector('input');
    if (first) setTimeout(function () { first.focus(); }, 30);
  }
  $('panelClose').addEventListener('click', function () { panel.close(); });
  panel.addEventListener('click', function (e) { if (e.target === panel) panel.close(); });

  function openSettings() {
    var dark = effectiveTheme() === 'dark';
    var confirmStep = false;
    var wipe = h('button', { class: 'btn btn-ghost', type: 'button', disabled: isDemo() || !state.personal.length ? true : null }, 'Барлық жазбаларды өшіру');
    wipe.addEventListener('click', function () {
      if (!confirmStep) { confirmStep = true; wipe.className = 'btn btn-danger'; wipe.textContent = 'Иә, бәрін өшіру'; return; }
      state.personal = []; state.goal = null; state.flags = {};
      try { localStorage.removeItem(KEY); localStorage.removeItem(GOAL_KEY); localStorage.removeItem(FLAGS_KEY); } catch (e) {}
      panel.close(); render(); toast('Барлық жазбалар өшірілді');
    });
    openPanel('Параметрлер', '', [
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Тақырып'),
        h('div', { class: 'seg' },
          h('button', { type: 'button', class: dark ? null : 'is-on', onclick: function () { setTheme('light'); openSettings(); } }, 'Күндізгі'),
          h('button', { type: 'button', class: dark ? 'is-on' : null, onclick: function () { setTheme('dark'); openSettings(); } }, 'Түнгі'))),
      h('div', { class: 'field' }, h('span', { class: 'lbl' }, 'Деректер'),
        h('p', { class: 'dlg-note' }, 'Жазбалар тек осы құрылғының браузерінде сақталады. Қазір сақталғаны: ' + state.personal.length + ' жазба.'),
        wipe, isDemo() ? h('p', { class: 'muted', style: 'font-size:13px' }, 'Мысал режимінде өшіру қолжетімсіз.') : null)
    ]);
  }
  function openHelp() {
    var faq = [
      ['Деректерім қайда сақталады?', 'Тек осы құрылғының браузерінде. Сайт оларды ешқайда жібермейді. Басқа телефоннан не компьютерден ашсаңыз, жазбалар көрінбейді.'],
      ['Жазбаны қалай қосамын?', '«Жазба қосу» батырмасын басып, соманы, отбасы мүшесін және санатты таңдаңыз. Күні мен уақыты өзі қойылады.'],
      ['Қате жазбаны қалай өшіремін?', 'Операциялар тарихында жазбаның оң жағындағы қоқыс жәшігі белгісін басып, жоюды растаңыз.'],
      ['Мысал режимі деген не?', 'Сайттың мүмкіндіктерін көрсетуге арналған үлгі отбасының бюджеті. Ондағы өзгерістер сіздің жазбаларыңызға әсер етпейді.'],
      ['Айдың басында сомалар неге нөлге түседі?', 'Кіріс, шығыс және қалдық ағымдағы ай бойынша есептеледі. Өткен айлардың жазбалары тарихта сақтаулы.']
    ];
    openPanel('Көмек орталығы', 'Жиі қойылатын сұрақтар', [h('div', { class: 'faq' }, faq.map(function (f, i) { return h('details', i === 0 ? { open: true } : null, h('summary', null, f[0]), h('p', null, f[1])); }))]);
  }

  /* ---------- entry form ---------- */
  var form = $('form');
  function currentType() { return $('tIncome').checked ? 'income' : 'expense'; }
  function syncType() {
    var inc = currentType() === 'income';
    $('catField').hidden = inc;
    $('submitBtn').textContent = inc ? 'Кірісті қосу' : 'Шығысты қосу';
    $('note').placeholder = inc ? 'Мысалы, жалақы' : 'Мысалы, апталық азық-түлік';
    clearErr('cat');
  }
  $('tIncome').addEventListener('change', syncType);
  $('tExpense').addEventListener('change', syncType);
  $('amount').addEventListener('input', function () { var d = this.value.replace(/\D/g, '').replace(/^0+/, '').slice(0, 10); this.value = d ? fmtNum(+d) : ''; clearErr('amount'); });
  $('member').addEventListener('input', function () { clearErr('member'); renderNameChips(); });
  [].forEach.call(document.querySelectorAll('input[name="cat"]'), function (el) { el.addEventListener('change', function () { clearErr('cat'); }); });
  function showErr(field, msg) { var e = $(field + 'Err'); e.textContent = msg; e.hidden = false; if (field !== 'cat') $(field).setAttribute('aria-invalid', 'true'); }
  function clearErr(field) { var e = $(field + 'Err'); if (e) { e.hidden = true; e.textContent = ''; } if (field !== 'cat') $(field).removeAttribute('aria-invalid'); }

  form.addEventListener('submit', function (ev) {
    ev.preventDefault();
    var type = currentType(), amount = digits($('amount').value), member = normalizeName($('member').value);
    var catEl = document.querySelector('input[name="cat"]:checked');
    var category = type === 'expense' ? (catEl ? catEl.value : '') : null;
    var bad = null;
    if (amount <= 0) { showErr('amount', 'Соманы жазыңыз: ол 0-ден үлкен болуы керек'); bad = bad || $('amount'); }
    else if (amount > MAX_AMOUNT) { showErr('amount', 'Сома тым үлкен. 100 000 000 ₸-ге дейін жазыңыз'); bad = bad || $('amount'); }
    if (!member) { showErr('member', 'Кім екенін жазыңыз, мысалы: Айгүл'); bad = bad || $('member'); }
    if (type === 'expense' && !category) { showErr('cat', 'Санатты таңдаңыз'); bad = bad || $('cFood'); }
    if (bad) { bad.focus(); return; }
    var rec = { id: uid(), type: type, amount: amount, member: member, note: $('note').value.trim().replace(/\s+/g, ' ').slice(0, 60), category: category, createdAt: new Date().toISOString() };
    records().push(rec);
    state.flashId = rec.id;
    $('member').value = member;
    commit();
    $('amount').value = ''; $('note').value = '';
    if (catEl) catEl.checked = false;
    renderNameChips();
    toast((type === 'income' ? 'Кіріс қосылды: +' : 'Шығыс қосылды: −') + fmtNum(amount) + NB + '₸');
    closeEntry();
  });

  /* ---------- delete ---------- */
  var dlg = $('delDlg');
  function askDelete(r) {
    state.pendingDelete = r.id;
    var isInc = r.type === 'income', title = r.note || (isInc ? 'Кіріс' : CATS[r.category].name), rec = $('delRec');
    rec.textContent = '';
    rec.appendChild(h('span', { class: 't' }, title));
    rec.appendChild(h('span', { class: 'a' }, (isInc ? '+' : '−') + fmtNum(r.amount) + NB + '₸'));
    rec.appendChild(h('span', { class: 'm' }, (isInc ? 'Кіріс' : CATS[r.category].name) + ' · ' + r.member + ' · ' + whenLabel(new Date(r.createdAt))));
    dlg.returnValue = '';
    if (typeof dlg.showModal === 'function') dlg.showModal(); else dlg.setAttribute('open', '');
  }
  dlg.addEventListener('close', function () {
    var id = state.pendingDelete; state.pendingDelete = null;
    if (dlg.returnValue !== 'ok' || !id) return;
    var list = records(), idx = list.findIndex(function (r) { return r.id === id; });
    if (idx < 0) return;
    list.splice(idx, 1); commit(); toast('Жазба жойылды');
  });
  dlg.addEventListener('click', function (e) { if (e.target === dlg) dlg.close('cancel'); });

  /* ---------- demo ---------- */
  function resetForm() { $('member').value = ''; clearErr('amount'); clearErr('member'); clearErr('cat'); }
  function enterDemo() {
    state.mode = 'demo'; state.demo = buildDemo(); state.demoGoal = { name: 'Үй алу', target: 3000000 }; state.demoFlags = { read: true };
    state.histLimit = HIST_PAGE; state.activeCat = null; state.editingGoal = false;
    resetForm(); closeMenu(); setQuery(''); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Мысал ашылды');
  }
  function exitDemo() {
    state.mode = 'personal'; state.demo = []; state.personal = readStore(); state.goal = readGoal(); state.flags = readFlags();
    state.histLimit = HIST_PAGE; state.activeCat = null; state.editingGoal = false;
    resetForm(); setQuery(''); render();
    window.scrollTo({ top: 0, behavior: 'smooth' });
    toast('Өз бюджетіңізге оралдыңыз');
  }
  $('exitDemoBtn').addEventListener('click', exitDemo);
  $('moreBtn').addEventListener('click', function () { state.histLimit += HIST_PAGE; renderHistory(); });

  /* ---------- search ---------- */
  function setQuery(q) {
    state.query = q;
    if ($('searchTop').value !== q) $('searchTop').value = q;
    if ($('searchHist').value !== q) $('searchHist').value = q;
    state.histLimit = HIST_PAGE;
    renderHistory();
  }
  var searchTimer = null;
  $('searchTop').addEventListener('input', function () { var v = this.value; setQuery(v); clearTimeout(searchTimer); if (v.trim()) searchTimer = setTimeout(function () { goTo('histCard'); }, 600); });
  $('searchTop').addEventListener('keydown', function (e) { if (e.key === 'Enter') { e.preventDefault(); goTo('histCard'); } });
  $('searchHist').addEventListener('input', function () { setQuery(this.value); });
  $('clearSearch').addEventListener('click', function () { setQuery(''); });

  /* ---------- drawers: entry form and menu ---------- */
  var openName = null;
  var deskMq = window.matchMedia('(min-width: 1280px)');
  function setInert(on, except) {
    ['topbar', 'top', 'sidebar'].forEach(function (id) { var el = $(id); if (!el || id === except) return; if (on) el.setAttribute('inert', ''); else el.removeAttribute('inert'); });
  }
  function openEntry() {
    closeMenu();
    $('entry').classList.add('open'); $('scrim').classList.add('open', 'over-entry');
    document.documentElement.classList.add('lock'); setInert(true); openName = 'entry';
    setTimeout(function () { $('amount').focus({ preventScroll: true }); }, 60);
  }
  function closeEntry() {
    if (openName !== 'entry') return;
    $('entry').classList.remove('open'); $('scrim').classList.remove('open', 'over-entry');
    document.documentElement.classList.remove('lock'); setInert(false); openName = null;
  }
  function openMenu() {
    if (deskMq.matches) return;
    $('sidebar').classList.add('open'); $('scrim').classList.add('open');
    document.documentElement.classList.add('lock'); setInert(true, 'sidebar'); openName = 'menu';
    setTimeout(function () { var a = $('sidebar').querySelector('.nav-item'); if (a) a.focus({ preventScroll: true }); }, 60);
  }
  function closeMenu() {
    if (openName !== 'menu') return;
    $('sidebar').classList.remove('open'); $('scrim').classList.remove('open');
    document.documentElement.classList.remove('lock'); setInert(false); openName = null;
  }
  $('menuBtn').addEventListener('click', openMenu);
  $('closeMenuBtn').addEventListener('click', closeMenu);
  $('closeSheetBtn').addEventListener('click', closeEntry);
  $('scrim').addEventListener('click', function () { closeEntry(); closeMenu(); });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape') { closeEntry(); closeMenu(); closeBell(); } });
  var onDesk = function () { if (deskMq.matches) closeMenu(); };
  if (deskMq.addEventListener) deskMq.addEventListener('change', onDesk); else if (deskMq.addListener) deskMq.addListener(onDesk);

  function goTo(id) {
    closeMenu();
    if (id === 'top') { window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
    var el = $(id); if (el) el.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }
  document.addEventListener('click', function (e) {
    var tool = e.target.closest('[data-tool]');
    if (tool) { openTool(tool.dataset.tool); return; }
    var g = e.target.closest('[data-goto]');
    if (g) { e.preventDefault(); goTo(g.dataset.goto); return; }
    var a = e.target.closest('[data-action]');
    if (!a) return;
    var act = a.dataset.action;
    if (act === 'add') openEntry();
    else if (act === 'demo') enterDemo();
    else if (act === 'settings') { closeMenu(); openSettings(); }
    else if (act === 'help') { closeMenu(); openHelp(); }
  });
  $('familyBtn').addEventListener('click', openSettings);

  /* ---------- scroll spy for the sidebar ---------- */
  var spyIds = ['histCard', 'toolsCard', 'safeCard', 'achCard', 'infoCard'];
  function spy() {
    var cur = 'top';
    spyIds.forEach(function (id) { var el = $(id); if (el && el.getBoundingClientRect().top < 160) cur = id; });
    if (window.innerHeight + window.scrollY >= document.documentElement.scrollHeight - 4) {
      var vis = spyIds.filter(function (id) { var r = $(id).getBoundingClientRect(); return r.top < window.innerHeight && r.bottom > 0; });
      if (vis.length) cur = vis[vis.length - 1];
    }
    [].forEach.call(document.querySelectorAll('.nav-item[data-spy]'), function (b) { b.classList.toggle('is-active', b.dataset.spy === cur); });
  }
  var spyRaf = null;
  window.addEventListener('scroll', function () { if (spyRaf) return; spyRaf = requestAnimationFrame(function () { spyRaf = null; spy(); }); }, { passive: true });

  /* ---------- bell ---------- */
  function closeBell() { $('bellPop').hidden = true; $('bellBtn').setAttribute('aria-expanded', 'false'); }
  $('bellBtn').addEventListener('click', function (e) {
    e.stopPropagation();
    var open = $('bellPop').hidden;
    $('bellPop').hidden = !open; $('bellBtn').setAttribute('aria-expanded', String(open));
    if (open) $('bellDot').hidden = true;
  });
  document.addEventListener('click', function (e) { if (!e.target.closest('.bell-wrap')) closeBell(); });

  /* ---------- theme ---------- */
  var root = document.documentElement;
  function effectiveTheme() { return root.getAttribute('data-theme') === 'dark' ? 'dark' : 'light'; }
  function paintTheme() {
    var dark = effectiveTheme() === 'dark';
    $('themeSwitch').setAttribute('aria-checked', String(dark));
    var meta = document.querySelector('meta[name="theme-color"]');
    if (meta) meta.setAttribute('content', dark ? '#0c110e' : '#f2f6f3');
  }
  function setTheme(t) { root.setAttribute('data-theme', t); try { localStorage.setItem(THEME_KEY, t); } catch (e) {} paintTheme(); }
  $('themeSwitch').addEventListener('click', function () { setTheme(effectiveTheme() === 'dark' ? 'light' : 'dark'); });

  /* ---------- toast ---------- */
  var toastTimer = null;
  function toast(msg) {
    var t = $('toast');
    t.innerHTML = icon('check', 18);
    t.appendChild(document.createTextNode(msg));
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(function () { t.classList.remove('show'); }, 2600);
  }

  /* ---------- keep in sync ---------- */
  window.addEventListener('storage', function (e) {
    if (e.key !== KEY && e.key !== GOAL_KEY && e.key !== FLAGS_KEY) return;
    state.personal = readStore(); state.goal = readGoal(); state.flags = readFlags();
    if (!isDemo()) render();
  });
  var lastMonth = monthKey(new Date()), lastDay = new Date().getDate();
  function tick() { var n = new Date(); if (monthKey(n) !== lastMonth || n.getDate() !== lastDay) { lastMonth = monthKey(n); lastDay = n.getDate(); render(); } }
  setInterval(tick, 60000);
  document.addEventListener('visibilitychange', function () { if (!document.hidden) tick(); });

  /* ---------- boot ---------- */
  fillIcons();
  renderTools();
  renderTip();
  renderArticle();
  initChat();
  $('storageWarn').hidden = storageOk;
  paintTheme();
  syncType();
  render();
  spy();
})();
