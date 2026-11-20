/* Matched, fictional tasks. Each participant sees one of each pair in each mode. */
var QarzhyPilotStudy = (function () {
  'use strict';
  var TASKS = {
    'food-a': {
      ru: 'Айгүл купила продукты за 4 800 ₸.',
      kk: 'Айгүл азық-түлікке 4 800 теңге жұмсады.',
      gold: { type: 'expense', amount: 4800, member: 'Айгүл', category: 'food' }
    },
    'food-b': {
      ru: 'Мәдина купила продукты за 5 600 ₸.',
      kk: 'Мәдина азық-түлікке 5 600 теңге жұмсады.',
      gold: { type: 'expense', amount: 5600, member: 'Мәдина', category: 'food' }
    },
    'transport-a': {
      ru: 'Ерлан заплатил за такси 2 300 ₸.',
      kk: 'Ерлан таксиге 2 300 теңге төледі.',
      gold: { type: 'expense', amount: 2300, member: 'Ерлан', category: 'transport' }
    },
    'transport-b': {
      ru: 'Арман заплатил за такси 2 700 ₸.',
      kk: 'Арман таксиге 2 700 теңге төледі.',
      gold: { type: 'expense', amount: 2700, member: 'Арман', category: 'transport' }
    },
    'income-a': {
      ru: 'Мәдина получила зарплату 210 000 ₸.',
      kk: 'Мәдинаға 210 000 теңге жалақы түсті.',
      gold: { type: 'income', amount: 210000, member: 'Мәдина', category: null }
    },
    'income-b': {
      ru: 'Айгүл получила зарплату 240 000 ₸.',
      kk: 'Айгүлге 240 000 теңге жалақы түсті.',
      gold: { type: 'income', amount: 240000, member: 'Айгүл', category: null }
    }
  };
  var FIELDS = ['type', 'amount', 'member', 'category'];
  var MEMBERS = ['Айгүл', 'Мәдина', 'Ерлан', 'Арман'];
  function shuffle(items, random) {
    var list = items.slice();
    for (var i = list.length - 1; i > 0; i--) {
      var j = Math.floor(random() * (i + 1)), tmp = list[i];
      list[i] = list[j]; list[j] = tmp;
    }
    return list;
  }
  function makePlan(order, random) {
    var firstMode = order === 'ai-first' ? 'ai' : 'manual';
    var secondMode = firstMode === 'ai' ? 'manual' : 'ai';
    var groups = shuffle(['food', 'transport', 'income'], random);
    var first = [], second = [];
    groups.forEach(function (group) {
      var aFirst = random() < 0.5;
      first.push({ taskId: group + (aFirst ? '-a' : '-b'), mode: firstMode });
      second.push({ taskId: group + (aFirst ? '-b' : '-a'), mode: secondMode });
    });
    return first.concat(second);
  }
  function differingFields(value, gold) {
    function name(s) { return String(s || '').trim().toLocaleLowerCase('kk'); }
    return FIELDS.filter(function (field) {
      if (field === 'member') return name(value.member) !== name(gold.member);
      if (field === 'category' && value.type === 'income') return gold.category !== null;
      return value[field] !== gold[field];
    });
  }
  function median(values) {
    if (!values.length) return null;
    var sorted = values.slice().sort(function (a, b) { return a - b; });
    var mid = Math.floor(sorted.length / 2);
    return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2;
  }
  function summarize(trials, mode) {
    var subset = trials.filter(function (trial) { return trial.mode === mode; });
    return {
      medianMs: median(subset.map(function (trial) { return trial.activeMs; })),
      wrongAttempts: subset.reduce(function (sum, trial) { return sum + trial.wrongAttempts; }, 0),
      correctedFields: subset.reduce(function (sum, trial) { return sum + trial.correctedFields; }, 0)
    };
  }
  function createClock(now, previousMs) {
    var elapsed = previousMs || 0, since = null;
    return {
      start: function () { if (since === null) since = now(); },
      pause: function () { if (since !== null) { elapsed += Math.max(0, now() - since); since = null; } },
      read: function () { return Math.round(elapsed + (since === null ? 0 : Math.max(0, now() - since))); }
    };
  }
  return { TASKS: TASKS, MEMBERS: MEMBERS, makePlan: makePlan, differingFields: differingFields, median: median, summarize: summarize, createClock: createClock };
})();
