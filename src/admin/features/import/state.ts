/** The import wizard's state and the computations both the screen and the actions need. */
import type { Product } from '../../../shared/domain/types';
import { applyImport, type ImportPlan } from '../../../shared/import/plan';
import type { ImportRecord } from '../../../shared/import/repository';
import type { ImportField, ImportTable, ProductDraft, RowIssue } from '../../../shared/import/types';
import { StorageKeys } from '../../../shared/storage/keys';
import { STORAGE_CAPACITY_CHARS, storageUsage, storedLength } from '../../../shared/storage/local-store';
import type { PhotoSet } from './photos';

export type Step = 1 | 2 | 3 | 4 | 5;

export interface LoadedFile {
  names: string[];
  table: ImportTable;
  /** the export came as a zip: its photos can be taken on the photo step without uploading again */
  archive?: { name: string; bytes: Uint8Array; photos: number };
}

export interface Wizard {
  step: Step;
  store: string;
  file: LoadedFile | null;
  mapping: ImportField[];
  /** what the system proposed (suggested or remembered), to mark the recognised columns */
  auto: ImportField[];
  remembered: boolean;
  drafts: ProductDraft[];
  issues: RowIssue[];
  plan: ImportPlan | null;
  /** store and mapping the plan was built for: an unchanged mapping keeps the plan and the photos */
  planKey: string;
  /** answers on «similar» products by file row: yes = take its photo and description */
  decisions: Map<number, 'yes' | 'no'>;
  photos: PhotoSet | null;
  /** a running operation, shown instead of the drop zone */
  busy: string;
  error: string;
  /** the import that just finished (shown on the first step) */
  done: ImportRecord | null;
}

export const fresh = (store: string): Wizard => ({
  step: 1, store, file: null, mapping: [], auto: [], remembered: false, drafts: [], issues: [], plan: null,
  planKey: '', decisions: new Map(), photos: null, busy: '', error: '', done: null,
});

/** Fields without which a product can't be imported (and recognised next time). */
export const REQUIRED: ImportField[] = ['sku', 'title', 'price'];
export const missingFields = (mapping: ImportField[]): ImportField[] => REQUIRED.filter((f) => !mapping.includes(f));

export const reuseSet = (w: Wizard): Set<number> => new Set([...w.decisions].filter(([, a]) => a === 'yes').map(([row]) => row));

/** Data rows of the file (empty ones are not counted). */
export const dataRows = (t: ImportTable): number => t.rows.filter((r) => r.some((c) => c.trim())).length;

/** The catalogue as it will be after the import (nothing is changed). */
export const dryRun = (w: Wizard, products: Record<string, Product>) =>
  applyImport(w.plan!, products, { reuse: reuseSet(w), photos: w.photos?.bySku });

/** Characters stored outside the products part (the part itself is replaced by the save). */
const othersStored = () => storageUsage() - storedLength(StorageKeys.products);

/**
 * How many characters of photos still fit: the browser's capacity minus everything else stored,
 * minus the catalogue after the import without new photos. An estimate; the save has the last word.
 */
export function roomForPhotos(w: Wizard, products: Record<string, Product>): number {
  if (!w.plan) return 0;
  const after = JSON.stringify(applyImport(w.plan, products, { reuse: reuseSet(w) }).products).length;
  return Math.floor(STORAGE_CAPACITY_CHARS * 0.95) - othersStored() - after;
}

/** What the browser's storage will hold after the import, against its capacity. */
export function sizeEstimate(w: Wizard, products: Record<string, Product>): { needed: number; capacity: number } {
  return { needed: othersStored() + JSON.stringify(dryRun(w, products).products).length, capacity: STORAGE_CAPACITY_CHARS };
}
