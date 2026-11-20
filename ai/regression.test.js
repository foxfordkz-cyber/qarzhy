'use strict';
const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');

const context = vm.createContext({});
for (const file of ['ai.js', 'budget-query.js']) {
  vm.runInContext(fs.readFileSync(path.join(__dirname, '../js', file), 'utf8'), context);
}
const { OtbasyAI: ai, BudgetQuery: queries } = context;

test('spoken Kazakh and Russian amounts use the same parser as typed entries', () => {
  const cases = [
    ['Айгүл он екі мың бес жүз теңгеге азық-түлік алды', 12500],
    ['Мәдина заплатила двенадцать тысяч пятьсот тенге за продукты', 12500],
    ['Такси екі мың үш жүз елу теңге', 2350],
    ['Семьсот тридцать пять тенге за проезд', 735],
    ['Миллион екі жүз мың теңге жалақы', 1200000],
    ['Сүт сексен бес теңге', 85],
    ['Такси 12 мың бес жүз теңге', 12500],
    ['Такси бір жарым мың теңге', 1500],
    ['Полторы тысячи тенге на такси', 1500],
    ['Чек двенадцать тысяч 500 тенге', 12500],
    ['Мәдина 1 млн 200 мың 350 теңге алды', 1200350],
    ['Екі нан', null]
  ];
  for (const [text, expected] of cases) assert.equal(ai.parsePhrase(text, []).amount, expected, text);
});

test('dates, quantities and ambiguous prices are never used as a confirmed amount', () => {
  const cases = [
    ['20.11.2026 09:45 такси', null],
    ['2 кг алма 1 750 ₸', 1750],
    ['Чек на 12,500 ₸', 12500],
    ['Аренда 1.250.000 тенге', 1250000],
    ['Бензин АИ-95 на 3 400 ₸', 3400],
    ['Екі кг ұн және бес жүз теңге', 500],
    ['Такси 1 800 ₸ и кафе 2 600 ₸', null],
    ['Такси екі мың теңге и кафе три тысячи тенге', null]
  ];
  for (const [text, expected] of cases) assert.equal(ai.parsePhrase(text, []).amount, expected, text);
});

test('a missing member or transaction type stays unfilled', () => {
  assert.equal(ai.parsePhrase('Такси 1800', []).member, null);
  assert.equal(ai.parsePhrase('Мәдина таксиге 1800 төледі', []).member, 'Мәдина');
  assert.equal(ai.parsePhrase('1250', []).type, null);
  assert.equal(ai.parsePhrase('1250', []).category, null);
});

const members = ['Айгүл', 'Мәдина', 'Ана Мария'];
const selected = 24318, current = selected + 2;
test('ledger questions combine member, category, entry type and month', () => {
  const kk = queries.parse('Айгүл азық-түлікке қанша жұмсады?', members, selected, current);
  assert.equal(kk.scope.member, 'Айгүл');
  assert.equal(kk.scope.category, 'food');
  assert.equal(kk.scope.type, 'expense');
  assert.equal(kk.scope.month, selected);
  const ru = queries.parse('Сколько у Мадины расходов в прошлом месяце?', ['Мадина'], selected, current);
  assert.equal(ru.scope.member, 'Мадина');
  assert.equal(ru.scope.month, current - 1);
  assert.equal(ru.ru, true);
  const full = queries.parse('Ана Мария қанша кіріс алды?', members, selected, current);
  assert.equal(full.scope.member, 'Ана Мария');
  assert.equal(full.scope.type, 'income');
  assert.equal(queries.parse('Осы айда қанша қалды?', members, selected, current).scope.month, current);
  assert.equal(queries.parse('Сколько потратили на «Market 24»?', members, selected, current).scope.note, 'Market 24');
  assert.equal(queries.parse('Кім ең көп жұмсады?', members, selected, current).rank, 'member');
  assert.equal(queries.parse('На что больше всего потратили?', members, selected, current).rank, 'category');
});

test('unsupported scopes request clarification instead of returning family totals', () => {
  for (const question of ['Сколько руслан потратил?', 'Айгүл мен Мәдина қанша жұмсады?', 'Сколько потратили на книги?']) {
    assert.equal(queries.parse(question, members, selected, current).prompt, 'scope', question);
  }
  assert.equal(queries.parse('Кеше таксиге қанша жұмсадық?', members, selected, current).prompt, 'period');
  assert.equal(queries.parse('Жинағымды қалай көбейтемін?', members, selected, current), null);
});
