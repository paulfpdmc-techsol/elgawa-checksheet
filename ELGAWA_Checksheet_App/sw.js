const CACHE_NAME = "elgawa-checksheet-v146";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];
// PDF + rendering libraries — precached so PDF buttons work on weak signal/offline
const CDN_ASSETS = [
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf/2.5.1/jspdf.umd.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/jspdf-autotable/3.8.2/jspdf.plugin.autotable.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.min.js",
  "https://cdnjs.cloudflare.com/ajax/libs/pdf.js/3.11.174/pdf.worker.min.js"
];

// Install — cache all assets (CDN libs cached best-effort so a single
// failure doesn't block the install)
self.addEventListener("install", e => {
  e.waitUntil(
    caches.open(CACHE_NAME).then(cache =>
      cache.addAll(ASSETS).then(() =>
        Promise.all(CDN_ASSETS.map(u => cache.add(u).catch(() => {})))
      )
    )
  );
  self.skipWaiting();
});

// Activate — clean old caches immediately
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Fetch:
//  - cdnjs libraries: cache-first (immutable versioned files; instant + offline-proof)
//  - same-origin: network-first, fall back to cache (updates show immediately)
self.addEventListener("fetch", e => {
  const url = e.request.url;
  if (url.startsWith("https://cdnjs.cloudflare.com/")) {
    e.respondWith(
      caches.match(e.request).then(hit => hit || fetch(e.request).then(response => {
        const clone = response.clone();
        caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
        return response;
      }))
    );
    return;
  }
  if (!url.startsWith(self.location.origin)) return;
  e.respondWith(
    fetch(e.request).then(response => {
      const clone = response.clone();
      caches.open(CACHE_NAME).then(cache => cache.put(e.request, clone));
      return response;
    }).catch(() => caches.match(e.request))
  );
});

// Push notifications
self.addEventListener("push", e => {
  const data = e.data ? e.data.json() : { title: "ELGAWA Checksheet", body: "Time to fill in your daily checksheet!" };
  e.waitUntil(self.registration.showNotification(data.title, {
    body: data.body,
    icon: "./icon-192.png",
    badge: "./icon-192.png",
    vibrate: [200, 100, 200]
  }));
});

self.addEventListener("notificationclick", e => {
  e.notification.close();
  e.waitUntil(clients.openWindow("./index.html"));
});
