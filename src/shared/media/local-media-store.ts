/**
 * Uploads with no server: compression on the device, the result is a data: URL inside the data.
 * Photos are downscaled to MAX_SIDE and re-encoded (JPEG; logos with transparency, PNG/WebP).
 * That turns 3–5 MB photos into ~100–250 KB, enough room for several images in the browser.
 */
import {
  MAX_RAW_IMAGE_BYTES, MAX_SIDE, MAX_VIDEO_BYTES, dataUrlBytes, fitWithin,
  type MediaPurpose, type MediaResult, type MediaStore,
} from './types';

const readAsDataUrl = (file: Blob) => new Promise<string>((resolve, reject) => {
  const r = new FileReader();
  r.onload = () => resolve(String(r.result));
  r.onerror = () => reject(r.error);
  r.readAsDataURL(file);
});

async function compressImage(file: File, purpose: MediaPurpose): Promise<string> {
  const bitmap = await createImageBitmap(file);
  const { w, h } = fitWithin(bitmap.width, bitmap.height, MAX_SIDE[purpose]);
  const canvas = document.createElement('canvas');
  canvas.width = w; canvas.height = h;
  const ctx = canvas.getContext('2d');
  if (!ctx) throw new Error('canvas');
  /* логотипам нужна прозрачность: WebP с альфой (если браузер его не кодирует — PNG) */
  const keepAlpha = purpose === 'shop-logo' && file.type !== 'image/jpeg';
  if (!keepAlpha) { ctx.fillStyle = '#fff'; ctx.fillRect(0, 0, w, h); }
  ctx.drawImage(bitmap, 0, 0, w, h);
  bitmap.close?.();
  if (keepAlpha) {
    const webp = canvas.toDataURL('image/webp', 0.86);
    return webp.startsWith('data:image/webp') ? webp : canvas.toDataURL('image/png');
  }
  return canvas.toDataURL('image/jpeg', 0.82);
}

export class LocalMediaStore implements MediaStore {
  async upload(file: File, purpose: MediaPurpose): Promise<MediaResult> {
    try {
      if (file.type.startsWith('video/')) {
        if (purpose !== 'story-slide') return { ok: false, error: 'unsupported' };
        if (file.size > MAX_VIDEO_BYTES) return { ok: false, error: 'too_large' };
        const url = await readAsDataUrl(file);
        return { ok: true, url, bytes: dataUrlBytes(url) };
      }
      if (file.type === 'image/gif' || file.type === 'image/svg+xml') {
        if (file.size > MAX_RAW_IMAGE_BYTES) return { ok: false, error: 'too_large' };
        const url = await readAsDataUrl(file);
        return { ok: true, url, bytes: dataUrlBytes(url) };
      }
      if (!file.type.startsWith('image/')) return { ok: false, error: 'unsupported' };
      const url = await compressImage(file, purpose);
      return { ok: true, url, bytes: dataUrlBytes(url) };
    } catch {
      return { ok: false, error: 'failed' };
    }
  }
}
