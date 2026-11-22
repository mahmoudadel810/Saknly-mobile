import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/colors';
import { describeError } from '@/utils/errors';

import { Button } from './Button';

export function LoadingView() {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center justify-center py-10">
      <ActivityIndicator color={colors.primary} accessibilityLabel="loading" />
    </View>
  );
}

export function ErrorView({ error, onRetry }: { error: unknown; onRetry: () => void }) {
  const { t } = useTranslation();
  return (
    <View className="items-center justify-center gap-3 px-6 py-10" accessibilityRole="alert">
      <Text className="text-center text-base font-semibold text-text">{t('state.error')}</Text>
      <Text className="text-center text-sm text-text-2">{describeError(error)}</Text>
      <Button title={t('state.retry')} variant="secondary" onPress={onRetry} />
    </View>
  );
}

export function EmptyView({ message, children }: { message: string; children?: React.ReactNode }) {
  return (
    <View className="items-center justify-center gap-3 px-6 py-10">
      <Text className="text-center text-base text-text-2">{message}</Text>
      {children}
    </View>
  );
}
