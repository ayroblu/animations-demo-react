import { cacheName, cacheablePaths } from "./helper";
import { log } from "./utils";

declare const self: ServiceWorkerGlobalScope;

// MARK: install
export function handlePrecache(event: ExtendableEvent) {
  event.waitUntil(handlePrecacheManifest());
}
async function handlePrecacheManifest() {
  const cache = await caches.open(cacheName);
  const cachedRequests = await cache.keys();
  const cachedUrls = new Set(
    cachedRequests
      .map(({ url }) => url)
      .map((url) => url.replace(self.location.origin, "")),
  );
  const newPaths = cacheablePaths.filter(
    ({ url, revision }) => revision || !cachedUrls.has(url),
  );
  log("sw: new precache:", newPaths.length, "/", cacheablePaths.length);

  for (const { url } of newPaths) {
    const reqUrl = new URL(url, self.location.origin);
    // TODO: update tests to support URL param to fetch
    await cache.add(reqUrl);
  }
}
