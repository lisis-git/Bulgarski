// sw.js — Offline-Unterstützung für Bulgarski
// Strategie: "network-first" → online immer die neueste Datei (Auto-Update bleibt),
// offline Rückgriff auf die zuletzt gespeicherte Fassung (z. B. im Flugzeug).
// Hinweis: Diese Datei muss nur geändert werden, wenn sich das Caching ändert.
// Normale Inhalts-Updates (neue Vokabeln) laufen weiter allein über app.js.

var VERSION = "v7";
var CACHE   = "bulgarski-" + VERSION;
var CORE    = ["./", "./index.html", "./app.js", "./icon-512.png"];

self.addEventListener("install", function(e){
  self.skipWaiting();
  e.waitUntil(caches.open(CACHE).then(function(c){ return c.addAll(CORE); }).catch(function(){}));
});

self.addEventListener("activate", function(e){
  e.waitUntil(
    caches.keys().then(function(keys){
      return Promise.all(keys.map(function(k){ if(k!==CACHE) return caches.delete(k); }));
    }).then(function(){ return self.clients.claim(); })
  );
});

self.addEventListener("fetch", function(e){
  var req = e.request;
  if(req.method !== "GET") return;
  if(req.url.indexOf("http") !== 0) return;

  e.respondWith(
    fetch(req).then(function(res){
      // Frische Kopie ohne Query (?t=…) im Cache ablegen → kein Aufblähen
      if(res && res.ok){
        var copy = res.clone();
        var key  = req.url.split("?")[0];
        caches.open(CACHE).then(function(c){ c.put(key, copy); });
      }
      return res;
    }).catch(function(){
      // Offline: passende gespeicherte Datei zurückgeben (Query wird ignoriert)
      return caches.match(req, {ignoreSearch:true}).then(function(m){
        return m || caches.match("./index.html", {ignoreSearch:true}) || caches.match("./");
      });
    })
  );
});
