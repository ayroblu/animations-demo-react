export {};

declare global {
  interface ServiceWorkerGlobalScope {
    __WB_MANIFEST?: Array<PrecacheEntry>;
  }
}
export interface PrecacheEntry {
  integrity?: string;
  url: string;
  revision?: string | null;
}
