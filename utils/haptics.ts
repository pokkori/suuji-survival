import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics only work on native (iOS/Android), not on web
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

export async function hapticClear() {
  if (!isNative) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

export async function hapticCombo() {
  if (!isNative) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

export async function hapticFever() {
  if (!isNative) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  } catch {}
}

export async function hapticGameOver() {
  if (!isNative) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
}
