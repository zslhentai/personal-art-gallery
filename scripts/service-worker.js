/* global __VERSION__, __SHELL__ */
/* Build injects a content-derived version and the minimal shell URLs. */
const VERSION = __VERSION__;
const SHELL = __SHELL__;
const BASE = "/personal-art-gallery/";
const PREFIX = "personal-art-gallery-";
const SHELL_CACHE = `${PREFIX}shell-${VERSION}`;
const RUNTIME_CACHE = `${PREFIX}code-${VERSION}`;
self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(SHELL_CACHE)
      .then((cache) =>
        cache.addAll(
          SHELL.map(
            (path) =>
              new Request(path, {
                cache: path.includes("/assets/") ? "force-cache" : "no-cache",
              }),
          ),
        ),
      ),
  );
  // Updates wait until the reader explicitly refreshes; do not discard an unfinished note.
});
self.addEventListener("message", (event) => {
  if (event.data?.type === "SKIP_WAITING") self.skipWaiting();
});
self.addEventListener("activate", (event) => {
  event.waitUntil(
    (async () => {
      for (const name of await caches.keys()) {
        if (
          name.startsWith(PREFIX) &&
          ![SHELL_CACHE, RUNTIME_CACHE].includes(name)
        )
          await caches.delete(name);
      }
      await self.clients.claim();
    })(),
  );
});
self.addEventListener("fetch", (event) => {
  const request = event.request;
  const url = new URL(request.url);
  if (
    request.method !== "GET" ||
    url.origin !== self.location.origin ||
    !url.pathname.startsWith(BASE)
  )
    return;
  if (
    request.mode === "navigate" &&
    [BASE, `${BASE}index.html`].includes(url.pathname)
  ) {
    event.respondWith(
      (async () => {
        try {
          return await fetch(request);
        } catch {
          return (
            (await caches.match(BASE, { cacheName: SHELL_CACHE })) ||
            Response.error()
          );
        }
      })(),
    );
    return;
  }
  // Do not cache previews, downloads or external originals. Only bounded local app code.
  const code =
    url.pathname.startsWith(`${BASE}assets/`) &&
    /\.(js|css)$/.test(url.pathname);
  if (!code && !SHELL.includes(url.pathname)) return;
  event.respondWith(
    (async () => {
      const cached =
        (await caches.match(request, { cacheName: SHELL_CACHE })) ||
        (await caches.match(request, { cacheName: RUNTIME_CACHE }));
      if (cached) return cached;
      const response = await fetch(request);
      if (
        code &&
        response.ok &&
        !response.redirected &&
        /javascript|css/.test(response.headers.get("content-type") || "")
      ) {
        const cache = await caches.open(RUNTIME_CACHE);
        await cache.put(request, response.clone());
        const keys = await cache.keys();
        while (keys.length > 16) await cache.delete(keys.shift());
      }
      return response;
    })(),
  );
});
