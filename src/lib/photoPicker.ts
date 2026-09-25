import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';
import { Camera, Image as ImageIcon } from 'lucide-react-native';

import { showActionSheet, showToast } from '../design';
import { uploadPhoto, type PickedPhoto } from '../services/media';

const PICKER_OPTIONS = { mediaType: 'photo' as const, quality: 0.7 as const, maxWidth: 1600, maxHeight: 1600 };

function pickFrom(source: 'camera' | 'library'): Promise<PickedPhoto | null> {
  return new Promise((resolve) => {
    const onResult = (res: ImagePickerResponse) => {
      if (res.didCancel) return resolve(null);
      const asset = res.assets?.[0];
      if (res.errorMessage || !asset?.uri) {
        showToast(res.errorMessage || 'Fotoğraf seçilemedi');
        return resolve(null);
      }
      resolve({ uri: asset.uri, fileName: asset.fileName, type: asset.type });
    };
    if (source === 'camera') launchCamera(PICKER_OPTIONS, onResult);
    else launchImageLibrary(PICKER_OPTIONS, onResult);
  });
}

async function pickUploadAndCall(source: 'camera' | 'library', onUploaded: (url: string) => void, onStart?: () => void, onEnd?: () => void) {
  const photo = await pickFrom(source);
  if (!photo) return;
  onStart?.();
  const res = await uploadPhoto(photo);
  onEnd?.();
  if (!res.ok) {
    showToast(res.error);
    return;
  }
  onUploaded(res.url);
}

/**
 * Shows a "Kameradan çek / Galeriden seç" action sheet, uploads the chosen photo to
 * `/api/media/upload`, and calls `onUploaded` with the resulting URL. Callback-style
 * (rather than a Promise) because the action sheet can be dismissed without picking
 * anything, which would otherwise leave a caller awaiting forever.
 */
export function pickAndUploadPhoto(onUploaded: (url: string) => void, onStart?: () => void, onEnd?: () => void) {
  showActionSheet({
    title: 'Fotoğraf ekle',
    options: [
      { label: 'Kameradan çek', icon: Camera, onPress: () => pickUploadAndCall('camera', onUploaded, onStart, onEnd) },
      { label: 'Galeriden seç', icon: ImageIcon, onPress: () => pickUploadAndCall('library', onUploaded, onStart, onEnd) },
    ],
  });
}
