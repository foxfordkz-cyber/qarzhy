/* Measures the on-device model on a hold-out set it was not trained on.
   Usage: node ai/eval.js            (reads the model from js/ai.js)
   Prints category accuracy, macro-F1, confusion matrix and phrase-parsing accuracy. */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const code = fs.readFileSync(path.join(__dirname, '..', 'js', 'ai.js'), 'utf8');
const ctx = {};
vm.createContext(ctx);
vm.runInContext(code + '\nthis.OtbasyAI = OtbasyAI;', ctx);
const AI = ctx.OtbasyAI;

/* Hold-out descriptions: phrased differently from the training examples. */
const TEST = [
  ['income', 'айлығым түсті'], ['income', 'жалақы картаға келді'], ['income', 'зарплату перевели'], ['income', 'аванс түсті'],
  ['income', 'премия за квартал'], ['income', 'стипендия пришла'], ['income', 'балаларға жәрдемақы'], ['income', 'тапсырыс берушіден ақша'],
  ['income', 'фрилансқа төлем'], ['income', 'кешбэк қайтарылды'], ['income', 'депозиттен сыйақы'], ['income', 'пәтер жалынан табыс'],
  ['income', 'досым қарызын қайтарды'], ['income', 'велосипедті сатып жібердім'], ['income', 'репетиторлықтан табыс'], ['income', 'қосымша жұмыстан ақша'],
  ['income', 'анам ақша аударды'], ['income', 'бонус от работы'], ['income', 'торттар сатылды'], ['income', 'зейнетақы келді'],
  ['food', 'магнумда азық-түлік'], ['food', 'дүкеннен нан мен сүт'], ['food', 'купила продукты'], ['food', 'базардан көкөніс'],
  ['food', 'тауық пен күріш'], ['food', 'жеміс алдым'], ['food', 'кафеде тамақтандық'], ['food', 'пицца заказали'],
  ['food', 'wolt арқылы тамақ'], ['food', 'анвардан апталық азық'], ['food', 'сыр и колбаса'], ['food', 'балаларға тәттілер'],
  ['food', 'шай мен қант'], ['food', 'ресторанда кешкі ас'], ['food', 'фрукты для детей'], ['food', 'етке'],
  ['food', 'жұмыртқа мен май'], ['food', 'кофе с собой'], ['food', 'түскі тамақ'], ['food', 'small дүкенінен'],
  ['transport', 'таксиге'], ['transport', 'яндекспен жұмысқа'], ['transport', 'машинаға бензин'], ['transport', 'жанармай құйдым'],
  ['transport', 'онай картаны толтырдым'], ['transport', 'автобусқа'], ['transport', 'көлікті жудым'], ['transport', 'машину помыл'],
  ['transport', 'көлік жөндеуге'], ['transport', 'масло поменял'], ['transport', 'тұраққа төлем'], ['transport', 'штраф за превышение'],
  ['transport', 'астанаға пойыз'], ['transport', 'авиабилеты в шымкент'], ['transport', 'шина ауыстыру'], ['transport', 'индрайвпен'],
  ['transport', 'аи-92 құйдым'], ['transport', 'көлік сақтандыруы'], ['transport', 'электросамокатқа'], ['transport', 'метроға'],
  ['home', 'пәтер ақысы'], ['home', 'аренда за месяц'], ['home', 'коммуналка за октябрь'], ['home', 'жарыққа төлем'],
  ['home', 'газға төледік'], ['home', 'суға төлем'], ['home', 'интернетке'], ['home', 'телефонға баланс'],
  ['home', 'kcell толтыру'], ['home', 'ипотека айлық төлемі'], ['home', 'жаңа диван'], ['home', 'шкаф купили'],
  ['home', 'кір жуғышқа ұнтақ'], ['home', 'сантехник шақырдық'], ['home', 'пәтер жөндеуге'], ['home', 'лампочкалар'],
  ['home', 'отопление за месяц'], ['home', 'тоңазытқыш жөндеу'], ['home', 'ыдыс-аяқ'], ['home', 'тазалау құралдары'],
  ['other', 'дәріханадан дәрі'], ['other', 'лекарства от простуды'], ['other', 'тіс емдеу'], ['other', 'балабақшаға төлем'],
  ['other', 'мектепке кітаптар'], ['other', 'ағылшын курсы'], ['other', 'балаға куртка'], ['other', 'кроссовкалар'],
  ['other', 'фитнеске абонемент'], ['other', 'кинотеатрға'], ['other', 'досыма сыйлық'], ['other', 'тойға көрімдік'],
  ['other', 'шаштаразға'], ['other', 'косметика'], ['other', 'балаға ойыншық'], ['other', 'дәрігердің қабылдауы'],
  ['other', 'наушники купил'], ['other', 'netflix жазылым'], ['other', 'бассейнге'], ['other', 'ветеринарға мысық']
];

/* Second hold-out set, written after the training data was frozen and never used for tuning.
   This is the number to report. */
const FRESH = [
  ['income', 'айлықтың екінші бөлігі'], ['income', 'жұмыстан бонус берді'], ['income', 'ата-анам көмек жіберді'], ['income', 'перевели аванс'],
  ['income', 'сабақ бергені үшін ақша'], ['income', 'ескі диванды саттық'], ['income', 'үй жалдаушы ақша аударды'], ['income', 'кэшбэк за месяц'],
  ['income', 'стипендиям түсті'], ['income', 'табыс фрилансерлік'],
  ['food', 'дүкенге кешке'], ['food', 'көкөніс пен жеміс базардан'], ['food', 'сүт өнімдері'], ['food', 'макарон және күріш'], ['food', 'балалар үшін йогурт'],
  ['food', 'кафеде кофе ішу'], ['food', 'тамақ жеткізу'], ['food', 'продукты в магнуме'], ['food', 'нан алдым'], ['food', 'ет сатып алу'],
  ['transport', 'жұмысқа такси'], ['transport', 'бензин 95'], ['transport', 'автобус жол ақысы'], ['transport', 'көлікке техбайқау'], ['transport', 'машинаның майын ауыстыру'],
  ['transport', 'вокзалдан пойызға билет'], ['transport', 'әуежайға такси'], ['transport', 'яндекс доставка поездка'], ['transport', 'шиналарды ауыстыру'], ['transport', 'онайға ақша салу'],
  ['home', 'үй интернетінің ақысы'], ['home', 'электр жарығы'], ['home', 'суық су есептегіш'], ['home', 'пәтер иесіне ақы'], ['home', 'мобильдік байланыс'],
  ['home', 'жаңа үстел'], ['home', 'тұрмыстық техника'], ['home', 'ванна жөндеу'], ['home', 'ипотекаға төлем'], ['home', 'коммуналдық қызмет'],
  ['other', 'балаға дәрі'], ['other', 'мектеп формасы'], ['other', 'спорт секциясы'], ['other', 'әжеге сыйлық'], ['other', 'кино билеттері'],
  ['other', 'тіс тазалау дәрігерде'], ['other', 'шаш қидыру'], ['other', 'той көрімдігі'], ['other', 'оқулық сатып алу'], ['other', 'балабақша айлық ақысы']
];

/* Full phrases, as a person would type or say them. */
const NAMES = ['Айгүл', 'Арман', 'Мәдина', 'Ерлан'];
const PHRASES = [
  ['Айгүл Магнумнан 12 500 теңгеге азық-түлік алды', { type: 'expense', amount: 12500, member: 'Айгүл', category: 'food' }],
  ['Арман таксиге 2400 төледі', { type: 'expense', amount: 2400, member: 'Арман', category: 'transport' }],
  ['Ерланның жалақысы 450 мың түсті', { type: 'income', amount: 450000, member: 'Ерлан', category: null }],
  ['Мәдина дәріханаға 5600', { type: 'expense', amount: 5600, member: 'Мәдина', category: 'other' }],
  ['Пәтерақы 180000 Ерлан төледі', { type: 'expense', amount: 180000, member: 'Ерлан', category: 'home' }],
  ['Арман бензин 18 000', { type: 'expense', amount: 18000, member: 'Арман', category: 'transport' }],
  ['Айгүлге стипендия 42к келді', { type: 'income', amount: 42000, member: 'Айгүл', category: null }],
  ['Мәдина базардан ет алды 24 000 тг', { type: 'expense', amount: 24000, member: 'Мәдина', category: 'food' }],
  ['Интернет 9 990 Арман', { type: 'expense', amount: 9990, member: 'Арман', category: 'home' }],
  ['Ерлан аи-92 құйды 15000', { type: 'expense', amount: 15000, member: 'Ерлан', category: 'transport' }],
  ['Айгүл балабақшаға 35 000 төледі', { type: 'expense', amount: 35000, member: 'Айгүл', category: 'other' }],
  ['Мәдинаның торт тапсырысы үшін 45000 түсті', { type: 'income', amount: 45000, member: 'Мәдина', category: null }],
  ['Арман купил продукты на 8 700', { type: 'expense', amount: 8700, member: 'Арман', category: 'food' }],
  ['Ерлан коммуналка 27800', { type: 'expense', amount: 27800, member: 'Ерлан', category: 'home' }],
  ['Айгүл спортзалға 15 мың', { type: 'expense', amount: 15000, member: 'Айгүл', category: 'other' }],
  ['Мәдина онай картаға 4000 салды', { type: 'expense', amount: 4000, member: 'Мәдина', category: 'transport' }],
  ['Арманға бонус 1,2 млн', { type: 'income', amount: 1200000, member: 'Арман', category: null }],
  ['Ерлан кафеде 6500', { type: 'expense', amount: 6500, member: 'Ерлан', category: 'food' }],
  ['Айгүл жаңа диван 210 000', { type: 'expense', amount: 210000, member: 'Айгүл', category: 'home' }],
  ['Мәдина балаға куртка 19 900', { type: 'expense', amount: 19900, member: 'Мәдина', category: 'other' }],
  ['Арман көлік жуу 3500', { type: 'expense', amount: 3500, member: 'Арман', category: 'transport' }],
  ['Ерлан айлық 380 000', { type: 'income', amount: 380000, member: 'Ерлан', category: null }],
  ['Айгүл нан сүт 1800', { type: 'expense', amount: 1800, member: 'Айгүл', category: 'food' }],
  ['Мәдина ұялы байланыс 3000', { type: 'expense', amount: 3000, member: 'Мәдина', category: 'home' }],
  ['Арман досына сыйлық 10 000', { type: 'expense', amount: 10000, member: 'Арман', category: 'other' }],
  /* a new name, not used before */
  ['Дәулет таксиге 1500', { type: 'expense', amount: 1500, member: 'Дәулет', category: 'transport' }],
  ['Жанар жалақы 300000', { type: 'income', amount: 300000, member: 'Жанар', category: null }],
  ['Сәуле дүкеннен 7 400', { type: 'expense', amount: 7400, member: 'Сәуле', category: 'food' }]
];

function pct(x) { return (x * 100).toFixed(1) + '%'; }

/* 1. Five-class classification (type + category) on descriptions */
const labels = AI.LABELS;
const conf = {}; labels.forEach(a => { conf[a] = {}; labels.forEach(b => conf[a][b] = 0); });
let ok = 0;
const misses = [];
TEST.forEach(([gold, text]) => {
  const p = AI.predict(text).label;
  conf[gold][p]++;
  if (p === gold) ok++; else misses.push(`${text}  →  ${p} (керек: ${gold})`);
});
const f1s = labels.map(l => {
  const tp = conf[l][l];
  const fp = labels.reduce((s, g) => s + (g !== l ? conf[g][l] : 0), 0);
  const fn = labels.reduce((s, p) => s + (p !== l ? conf[l][p] : 0), 0);
  const prec = tp + fp ? tp / (tp + fp) : 0, rec = tp + fn ? tp / (tp + fn) : 0;
  return { l, prec, rec, f1: prec + rec ? 2 * prec * rec / (prec + rec) : 0 };
});
console.log(`Training examples: ${AI.trainSize}, hold-out examples: ${TEST.length}`);
console.log(`\n1) Classification (5 classes) accuracy: ${pct(ok / TEST.length)}  (${ok}/${TEST.length})`);
console.log(`   Macro-F1: ${pct(f1s.reduce((s, x) => s + x.f1, 0) / f1s.length)}`);
f1s.forEach(x => console.log(`   ${x.l.padEnd(10)} precision ${pct(x.prec)}  recall ${pct(x.rec)}  F1 ${pct(x.f1)}`));
console.log('   Confusion (rows = true, cols = predicted): ' + labels.join(' / '));
labels.forEach(l => console.log('   ' + l.padEnd(10) + labels.map(p => String(conf[l][p]).padStart(4)).join('')));
if (misses.length) { console.log('   Errors:'); misses.forEach(x => console.log('     - ' + x)); }

let ok2 = 0; const miss2 = [];
FRESH.forEach(([gold, text]) => { const p = AI.predict(text).label; if (p === gold) ok2++; else miss2.push(`${text}  →  ${p} (керек: ${gold})`); });
console.log(`\n1b) FRESH hold-out (never used for tuning): accuracy ${pct(ok2 / FRESH.length)}  (${ok2}/${FRESH.length})`);
if (miss2.length) { console.log('   Errors:'); miss2.forEach(x => console.log('     - ' + x)); }
/* The page auto-fills only when the model is confident; otherwise the person chooses. */
[0.5, 0.6, 0.7, 0.8].forEach(th => {
  const all = TEST.concat(FRESH); let cov = 0, right = 0;
  all.forEach(([gold, text]) => { const p = AI.predict(text); if (p.prob >= th) { cov++; if (p.label === gold) right++; } });
  console.log(`   threshold ${th}: auto-filled ${pct(cov / all.length)} of cases, accuracy among them ${pct(right / cov)}`);
});

/* 2. Phrase parsing */
const field = { type: 0, amount: 0, member: 0, category: 0 }; let all = 0;
const pmiss = [];
PHRASES.forEach(([text, gold]) => {
  const r = AI.parsePhrase(text, NAMES);
  let full = true;
  Object.keys(field).forEach(k => {
    const okk = (r[k] || null) === (gold[k] || null);
    if (okk) field[k]++; else { full = false; }
  });
  if (full) all++; else pmiss.push(`${text}  →  ${JSON.stringify({ type: r.type, amount: r.amount, member: r.member, category: r.category })}`);
});
console.log(`\n2) Phrase parsing, ${PHRASES.length} phrases:`);
Object.keys(field).forEach(k => console.log(`   ${k.padEnd(9)} ${pct(field[k] / PHRASES.length)}`));
console.log(`   all four fields correct: ${pct(all / PHRASES.length)}  (${all}/${PHRASES.length})`);
if (pmiss.length) { console.log('   Errors:'); pmiss.forEach(x => console.log('     - ' + x)); }

module.exports = { accuracy: ok / TEST.length };
