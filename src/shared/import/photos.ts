/**
 * Photos for imported products. A photo belongs to a product by the path given in the file
 * (CommerceML «Картинка», a «Фото» column with file names) or by the article in the file name:
 * PS-0412.jpg is the main photo, PS-0412_2.jpg the second one.
 */
const PHOTO_EXT = /\.(jpe?g|png|webp)$/i;
const skuKey = (sku: string) => sku.trim().toLowerCase();
const normPath = (p: string) => p.trim().replace(/\\/g, '/').replace(/^(\.\/|\/)+/, '').toLowerCase();
const baseName = (p: string) => normPath(p).split('/').pop() ?? '';
const SUFFIX = /[_ ](\d{1,2})$/;

/** A photo, not a system file of the archive (__MACOSX, .DS_Store, «._name» from macOS). */
export function isPhotoPath(path: string): boolean {
  const parts = normPath(path).split('/');
  const name = parts[parts.length - 1];
  return PHOTO_EXT.test(name) && !name.startsWith('.') && !parts.includes('__macosx');
}

/** A zip archive by its name (photos or a packed export). */
export const isZipName = (name: string): boolean => /\.zip$/i.test(name);

/** A link to a photo, as opposed to a file name inside the 1C archive. */
export const isPhotoUrl = (value: string): boolean => /^https?:\/\/\S+$/i.test(value.trim());

/** Photo file name → article: 'PS-0412.jpg', 'Фото/ps-0412_2.PNG' → 'ps-0412'. */
export function skuFromPhotoName(fileName: string): string {
  return skuKey(baseName(fileName).replace(/\.[a-z0-9]+$/i, '').replace(SUFFIX, ''));
}

/** Position among the photos of one article: no suffix = 0 (the main one), «_2» = 2. */
const photoOrder = (fileName: string) => Number(baseName(fileName).replace(/\.[a-z0-9]+$/i, '').match(SUFFIX)?.[1] ?? 0);

/** A product that needs photos: its article and, if the file names one, the photo's path. */
export interface PhotoTarget { sku: string; photoRef?: string }

export interface PhotoMatch {
  /** article (lower case) → photo paths, the main one first */
  bySku: Map<string, string[]>;
  /** photos that belong to no product of this import */
  unmatched: string[];
}

export function matchPhotos(paths: string[], targets: PhotoTarget[]): PhotoMatch {
  const skus = new Set(targets.map((t) => skuKey(t.sku)));
  const byRef = new Map<string, string>();
  const byRefName = new Map<string, string>();
  for (const t of targets) {
    if (!t.photoRef) continue;
    byRef.set(normPath(t.photoRef), skuKey(t.sku));
    byRefName.set(baseName(t.photoRef), skuKey(t.sku));
  }
  /* путь из файла может лежать в архиве внутри папки: «Выгрузка/import_files/ab/x.jpg» */
  const refFor = (path: string) => {
    const parts = normPath(path).split('/');
    for (let i = 0; i < parts.length; i++) {
      const hit = byRef.get(parts.slice(i).join('/'));
      if (hit) return hit;
    }
    return byRefName.get(parts[parts.length - 1]);
  };
  const found = new Map<string, Array<{ path: string; order: number }>>();
  const unmatched: string[] = [];
  for (const path of paths) {
    if (!isPhotoPath(path)) continue;
    const ref = refFor(path);
    const key = ref ?? skuFromPhotoName(path);
    if (!skus.has(key)) { unmatched.push(path); continue; }
    const list = found.get(key) ?? [];
    list.push({ path, order: ref ? 0 : photoOrder(path) });
    found.set(key, list);
  }
  const bySku = new Map<string, string[]>();
  for (const [key, list] of found) {
    bySku.set(key, list.sort((a, b) => a.order - b.order || a.path.localeCompare(b.path)).map((x) => x.path));
  }
  return { bySku, unmatched };
}
