import { useNetworkState } from 'expo-network';
import type { PropsWithChildren } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';
import { SafeAreaInsetsContext, useSafeAreaInsets } from 'react-native-safe-area-context';

import { Text } from '@/components/Text';

/**
 * Both fields are undefined until the first reading, so only an explicit `false` counts as
 * offline (no flash at launch).
 */
const useOffline = () => {
  const network = useNetworkState();
  return network.isConnected === false || network.isInternetReachable === false;
};

/**
 * The app below a strip that shows while the phone has no connection. The strip already covers
 * the status bar, so everything under it gets a top inset of 0: without that, Home's hero and the
 * screen headers (which read the inset) would leave a second status-bar gap below it.
 */
export function OfflineBoundary({ children }: PropsWithChildren) {
  const offline = useOffline();
  const insets = useSafeAreaInsets();
  return (
    <View className="flex-1">
      {offline ? <OfflineBanner /> : null}
      <SafeAreaInsetsContext.Provider value={offline ? { ...insets, top: 0 } : insets}>
        <View className="flex-1">{children}</View>
      </SafeAreaInsetsContext.Provider>
    </View>
  );
}

function OfflineBanner() {
  const { t } = useTranslation();
  const insets = useSafeAreaInsets();

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
