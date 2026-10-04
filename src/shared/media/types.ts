/**
 * File uploads (photos, video). Editors know only MediaStore: today the file is compressed
 * and embedded in the data (a data: URL), with a server it goes to object storage and a URL comes back.
 */
export type MediaPurpose =
  | 'shop-banner' | 'shop-logo' | 'shop-gallery' | 'shop-about'
  | 'story-slide' | 'lifehack-cover' | 'lifehack-gallery';

export type MediaError = 'too_large' | 'unsupported' | 'failed';
export type MediaResult = { ok: true; url: string; bytes: number } | { ok: false; error: MediaError };

export interface MediaStore {
  upload(file: File, purpose: MediaPurpose): Promise<MediaResult>;
}

/** Longest side, in pixels, after compression: enough for the screen, without excess weight. */
export const MAX_SIDE: Record<MediaPurpose, number> = {
  'shop-banner': 1600, 'shop-gallery': 1600, 'shop-about': 1200, 'shop-logo': 512,
  'story-slide': 1920, 'lifehack-cover': 1600, 'lifehack-gallery': 1600,
};

/** Video without a server: only small clips (browser storage holds ~5 MB in total). */
export const MAX_VIDEO_BYTES = 2.5 * 1024 * 1024;
/** GIF and SVG are not compressed (animation, vectors): a size limit instead. */
export const MAX_RAW_IMAGE_BYTES = 600 * 1024;

export const MEDIA_MESSAGES: Record<MediaError, string> = {
  too_large: 'Файл слишком большой для хранения в браузере. Большие видео и фото можно будет загружать после подключения сервера.',
  unsupported: 'Этот тип файла не поддерживается: загрузите фото (JPG, PNG, WebP) или короткое видео',
  failed: 'Не удалось прочитать файл',
};

/** Fit inside a size×size square keeping the proportions; never enlarge. */
export function fitWithin(w: number, h: number, size: number): { w: number; h: number } {
  const k = Math.min(1, size / Math.max(w, h));
  return { w: Math.max(1, Math.round(w * k)), h: Math.max(1, Math.round(h * k)) };
}

/** Size of a data: URL in bytes (base64 → binary). */
export function dataUrlBytes(url: string): number {
  const i = url.indexOf(',');
  const b64 = i < 0 ? url : url.slice(i + 1);
  return Math.floor((b64.length * 3) / 4) - (b64.endsWith('==') ? 2 : b64.endsWith('=') ? 1 : 0);
}
