'use strict';
const BASE = new URL('./', self.location.href);
const PREFIX = 'lantern-dungeon:' + BASE.pathname + ':';
const CACHE = PREFIX + 'eb3bdf6a42a8ce6f';
const INDEX = new URL('index.html', BASE).href;
const MANIFEST = new URL('manifest.webmanifest', BASE).href;
self.addEventListener('install', event => {
  event.waitUntil((async () => {
    const cache = await caches.open(CACHE);
    await cache.addAll([new Request(INDEX, {cache:'reload'}), new Request(MANIFEST, {cache:'reload'})]);
    await self.skipWaiting();
  })());
});
self.addEventListener('activate', event => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter(key => key.startsWith(PREFIX) && key !== CACHE).map(key => caches.delete(key)));
    await self.clients.claim();
  })());
});
self.addEventListener('fetch', event => {
  const request = event.request, url = new URL(request.url);
  if (request.method !== 'GET' || url.origin !== BASE.origin) return;
  const indexRequest = request.mode === 'navigate' && (url.pathname === BASE.pathname || url.pathname === new URL(INDEX).pathname);
  const manifestRequest = url.pathname === new URL(MANIFEST).pathname;
  if (!indexRequest && !manifestRequest) return;
  const key = indexRequest ? INDEX : MANIFEST;
  event.respondWith((async () => {
    const cache = await caches.open(CACHE);
    try {
      const response = await fetch(request, {cache:'no-cache'});
      if (!response.ok) throw new Error('HTTP ' + response.status);
      // Cache failures must not prevent a successful online response.
      try { await cache.put(key, response.clone()); } catch {}
      return response;
    } catch {
      return await cache.match(key) || new Response('初回はオンラインでゲームを開いてください。', {status:503, headers:{'Content-Type':'text/plain; charset=utf-8'}});
    }
  })());
});
