/**
 * The catalogue as a whole: what's stored and how it combines with the seed.
 * One merge rule for the app and the admin (before, each page had its own and they disagreed).
 * Pure functions: shared by the localStorage repository and, later, the server data migration.
 */
import type {
  Directory, Lifehack, OnboardingSlide, Product, PromoSlide, Shop, ShowcaseRequest, Specialist, Story, Vacancy,
} from '../domain/types';

export interface CatalogState {
  products: Record<string, Product>;
  shops: Record<string, Shop>;
  stories: Story[];
  promo: PromoSlide[];
  directory: Directory;
  vacancies: Vacancy[];
  onboarding: OnboardingSlide[];
  showcases: ShowcaseRequest[];
  lifehacks: { categories: string[]; items: Lifehack[] };
  lifehackSaved: string[];
}
export type CatalogPart = keyof CatalogState;
export const CATALOG_PARTS: CatalogPart[] = ['products', 'shops', 'stories', 'promo', 'directory', 'vacancies', 'onboarding', 'showcases', 'lifehacks', 'lifehackSaved'];

/** Stored values by part; undefined means nothing was stored. */
export type StoredCatalog = { [K in CatalogPart]?: unknown };

const isObj = (v: unknown): v is Record<string, unknown> => !!v && typeof v === 'object' && !Array.isArray(v);
const nonEmptyArray = (v: unknown): v is unknown[] => Array.isArray(v) && v.length > 0;

/**
 * Products: a stored record wins field by field; the seed only fills gaps; new (store-created)
 * products are added whole. Before, the app took only 6 fields from storage for seeded products,
 * so admin edits to the description, photos, old price and badge didn't reach the buyer.
 */
export function mergeProducts(seed: Record<string, Product>, stored: unknown): Record<string, Product> {
  const out: Record<string, Product> = { ...seed };
  if (!isObj(stored)) return out;
  for (const [id, rec] of Object.entries(stored)) {
    if (!isObj(rec)) continue;
    out[id] = { ...(seed[id] ?? {}), ...rec, id: String(rec.id ?? id) } as Product;
  }
  return out;
}

/** Stores: likewise per field (before, a stored record replaced the seed whole). */
export function mergeShops(seed: Record<string, Shop>, stored: unknown): Record<string, Shop> {
  const out: Record<string, Shop> = { ...seed };
  if (!isObj(stored)) return out;
  for (const [name, rec] of Object.entries(stored)) {
    if (isObj(rec)) out[name] = { ...(seed[name] ?? {}), ...rec } as Shop;
  }
  return out;
}

/**
 * Directory: only specialists are merged, as in the prototype. Stored ones come first; seed
 * specialists missing from storage are appended; a missing craft is filled from the seed.
 */
export function mergeDirectory(seed: Directory, stored: unknown): Directory {
  const out: Directory = { ...seed };
  if (!isObj(stored) || !Array.isArray(stored.specialists)) return out;
  const list = (stored.specialists as Specialist[]).filter((s) => s && s.id);
  const byId = new Map(list.map((s) => [s.id, s]));
  for (const s of seed.specialists ?? []) {
    if (!s?.id) continue;
    const have = byId.get(s.id);
    if (!have) { list.push(s); byId.set(s.id, s); } else if (!have.craft && s.craft) have.craft = s.craft;
  }
  out.specialists = list;
  return out;
}

/**
 * Lifehacks: the old format is an array of articles; the new one is { categories, items }.
 * Stored categories are completed with the base ones (none are lost).
 */
export function mergeLifehacks(seed: { categories: string[]; items: Lifehack[] }, stored: unknown): { categories: string[]; items: Lifehack[] } {
  if (nonEmptyArray(stored)) return { categories: [...seed.categories], items: stored as Lifehack[] };
  if (isObj(stored) && Array.isArray(stored.items)) {
    const cats = nonEmptyArray(stored.categories) ? (stored.categories as string[]).slice() : [...seed.categories];
    for (const c of seed.categories) if (!cats.includes(c)) cats.push(c);
    return { categories: cats, items: stored.items as Lifehack[] };
  }
  return { categories: [...seed.categories], items: seed.items };
}

/** The whole catalogue: the seed plus whatever was stored, part by part. */
export function mergeCatalog(seed: CatalogState, stored: StoredCatalog): CatalogState {
  const s = stored;
  return {
    products: mergeProducts(seed.products, s.products),
    shops: mergeShops(seed.shops, s.shops),
    /* пустой сохранённый список историй / онбординга не затирает стартовый (как в прототипе) */
    stories: nonEmptyArray(s.stories) ? (s.stories as Story[]) : seed.stories,
    onboarding: nonEmptyArray(s.onboarding) ? (s.onboarding as OnboardingSlide[]) : seed.onboarding,
    /* вакансии, промо, заявки витрин: сохранённое — как есть, даже пустой список */
    vacancies: Array.isArray(s.vacancies) ? (s.vacancies as Vacancy[]) : seed.vacancies,
    promo: Array.isArray(s.promo) ? (s.promo as PromoSlide[]) : seed.promo,
    showcases: Array.isArray(s.showcases) ? (s.showcases as ShowcaseRequest[]) : seed.showcases,
    directory: mergeDirectory(seed.directory, s.directory),
    lifehacks: mergeLifehacks(seed.lifehacks, s.lifehacks),
    lifehackSaved: Array.isArray(s.lifehackSaved) ? (s.lifehackSaved as unknown[]).filter((x): x is string => typeof x === 'string') : seed.lifehackSaved,
  };
}

/** Removes embedded files (data: URLs) from a value: for a retry save when the quota ran out. */
export function stripEmbeddedMedia<T>(value: T): T {
  if (typeof value === 'string') return (value.startsWith('data:') ? '' : value) as T;
  if (Array.isArray(value)) {
    return value.filter((x) => !(typeof x === 'string' && x.startsWith('data:'))).map((x) => stripEmbeddedMedia(x)) as T;
  }
  if (value && typeof value === 'object') {
    const out: Record<string, unknown> = {};
    for (const [k, v] of Object.entries(value)) out[k] = stripEmbeddedMedia(v);
    return out as T;
  }
  return value;
}

/**
 * What goes into storage. Embedded photos are saved together with the data (they're compressed by
 * MediaStore). If the part doesn't fit, the repository repeats the save without them (stripMedia).
 * A published product that loses its only photo that way goes back to drafts: buyers never see
 * an empty card (the rule «no photo, not in the catalogue»).
 */
export function toStored(part: CatalogPart, state: CatalogState, stripMedia = false): unknown {
  const value = state[part];
  if (!stripMedia) return value;
  const stripped = stripEmbeddedMedia(value);
  if (part === 'products') {
    for (const [id, p] of Object.entries(stripped as Record<string, Product>)) {
      if (!p.image && state.products[id]?.image && p.status === 'published') p.status = 'draft';
    }
  }
  return stripped;
}
