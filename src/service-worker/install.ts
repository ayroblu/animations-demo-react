import { cacheName, cacheablePaths, updateUrlWithRevision } from "./helper";
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
  let counter = 0;

  for (const { url, revision } of newPaths) {
    const reqUrl = new URL(url, self.location.origin);
    if (revision) {
      updateUrlWithRevision(reqUrl, revision);
    }
    // TODO: update tests to support URL param to fetch
    const match = await cache.match(reqUrl);
    if (!match) {
      counter += 1;
      // log("new", reqUrl.href);
      await cache.add(reqUrl);
    }
  }
  log("sw: new precache:", counter, "/", cacheablePaths.length);
}
