import { Platform } from 'react-native';
import * as Haptics from 'expo-haptics';

// Haptics only work on native (iOS/Android), not on web
const isNative = Platform.OS === 'ios' || Platform.OS === 'android';

// Haptics enabled flag (controlled from settings)
let hapticsEnabled = true;

export function setHapticsEnabled(enabled: boolean) {
  hapticsEnabled = enabled;
}

/** Basic clear: Light impact */
export async function hapticClear() {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  } catch {}
}

/** Combo 2+: Medium impact */
export async function hapticCombo() {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  } catch {}
}

/** Combo 5+: Heavy impact */
export async function hapticComboHeavy() {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  } catch {}
}

/** Fever start: double Success notification */
export async function hapticFever() {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
    setTimeout(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      } catch {}
    }, 150);
  } catch {}
}

/** Special block activation (bomb etc): Heavy + Warning */
export async function hapticSpecialBlock() {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
    setTimeout(async () => {
      try {
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
      } catch {}
    }, 100);
  } catch {}
}

export async function hapticGameOver() {
  if (!isNative || !hapticsEnabled) return;
  try {
    await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  } catch {}
}
