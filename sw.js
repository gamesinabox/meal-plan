"use strict";
var CACHE_NAME = "meal-planner-shell-v1";
var SHELL_FILES = [
  "./index.html",
  "./manifest.webmanifest",
  "./icons/icon-192.png",
  "./icons/icon-512.png"
];

self.addEventListener("install", function (event) {
  event.waitUntil(
    caches.open(CACHE_NAME).then(function (cache) { return cache.addAll(SHELL_FILES); }).then(function () { return self.skipWaiting(); })
  );
});

self.addEventListener("activate", function (event) {
  event.waitUntil(
    caches.keys().then(function (names) {
      return Promise.all(names.filter(function (n) { return n !== CACHE_NAME; }).map(function (n) { return caches.delete(n); }));
    }).then(function () { return self.clients.claim(); })
  );
});

// Only serve the cached app shell for same-origin navigations/assets we precached.
// Everything else (Firebase auth, Firestore, Google fonts, etc.) goes straight to the network untouched.
self.addEventListener("fetch", function (event) {
  var url = new URL(event.request.url);
  if (url.origin !== self.location.origin) return;
  var path = url.pathname.replace(/^.*\//, "./");
  var isShellFile = SHELL_FILES.indexOf(path) !== -1 || event.request.mode === "navigate";
  if (!isShellFile) return;
  event.respondWith(
    caches.match(event.request.mode === "navigate" ? "./index.html" : event.request).then(function (cached) {
      var network = fetch(event.request).then(function (resp) {
        if (resp && resp.ok) {
          caches.open(CACHE_NAME).then(function (cache) { cache.put(event.request, resp.clone()); });
        }
        return resp;
      }).catch(function () { return cached; });
      return cached || network;
    })
  );
});
