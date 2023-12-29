/// <reference lib="webworker" />
import "./types";
const base = import.meta.env.BASE_URL;

declare const self: ServiceWorkerGlobalScope;

function getCacheablePaths() {
  const manifest = self.__WB_MANIFEST ?? [];
  return manifest.map(({ url }) => `${base}${url}`);
}

// if you ever change this, you need to delete existing cache storage
const version = "1";
const cacheName = `sw-precache-v${version}`;
const precacheRoutes = new Set();
const cacheablePaths = getCacheablePaths();

// MARK: install
export function handlePrecache(event: ExtendableEvent) {
  event.waitUntil(handlePrecacheManifest());
}
async function handlePrecacheManifest() {
  saveRoutes(cacheablePaths);
  const cache = await caches.open(cacheName);
  const cachedRequests = await cache.keys();
  const cachedUrls = new Set(
    cachedRequests
      .map(({ url }) => url)
      .map((url) => url.replace(self.location.origin, "")),
  );
  const newPaths = cacheablePaths.filter((url) => !cachedUrls.has(url));
  log("sw: new precache:", newPaths.length, "/", cacheablePaths.length);

  for (const path of newPaths) {
    const reqUrl = new URL(path, self.location.origin);
    // TODO: update tests to support URL param to fetch
    await cache.add(reqUrl);
  }
}
function saveRoutes(routes: string[]) {
  for (const route of routes) {
    const url = new URL(route, self.location.origin);
    const simplifiedRoute = `${url.origin}${url.pathname}`;
    precacheRoutes.add(simplifiedRoute);
    if (url.pathname.endsWith("index.html")) {
      // workbox provides the route as index.html
      const pathname = url.pathname.replace("index.html", "");
      const simplifiedRoute = `${url.origin}${pathname}`;
      precacheRoutes.add(simplifiedRoute);
    }
  }
}

// MARK: activate
export function cleanupStaleAssets(event: ExtendableEvent) {
  event.waitUntil(handleRemoveStaleAssets());
}
async function handleRemoveStaleAssets() {
  const cacheablePathsSet = new Set(cacheablePaths);
  const cache = await caches.open(cacheName);
  const cachedRequests = await cache.keys();
  const staleRequests = cachedRequests.filter(
    (req) => !cacheablePathsSet.has(req.url.replace(self.location.origin, "")),
  );
  log(
    "sw: removing stale assets:",
    staleRequests.length,
    "/",
    cachedRequests.length,
  );
  await Promise.all(staleRequests.map((req) => cache.delete(req)));
}

export function handleNavigationPreload(event: ExtendableEvent) {
  event.waitUntil(setNavigationPreload());
}
async function setNavigationPreload() {
  if (self.registration.navigationPreload) {
    await self.registration.navigationPreload.enable();
  }
}

// MARK: fetch
export function proxyFetch(event: FetchEvent) {
  const url = new URL(event.request.url);
  const route = `${url.origin}${url.pathname}`;
  if (precacheRoutes.has(route)) {
    event.respondWith(handlePrefetch(event));
  }
}
async function handlePrefetch(
  event: FetchEvent,
  url: string = event.request.url,
) {
  const preloadResponse: Promise<void | Response> = event.preloadResponse;
  let isDone = false;
  const preload = preloadResponse.then(async (res) => {
    if (!res) {
      if (event.request.mode !== "navigate") {
        // Preload only applies for navigation requests
        return;
      }
      // If preload is not enabled, then just do a normal fetch, as if preloading
      res = await fetch(event.request);
    }
    if (res.ok) {
      const cache = await caches.open(cacheName);
      await cache.put(url, res.clone());
    }
    isDone = true;
    return res;
  });
  event.waitUntil(preload);
  const cacheResult = raceSafeAny([wait(1000), preload]).then(async () => {
    if (isDone) return;
    const cache = await caches.open(cacheName);
    const match = await cache.match(url, { ignoreSearch: true });
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
        await cache.put(url, res.clone());
      }
    }
    return res;
  });
}

function raceSafe<T>(promises: Promise<T>[]): Promise<T> {
  const rejections: unknown[] = [];
  let isFinished = false;
  return new Promise((resolve, reject) => {
    for (const promise of promises) {
      promise.then(
        (r) => {
          if (!isFinished && r) {
            isFinished = true;
            resolve(r);
          }
        },
        (e) => {
          rejections.push(e);
          if (rejections.length === promises.length) {
            reject(rejections);
          }
        },
      );
    }
  });
}
function raceSafeAny(promises: Promise<unknown>[]): Promise<void> {
  let isFinished = false;
  return new Promise((resolve) => {
    for (const promise of promises) {
      promise.then(
        () => {
          if (!isFinished) {
            isFinished = true;
            resolve();
          }
        },
        () => {
          if (!isFinished) {
            isFinished = true;
            resolve();
          }
        },
      );
    }
  });
}
function wait(numMillis: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, numMillis));
}

const debug = true;
function log(...args: unknown[]) {
  if (debug) {
    setTimeout(() => {
      console.log(...args);
    }, 50);
  }
}
