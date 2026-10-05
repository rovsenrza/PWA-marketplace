/**
 * File uploads (photos, video). Editors know only MediaStore: today the file is compressed
 * and embedded in the data (a data: URL), with a server it goes to object storage and a URL comes back.
 */
export type MediaPurpose =
  | 'shop-banner' | 'shop-logo' | 'shop-gallery' | 'shop-about'
  | 'story-slide' | 'lifehack-cover' | 'lifehack-gallery'
  /** photos of imported products: many at once, so smaller */
  | 'product-photo';

export type MediaError = 'too_large' | 'unsupported' | 'failed';
export type MediaResult = { ok: true; url: string; bytes: number } | { ok: false; error: MediaError };

export interface MediaStore {
  upload(file: File, purpose: MediaPurpose): Promise<MediaResult>;
}

/** Longest side, in pixels, after compression: enough for the screen, without excess weight. */
export const MAX_SIDE: Record<MediaPurpose, number> = {
  'shop-banner': 1600, 'shop-gallery': 1600, 'shop-about': 1200, 'shop-logo': 512,
  'story-slide': 1920, 'lifehack-cover': 1600, 'lifehack-gallery': 1600, 'product-photo': 800,
};

/** Size budget after compression: the browser holds ~5 MB for everything, so each photo has a limit. */
export const MAX_BYTES: Record<MediaPurpose, number> = {
  'shop-banner': 350 * 1024, 'shop-gallery': 300 * 1024, 'shop-about': 250 * 1024, 'shop-logo': 120 * 1024,
  'story-slide': 400 * 1024, 'lifehack-cover': 350 * 1024, 'lifehack-gallery': 300 * 1024, 'product-photo': 50 * 1024,
};

/**
 * The compression plan: first lower the quality, then the size. Every step is smaller than the last;
 * the first one that fits the budget is used. A pure function: the plan is tested without a browser.
 */
export function compressionSteps(w: number, h: number, maxSide: number): Array<{ w: number; h: number; quality: number }> {
  const steps: Array<{ w: number; h: number; quality: number }> = [];
  let side = maxSide;
  for (let round = 0; round < 4; round++) {
    const size = fitWithin(w, h, side);
    for (const quality of [0.82, 0.72, 0.62, 0.52]) steps.push({ ...size, quality });
    side = Math.round(side * 0.75);
  }
  return steps;
}

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
