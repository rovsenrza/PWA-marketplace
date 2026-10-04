/** Uploads from editors: MediaStore (today compressing on the device) + a toast when a file is refused. */
import { LocalMediaStore } from '../../shared/media/local-media-store';
import { MEDIA_MESSAGES, type MediaPurpose, type MediaResult, type MediaStore } from '../../shared/media/types';

export const media: MediaStore = new LocalMediaStore();

export async function mediaUpload(file: File, purpose: MediaPurpose): Promise<MediaResult> {
  const r = await media.upload(file, purpose);
  if (!r.ok) window.showSmsToast?.(MEDIA_MESSAGES[r.error]);
  return r;
}
