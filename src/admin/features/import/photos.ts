/**
 * Import photos in the browser: files or zip archives → photos matched to products → compressed
 * through MediaStore within the room left in the browser's storage. Main photos go first, so as many
 * products as possible get one; second photos only if room remains.
 */
import { extractArchive, listArchive } from '../../../shared/import/archive';
import { isPhotoPath, isZipName, type PhotoMatch } from '../../../shared/import/photos';
import type { MediaStore } from '../../../shared/media/types';

/** A photo that is read only when it's needed (an archive may hold hundreds). */
export interface PhotoSource { path: string; read: () => Promise<File> }

export interface PhotoSet {
  /** what was chosen: file and archive names */
  label: string;
  /** article (lower case) → compressed photos, the main one first */
  bySku: Map<string, string[]>;
  /** products that got at least one photo */
  matched: number;
  /** photos with no product of this import */
  unmatched: number;
  /** matched photos that didn't fit the browser's storage */
  noRoom: number;
  /** photos that couldn't be read */
  failed: number;
}

const MIME: Record<string, string> = { jpg: 'image/jpeg', jpeg: 'image/jpeg', png: 'image/png', webp: 'image/webp' };
const mimeOf = (name: string) => MIME[name.split('.').pop()?.toLowerCase() ?? ''] ?? 'application/octet-stream';
const baseName = (path: string) => path.split('/').pop() ?? path;

/** The photos among loose files and inside archives (an archive is unpacked one photo at a time). */
export async function photoSources(files: Array<{ name: string; bytes?: Uint8Array; file?: File }>): Promise<PhotoSource[]> {
  const out: PhotoSource[] = [];
  for (const f of files) {
    if (isZipName(f.name) && f.bytes) {
      const bytes = f.bytes;
      for (const path of (await listArchive(bytes)).filter(isPhotoPath)) {
        out.push({
          path,
          read: async () => {
            const [entry] = await extractArchive(bytes, (n) => n === path);
            return new File([entry.bytes as BlobPart], baseName(path), { type: mimeOf(path) });
          },
        });
      }
    } else if (f.file && isPhotoPath(f.name)) {
      const file = f.file;
      out.push({ path: f.name, read: async () => file });
    }
  }
  return out;
}

/** Below this, no compressed photo fits any more: the rest is counted as «no room». */
const MIN_PHOTO_CHARS = 8_000;

export async function embedPhotos(
  sources: PhotoSource[], match: PhotoMatch, room: number, media: MediaStore,
  progress: (done: number, total: number) => void,
): Promise<Omit<PhotoSet, 'label'>> {
  const byPath = new Map(sources.map((s) => [s.path, s]));
  const bySku = new Map<string, string[]>();
  const all = [...match.bySku];
  const passes = [all.map(([sku, p]) => [sku, p.slice(0, 1)] as const), all.map(([sku, p]) => [sku, p.slice(1)] as const)];
  const total = all.reduce((n, [, p]) => n + p.length, 0);
  let used = 0;
  let done = 0;
  let noRoom = 0;
  let failed = 0;
  for (const pass of passes) {
    for (const [sku, paths] of pass) {
      for (const path of paths) {
        progress(++done, total);
        if (room - used < MIN_PHOTO_CHARS) { noRoom++; continue; }
        let r;
        try { r = await media.upload(await byPath.get(path)!.read(), 'product-photo'); } catch { r = null; }
        if (!r?.ok) { failed++; continue; }
        if (used + r.url.length > room) { noRoom++; continue; }
        used += r.url.length;
        bySku.set(sku, [...(bySku.get(sku) ?? []), r.url]);
      }
    }
  }
  return { bySku, matched: bySku.size, unmatched: match.unmatched.length, noRoom, failed };
}
