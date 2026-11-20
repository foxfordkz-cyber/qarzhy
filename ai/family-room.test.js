'use strict';
const test = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const path = require('node:path');
const vm = require('node:vm');
const { webcrypto } = require('node:crypto');
const source = fs.readFileSync(path.join(__dirname, '../js/family-room.js'), 'utf8');
const copy = value => JSON.parse(JSON.stringify(value));
const plain = api => copy(api.view());
const record = (id, amount) => ({ id, amount, member: 'Жанар', note: 'Тіс дәрігері' });
const change = (key, value) => [{ key, value }];

// Each relay value is an opaque ciphertext. Tests exercise the real Web Crypto implementation.
function relay() {
  const rooms = new Map(), requests = [];
  const server = { rooms, requests, offline: false, lostAck: false, lostCreateAck: false, putBarrier: null, conflicts: 0 };
  function answer(status, body) { return { status, ok: status >= 200 && status < 300, json: async () => copy(body) }; }
  server.fetch = async (url, options) => {
    if (server.offline) throw new TypeError('offline');
    const u = new URL(url), id = u.pathname.split('/').at(-1), auth = options.headers.Authorization;
    const method = options.method, body = options.body && JSON.parse(options.body);
    requests.push({ url, method, body, auth });
    let value = rooms.get(id);
    if (method === 'POST') {
      if (value) return answer(value.auth === auth ? 200 : 409, { rev: value.rev });
      rooms.set(id, { rev: 1, auth, box: body.box });
      if (server.lostCreateAck) { server.lostCreateAck = false; throw new TypeError('response interrupted after create'); }
      return answer(201, { rev: 1 });
    }
    if (!value || value.auth !== auth) return answer(404);
    if (method === 'GET') {
      if (value.rev === Number(u.searchParams.get('since'))) return answer(304);
      return answer(200, { rev: value.rev, box: value.box });
    }
    assert.equal(method, 'PUT');
    if (server.putBarrier) await server.putBarrier();
    value = rooms.get(id);
    if (body.rev !== value.rev) { server.conflicts++; return answer(409); }
    value.rev++; value.box = body.box;
    if (server.lostAck) { server.lostAck = false; throw new TypeError('connection interrupted after commit'); }
    return answer(200, { rev: value.rev });
  };
  return server;
}
function disk() { return { items: new Map(), tabs: new Set(), quota: false }; }
function tab(server, shared = disk()) {
  const win = new EventTarget(), doc = new EventTarget(), storage = {};
  doc.hidden = true; // End-to-end tests drive the foreground polling hook explicitly.
  function notify(key) {
    for (const other of shared.tabs) {
      if (other === win) continue;
      const event = new Event('storage'); event.key = key;
      queueMicrotask(() => other.dispatchEvent(event));
    }
  }
  const methods = {
    getItem(key) { return shared.items.get(key) ?? null; },
    setItem(key, value) {
      if (shared.quota) throw new Error('quota');
      shared.items.set(key, String(value)); notify(key);
    },
    removeItem(key) { if (shared.items.delete(key)) notify(key); }
  };
  const localStorage = new Proxy(storage, {
    get: (_, key) => Object.hasOwn(methods, key) ? methods[key] : shared.items.get(key),
    ownKeys: () => Array.from(shared.items.keys()),
    getOwnPropertyDescriptor: (_, k) => shared.items.has(k) ? { enumerable: true, configurable: true } : undefined
  });
  Object.assign(win, { localStorage, crypto: webcrypto, fetch: server.fetch, document: doc, setTimeout, clearTimeout,
    atob, btoa, location: { href: 'https://collection.example/qarzhy/' },
    QarzhyService: { apiBase: 'https://service.example' } });
  shared.tabs.add(win);
  vm.runInNewContext(source, { window: win, TextEncoder, TextDecoder, URL, AbortController });
  return { api: win.FamilyRoom, disk: shared, win };
}
const code = (value) => err => err && err.code === value;

test('two devices share confirmed records, while only an authenticated ciphertext reaches the relay', async () => {
  const server = relay(), a = tab(server).api, b = tab(server).api;
  await a.create();
  const invite = a.invite(), id = a.status().roomId;
  assert.match(invite, /^#family=[A-Za-z0-9_-]{43}$/);
  assert.match(id, /^[A-Za-z0-9_-]{43}$/);
  await b.join('https://collection.example/qarzhy/' + invite);
  a.apply(change('record:one', record('one', 13600)));
  assert.equal(a.status().pending, true);
  assert.equal(a.view()['record:one'].amount, 13600);
  await a.sync(); await b.sync();
  assert.deepEqual(plain(b), { 'record:one': record('one', 13600) });
  assert.equal(a.status().pending, false);
  assert.equal(b.status().phase, 'online');
  const copyOfView = b.view();
  copyOfView['record:one'].amount = 1;
  assert.equal(b.view()['record:one'].amount, 13600);
  const wire = JSON.stringify(server.requests), bearer = server.rooms.get(id).auth.slice(7);
  assert.match(bearer, /^[A-Za-z0-9_-]{43}$/);
  assert.equal(new Set([id, bearer, invite.slice(8)]).size, 3);
  for (const secret of [invite.slice(8), 'Жанар', 'Тіс дәрігері', 'record:one']) assert.ok(!wire.includes(secret));
  for (const request of server.requests) {
    assert.equal(new URL(request.url).origin, 'https://service.example');
    assert.ok(!request.url.includes(bearer));
    if (request.body) {
      assert.match(request.body.box.iv, /^[A-Za-z0-9_-]{16}$/);
      assert.match(request.body.box.ciphertext, /^[A-Za-z0-9_-]{22,}$/);
    }
  }
  await b.sync();
  assert.match(server.requests.at(-1).url, /\?since=2$/);
});

test('offline edits survive reload, block leaving until confirmed, and drain on reconnect', async () => {
  const server = relay(), first = tab(server);
  await first.api.create();
  const invite = first.api.invite();
  server.offline = true;
  first.api.apply(change('goal', { amount: 25000 }));
  await first.api.sync();
  assert.equal(first.api.status().phase, 'offline');
  assert.throws(() => first.api.leave(), code('pending'));
  const second = tab(server, first.disk).api;
  await second.resume();
  assert.deepEqual(plain(second), { goal: { amount: 25000 } });
  assert.equal(second.status().pending, true);
  server.offline = false; await second.sync();
  assert.equal(second.status().pending, false);
  second.leave(); assert.deepEqual(plain(second), {});
  assert.equal(first.disk.items.size, 0);
  const guest = tab(server).api; await guest.join(invite);
  assert.deepEqual(plain(guest), { goal: { amount: 25000 } });
});

test('simultaneous PUT requests use revision retries and converge without losing either write', async () => {
  const server = relay(), a = tab(server).api, b = tab(server).api;
  await a.create(); await b.join(a.invite());
  a.apply(change('record:a', record('a', 1200)));
  b.apply(change('record:b', record('b', 4500)));
  let first, release; const gate = new Promise(r => { release = r; });
  server.putBarrier = async () => { if (!first) { first = true; await gate; } else { server.putBarrier = null; release(); } };
  await Promise.all([a.sync(), b.sync()]);
  await a.sync(); await b.sync();
  assert.ok(server.conflicts >= 1);
  const expected = { 'record:a': record('a', 1200), 'record:b': record('b', 4500) };
  assert.deepEqual(plain(a), expected); assert.deepEqual(plain(b), expected);
});

test('a stale peer cannot resurrect a removed transaction and can deliberately restore a setting', async () => {
  const server = relay(), a = tab(server).api, b = tab(server).api;
  await a.create();
  a.apply([{ key: 'record:a', value: record('a', 500) }, { key: 'goal', value: 'trip' }]);
  await a.sync(); await b.join(a.invite());
  a.apply([{ key: 'record:a', value: null }, { key: 'goal', value: null }]);
  await a.sync();
  b.apply(change('record:a', record('a', 600)));
  b.apply(change('record:a', record('a', 650)));
  b.apply(change('goal', 'stale trip'));
  b.apply(change('limit:food', 10000));
  await b.sync(); await a.sync();
  assert.deepEqual(plain(b), { 'limit:food': 10000 });
  assert.equal(b.status().conflicts, 2);
  assert.deepEqual(plain(a), plain(b));
  assert.throws(() => b.apply(change('record:a', record('a', 800))), code('deleted'));
  b.apply(change('goal', 'education')); await b.sync(); await a.sync();
  assert.equal(a.view().goal, 'education');
});

test('independent browser tabs persist separate batches and preserve them across a lost acknowledgement', async () => {
  const server = relay(), first = tab(server), second = tab(server, first.disk);
  await first.api.create(); await second.api.resume();
  first.api.apply(change('record:a', record('a', 50)));
  second.api.apply(change('record:b', record('b', 150)));
  server.lostAck = true;
  await first.api.sync();
  assert.equal(first.api.status().phase, 'offline');
  assert.equal(server.rooms.get(first.api.status().roomId).rev, 2);
  await second.api.sync(); await first.api.sync();
  assert.equal(first.api.status().pending, false);
  assert.equal(server.rooms.get(first.api.status().roomId).rev, 2);
  const restored = tab(server).api; await restored.join(first.api.invite());
  assert.deepEqual(plain(restored), { 'record:a': record('a', 50), 'record:b': record('b', 150) });
});

test('invalid invites and damaged ciphertext do not take over the local budget', async () => {
  const server = relay(), host = tab(server).api, guest = tab(server).api;
  await host.create();
  await assert.rejects(guest.join('#family=short'), code('invalid'));
  const known = server.rooms.get(host.status().roomId), validBox = known.box;
  known.box = { iv: validBox.iv, ciphertext: (validBox.ciphertext[0] === 'A' ? 'B' : 'A') + validBox.ciphertext.slice(1) };
  await assert.rejects(guest.join(host.invite()), code('integrity'));
  assert.equal(guest.status().active, false); assert.equal(guest.invite(), '');
  known.box = validBox; await guest.join(host.invite());
  await assert.rejects(guest.create(), code('active'));
});

test('retrying a lost create response attaches to the same authenticated room', async () => {
  const server = relay(), api = tab(server).api;
  server.lostCreateAck = true;
  await assert.rejects(api.create(), code('offline'));
  assert.equal(api.status().active, false);
  await api.create();
  assert.equal(server.rooms.size, 1);
  assert.deepEqual(server.requests.map(r => r.method), ['POST', 'POST', 'GET']);
  assert.equal(api.status().active, true);
});

test('quota and size errors leave the previous view intact and report the failed save', async () => {
  const server = relay(), device = tab(server), api = device.api;
  await api.create();
  device.disk.quota = true;
  assert.throws(() => api.apply(change('record:a', record('a', 400))), code('storage'));
  assert.deepEqual(plain(api), {}); assert.equal(api.status().error, 'storage');
  device.disk.quota = false;
  assert.throws(() => api.apply(change('record:a', 'a'.repeat(1100000))), code('full'));
  assert.deepEqual(plain(api), {});
  api.apply(change('record:a', record('a', 400))); await api.sync();
  assert.equal(api.status().phase, 'online'); assert.equal(api.view()['record:a'].amount, 400);
});

test('returning to the foreground refreshes the second device automatically', async () => {
  const server = relay(), a = tab(server).api, second = tab(server), b = second.api;
  await a.create(); await b.join(a.invite());
  a.apply(change('record:a', record('a', 12500))); await a.sync();
  const ready = new Promise((resolve, reject) => {
    const timeout = setTimeout(() => reject(new Error('foreground refresh timed out')), 2000);
    const stop = b.subscribe(() => {
      if (b.view()['record:a']) { stop(); clearTimeout(timeout); resolve(); }
    });
  });
  second.win.document.hidden = false; second.win.document.dispatchEvent(new Event('visibilitychange'));
  try { await ready; }
  finally { second.win.document.hidden = true; second.win.document.dispatchEvent(new Event('visibilitychange')); }
  assert.equal(b.view()['record:a'].amount, 12500);
});

test('a damaged server checkpoint is downloaded again without dropping the offline outbox', async () => {
  const server = relay(), first = tab(server);
  await first.api.create();
  first.api.apply(change('record:a', record('a', 200))); await first.api.sync();
  first.api.apply(change('record:b', record('b', 300)));
  const key = Array.from(first.disk.items.keys()).find(k => k.includes(':base:'));
  first.disk.items.set(key, 'broken cache');
  const restored = tab(server, first.disk).api;
  await restored.resume(); assert.equal(restored.status().pending, true);
  assert.equal(restored.view()['record:b'].amount, 300);
  await restored.sync();
  assert.deepEqual(plain(restored), { 'record:a': record('a', 200), 'record:b': record('b', 300) });
  assert.equal(restored.status().pending, false);
});
