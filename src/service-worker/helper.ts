const base = import.meta.env.BASE_URL;

declare const self: ServiceWorkerGlobalScope;

function getCacheablePaths() {
  const manifest = self.__WB_MANIFEST ?? [];
  return manifest.map(({ url, revision }) => ({
    url: `${base}${url}`,
    revision,
  }));
}

// if you ever change this, you need to delete existing cache storage
const version = "1";
export const cacheName = `sw-precache-v${version}`;
export const precacheRoutes = new Set();
export const cacheablePaths = getCacheablePaths();
