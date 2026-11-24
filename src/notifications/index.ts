import * as Notifications from 'expo-notifications';
import { AndroidImportance } from 'expo-notifications';
import { type Href, router } from 'expo-router';
import { useEffect } from 'react';
import { Linking, Platform } from 'react-native';

import i18n from '@/i18n';

/**
 * - granted: notifications show.
 * - undetermined: never asked; the system prompt can still be shown.
 * - blocked: the user said no and the system won't ask again; only Settings can turn them on.
 */
export type NotificationAccess = 'granted' | 'undetermined' | 'blocked';

const CHANNEL_ID = 'default';

// Banners show while the app is open too, like they do in the background.
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

/** Android 13+ shows the permission prompt only once a channel exists, so this comes first. */
const ensureChannel = async () => {
  if (Platform.OS !== 'android') return;
  await Notifications.setNotificationChannelAsync(CHANNEL_ID, {
    name: i18n.t('notifications.channelName'),
    importance: AndroidImportance.HIGH,
    vibrationPattern: [0, 180, 120, 180],
    lightColor: '#0E5E57',
  });
};

const toAccess = (permission: Notifications.NotificationPermissionsStatus): NotificationAccess => {
  if (permission.granted) return 'granted';
  return permission.canAskAgain ? 'undetermined' : 'blocked';
};

export const getNotificationAccess = async (): Promise<NotificationAccess> => {
  if (Platform.OS === 'web') return 'blocked';
  return toAccess(await Notifications.getPermissionsAsync());
};

/** Shows the system prompt (once it can't any more, this resolves 'blocked' straight away). */
export const requestNotificationAccess = async (): Promise<NotificationAccess> => {
  if (Platform.OS === 'web') return 'blocked';
  await ensureChannel();
  return toAccess(await Notifications.requestPermissionsAsync());
};

/** The app's page in the system settings, where blocked notifications are turned back on. */
export const openNotificationSettings = () => Linking.openSettings();

/** A notification now, to check that they arrive (offered under Account > Notifications). */
export const sendTestNotification = async () => {
  await ensureChannel();
  await Notifications.scheduleNotificationAsync({
    content: {
      title: i18n.t('notifications.testTitle'),
      body: i18n.t('notifications.testBody'),
      data: { url: '/(tabs)/account' },
    },
    trigger: null,
  });
};

const openFromNotification = (response: Notifications.NotificationResponse | null) => {
  const url = response?.notification.request.content.data?.url;
  if (typeof url === 'string' && url.startsWith('/')) router.push(url as Href);
};

/**
 * Opens the screen a notification points at (`data.url`, an app path such as
 * `/properties/123`) when it is tapped, including a tap that launched the app. Waits for
 * `ready` (the navigator mounted): a cold-start tap arrives before there is anything to push to.
 */
export function useNotificationRouting(ready: boolean) {
  useEffect(() => {
    if (Platform.OS === 'web' || !ready) return;
    // A tap that started the app arrives before this listener exists.
    Notifications.getLastNotificationResponseAsync().then(openFromNotification);
    const subscription =
      Notifications.addNotificationResponseReceivedListener(openFromNotification);
    return () => subscription.remove();
  }, [ready]);
}
