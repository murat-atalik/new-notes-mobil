import { API_BASE_URL } from '../config/api';
import { authHeaders, notifyUnauthorized } from './session';

/** Uploads a locally-picked photo (from react-native-image-picker) to `/api/media/upload`. */
export type PickedPhoto = { uri: string; fileName?: string | null; type?: string | null };

export type UploadResult = { ok: true; url: string } | { ok: false; error: string };

export async function uploadPhoto(photo: PickedPhoto): Promise<UploadResult> {
  const form = new FormData();
  const name = photo.fileName || `photo-${Date.now()}.jpg`;
  const type = photo.type || 'image/jpeg';
  // RN's FormData accepts this {uri,name,type} shape for a file part; do not set
  // Content-Type manually below — fetch must generate the multipart boundary itself.
  form.append('file', { uri: photo.uri, name, type } as unknown as Blob);

  let res: Response;
  try {
    res = await fetch(`${API_BASE_URL}/api/media/upload`, {
      method: 'POST',
      headers: { ...authHeaders() },
      body: form,
    });
  } catch (error) {
    return { ok: false, error: error instanceof Error ? `Yükleme başarısız: ${error.message}` : 'Yükleme başarısız oldu' };
  }

  let json: { success?: boolean; url?: string; error?: string } = {};
  try {
    json = await res.json();
  } catch {
    // Non-JSON error page.
  }
  if (res.status === 401) notifyUnauthorized();
  if (!res.ok || !json.success || !json.url) {
    return { ok: false, error: json.error || `Fotoğraf yüklenemedi (${res.status})` };
  }
  return { ok: true, url: json.url };
}
