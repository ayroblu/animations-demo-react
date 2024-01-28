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
export const precacheRoutes = new Set<string>();
export const cacheablePaths = getCacheablePaths();

function saveRoutes(routes: string[]) {
  for (const route of routes) {
    const url = new URL(route, self.location.origin);
    const simplifiedRoute = `${url.origin}${url.pathname}`;
    precacheRoutes.add(simplifiedRoute);
  }
}
saveRoutes(cacheablePaths.map(({ url }) => url));

export const revisionParam = "__wb_revision";
export function getUrlWithRevision(url: string, revision: string): string {
  if (url.includes("/index.html")) {
    return url;
  }
  const param = `${revisionParam}=${revision}`;
  const prefix = url.includes("?") ? "&" : "?";
  return `${url}${prefix}${param}`;
}
export function updateUrlWithRevision(url: URL, revision: string): void {
  if (url.pathname.includes("/index.html")) {
    return;
  }
  if (revision) {
    url.searchParams.append(revisionParam, revision);
  }
}
