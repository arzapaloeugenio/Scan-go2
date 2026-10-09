/* Tottus Scan & Go - SW mínimo offline (demo) */
const CACHE = "tottus-scan-go-v10";
const ASSETS = ["./", "./index.html", "./styles.css", "./app.js", "./manifest.json", "./tobi-chat.js", "./tobi-history.js", "./tobi-profile.js", "./tobi-recipes.js", "./tobi-discounts.js", "./tobi-allergens.js"];
self.addEventListener("install", (e) => {
  e.waitUntil(caches.open(CACHE).then((c) => c.addAll(ASSETS)).then(() => self.skipWaiting()));
});
self.addEventListener("activate", (e) => {
  e.waitUntil(
    caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim())
  );
});
self.addEventListener("fetch", (e) => {
  e.respondWith(caches.match(e.request).then((r) => r || fetch(e.request).catch(() => caches.match("./index.html"))));
});
