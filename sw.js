/* Plumas Locas: permite instalar el juego como app y abrirlo sin internet.
   Siempre pregunta al servidor si hay algo nuevo; si no hay conexión, usa lo guardado.
   El nombre de la caché lleva la versión: build.sh lo cambia solo en cada compilación. */
var CACHE = 'plumas-locas-20261105162134';
var FILES = ['./', 'index.html', 'plumas-locas.html', 'three.min.js', 'peerjs.min.js', 'qrcode.min.js', 'ranking-online.js',
  'manifest.webmanifest', 'icon-192.png', 'icon-512.png', 'icon-maskable-512.png', 'apple-touch-icon.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) {
    return c.addAll(FILES.map(function (f) { return new Request(f, { cache: 'reload' }); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request, url = new URL(req.url);
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;
  if (/version\.json$/.test(url.pathname)) return;           // el aviso de versión nunca se guarda
  // 'no-cache': el navegador pregunta siempre al servidor (si no cambió, no se descarga de nuevo)
  e.respondWith(fetch(req.url, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
    if (res && res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req.url.split('?')[0], copy); }); }
    return res;
  }).catch(function () {
    return caches.match(req, { ignoreSearch: true }).then(function (r) { return r || caches.match('index.html'); });
  }));
});
