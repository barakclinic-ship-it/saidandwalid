// Minimal service worker — enables "Add to Home Screen" / install,
// and caches the app shell so it also opens with no internet connection.
//
// Bump CACHE_NAME any time this file itself needs a hard refresh across
// installs; the fetch handler below is network-first, so ordinary content
// updates (editing index.html) show up immediately without needing that.
const CACHE_NAME = "shihon-arabic-v2";
const APP_SHELL = [
  "./",
  "./index.html",
  "./manifest.webmanifest",
  "./icon-192.png",
  "./icon-512.png"
];

self.addEventListener("install", function(event){
  self.skipWaiting();
  event.waitUntil(
    caches.open(CACHE_NAME).then(function(cache){
      return cache.addAll(APP_SHELL).catch(function(){ /* ignore missing files */ });
    })
  );
});

self.addEventListener("activate", function(event){
  event.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(
        keys.filter(function(key){ return key !== CACHE_NAME; })
            .map(function(key){ return caches.delete(key); })
      );
    }).then(function(){ return self.clients.claim(); })
  );
});

// network-first, falling back to the cache only when there's no connection —
// this way every edit to the app shows up on the very next load, and the
// cached copy is only ever used as an offline fallback.
self.addEventListener("fetch", function(event){
  if(event.request.method !== "GET") return;
  event.respondWith(
    fetch(event.request).then(function(response){
      if(response && response.ok){
        var copy = response.clone();
        caches.open(CACHE_NAME).then(function(cache){ cache.put(event.request, copy); });
      }
      return response;
    }).catch(function(){
      return caches.match(event.request);
    })
  );
});
