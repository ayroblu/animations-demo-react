declare const self: ServiceWorkerGlobalScope;

function getCacheablePaths() {
  const manifest = self.__WB_MANIFEST ?? [];
  return manifest;
}

// if you ever change this, you need to delete existing cache storage
const version = "1";
export const cacheName = `sw-precache-v${version}`;
export const precacheRoutes = new Set();
export const cacheablePaths = getCacheablePaths();
