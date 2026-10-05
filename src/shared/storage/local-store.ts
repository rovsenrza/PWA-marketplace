import type { StorageKey } from './keys';

/**
 * Safe localStorage access. In private mode, with storage blocked, or when quota runs out,
 * reads return the fallback and writes are dropped quietly, so the app never crashes on storage.
 */
export function readJSON<T>(key: StorageKey, fallback: T): T {
  try {
    const raw = localStorage.getItem(key);
    return raw == null ? fallback : (JSON.parse(raw) as T);
  } catch {
    return fallback;
  }
}

export function writeJSON(key: StorageKey, value: unknown): void {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch {
    /* хранилище недоступно — состояние живёт до перезагрузки */
  }
}

export function readSet(key: StorageKey): Set<string> {
  return new Set(readJSON<string[]>(key, []));
}

export function writeSet(key: StorageKey, set: Set<string>): void {
  writeJSON(key, Array.from(set));
}

/** Subscribe to changes of a key from other tabs (for example, the admin panel). */
export function onExternalChange(key: StorageKey, cb: () => void): () => void {
  const handler = (e: StorageEvent) => {
    if (e.key === key || e.key === null) cb();
  };
  window.addEventListener('storage', handler);
  return () => window.removeEventListener('storage', handler);
}

/**
 * Browsers keep about 5 MB per site in localStorage (Chrome counts 5 M characters; Safari and Firefox
 * are close). A conservative figure: the real limit is checked by the save itself.
 */
export const STORAGE_CAPACITY_CHARS = 5_000_000;

/** Characters in use (keys and values), for the estimate of how much more fits. */
export function storageUsage(storage: Storage | undefined = globalThis.localStorage): number {
  let total = 0;
  try {
    for (let i = 0; i < (storage?.length ?? 0); i++) {
      const key = storage!.key(i) ?? '';
      total += key.length + (storage!.getItem(key)?.length ?? 0);
    }
  } catch { /* хранилище недоступно */ }
  return total;
}

/** Length of a stored value in characters (0 when there's none). */
export function storedLength(key: StorageKey, storage: Storage | undefined = globalThis.localStorage): number {
  try { return storage?.getItem(key)?.length ?? 0; } catch { return 0; }
}
