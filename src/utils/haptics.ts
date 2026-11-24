import * as Haptics from 'expo-haptics';
import { Platform } from 'react-native';

// Small taps that confirm an action by touch. Never awaited, and failures are ignored: a phone
// without a vibration motor (or the web preview) just skips them.
const run = (effect: () => Promise<void>) => {
  if (Platform.OS === 'web') return;
  effect().catch(() => {});
};

export const haptics = {
  /** A toggle or a choice changed (a heart, a language). */
  select: () => run(() => Haptics.selectionAsync()),
  /** Something was sent or saved. */
  success: () => run(() => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success)),
};
