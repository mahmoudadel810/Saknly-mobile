import { useNetworkState } from 'expo-network';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Text } from '@/components/Text';

/**
 * A strip across the top while the phone has no connection. Both fields are undefined until the
 * first reading, so only an explicit `false` counts as offline (no flash at launch).
 */
export function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();
  const network = useNetworkState();
  const offline = network.isConnected === false || network.isInternetReachable === false;
  if (!offline) return null;

  return (
    <View
      accessible
      accessibilityRole="alert"
      accessibilityLiveRegion="polite"
      // Inverted colors (dark on light, light on dark) so it reads in both themes.
      className="bg-text px-4 pb-2"
      style={{ paddingTop: insets.top + 8 }}
    >
      <Text className="text-center text-sm text-bg font-medium">{t('common.offline')}</Text>
    </View>
  );
}
