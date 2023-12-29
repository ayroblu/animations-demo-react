import { describe, beforeEach, vi, it, expect, afterEach } from "vitest";
import makeServiceWorkerEnv from "service-worker-mock";

// vi.mock(
//   "$service-worker",
//   (): SvelteServiceWorkerModule => ({
//     build: [
//       "/_app/immutable/entry/a.123.js",
//       "/_app/immutable/assets/a.321.css",
//     ],
//     files: ["/favicon.png"],
//     prerendered: ["/"],
//     base: "/",
//     version: Date.now().toString(),
//   }),
// );

const cacheName = "sw-precache-v1";

describe("service-worker", () => {
  beforeEach(() => {
    Object.assign(global, makeServiceWorkerEnv());
    vi.resetModules();
  });

  setupFetchMock();
  mockCacheSet();

  it("precache new assets", async () => {
    mockExtendableEvent();

    await import("./sw");
    await self.trigger("install");
    {
      const keys = Object.keys(self.snapshot().caches[cacheName]);
      expect(keys).toHaveLength(4);
    }
    await self.trigger("activate");
    {
      const keys = Object.keys(self.snapshot().caches[cacheName]);
      expect(keys).toHaveLength(4);
    }
    await self.trigger("fetch", "/_app/immutable/entry/a.123.js");
    {
      const keys = Object.keys(self.snapshot().caches[cacheName]);
      expect(keys).toHaveLength(4);
    }
  });

  it("precache with existing assets", async () => {
    await setupExistingCache();
    mockExtendableEvent();

    await import("./sw");
    {
      const keys = Object.keys(self.snapshot().caches[cacheName]);
      expect(keys).toHaveLength(4);
    }
    const values: Response[] = Object.values(self.snapshot().caches[cacheName]);
    const favicon = values.find((req) => req.url.includes("/favicon.png"));
    const root = values.find((req) => req.url === self.location.origin + "/");

    await self.trigger("install");
    {
      const keys = Object.keys(self.snapshot().caches[cacheName]);
      expect(keys).toHaveLength(6);
      const values: Response[] = Object.values(
        self.snapshot().caches[cacheName],
      );
      expect(values).toContain(favicon);
      // Prerendered root was rerequested
      expect(values).not.toContain(root);
    }
    await self.trigger("activate");
    {
      const keys = Object.keys(self.snapshot().caches[cacheName]);
      expect(keys).toHaveLength(4);
    }
    // await self.trigger('fetch', '/_app/immutable/entry/a.123.js');
  });
});

async function setupExistingCache() {
  const cache = await self.caches.open(cacheName);
  const savedUrls = [
    "/stale.412.css",
    "/stale.932.js",
    "/",
    "/favicon.png",
  ].map((path) => `${self.location.origin}${path}`);
  await cache.addAll(savedUrls);
}

async function setupFetchMock() {
  const originalFetch = global.fetch;

  beforeEach(() => {
    global.fetch = vi.fn().mockImplementation(getMockResponse);
  });

  afterEach(() => {
    global.fetch = originalFetch;
  });
}
async function getMockResponse(request: Request | URL | string) {
  const response = new Response("Response from fetch mock", {
    status: 200,
    statusText: "ok.",
  });
  if (request instanceof Request) {
    // @ts-expect-error readonly
    response.url = request.url;
  } else if (request instanceof URL) {
    // @ts-expect-error readonly
    response.url = request.href;
  } else {
    // @ts-expect-error readonly
    response.url = request;
  }
  return response;
}
async function mockExtendableEvent() {
  vi.spyOn(ExtendableEvent.prototype, "waitUntil").mockImplementation(function (
    this: ExtendableEvent,
    promise,
  ) {
    // @ts-expect-error service-worker-mock internal
    this.promise = promise;
  });
}
async function mockCacheSet() {
  // Mock to make this work, ideally should use URL type in the mock too
  // https://github.com/zackargyle/service-workers/blob/master/packages/service-worker-mock/models/Cache.js#L45C20-L45C31
  beforeEach(() => {
    Object.defineProperty(URL.prototype, "url", {
      configurable: true,
      get: function (this: URL) {
        return this.href;
      },
    });
  });
  afterEach(() => {
    // @ts-expect-error thing we're trying to mock
    delete URL.prototype.url;
  });
}
