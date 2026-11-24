import { Ionicons } from '@expo/vector-icons';
import { useFocusEffect } from 'expo-router';
import { useCallback, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AppState, Platform, Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { setAppLanguage } from '@/i18n/direction';
import type { Language } from '@/i18n/preference';
import {
  getNotificationAccess,
  type NotificationAccess,
  openNotificationSettings,
  requestNotificationAccess,
  sendTestNotification,
} from '@/notifications';
import { useThemeColors } from '@/theme/colors';
import { haptics } from '@/utils/haptics';

// Each language is named in itself, so the way back is readable whichever one is on.
const LANGUAGES: { code: Language; label: string }[] = [
  { code: 'ar', label: 'العربية' },
  { code: 'en', label: 'English' },
];

/** Language and notifications: shown on Account, signed in or not. */
export function Preferences() {
  const { t } = useTranslation();
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="px-1 text-sm text-muted font-semibold">
        {t('settings.title')}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        <LanguageRow />
        {Platform.OS === 'web' ? null : (
          <View className="border-t border-border">
            <NotificationsRow />
          </View>
        )}
      </View>
    </View>
  );
}

function RowIcon({ name }: { name: keyof typeof Ionicons.glyphMap }) {
  const colors = useThemeColors();
  return (
    <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary-soft">
      <Ionicons name={name} size={18} color={colors.primary} />
    </View>
  );
}

function LanguageRow() {
  const { t, i18n } = useTranslation();
  const [switching, setSwitching] = useState(false);

  const choose = async (code: Language) => {
    if (code === i18n.language || switching) return;
    haptics.select();
    setSwitching(true);
    try {
      // May reload the app (the layout direction flips), so nothing after this is guaranteed.
      await setAppLanguage(code);
    } finally {
      setSwitching(false);
    }
  };

  return (
    <View className="gap-3 px-4 py-4">
      <View className="flex-row items-center gap-3">
        <RowIcon name="language" />
        <Text className="flex-1 text-left text-base text-text font-medium">
          {t('settings.language')}
        </Text>
      </View>
      <View accessibilityRole="radiogroup" className="flex-row gap-1 rounded-xl bg-field p-1">
        {LANGUAGES.map(({ code, label }) => {
          const selected = i18n.language === code;
          return (
            <Pressable
              key={code}
              accessibilityRole="radio"
              accessibilityState={{ selected, disabled: switching }}
              accessibilityLanguage={code}
              onPress={() => choose(code)}
              className={`flex-1 items-center rounded-lg py-2.5 ${
                selected ? 'bg-surface shadow-sm' : 'active:bg-surface-2'
              }`}
            >
              <Text
                className={`text-base ${selected ? 'text-primary font-semibold' : 'text-text-2'}`}
              >
                {label}
              </Text>
            </Pressable>
          );
        })}
      </View>
    </View>
  );
}

function NotificationsRow() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [access, setAccess] = useState<NotificationAccess | null>(null);

  // Re-read on focus and when the app comes back from the system settings.
  useFocusEffect(
    useCallback(() => {
      const refresh = () => getNotificationAccess().then(setAccess);
      refresh();
      const subscription = AppState.addEventListener('change', (state) => {
        if (state === 'active') refresh();
      });
      return () => subscription.remove();
    }, []),
  );

  const action =
    access === 'granted'
      ? { label: t('notifications.sendTest'), run: () => sendTestNotification() }
      : access === 'blocked'
        ? { label: t('notifications.openSettings'), run: () => openNotificationSettings() }
        : {
            label: t('notifications.enable'),
            run: async () => {
              const next = await requestNotificationAccess();
              setAccess(next);
              if (next === 'granted') haptics.success();
            },
          };

  const status =
    access === 'granted'
      ? t('notifications.statusOn')
      : access === 'blocked'
        ? t('notifications.statusBlocked')
        : t('notifications.statusOff');

  return (
    <View className="gap-3 px-4 py-4">
      <View className="flex-row items-center gap-3">
        <RowIcon name="notifications-outline" />
        <View className="flex-1 gap-0.5">
          <Text className="text-left text-base text-text font-medium">
            {t('settings.notifications')}
          </Text>
          <Text className="text-left text-sm text-muted">{access ? status : ' '}</Text>
        </View>
        {access === 'granted' ? (
          <Ionicons name="checkmark-circle" size={22} color={colors.primary} />
        ) : null}
      </View>
      {access ? (
        <Pressable
          accessibilityRole="button"
          onPress={action.run}
          className="items-center rounded-xl border border-border py-2.5 active:bg-surface-2"
        >
          <Text className="text-sm text-primary font-semibold">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
