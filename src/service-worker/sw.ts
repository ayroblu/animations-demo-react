/// <reference lib="webworker" />
import "./types";
import { proxyFetch } from "./fetch";
import { handlePrecache } from "./install";
import { cleanupStaleAssets, handleNavigationPreload } from "./activate";

declare const self: ServiceWorkerGlobalScope;

self.addEventListener("fetch", proxyFetch);

self.addEventListener("install", handlePrecache);
// Skip Waiting makes the new service worker the active service worker
self.addEventListener("install", () => self.skipWaiting());
// claim makes the new requests go to the new service worker
self.addEventListener("activate", (event) =>
  event.waitUntil(self.clients.claim()),
);
self.addEventListener("activate", cleanupStaleAssets);

self.addEventListener("activate", handleNavigationPreload);
