import { cacheName, precacheRoutes } from "./helper";
import { raceSafe, raceSafeAny, log, wait } from "./utils";

declare const self: ServiceWorkerGlobalScope;

const base = import.meta.env.BASE_URL;

// MARK: fetch
export function proxyFetch(event: FetchEvent) {
  const url = new URL(event.request.url);
  const route = `${url.origin}${url.pathname}`;
  if (
    event.request.mode === "navigate" &&
    // Ignore all .js .css, image etc assets
    (!url.pathname.includes(".") || url.pathname.endsWith(".html"))
  ) {
    event.respondWith(handleNavigation(event));
  } else if (precacheRoutes.has(route)) {
    event.respondWith(cacheFirst(event, { ignoreSearch: true }));
  } else if (route.includes("favicon")) {
    event.respondWith(networkFirst(event));
  } else if (route.includes("/assets/")) {
    // Mimicing browser cache since github pages doesn't set cache headers
    event.respondWith(cacheFirst(event));
  } else if (!route.includes("localhost")) {
    // log("cacheFirst", event.request.url, route);
    // event.respondWith(cacheFirst(event));
  } else {
    // log("missing", event.request.url, route);
  }
}

const navigationCacheUrl = `${self.location.origin}${base}index.html`;
async function handleNavigation(event: FetchEvent) {
  const preloadResponse: Promise<void | Response> = event.preloadResponse;
  let isDone = false;
  const preload = preloadResponse.then(async (res) => {
    if (!res) {
      // If preload is not enabled, then just do a normal fetch, as if preloading
      res = await fetch(event.request);
    }
    if (res.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(navigationCacheUrl, res.clone());
    }
    isDone = true;
    return res;
  });
  event.waitUntil(preload);
  const cacheResult = raceSafeAny([wait(1000), preload]).then(async () => {
    if (isDone) return;
    const cache = await caches.open(cacheName);
    const match = await cache.match(navigationCacheUrl, { ignoreSearch: true });
    if (match) {
      isDone = true;
      return match;
    }
  });
  preload.catch((err) => log("preload err", err));
  cacheResult.catch((err) => log("cacheResult err", err));
  return raceSafe([preload, cacheResult]).then(async (res) => {
    if (!res) {
      res = await fetch(event.request);
      if (res.ok) {
        const cache = await caches.open(cacheName);
        await cache.put(navigationCacheUrl, res.clone());
      }
    }
    return res;
  });
}

async function cacheFirst(
  event: FetchEvent,
  { ignoreSearch }: { ignoreSearch?: boolean } = {},
) {
  const url = event.request.url;
  const cache = await caches.open(cacheName);
  const match = await cache.match(url, { ignoreSearch });
  if (match) {
    return match;
  }
  const res = await fetch(event.request);
  console.log("fetching", event.request.url);
  if (res.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(url, res.clone());
  }
  return res;
}

async function networkFirst(event: FetchEvent) {
  let isDone = false;
  const network = fetch(event.request).then(async (res) => {
    if (res.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(event.request.url, res.clone());
    }
    isDone = true;
    return res;
  });
  const cacheResult = raceSafeAny([wait(1000), network]).then(async () => {
    if (isDone) return new Promise<Response>(() => {});
    const cache = await caches.open(cacheName);
    const match = await cache.match(navigationCacheUrl, { ignoreSearch: true });
    if (match) {
      isDone = true;
      return match;
    }
    // if the cache is not found, hang the response forever
    return new Promise<Response>(() => {});
  });
  network.catch((err) => log("network err", err));
  cacheResult.catch((err) => log("network cache err", err));
  return raceSafe([network, cacheResult]);
}
