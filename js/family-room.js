/* The invite stays on the devices. The relay receives a room address, a separate bearer and an AES-GCM box. */
(function (win) {
  'use strict';
  const ROOT = 'otbasy-budget:family:v1:';
  const ACTIVE = ROOT + 'active';
  const MAX_CIPHER = 1400000;
  const encoder = new TextEncoder();
  const decoder = new TextDecoder('utf-8', { fatal: true });
  const listeners = new Set();
  let room = null, opening = null, provisionalInvite = null, timer = null;
  let phase = 'idle', issue = null, lastNotice = '';

  function failure(code) { return Object.assign(new Error(code), { name: 'FamilyRoomError', code: code }); }
  function b64(bytes) {
    const pieces = [];
    for (let i = 0; i < bytes.length; i += 16384) pieces.push(String.fromCharCode(...bytes.subarray(i, i + 16384)));
    return win.btoa(pieces.join('')).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  }
  function unb64(text) {
    if (typeof text !== 'string' || !/^[A-Za-z0-9_-]+$/.test(text) || text.length % 4 === 1) throw failure('invalid');
    try { return Uint8Array.from(win.atob(text.replace(/-/g, '+').replace(/_/g, '/')), c => c.charCodeAt(0)); }
    catch (_) { throw failure('invalid'); }
  }
  function random(n) {
    if (!win.crypto || !win.crypto.subtle) throw failure('crypto');
    return win.crypto.getRandomValues(new Uint8Array(n));
  }
  function secretFrom(value) {
    const match = /^(?:[^#]*#)?family=([A-Za-z0-9_-]{43})$/.exec(String(value || '').trim());
    if (!match || b64(unb64(match[1])) !== match[1]) throw failure('invalid');
    return match[1];
  }
  async function keys(master) {
    if (!win.crypto || !win.crypto.subtle) throw failure('crypto');
    const crypto = win.crypto.subtle, material = await crypto.importKey('raw', unb64(master), 'HKDF', false, ['deriveBits', 'deriveKey']);
    const params = name => ({ name: 'HKDF', hash: 'SHA-256', salt: encoder.encode('Otbasy Budget / family / v1'), info: encoder.encode(name) });
    const [id, bearer, key] = await Promise.all([
      crypto.deriveBits(params('room-address'), material, 256),
      crypto.deriveBits(params('room-authorization'), material, 256),
      crypto.deriveKey(params('room-content'), material, { name: 'AES-GCM', length: 256 }, false, ['encrypt', 'decrypt'])
    ]);
    return { master, id: b64(new Uint8Array(id)), bearer: b64(new Uint8Array(bearer)), key, local: null, task: null,
      delay: 2000, conflicts: 0, lastConflict: new Map() };
  }
  function cipherParams(s, iv) { return { name: 'AES-GCM', iv, additionalData: encoder.encode('qarzhy-family-v1/' + s.id), tagLength: 128 }; }
  function encodeCells(cells) {
    const bytes = encoder.encode(JSON.stringify({ version: 1, cells }));
    if (Math.ceil((bytes.length + 16) * 4 / 3) > MAX_CIPHER) throw failure('full');
    return bytes;
  }
  async function seal(s, cells) {
    const iv = random(12);
    const bytes = await win.crypto.subtle.encrypt(cipherParams(s, iv), s.key, encodeCells(cells));
    return { iv: b64(iv), ciphertext: b64(new Uint8Array(bytes)) };
  }
  async function unlock(s, box) {
    if (!box || typeof box.iv !== 'string' || box.iv.length !== 16 || typeof box.ciphertext !== 'string' ||
        box.ciphertext.length < 22 || box.ciphertext.length > MAX_CIPHER) throw failure('integrity');
    try {
      const bytes = await win.crypto.subtle.decrypt(cipherParams(s, unb64(box.iv)), s.key, unb64(box.ciphertext));
      const doc = JSON.parse(decoder.decode(bytes));
      if (!doc || doc.version !== 1) throw failure('integrity');
      return validCells(doc.cells);
    } catch (_) { throw failure('integrity'); }
  }

  function goodKey(k) {
    return typeof k === 'string' && k.length > 0 && k.length <= 200 && !/[\u0000-\u001f]/.test(k) &&
      k !== '__proto__' && k !== 'constructor' && k !== 'prototype';
  }
  function validCells(obj) {
    if (!obj || typeof obj !== 'object' || Array.isArray(obj)) throw failure('corrupt');
    for (const [k, c] of Object.entries(obj)) {
      if (!goodKey(k) || !Array.isArray(c) || c.length !== 4 || !Number.isSafeInteger(c[0]) || c[0] < 0 ||
          !Number.isSafeInteger(c[1]) || c[1] < 1 || typeof c[2] !== 'string' || !/^[A-Za-z0-9_-]{22}$/.test(c[2])) throw failure('corrupt');
    }
    return obj;
  }
  function isEntity(k) { return /^(?:record|reminder|rem):/.test(k); }
  // A deleted record ID is terminal. For settings, an explicit edit after an observed deletion starts afresh.
  // The generation advances on delete, so a stale offline edit cannot revive a removed value.
  function compare(k, a, b) {
    if (!Array.isArray(b)) return 1;
    if (isEntity(k) && (a[3] === null) !== (b[3] === null)) return a[3] === null ? 1 : -1;
    return a[0] - b[0] || a[1] - b[1] || (a[2] < b[2] ? -1 : a[2] > b[2] ? 1 : 0);
  }
  function merge(target, patch) {
    for (const [k, cell] of Object.entries(patch)) if (compare(k, cell, target[k]) > 0) target[k] = cell;
    return target;
  }
  function clone(value) { return JSON.parse(JSON.stringify(value)); }
  function inputValue(value) {
    try {
      return JSON.parse(JSON.stringify(value, function (_, v) {
        if (typeof v === 'undefined' || typeof v === 'function' || typeof v === 'symbol' ||
            (typeof v === 'number' && !Number.isFinite(v))) throw failure('invalid');
        return v;
      }));
    } catch (_) { throw failure('invalid'); }
  }
  // A unique key per mutation batch makes synchronous saves atomic across tabs, including offline.
  // Checkpoints are immutable per server revision. A delayed tab can never replace a newer checkpoint.
  function prefix(s) { return ROOT + s.id + ':'; }
  function stored(action) {
    try { return action(win.localStorage); }
    catch (err) { throw err && err.name === 'FamilyRoomError' ? err : failure('storage'); }
  }
  function readJSON(value) { try { return JSON.parse(value); } catch (_) { throw failure('corrupt'); } }
  function localState(s) {
    return stored(storage => {
      const p = prefix(s), batches = [], bases = [];
      for (const key of Object.keys(storage)) {
        if (!key.startsWith(p)) continue;
        const tail = key.slice(p.length);
        if (tail.startsWith('batch:')) {
          const raw = storage.getItem(key);
          if (raw !== null) batches.push({ key, cells: validCells(readJSON(raw)) });
        } else if (/^base:[1-9]\d*$/.test(tail)) {
          const rev = Number(tail.slice(5));
          if (Number.isSafeInteger(rev)) bases.push({ key, rev });
        }
      }
      bases.sort((a, b) => b.rev - a.rev);
      let base = Object.create(null), rev = 0;
      for (const entry of bases) {
        const raw = storage.getItem(entry.key);
        if (raw !== null) {
          try { base = validCells(readJSON(raw)); rev = entry.rev; break; }
          catch (err) {
            if (err.code !== 'corrupt') throw err;
            // This is a confirmed server checkpoint, so it can be fetched again. Pending batches are retained.
            storage.removeItem(entry.key);
          }
        }
      }
      const cells = Object.assign(Object.create(null), base);
      for (const b of batches) merge(cells, b.cells);
      return { base, rev, cells, batches, signature: rev + '/' + batches.map(b => b.key).sort().join(',') };
    });
  }
  function checkpoint(s, rev, cells) {
    if (!Number.isSafeInteger(rev) || rev < 1) throw failure('service');
    const key = prefix(s) + 'base:' + rev;
    const old = localState(s);
    if (rev > old.rev) stored(st => st.setItem(key, JSON.stringify(cells)));
    const authoritative = old.rev > rev ? old.base : cells;
    const edits = Object.create(null);
    for (const batch of old.batches) merge(edits, batch.cells);
    for (const [k, localCell] of Object.entries(edits)) {
      const winner = authoritative[k];
      if (Array.isArray(winner) && compare(k, winner, localCell) > 0 && JSON.stringify(winner[3]) !== JSON.stringify(localCell[3])) {
        const conflict = localCell[2] + '/' + winner[2];
        if (s.lastConflict.get(k) !== conflict) { s.lastConflict.set(k, conflict); s.conflicts++; }
      }
    }
    stored(st => {
      for (const b of old.batches) {
        if (Object.entries(b.cells).every(([k, c]) => compare(k, c, authoritative[k]) <= 0)) st.removeItem(b.key);
      }
      const p = prefix(s) + 'base:';
      for (const k of Object.keys(st)) if (k.startsWith(p) && Number(k.slice(p.length)) < Math.max(rev, old.rev)) st.removeItem(k);
    });
    s.local = localState(s);
  }
  function phaseError(err) {
    issue = err && err.code || 'service';
    phase = issue === 'offline' ? 'offline' : 'error';
    announce();
  }
  function status() {
    return { active: !!room, phase, pending: !!(room && room.local && room.local.batches.length),
      error: issue, rev: room && room.local ? room.local.rev : 0, roomId: room ? room.id : null,
      conflicts: room ? room.conflicts : 0 };
  }
  function view() {
    if (!room || !room.local) return {};
    const result = {};
    for (const [k, cell] of Object.entries(room.local.cells)) if (cell[3] !== null) result[k] = clone(cell[3]);
    return result;
  }
  function announce() {
    const info = status(), notice = JSON.stringify(info) + (room && room.local ? room.local.signature : '');
    if (notice === lastNotice) return;
    lastNotice = notice;
    for (const fn of listeners) { try { fn(info); } catch (err) { win.setTimeout(() => { throw err; }, 0); } }
  }
  function subscribe(fn) { listeners.add(fn); fn(status()); return () => listeners.delete(fn); }
  function invite() { return room ? '#family=' + room.master : ''; }
  function address(id) {
    let url;
    try { url = new URL(win.QarzhyService.apiBase, win.location.href); }
    catch (_) { throw failure('unavailable'); }
    const local = ['127.0.0.1', 'localhost', '[::1]'].includes(url.hostname);
    if (!win.QarzhyService.apiBase || !(url.protocol === 'https:' || (local && url.protocol === 'http:')) ||
        url.username || url.password || url.hash || url.search) throw failure('unavailable');
    return url.href.replace(/\/$/, '') + '/v1/rooms/' + id;
  }
  async function request(s, method, body, since) {
    const url = address(s.id) + (since ? '?since=' + since : '');
    const controller = new AbortController(), deadline = win.setTimeout(() => controller.abort(), 12000);
    try {
      const headers = { Authorization: 'Bearer ' + s.bearer };
      if (body) headers['Content-Type'] = 'application/json';
      const response = await win.fetch(url, { method, headers, body: body ? JSON.stringify(body) : undefined,
        cache: 'no-store', credentials: 'omit', redirect: 'error', referrerPolicy: 'no-referrer', signal: controller.signal });
      if (response.status === 304 && since) return null;
      if (response.status === 409) throw failure('conflict');
      if ([401, 403, 404].includes(response.status)) throw failure('denied');
      if (response.status === 413) throw failure('full');
      if (response.status === 429) throw failure('rate');
      if (!response.ok) throw failure('service');
      const result = await response.json();
      if (!result || !Number.isSafeInteger(result.rev) || result.rev < 1) throw failure('service');
      if (method === 'POST' && response.status !== 201) return { rev: result.rev, existing: true };
      return result;
    } catch (err) {
      if (err && err.name === 'FamilyRoomError') throw err;
      throw failure(err instanceof SyntaxError ? 'service' : 'offline');
    } finally { win.clearTimeout(deadline); }
  }
  function selected(s) { return room === s && stored(st => st.getItem(ACTIVE)) === s.master; }
  function cancelTimer() { if (timer !== null) win.clearTimeout(timer); timer = null; }
  function schedule(ms) {
    cancelTimer();
    if (room && !win.document.hidden) timer = win.setTimeout(() => { timer = null; sync(); }, ms);
  }
  async function reconcile(s) {
    for (let attempt = 0; attempt < 4 && selected(s); attempt++) {
      const before = s.local = localState(s), baseRev = before.rev;
      const snapshot = await request(s, 'GET', null, baseRev);
      if (!selected(s)) return;
      if (snapshot && snapshot.rev < baseRev) throw failure('service');
      if (snapshot && snapshot.rev > baseRev) {
        const remote = await unlock(s, snapshot.box);
        if (!selected(s)) return;
        checkpoint(s, snapshot.rev, remote);
      } else if (baseRev) checkpoint(s, baseRev, before.base);
      s.local = localState(s);
      phase = s.local.batches.length ? 'pending' : 'online'; issue = null; announce();
      if (!s.local.batches.length) return;
      const data = s.local, box = await seal(s, data.cells);
      if (!selected(s)) return;
      try {
        const ack = await request(s, 'PUT', { rev: data.rev, box });
        if (!selected(s)) return;
        if (ack.rev <= data.rev) throw failure('service');
        checkpoint(s, ack.rev, data.cells);
      } catch (err) { if (err.code === 'conflict') continue; throw err; }
      if (!s.local.batches.length) { phase = 'online'; issue = null; announce(); return; }
    }
  }
  function sync() {
    const s = room;
    if (!s) return Promise.resolve(status());
    if (s.task) return s.task;
    try { if (!selected(s)) return resume().catch(() => status()); }
    catch (err) { phaseError(err); return Promise.resolve(status()); }
    cancelTimer();
    s.task = reconcile(s).then(() => { s.delay = 2000; }).catch(err => {
      if (room === s) { phaseError(err); s.delay = Math.min(30000, Math.max(4000, s.delay * 2)); }
    }).finally(() => {
      s.task = null;
      if (room === s) schedule(!issue && s.local.batches.length ? 150 : s.delay);
    }).then(status);
    return s.task;
  }
  function apply(ops) {
    const s = room;
    if (!s || !selected(s)) throw failure('no-room');
    if (!Array.isArray(ops)) throw failure('invalid');
    try {
      const local = localState(s), batch = Object.create(null), nonce = b64(random(16));
      for (const op of ops) {
        if (!op || !goodKey(op.key)) throw failure('invalid');
        const value = inputValue(op.value), k = op.key, previous = local.cells[k];
        if (previous && JSON.stringify(previous[3]) === JSON.stringify(value)) continue;
        if (previous && previous[3] === null && value !== null && isEntity(k)) throw failure('deleted');
        const generation = (previous ? previous[0] : 0) + (value === null ? 1 : 0);
        const clock = previous && generation === previous[0] ? previous[1] + 1 : 1;
        if (!Number.isSafeInteger(generation) || !Number.isSafeInteger(clock)) throw failure('full');
        local.cells[k] = batch[k] = [generation, clock, nonce, value];
      }
      if (!Object.keys(batch).length) { s.local = local; announce(); return status(); }
      encodeCells(local.cells);
      const batchKey = prefix(s) + 'batch:' + nonce;
      stored(st => {
        if (st.getItem(ACTIVE) !== s.master) throw failure('changed');
        st.setItem(batchKey, JSON.stringify(batch));
        // A different tab may disconnect while this tab is preparing the write.
        if (st.getItem(ACTIVE) !== s.master) { st.removeItem(batchKey); throw failure('changed'); }
      });
      s.local = localState(s); phase = 'pending';
      issue = null; announce(); schedule(0); return status();
    } catch (err) { phaseError(err); throw err; }
  }
  function bind(s, writeActive) {
    s.local = localState(s);
    if (writeActive) {
      const active = stored(st => st.getItem(ACTIVE));
      if (active && active !== s.master) throw failure('active');
      stored(st => st.setItem(ACTIVE, s.master));
    }
    room = s; phase = s.local.batches.length ? 'pending' : 'connecting'; issue = null; announce(); schedule(0);
    return status();
  }
  function open(action) {
    if (opening) return Promise.reject(failure('busy'));
    phase = 'connecting'; issue = null; announce();
    opening = Promise.resolve().then(action).catch(err => { phaseError(err); throw err; })
      .finally(() => { opening = null; });
    return opening;
  }
  function create() {
    if (room) return Promise.reject(failure('active'));
    return open(async () => {
      if (stored(st => st.getItem(ACTIVE))) throw failure('active');
      if (!provisionalInvite) provisionalInvite = b64(random(32));
      const s = await keys(provisionalInvite);
      let cells = {};
      let response;
      try { response = await request(s, 'POST', { box: await seal(s, cells) }); }
      catch (err) {
        if (err.code !== 'conflict') throw err;
        response = { existing: true };
      }
      if (response.existing || response.rev !== 1) {
        response = await request(s, 'GET');
        cells = await unlock(s, response.box);
      }
      checkpoint(s, response.rev, cells);
      const result = bind(s, true); provisionalInvite = null; return result;
    });
  }
  function join(fragment) {
    if (room) return Promise.reject(failure('active'));
    return open(async () => {
      if (stored(st => st.getItem(ACTIVE))) throw failure('active');
      const s = await keys(secretFrom(fragment)), snapshot = await request(s, 'GET');
      const cells = await unlock(s, snapshot.box);
      checkpoint(s, snapshot.rev, cells); return bind(s, true);
    });
  }
  function resume() {
    if (opening) return opening;
    let master;
    try { master = stored(st => st.getItem(ACTIVE)); }
    catch (err) { phaseError(err); return Promise.reject(err); }
    if (!master) {
      room = null; cancelTimer(); phase = 'idle'; issue = null; announce(); return Promise.resolve(status());
    }
    if (room && room.master === master) return Promise.resolve(status());
    room = null; cancelTimer();
    return open(async () => {
      const s = await keys(secretFrom('family=' + master));
      if (stored(st => st.getItem(ACTIVE)) !== master) throw failure('changed');
      return bind(s, false);
    });
  }
  function leave() {
    if (opening) throw failure('busy');
    if (!room) return status();
    const s = room;
    if (!selected(s)) throw failure('changed');
    s.local = localState(s);
    if (s.local.batches.length) throw failure('pending');
    stored(st => {
      st.removeItem(ACTIVE);
      // Close the gate to other tabs first, then recheck for a batch they just committed.
      if (localState(s).batches.length) {
        if (!st.getItem(ACTIVE)) st.setItem(ACTIVE, s.master);
        throw failure('pending');
      }
      // Purge confirmed cached data. Each pending batch is immutable and never removed by logout.
      for (const key of Object.keys(st)) if (key.startsWith(prefix(s) + 'base:')) st.removeItem(key);
    });
    room = null; cancelTimer(); phase = 'idle'; issue = null; announce(); return status();
  }
  win.addEventListener('storage', e => {
    if (!e.key || e.key === ACTIVE) { resume().catch(() => {}); return; }
    if (!room || !e.key.startsWith(prefix(room))) return;
    try {
      room.local = localState(room);
      if (room.local.batches.length && phase === 'online') phase = 'pending';
      announce(); if (room.local.batches.length) schedule(0);
    } catch (err) { phaseError(err); }
  });
  win.addEventListener('online', () => schedule(0));
  win.addEventListener('offline', () => { if (room) phaseError(failure('offline')); });
  win.document.addEventListener('visibilitychange', () => { if (win.document.hidden) cancelTimer(); else schedule(0); });
  win.FamilyRoom = Object.freeze({ create, join, resume, leave, invite, apply, view, status, subscribe, sync });
})(window);
