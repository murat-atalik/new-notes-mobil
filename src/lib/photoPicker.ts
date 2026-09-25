import { Alert } from 'react-native';
import { launchCamera, launchImageLibrary, type ImagePickerResponse } from 'react-native-image-picker';

import { showToast } from '../design';
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
 * Shows a "Kameradan çek / Galeriden seç" chooser, uploads the chosen photo to
 * `/api/media/upload`, and calls `onUploaded` with the resulting URL. Uses the native
 * `Alert` (not our custom action-sheet component) because this is opened from screens
 * presented as a native-stack modal, and our root-mounted custom sheet unreliably fails
 * to present on top of an already-presented native modal on real devices — `Alert`
 * uses UIKit's own robust presentation and doesn't have that problem.
 */
export function pickAndUploadPhoto(onUploaded: (url: string) => void, onStart?: () => void, onEnd?: () => void) {
  Alert.alert('Fotoğraf ekle', undefined, [
    { text: 'Kameradan çek', onPress: () => pickUploadAndCall('camera', onUploaded, onStart, onEnd) },
    { text: 'Galeriden seç', onPress: () => pickUploadAndCall('library', onUploaded, onStart, onEnd) },
    { text: 'Vazgeç', style: 'cancel' },
  ]);
}
