/**
 * Catalogue store: one per page (app or admin), with one set of rules for both.
 * Legacy code works with the old globals (productsDb, storiesData, …): they are accessors on window
 * that return the LIVE object (legacy mutates it in place) and replace it on assignment.
 */
import type { CatalogPart, CatalogState } from './catalog';
import { mergeCatalog } from './catalog';
import { createLocalCatalogRepository, type CatalogRepository, type SaveOptions, type SaveResult } from './catalog-repository';

/** Legacy global name → path in the state. */
export const LEGACY_GLOBALS = {
  productsDb: ['products'],
  shopsProfileDb: ['shops'],
  storiesData: ['stories'],
  promoData: ['promo'],
  directoryDb: ['directory'],
  vacanciesDb: ['vacancies'],
  onboardingData: ['onboarding'],
  showcaseModerationDb: ['showcases'],
  lifehacksDb: ['lifehacks', 'items'],
  lifehackCategories: ['lifehacks', 'categories'],
  lifehackSavedIds: ['lifehackSaved'],
} as const satisfies Record<string, readonly [CatalogPart] | readonly ['lifehacks', 'items' | 'categories']>;
export type LegacyGlobal = keyof typeof LEGACY_GLOBALS;

export class CatalogStore {
  state: CatalogState;

  constructor(
    private readonly seed: () => CatalogState,
    private readonly repo: CatalogRepository = createLocalCatalogRepository(),
  ) {
    this.state = seed();
  }

  /** The seed plus what's stored (the merge rules are in catalog.ts). */
  load(): void { this.state = mergeCatalog(this.seed(), this.repo.load()); }

  save(parts?: CatalogPart[], opts?: SaveOptions): SaveResult { return this.repo.save(this.state, parts, opts); }

  onExternalChange(cb: () => void): () => void { return this.repo.onExternalChange(cb); }

  private read(path: readonly string[]): unknown {
    let v: unknown = this.state;
    for (const k of path) v = (v as Record<string, unknown>)[k];
    return v;
  }

  private write(path: readonly string[], value: unknown): void {
    const target = path.slice(0, -1).reduce<Record<string, unknown>>((o, k) => o[k] as Record<string, unknown>, this.state as unknown as Record<string, unknown>);
    target[path[path.length - 1]] = value;
  }

  /** Accessors for the old globals. A name must not be declared with let/const in legacy code. */
  installLegacyAccessors(names: LegacyGlobal[] = Object.keys(LEGACY_GLOBALS) as LegacyGlobal[]): void {
    for (const name of names) {
      const path = LEGACY_GLOBALS[name];
      Object.defineProperty(window, name, {
        configurable: true,
        get: () => this.read(path),
        set: (v: unknown) => this.write(path, v),
      });
    }
  }
}

/** The seed from SEED (seed.js, a classic script: it loads earlier than the modules). */
export function seedFromLegacy(): CatalogState {
  const S = (window as unknown as { SEED: Record<string, () => unknown> }).SEED;
  return {
    products: S.products() as CatalogState['products'],
    shops: S.shops() as CatalogState['shops'],
    stories: S.stories() as CatalogState['stories'],
    promo: S.promo() as CatalogState['promo'],
    directory: S.directory() as CatalogState['directory'],
    vacancies: S.vacancies() as CatalogState['vacancies'],
    onboarding: S.onboarding() as CatalogState['onboarding'],
    showcases: [],
    lifehacks: { categories: S.lifehackCategories() as string[], items: S.lifehacks() as CatalogState['lifehacks']['items'] },
    lifehackSaved: [],
  };
}
