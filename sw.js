/* Amsei — service worker.
   La cáscara de la app se sirve desde caché (abre al instante, incluso sin red).
   El dato del API va siempre a la red primero y cae a la última copia si no hay conexión. */
var CACHE = 'amsei-v1';
var CASCARA = ['./', './index.html', './manifest.webmanifest', './icon-180.png', './icon-512.png'];

self.addEventListener('install', function(e){
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CASCARA); }).then(function(){ return self.skipWaiting(); }));
});
self.addEventListener('activate', function(e){
  e.waitUntil(caches.keys().then(function(ks){
    return Promise.all(ks.filter(function(k){ return k !== CACHE; }).map(function(k){ return caches.delete(k); }));
  }).then(function(){ return self.clients.claim(); }));
});
self.addEventListener('fetch', function(e){
  var url = e.request.url;
  if (e.request.method !== 'GET') return;
  if (url.indexOf('script.google') >= 0 || url.indexOf('googleusercontent') >= 0){
    e.respondWith(fetch(e.request).then(function(r){
      var copia = r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copia); }); return r;
    }).catch(function(){ return caches.match(e.request); }));
    return;
  }
  if (url.indexOf(self.location.origin) !== 0) return;   // el CDN lo maneja el navegador
  e.respondWith(caches.match(e.request).then(function(hit){
    var red = fetch(e.request).then(function(r){
      if (r && r.ok){ var copia = r.clone(); caches.open(CACHE).then(function(c){ c.put(e.request, copia); }); }
      return r;
    }).catch(function(){ return hit; });
    return hit || red;
  }));
});
