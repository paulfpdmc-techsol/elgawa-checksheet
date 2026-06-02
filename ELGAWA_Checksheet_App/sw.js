const CACHE_NAME = "elgawa-checksheet-v124";
const ASSETS = ["./index.html", "./manifest.json", "./icon-192.png", "./icon-512.png"];

// Install — cache all assets
self.addEventListener("install", e => {
  e.waitUntil(caches.open(CACHE_NAME).then(cache => cache.addAll(ASSETS)));
  self.skipWaiting();
});

// Activate — clean old caches immediately
self.addEventListener("activate", e => {
  e.waitUntil(caches.keys().then(keys =>
    Promise.all(keys.filter(k => k !== CACHE_NAME).map(k => caches.delete(k)))
  ));
  self.clients.claim();
});

// Fetch — network first, fall back to cache (ensures updates show immediately)
self.addEventListener("fetch", e => {
  if (!e.request.url.startsWith(self.location.origin)) return;
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
