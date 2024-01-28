import { cacheName, cacheablePaths, getUrlWithRevision } from "./helper";
import { log } from "./utils";

declare const self: ServiceWorkerGlobalScope;

// MARK: activate
export function cleanupStaleAssets(event: ExtendableEvent) {
  event.waitUntil(handleRemoveStaleAssets());
}
async function handleRemoveStaleAssets() {
  const cacheablePathsSet = new Set(
    cacheablePaths.map(({ url, revision }) =>
      revision ? getUrlWithRevision(url, revision) : url,
    ),
  );
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
  // if (staleRequests.length) {
  //   log(
  //     "staleRequests",
  //     staleRequests.map(({ url }) => url),
  //     cacheablePathsSet,
  //   );
  // }
  await Promise.all(staleRequests.map((req) => cache.delete(req)));
}

export function handleNavigationPreload(event: ExtendableEvent) {
  event.waitUntil(setNavigationPreload());
}
async function setNavigationPreload() {
  if (self.registration.navigationPreload) {
    if (process.env.NODE_ENV === "production") {
      await self.registration.navigationPreload.enable();
    } else {
      // In devel, we have no manifest, so can't identify precache
      await self.registration.navigationPreload.disable();
    }
  }
}
