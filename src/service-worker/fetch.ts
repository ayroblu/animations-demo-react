import { precacheRoutes } from "./helper";
import { raceSafe, raceSafeAny, log, wait } from "./utils";

declare const self: ServiceWorkerGlobalScope;

const base = import.meta.env.BASE_URL;

// if you ever change this, you need to delete existing cache storage
const version = "1";
const cacheName = `sw-precache-v${version}`;

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
    event.respondWith(handlePrefetch(event));
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

async function handlePrefetch(
  event: FetchEvent,
  url: string = event.request.url,
) {
  const cache = await caches.open(cacheName);
  const match = await cache.match(url, { ignoreSearch: true });
  if (match) {
    return match;
  }
  const res = await fetch(event.request);
  if (res.ok) {
    const cache = await caches.open(cacheName);
    await cache.put(url, res.clone());
  }
  return res;
}
