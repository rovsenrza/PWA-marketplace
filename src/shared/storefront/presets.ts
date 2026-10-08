import { inkFor } from './color';
import type { BlockType, StepsBlock, StoreFilterDef, StoreKind, StorefrontBlock, StorefrontTheme } from './types';

/** Every block a storefront can hold, in the order the admin offers them. */
export const BLOCK_TYPES: readonly BlockType[] = [
  'cover', 'services', 'categories', 'catalog', 'lookbook', 'steps', 'swatches',
  'calculator', 'promo', 'gallery', 'about', 'addresses', 'managers', 'terms',
];

/** The skeleton of every storefront: the admin may reorder these blocks but never delete or hide them. */
export const REQUIRED_BLOCKS: readonly BlockType[] = ['cover', 'about', 'services', 'catalog', 'addresses', 'managers', 'terms'];

export const KIND_LABELS: Record<StoreKind, string> = {
  mixtures: 'Строительные смеси и материалы',
  kitchens: 'Кухни',
  furniture: 'Мебель и аксессуары',
  general: 'Другое',
};

export const BLOCK_LABELS: Record<BlockType, string> = {
  cover: 'Обложка',
  services: 'Услуги',
  categories: 'Разделы магазина',
  catalog: 'Каталог и фильтры',
  lookbook: 'Образ с товарами',
  steps: 'Как мы работаем',
  swatches: 'Материалы и цвета',
  calculator: 'Калькулятор расхода',
  promo: 'Акция',
  gallery: 'Фото и видео',
  about: 'О компании',
  addresses: 'Адреса, карта и часы',
  managers: 'Менеджеры',
  terms: 'Оплата и доставка',
};

/* ---------------------------------------------------------------------------------------------- filters */

const chips = (key: string, label = key, unit?: string): StoreFilterDef =>
  unit ? { key, label, type: 'chips', unit } : { key, label, type: 'chips' };
const range = (key: string, label: string, unit: string): StoreFilterDef => ({ key, label, type: 'range', unit });
const price = (): StoreFilterDef => range('price', 'Цена', '₽');

/** The filters a store of this kind starts with; price is always last. A fresh array on every call. */
export function presetFilters(kind: StoreKind): StoreFilterDef[] {
  switch (kind) {
    case 'mixtures':
      return [chips('Тип'), chips('Основа'), chips('Фасовка, кг', 'Фасовка', 'кг'), chips('Применение'), chips('Бренд'), price()];
    case 'kitchens':
      return [chips('Планировка'), chips('Стиль'), chips('Фасады'), range('Длина, м', 'Длина', 'м'), price()];
    case 'furniture':
      return [chips('Комната'), chips('Тип'), chips('Материал'), chips('Цвет'), range('Ширина, см', 'Ширина', 'см'), price()];
    case 'general':
      return [price()];
  }
}

/* ----------------------------------------------------------------------------------------------- theme */

const LOOKS: Record<StoreKind, Omit<StorefrontTheme, 'ink'>> = {
  mixtures: { ground: 'stock', voice: 'industrial', cover: 'field' },
  kitchens: { ground: 'black', voice: 'modern', cover: 'full' },
  furniture: { ground: 'tint', voice: 'classic', cover: 'split' },
  general: { ground: 'stock', voice: 'modern', cover: 'split' },
};

/** The look a store of this kind starts with; the ink is the store's stable family ink. */
export function presetTheme(kind: StoreKind, storeName: string): StorefrontTheme {
  return { ink: inkFor(storeName), ...LOOKS[kind] };
}

/* ---------------------------------------------------------------------------------------------- blocks */

const defaultId = (type: BlockType) => `${type}-1`;

/** An empty block of this type, switched on, with its content arrays in place. */
export function newBlock(type: BlockType, id: string = defaultId(type)): StorefrontBlock {
  const base = { id, on: true };
  switch (type) {
    case 'categories': return { ...base, type, items: [] };
    case 'lookbook': return { ...base, type, image: '', pins: [] };
    case 'steps': return { ...base, type, items: [] };
    case 'swatches': return { ...base, type, items: [] };
    case 'promo': return { ...base, type, text: '' };
    case 'cover': return { ...base, type };
    case 'about': return { ...base, type };
    default: return { ...base, type };
  }
}

const LAYOUTS: Record<StoreKind, readonly BlockType[]> = {
  mixtures: ['cover', 'services', 'categories', 'calculator', 'catalog', 'gallery', 'about', 'addresses', 'managers', 'terms'],
  kitchens: ['cover', 'steps', 'catalog', 'gallery', 'services', 'about', 'addresses', 'managers', 'terms'],
  furniture: ['cover', 'categories', 'catalog', 'gallery', 'services', 'about', 'addresses', 'managers', 'terms'],
  general: ['cover', 'catalog', 'gallery', 'services', 'about', 'addresses', 'managers', 'terms'],
};

/** The process every kitchen workshop follows, as a starting point; marked as an example until the store edits it. */
function kitchenSteps(): StepsBlock {
  return {
    id: defaultId('steps'), type: 'steps', on: true, title: 'Как мы работаем', example: true,
    items: [
      { title: 'Замер', text: 'Специалист приезжает и снимает размеры помещения.' },
      { title: 'Проект', text: 'Планировка, фасады и встроенная техника под ваши размеры.' },
      { title: 'Производство', text: 'Кухню изготавливают по согласованному проекту.' },
      { title: 'Доставка и монтаж', text: 'Привозим и собираем кухню на месте.' },
    ],
  };
}

/** The blocks a store of this kind starts with, cover first, the whole skeleton included. Fresh objects each call. */
export function presetBlocks(kind: StoreKind): StorefrontBlock[] {
  return LAYOUTS[kind].map((type) => (type === 'steps' ? kitchenSteps() : newBlock(type)));
}
