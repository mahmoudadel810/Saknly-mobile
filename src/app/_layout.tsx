import '../global.css';
import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { AuthProvider, useAuth } from '@/auth/AuthProvider';

SplashScreen.preventAutoHideAsync();

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
  const signedIn = status === 'signedIn';

  // Mount the navigator only once the session is known: mounted earlier, the guards would
  // treat a signed-in user as signed out and redirect a link to /profile away to home.
  if (status === 'loading') return null;

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="index" />
      <Stack.Protected guard={!signedIn}>
        <Stack.Screen name="(auth)" />
      </Stack.Protected>
      <Stack.Protected guard={signedIn}>
        <Stack.Screen name="profile" />
      </Stack.Protected>
    </Stack>
  );
}

export default function RootLayout() {
  const [queryClient] = useState(
    () => new QueryClient({ defaultOptions: { queries: { retry: 1, staleTime: 60_000 } } }),
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
