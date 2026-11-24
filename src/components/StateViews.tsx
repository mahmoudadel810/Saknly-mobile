import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';
import { describeError } from '@/utils/errors';

import { Button } from './Button';

type IconName = keyof typeof Ionicons.glyphMap;

export function LoadingView() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center py-10">
      <ActivityIndicator color={colors.primary} accessibilityLabel={t('common.loading')} />
    </View>
  );
}

function StateIcon({ name, tone = 'primary' }: { name: IconName; tone?: 'primary' | 'error' }) {
  const colors = useThemeColors();
  return (
    <View
      className={`h-16 w-16 items-center justify-center rounded-3xl ${
        tone === 'error' ? 'bg-field' : 'bg-primary-soft'
      }`}
    >
      <Ionicons name={name} size={28} color={tone === 'error' ? colors.muted : colors.primary} />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center justify-center gap-3 px-6 py-10" accessibilityRole="alert">
      <StateIcon name="cloud-offline-outline" tone="error" />
      <Text className="text-center text-lg text-text font-semibold">{t('state.error')}</Text>
      <Text className="text-center text-sm leading-6 text-text-2">{describeError(error)}</Text>
      <Button title={t('state.retry')} icon="refresh" variant="secondary" onPress={onRetry} />
    </View>
  );
}

interface EmptyViewProps {
  message: string;
  /** Defaults to a generic "nothing here" icon. */
  icon?: IconName;
  children?: React.ReactNode;
}

export function EmptyView({ message, icon = 'file-tray-outline', children }: EmptyViewProps) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-10">
      <StateIcon name={icon} />
      <Text className="text-center text-base leading-7 text-text-2">{message}</Text>
      {children}
    </View>
  );
}
