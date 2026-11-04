// Service worker: makes Budgeter installable and opens it without a
// connection. Only the app itself is cached; budget data (/graphql) and
// anything from other sites (Auth0 sign-in, fonts) always go to the network.
const CACHE = "budgeter-v1";
const SHELL = ["/", "/manifest.json", "/icons/icon-192.png", "/icons/icon-512.png"];

self.addEventListener("install", (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)));
  self.skipWaiting();
});

// drop caches from older versions of this worker
self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((key) => key !== CACHE).map((key) => caches.delete(key))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;
  const url = new URL(request.url);
  if (request.method !== "GET" || url.origin !== self.location.origin || url.pathname.startsWith("/graphql")) {
    return;
  }

  // pages: always the newest from the network; the cached shell when offline
  if (request.mode === "navigate") {
    event.respondWith(
      fetch(request)
        .then((response) => {
          // every page is the same app, so one copy serves any address
          if (response.ok) {
            const copy = response.clone();
            caches.open(CACHE).then((cache) => cache.put("/", copy));
          }
          return response;
        })
        .catch(() => caches.match("/"))
    );
    return;
  }

  // built files have content hashes in their names, so a cached copy never
  // goes stale; other files are refreshed in the background
  const hashed = url.pathname.startsWith("/assets/");
  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached && hashed) {
        return cached;
      }
      const network = fetch(request).then((response) => {
        if (response.ok) {
          const copy = response.clone();
          caches.open(CACHE).then((cache) => cache.put(request, copy));
        }
        return response;
      });
      if (cached) {
        network.catch(() => {}); // offline: the cached copy is fine
        return cached;
      }
      return network;
    })
  );
});
