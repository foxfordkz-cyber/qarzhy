'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const path = require('node:path');
const context = vm.createContext({});
vm.runInContext(fs.readFileSync(path.join(__dirname, 'study.js'), 'utf8'), context);
const study = context.QarzhyPilotStudy;

test('both order groups receive three matched but different tasks per mode', () => {
  for (const order of ['manual-first', 'ai-first']) {
    for (const draw of [0, 0.35, 0.51, 0.99]) {
      const plan = study.makePlan(order, () => draw);
      assert.equal(new Set(plan.map(t => t.taskId)).size, 6);
      assert.equal(plan[0].mode, order === 'ai-first' ? 'ai' : 'manual');
      for (const domain of ['transport', 'food', 'income']) {
        const pair = plan.filter(t => t.taskId.startsWith(domain));
        assert.equal(pair.length, 2);
        assert.deepEqual(new Set(pair.map(t => t.mode)), new Set(['manual', 'ai']));
      }
    }
  }
});

test('only time spent while the task is running is counted', () => {
  let now = 50;
  const clock = study.createClock(() => now, 100);
  clock.start(); now += 200; clock.start(); now += 20;
  clock.pause(); now += 9999; clock.pause();
  assert.equal(clock.read(), 320);
  clock.start(); now += 40;
  assert.equal(clock.read(), 360);
});

test('corrections refer to the required four fields of the initial proposal', () => {
  const expected = study.TASKS['food-a'].gold;
  const value = { type: 'income', member: '  айгүл ', category: null, amount: 99 };
  assert.deepEqual(Array.from(study.differingFields(value, expected)), ['type', 'amount', 'category']);
  assert.equal(study.differingFields(study.TASKS['income-a'].gold, study.TASKS['income-a'].gold).length, 0);
});

test('the report calculates each median within its own mode', () => {
  const trials = [
    { mode: 'manual', activeMs: 200, wrongAttempts: 0, correctedFields: 0 },
    { mode: 'manual', activeMs: 1200, wrongAttempts: 1, correctedFields: 0 },
    { mode: 'manual', activeMs: 600, wrongAttempts: 0, correctedFields: 0 },
    { mode: 'ai', activeMs: 580, wrongAttempts: 0, correctedFields: 2 }
  ];
  assert.equal(study.summarize(trials, 'manual').medianMs, 600);
  assert.equal(study.summarize(trials, 'manual').wrongAttempts, 1);
  assert.equal(study.summarize(trials, 'ai').correctedFields, 2);
});
