import { Directory, File, Paths } from 'expo-file-system';
import * as ImagePicker from 'expo-image-picker';
import { Platform } from 'react-native';

import { uid } from '@/lib/date';

export type PhotoSource = 'camera' | 'library';
export type PhotoResult = { uri: string } | { denied: true } | null;

/**
 * Take or choose a photo and copy it into the app's own storage (under `folder`),
 * so it survives the picker's cache being cleared. Returns null if cancelled.
 */
async function pickPhoto(source: PhotoSource, aspect: [number, number], folder: string): Promise<PhotoResult> {
  if (source === 'camera') {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) return { denied: true };
  }
  const options: ImagePicker.ImagePickerOptions = { mediaTypes: 'images', quality: 0.7, allowsEditing: true, aspect };
  const res = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
  if (res.canceled || !res.assets?.length) return null;

  const picked = res.assets[0].uri;
  if (Platform.OS === 'web') return { uri: picked };

  const dir = new Directory(Paths.document, folder);
  if (!dir.exists) dir.create();
  const dest = new File(dir, `${uid()}.jpg`);
  new File(picked).copy(dest);
  return { uri: dest.uri };
}

export const pickProgressPhoto = (source: PhotoSource) => pickPhoto(source, [3, 4], 'progress-photos');
export const pickAvatar = (source: PhotoSource) => pickPhoto(source, [1, 1], 'avatar');
export const pickExercisePhoto = (source: PhotoSource) => pickPhoto(source, [4, 3], 'custom-exercises');

export function deletePhoto(uri: string | null) {
  if (!uri || Platform.OS === 'web') return;
  try {
    const f = new File(uri);
    if (f.exists) f.delete();
  } catch {
    // Already gone — nothing to clean up.
  }
}
