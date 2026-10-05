/**
 * What the import remembers: the column mapping per store and file layout (the next upload of the same
 * 1C export needs no setup) and the history of imports. localStorage today; the server keeps them later.
 */
import { StorageKeys } from '../storage/keys';
import { IMPORT_FIELD_LABELS, type ImportField, type ImportSource } from './types';

export interface ImportRecord {
  id: string;
  /** file names, comma-separated */
  file: string;
  store: string;
  source: ImportSource;
  at: number;
  rows: number;
  created: number;
  updated: number;
  /** visible to buyers right after the import */
  published: number;
  /** new products saved without a photo (drafts) */
  withoutPhoto: number;
  /** rows skipped with an error */
  issues: number;
}

export interface ImportRepository {
  mapping(store: string, layout: string): ImportField[] | null;
  rememberMapping(store: string, layout: string, mapping: ImportField[]): void;
  history(): ImportRecord[];
  record(r: ImportRecord): void;
}

const HISTORY_LIMIT = 30;
const MAPPINGS_LIMIT = 50;
type Mappings = Record<string, { mapping: ImportField[]; at: number }>;

export function createLocalImportRepository(storage: Storage | undefined = globalThis.localStorage): ImportRepository {
  const read = <T>(key: string, fallback: T): T => {
    try { const raw = storage?.getItem(key); return raw == null ? fallback : (JSON.parse(raw) as T); } catch { return fallback; }
  };
  const write = (key: string, value: unknown) => {
    try { storage?.setItem(key, JSON.stringify(value)); } catch { /* не поместилось — живёт до перезагрузки */ }
  };
  const id = (store: string, layout: string) => JSON.stringify([store, layout]);
  return {
    mapping(store, layout) {
      const m = read<Mappings>(StorageKeys.importMappings, {})[id(store, layout)];
      if (!Array.isArray(m?.mapping)) return null;
      return m.mapping.map((f) => (f in IMPORT_FIELD_LABELS ? f : 'skip'));
    },
    rememberMapping(store, layout, mapping) {
      const all = read<Mappings>(StorageKeys.importMappings, {});
      all[id(store, layout)] = { mapping, at: Date.now() };
      const kept = Object.entries(all).sort((a, b) => b[1].at - a[1].at).slice(0, MAPPINGS_LIMIT);
      write(StorageKeys.importMappings, Object.fromEntries(kept));
    },
    history() {
      const h = read<unknown>(StorageKeys.importHistory, []);
      return Array.isArray(h) ? (h as ImportRecord[]) : [];
    },
    record(r) {
      write(StorageKeys.importHistory, [r, ...this.history()].slice(0, HISTORY_LIMIT));
    },
  };
}
