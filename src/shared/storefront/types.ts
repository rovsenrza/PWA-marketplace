/**
 * Storefront model: what a store's own page is made of. The saved form (`SavedStorefront`, inside `Shop`) may
 * be partial or damaged; `resolveStorefront` turns it into a complete `Storefront` that screens can trust.
 * No imports from the rest of the domain: `ShopLike` and `ProductLike` are structural, so `Shop` and `Product`
 * fit them without a dependency cycle.
 */

export type StoreKind = 'mixtures' | 'kitchens' | 'furniture' | 'general';
/** The page's ground: the paper of the app, a tint of the store ink, or black. */
export type StoreGround = 'stock' | 'tint' | 'black';
/** The voice of headings: industrial is condensed caps, modern a wide geometric sans, classic a serif. */
export type StoreVoice = 'industrial' | 'modern' | 'classic';
export type CoverStyle = 'split' | 'full' | 'field';
export interface StorefrontTheme { ink: string; ground: StoreGround; voice: StoreVoice; cover: CoverStyle }
export interface StoreFilterDef { key: string; label: string; type: 'chips' | 'range'; unit?: string }

export type BlockType = 'cover' | 'services' | 'categories' | 'catalog' | 'lookbook' | 'steps' | 'swatches'
  | 'calculator' | 'promo' | 'gallery' | 'about' | 'addresses' | 'managers' | 'terms';
interface BlockBase<T extends BlockType> { id: string; type: T; on: boolean; title?: string; example?: boolean }

export interface CategoryItem { label: string; key: string; value: string; image?: string }
/** A pin on the lookbook photo; x and y are percentages of the photo. */
export interface LookbookPin { x: number; y: number; productId: string }
export interface StepItem { title: string; text: string }
export interface SwatchItem { name: string; color?: string; image?: string; note?: string }

export type CoverBlock = BlockBase<'cover'> & { line?: string; image?: string };
export type CategoriesBlock = BlockBase<'categories'> & { items: CategoryItem[] };
export type LookbookBlock = BlockBase<'lookbook'> & { image: string; text?: string; pins: LookbookPin[] };
export type StepsBlock = BlockBase<'steps'> & { items: StepItem[] };
export type SwatchesBlock = BlockBase<'swatches'> & { items: SwatchItem[] };
export type PromoBlock = BlockBase<'promo'> & { text: string; image?: string; sticker?: string; productId?: string };
export type AboutBlock = BlockBase<'about'> & { text?: string };
/** Blocks whose content comes from the shop record or its products (services, catalog, addresses…) carry no fields of their own. */
export type PlainBlock = BlockBase<'services' | 'catalog' | 'calculator' | 'gallery' | 'addresses' | 'managers' | 'terms'>;
export type StorefrontBlock = CoverBlock | CategoriesBlock | LookbookBlock | StepsBlock | SwatchesBlock | PromoBlock | AboutBlock | PlainBlock;

/** A complete storefront, as the screens use it. */
export interface Storefront { kind: StoreKind; theme: StorefrontTheme; blocks: StorefrontBlock[]; filters: StoreFilterDef[]; demo: boolean }
/** What `shop.storefront` holds on disk: everything optional, and `blocks` / `filters` unchecked. */
export interface SavedStorefront { kind?: StoreKind; theme?: Partial<StorefrontTheme>; blocks?: unknown[]; filters?: unknown[]; demo?: boolean }

/** The part of a shop this module reads. */
export interface ShopLike { name: string; category?: unknown; storefront?: SavedStorefront | null; [field: string]: unknown }
/** The part of a product this module reads. */
export interface ProductLike { id: string; store?: string; category?: unknown; price?: string | number; badge?: unknown; brand?: unknown; attrs?: Record<string, string | number>; [field: string]: unknown }
