/* Cache static screens. Invitations, ledger data and pilot responses never enter this cache. */
'use strict';
const scope = self.registration.scope;
const prefix = 'otbasy-shell:' + new URL(scope).pathname + ':';
const cacheName = prefix + '4';
const shell = ['index.html', 'css/style.css', 'js/ai.js', 'js/budget-query.js', 'js/service-config.js', 'js/family-room.js', 'js/app.js',
  'pilot/index.html', 'pilot/style.css', 'pilot/study.js', 'pilot/app.js'].map(path => new URL(path, scope).href);
const pilotDir = new URL('pilot/', scope).href;

self.addEventListener('install', event => {
  event.waitUntil(caches.open(cacheName).then(cache =>
    cache.addAll(shell.map(url => new Request(url, { cache: 'reload' })))
  ));
});

self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    for (const name of await caches.keys()) {
      if (name.startsWith(prefix) && name !== cacheName) await caches.delete(name);
    }
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', event => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  const key = url.href === scope ? shell[0] : url.href === pilotDir ? pilotDir + 'index.html' : url.href;
  if (!shell.includes(key)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    try {
      const response = await fetch(event.request);
      if (!response.ok) return (await cache.match(key)) || response;
      await cache.put(key, response.clone()).catch(() => {});
      return response;
    } catch (error) {
      const cached = await cache.match(key);
      if (cached) return cached;
      throw error;
    }
  })());
});
