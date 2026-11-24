import * as SecureStore from 'expo-secure-store';
import { Platform } from 'react-native';

import { getNotificationAccess } from './index';

/** Why the app is asking, shown in the primer: the moment the user just did something that a
 *  notification would follow up on. */
export type PrimerReason = 'listing' | 'inquiry';

type Listener = (reason: PrimerReason) => void;

const SHOWN_KEY = 'saknly.notificationPrimerShown';
const listeners = new Set<Listener>();

export const onPrimerRequest = (listener: Listener) => {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
};

const wasShown = () => {
  try {
    return SecureStore.getItem(SHOWN_KEY) === '1';
  } catch {
    return true;
  }
};

export const markPrimerShown = () => {
  try {
    SecureStore.setItem(SHOWN_KEY, '1');
  } catch {
    // Shown again next time; harmless.
  }
};

/**
 * Offers notifications right after an action they'd follow up on, never at launch. Asks once:
 * after that, or when access is already decided, the switch under Account is the way in.
 */
export const offerNotifications = async (reason: PrimerReason) => {
  if (Platform.OS === 'web' || wasShown()) return;
  if ((await getNotificationAccess()) !== 'undetermined') return;
  listeners.forEach((listener) => listener(reason));
};
