/* VYGO offline support: the app and your saved ticket open without a network. */
var V = "vygo-v1";
var CORE = ["./", "index.html", "hark.css", "hark-hero.css", "hark.js", "favicon.svg", "icon-192.png", "icon-512.png", "manifest.webmanifest"];
self.addEventListener("install", function (e) {
  e.waitUntil(caches.open(V).then(function (c) { return c.addAll(CORE); }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener("activate", function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== V; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener("fetch", function (e) {
  var r = e.request;
  if (r.method !== "GET") return;
  var u = new URL(r.url);
  if (r.mode === "navigate") {
    // page: network first so updates show at once, cached copy when offline
    e.respondWith(fetch(r).then(function (res) {
      var copy = res.clone(); caches.open(V).then(function (c) { c.put("index.html", copy); }); return res;
    }).catch(function () { return caches.match("index.html"); }));
    return;
  }
  var font = /fonts\.(googleapis|gstatic)\.com$/.test(u.hostname);
  if (u.origin !== location.origin && !font) return;
  // files and fonts: cached copy first, refreshed in the background
  e.respondWith(caches.match(r).then(function (hit) {
    var net = fetch(r).then(function (res) {
      if (res && (res.ok || res.type === "opaque")) { var copy = res.clone(); caches.open(V).then(function (c) { c.put(r, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
