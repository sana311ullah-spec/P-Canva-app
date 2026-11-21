import type { StockPhotoItem, WorkspaceState } from '../types/studio';

const DB_NAME = 'p-canva-offline-db';
const DB_VERSION = 1;
const STORE_NAME = 'kv';
const LS_WORKSPACE_KEY = 'p-canva-workspace-v1';
const LS_DELETED_IDS_KEY = 'p-canva-deleted-designs-v1';
const LS_CACHED_PHOTOS_KEY = 'p-canva-cached-photos-v1';

function openDB(): Promise<IDBDatabase | null> {
  if (typeof indexedDB === 'undefined') return Promise.resolve(null);
  return new Promise((resolve) => {
    try {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(STORE_NAME)) {
          db.createObjectStore(STORE_NAME);
        }
      };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbGet<T>(key: string): Promise<T | null> {
  const db = await openDB();
  if (!db) return null;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readonly');
      const store = tx.objectStore(STORE_NAME);
      const req = store.get(key);
      req.onsuccess = () => resolve((req.result as T) ?? null);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
}

async function idbSet<T>(key: string, value: T): Promise<void> {
  const db = await openDB();
  if (!db) return;
  return new Promise((resolve) => {
    try {
      const tx = db.transaction(STORE_NAME, 'readwrite');
      const store = tx.objectStore(STORE_NAME);
      store.put(value, key);
      tx.oncomplete = () => resolve();
      tx.onerror = () => resolve();
    } catch {
      resolve();
    }
  });
}

export function loadWorkspaceSync(): WorkspaceState | null {
  try {
    const raw = localStorage.getItem(LS_WORKSPACE_KEY);
    if (!raw) return null;
    const parsed = JSON.parse(raw) as WorkspaceState;
    if (parsed && Array.isArray(parsed.designs)) {
      return parsed;
    }
    return null;
  } catch {
    return null;
  }
}

export async function loadWorkspaceAsync(): Promise<WorkspaceState | null> {
  const fromIdb = await idbGet<WorkspaceState>('workspace_state');
  if (fromIdb && Array.isArray(fromIdb.designs)) {
    return fromIdb;
  }
  return loadWorkspaceSync();
}

export function saveWorkspaceLocal(state: WorkspaceState): void {
  try {
    localStorage.setItem(LS_WORKSPACE_KEY, JSON.stringify(state));
  } catch {
    // localStorage quota may be tight if user uploaded huge base64 images; IndexedDB handles large blobs
  }
  void idbSet('workspace_state', state);
}

export function getDeletedDesignIds(): string[] {
  try {
    const raw = localStorage.getItem(LS_DELETED_IDS_KEY);
    return raw ? (JSON.parse(raw) as string[]) : [];
  } catch {
    return [];
  }
}

export function markDesignDeletedLocal(designId: string): void {
  try {
    const cur = getDeletedDesignIds();
    if (!cur.includes(designId)) {
      localStorage.setItem(LS_DELETED_IDS_KEY, JSON.stringify([...cur, designId]));
    }
  } catch {
    // ignore
  }
}

export function mergeServerAndLocalWorkspace(
  serverState: WorkspaceState,
  localState: WorkspaceState | null,
): WorkspaceState {
  if (!localState) return serverState;
  const deletedSet = new Set(getDeletedDesignIds());

  // Preserve all local designs first so offline edits/creations are never overwritten
  const mergedDesigns = [...localState.designs];
  const localIds = new Set(localState.designs.map((d) => d.id));

  for (const srvDesign of serverState.designs) {
    if (!localIds.has(srvDesign.id) && !deletedSet.has(srvDesign.id)) {
      mergedDesigns.push(srvDesign);
    }
  }

  return {
    ...serverState,
    designs: mergedDesigns.filter((d) => !deletedSet.has(d.id)),
    brandKit: localState.brandKit || serverState.brandKit,
    uploads: localState.uploads.length > 0 ? localState.uploads : serverState.uploads,
    comments: localState.comments.length > 0 ? localState.comments : serverState.comments,
    pmTickets: localState.pmTickets.length > 0 ? localState.pmTickets : serverState.pmTickets,
  };
}

export function getCachedPhotos(): StockPhotoItem[] {
  try {
    const raw = localStorage.getItem(LS_CACHED_PHOTOS_KEY);
    return raw ? (JSON.parse(raw) as StockPhotoItem[]) : [];
  } catch {
    return [];
  }
}

export function cacheSearchPhotos(photos: StockPhotoItem[]): void {
  if (photos.length === 0) return;
  try {
    const existing = getCachedPhotos();
    const map = new Map<string, StockPhotoItem>();
    for (const p of photos) map.set(p.id, p);
    for (const p of existing) {
      if (!map.has(p.id)) map.set(p.id, p);
    }
    const merged = Array.from(map.values()).slice(0, 180);
    localStorage.setItem(LS_CACHED_PHOTOS_KEY, JSON.stringify(merged));
    void idbSet('cached_photos', merged);
  } catch {
    // ignore
  }
}

let warmedOnce = false;
export async function warmOfflineAssets(): Promise<void> {
  if (warmedOnce || typeof window === 'undefined' || !navigator.onLine) return;
  warmedOnce = true;

  const coreLocalAssets = [
    '/',
    '/index.html',
    '/manifest.json',
    '/icon.svg',
    '/icon-192.png',
    '/icon-512.png',
    '/pwa-maskable-512x512.png',
    '/apple-touch-icon.png',
    '/src/assets/images/photo_modern_workspace_1795238221169.jpg',
    '/src/assets/images/photo_product_headphones_1795238221093.jpg',
    '/src/assets/images/photo_botanical_skincare_1795238221151.jpg',
    '/src/assets/images/photo_abstract_waves_1795238220934.jpg',
    '/src/assets/images/avatar_design_lead_1795238221705.jpg',
  ];

  // Quietly warm browser & SW cache in the background without blocking UI
  if ('caches' in window) {
    try {
      const cache = await caches.open('pcanva-v2-shell');
      await Promise.allSettled(
        coreLocalAssets.map(async (url) => {
          const existing = await cache.match(url);
          if (!existing) {
            const res = await fetch(url);
            if (res.ok) await cache.put(url, res);
          }
        }),
      );
    } catch {
      // Non-fatal
    }
  }
}
