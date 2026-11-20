'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');

const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, '../js/ai.js'), 'utf8'), context);
const ai = context.OtbasyAI;
const family = ['Айгүл', 'Ерлан', 'Мәдина'];
const january = new Date(2027, 0, 1, 0, 3);
const parse = text => ai.parseEntries(text, family, january);
const fields = (result, key) => Array.from(result.entries, row => row[key]);

test('two independently editable expenses, with a shared date across New Year', () => {
  const examples = [
    'Вчера Айгүл купила продукты за 12 500 ₸, а Ерлан заплатил 1 800 ₸ за такси',
    'Кеше Айгүл азық-түлікке 12 500 теңге, ал Ерлан таксиге 1 800 теңге жұмсады',
    'Вчера Айгүл купила продукты за двенадцать тысяч пятьсот тенге Ерлан заплатил тысячу восемьсот тенге за такси'
  ];
  for (const phrase of examples) {
    const result = parse(phrase);
    assert.equal(result.issue, null, phrase);
    assert.deepEqual(fields(result, 'amount'), [12500, 1800]);
    assert.deepEqual(fields(result, 'type'), ['expense', 'expense']);
    assert.deepEqual(fields(result, 'member'), ['Айгүл', 'Ерлан']);
    assert.deepEqual(fields(result, 'category'), ['food', 'transport']);
    assert.deepEqual(fields(result, 'date'), ['2026-12-31', '2026-12-31']);
    assert.deepEqual(fields(result, 'dateExplicit'), [true, true]);
    for (const entry of result.entries) assert.ok(phrase.includes(entry.text));
    assert.equal(ai.parsePhrase(phrase, family).amount, null);
  }
});

test('uses the explicit next day, or propagates the preceding date', () => {
  const result = parse('Кеше Ерлан таксиге 900 ₸ төледі, ал бүгін Айгүл азық-түлікке 2100 ₸ жұмсады');
  assert.deepEqual(fields(result, 'date'), ['2026-12-31', '2027-01-01']);
  const leap = ai.parseEntries('Вчера кофе за 600 тенге', [], new Date(2024, 2, 1, 0, 15));
  assert.equal(leap.entries[0].date, '2024-02-29');
  assert.equal(parse('01.12.2026 кофе за 600 тенге').entries[0].date, '2026-12-01');
  assert.equal(parse('31.02.2026 кофе за 600 тенге').issue, 'ambiguous');
  assert.deepEqual(fields(parse('Кофе 650 ₸ и вчера такси 500 ₸'), 'dateExplicit'), [false, true]);
});

test('different types, numbered lists and decimal quantities or scales', () => {
  const mixed = parse('1) Мәдинаға жалақы 300 мың теңге түсті;\n2) Ерлан таксиге 1,8 мың теңге төледі');
  assert.equal(mixed.issue, null);
  assert.deepEqual(fields(mixed, 'type'), ['income', 'expense']);
  assert.deepEqual(fields(mixed, 'amount'), [300000, 1800]);
  assert.deepEqual(fields(mixed, 'category'), [null, 'transport']);
  for (const phrase of ['Айгүл купила 2 кг яблок за 1 200 ₸', 'Айгүл купила яблоки и груши за 1200 тенге',
    'Мәдина взяла 2,5 кг груш за 1200 тенге', 'Ерлан купил 4 яблока за 1 200 ₸', 'Ерлан базардан 2 кг алмаға 1 200 теңге төледі']) {
    const result = parse(phrase);
    assert.equal(result.issue, null, phrase);
    assert.deepEqual(fields(result, 'amount'), [1200], phrase);
    assert.deepEqual(fields(result, 'category'), ['food'], phrase);
  }
});

test('a coordinated purchase carries its subject; an independent or joint clause asks who paid', () => {
  const coordinated = parse('Ерлан заплатил 800 ₸ за кофе и купил билет на автобус за 150 ₸');
  assert.deepEqual(fields(coordinated, 'member'), ['Ерлан', 'Ерлан']);
  const independent = parse('Ерлан заплатил 800 ₸ за кофе; такси 1 500 ₸');
  assert.deepEqual(fields(independent, 'member'), ['Ерлан', null]);
  const shared = parse('Айгүл и Ерлан купили продукты за 4 500 ₸ и кофе за 700 ₸');
  assert.deepEqual(fields(shared, 'member'), [null, null]);
  const unknownCouple = ai.parseEntries('Алия и Руслан купили продукты за 4 500 ₸ и кофе за 700 ₸', [], january);
  assert.deepEqual(fields(unknownCouple, 'member'), [null, null]);
});

test('potentially overlapping amounts must be clarified before confirmation', () => {
  const cases = [
    ['Айгүл дала 20 000, получила 1 500 ₸ сдачи', 'change'],
    ['Ерлан 10 мың теңге берді, 400 ₸ қайтарым алды', 'change'],
    ['Куртка 24 000 ₸, скидка 3 000 ₸', 'ambiguous'],
    ['Кофе 700 ₸ и обед 2 000 ₸, итого 2 700 ₸', 'ambiguous'],
    ['За куртку 20 000, вернули 3 000 ₸', 'ambiguous'],
    ['2 кг яблок по 600 ₸ за кг', 'ambiguous'],
    ['Молоко 650 ₸, хлеб 420, барлығы 1070', 'ambiguous'],
    ['Кассир сказал «4000 ₸», Айгүл дала 5000 ₸', 'ambiguous'],
    ['650 ₸ или 800', 'ambiguous'],
    ['Кофе 950,50 ₸ и такси 1 700 ₸', 'ambiguous'],
    ['Такси 1 800 и Ерлан купил продукты', 'ambiguous'],
    ['Кофе 700 ₸; такси', 'ambiguous'],
    ['Такси 1800, а Айгүл купила продукты', 'ambiguous']
  ];
  for (const [phrase, issue] of cases) {
    const result = parse(phrase);
    assert.equal(result.issue, issue, phrase);
    assert.deepEqual(fields(result, 'amount'), [null], phrase);
    assert.equal(result.entries[0].text, phrase);
  }
  const refund = parse('Мәдина получила возврат за платье 8 000 ₸');
  assert.deepEqual(fields(refund, 'amount'), [8000]);
  assert.deepEqual(fields(refund, 'type'), ['income']);
});

test('an empty input or excess entries cannot silently save a partial batch', () => {
  assert.equal(parse('  ').entries.length, 0);
  const eight = Array(8).fill('Кофе 700 ₸').join('; ');
  assert.equal(parse(eight).entries.length, 8);
  const nine = eight + '; такси 1 200 ₸';
  const result = parse(nine);
  assert.equal(result.issue, 'limit');
  assert.equal(result.entries.length, 1);
  assert.equal(result.entries[0].text, nine);
  assert.equal(result.entries[0].amount, null);
});
