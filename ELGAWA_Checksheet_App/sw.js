// The app moved to the repo root. This worker replaces the old one that was
// registered at this folder path, unregisters itself, and gets out of the way
// so the redirect stub always reaches the network.
self.addEventListener("install", function () { self.skipWaiting(); });
self.addEventListener("activate", function (e) { e.waitUntil(self.registration.unregister()); });
