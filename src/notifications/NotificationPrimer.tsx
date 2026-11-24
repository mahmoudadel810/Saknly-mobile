import { Ionicons } from '@expo/vector-icons';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, Pressable, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';
import { haptics } from '@/utils/haptics';

import { requestNotificationAccess } from './index';
import { markPrimerShown, onPrimerRequest, type PrimerReason } from './primer';

/**
 * Our own explanation before the system prompt: the system only lets an app ask once, so the
 * user sees why first, at the moment it matters, and can say "not now" without burning it.
 * Mounted once in the root layout; `offerNotifications()` opens it.
 */
export function NotificationPrimer() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const [reason, setReason] = useState<PrimerReason | null>(null);
  const [asking, setAsking] = useState(false);

  useEffect(() => onPrimerRequest(setReason), []);

  const close = () => {
    markPrimerShown();
    setReason(null);
  };

  const enable = async () => {
    setAsking(true);
    try {
      if ((await requestNotificationAccess()) === 'granted') haptics.success();
    } finally {
      setAsking(false);
      close();
    }
  };

  return (
    <Modal visible={reason !== null} transparent animationType="slide" onRequestClose={close}>
      <Pressable
        accessibilityLabel={t('notifications.notNow')}
        onPress={close}
        className="flex-1 bg-black/40"
      />
      <View
        className="gap-5 rounded-t-3xl bg-surface px-6 pt-3"
        style={{ paddingBottom: Math.max(insets.bottom, 16) + 8 }}
      >
        <View className="h-1 w-10 self-center rounded-full bg-border" />
        <View className="h-16 w-16 items-center justify-center self-center rounded-2xl bg-primary-soft">
          <Ionicons name="notifications" size={30} color={colors.primary} />
        </View>
        <View className="gap-2">
          <Text accessibilityRole="header" className="text-center text-2xl text-text font-bold">
            {t('notifications.primerTitle')}
          </Text>
          <Text className="text-center text-base leading-7 text-text-2">
            {reason ? t(`notifications.primerBody.${reason}`) : ''}
          </Text>
        </View>
        <View className="gap-1">
          <Button title={t('notifications.enable')} onPress={enable} loading={asking} />
          <Button title={t('notifications.notNow')} variant="link" onPress={close} />
        </View>
      </View>
    </Modal>
  );
}
