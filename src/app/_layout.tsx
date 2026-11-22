import '../global.css';
import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { shouldRetry } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { useThemeColors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

// Where a blocked route (a guard turning false) sends the user.
export const unstable_settings = { anchor: '(tabs)' };

// The splash screen stays up until the stored session is restored.
function SplashScreenController() {
  const { status } = useAuth();
  useEffect(() => {
    if (status !== 'loading') SplashScreen.hide();
  }, [status]);
  return null;
}

function RootNavigator() {
  const { status } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const signedIn = status === 'signedIn';

  // Mount the navigator only once the session is known: mounted earlier, the guards would
  // treat a signed-in user as signed out and redirect a link to /profile away to home.
  if (status === 'loading') return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text },
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    >
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="properties/[id]" options={{ headerShown: true, title: '' }} />
      <Stack.Screen
        name="agencies/[id]"
        options={{ headerShown: true, title: t('browse.agencies') }}
      />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () =>
      new QueryClient({ defaultOptions: { queries: { retry: shouldRetry, staleTime: 60_000 } } }),
  );

  return (
    <SafeAreaProvider>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <SplashScreenController />
          <RootNavigator />
          <StatusBar style="auto" />
        </AuthProvider>
      </QueryClientProvider>
      <Toast />
    </SafeAreaProvider>
  );
}
