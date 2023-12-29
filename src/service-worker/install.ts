import { cacheName, cacheablePaths, precacheRoutes } from "./helper";
import { log } from "./utils";

declare const self: ServiceWorkerGlobalScope;

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
  }
}
