import '../global.css';
import '@/i18n';

import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type Href, router, SplashScreen, Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import { shouldRetry } from '@/api/client';
import { AuthProvider, useAuth } from '@/auth/AuthProvider';
import { takeReturnTo } from '@/auth/returnTo';
import { OfflineBoundary } from '@/components/OfflineBanner';
import { syncDirectionOnStart, useFollowDeviceLanguage } from '@/i18n/direction';
import { useNotificationRouting } from '@/notifications';
import { NotificationPrimer } from '@/notifications/NotificationPrimer';
import { useThemeColors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';
import { useAppFonts } from '@/theme/useAppFonts';

SplashScreen.preventAutoHideAsync();
// Before the first render: a language whose direction doesn't match the running layout reloads
// the app once, while the splash screen is still up.
syncDirectionOnStart();

// Where a blocked route (a guard turning false) sends the user.
export const unstable_settings = { anchor: '(tabs)' };

// The splash screen stays up until the stored session is restored and the app font is ready.
function SplashScreenController() {
  const { status } = useAuth();
  const fontsReady = useAppFonts();
  useEffect(() => {
    if (status !== 'loading' && fontsReady) SplashScreen.hide();
  }, [status, fontsReady]);
  return null;
}

function RootNavigator() {
  const { status } = useAuth();
  const { t } = useTranslation();
  const colors = useThemeColors();
  const signedIn = status === 'signedIn';
  useNotificationRouting(status !== 'loading');
  useFollowDeviceLanguage();

  // After signing in from a screen that asked for it, go back there. Deferred a tick: the
  // guard's own redirect to the anchor runs after this effect and would otherwise win.
  useEffect(() => {
    if (!signedIn) return;
    const path = takeReturnTo();
    if (!path) return;
    const timer = setTimeout(() => router.navigate(path as Href), 0);
    return () => clearTimeout(timer);
  }, [signedIn]);

  // Mount the navigator only once the session is known: mounted earlier, the guards would
  // treat a signed-in user as signed out and redirect a link to /profile away to home.
  if (status === 'loading') return null;

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        headerTitleStyle: { color: colors.text, fontFamily: fonts.semibold },
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
      <Stack.Screen
        name="inquiry/[id]"
        options={{ headerShown: true, title: t('inquiry.title'), presentation: 'modal' }}
      />
      <Stack.Screen name="contact" options={{ headerShown: true, title: t('contact.title') }} />
      <Stack.Screen
        name="testimonial"
        options={{ headerShown: true, title: t('testimonial.title') }}
      />
      <Stack.Screen name="about" options={{ headerShown: true, title: t('pages.about.title') }} />
      <Stack.Screen name="faq" options={{ headerShown: true, title: t('pages.faq.title') }} />
      <Stack.Screen
        name="privacy"
        options={{ headerShown: true, title: t('pages.privacy.title') }}
      />
      <Stack.Protected guard={signedIn}>
        <Stack.Screen
          name="listing/new"
          options={{ headerShown: true, title: t('listing.newTitle') }}
        />
        <Stack.Screen
          name="listing/edit/[id]"
          options={{ headerShown: true, title: t('listing.editTitle') }}
        />
      </Stack.Protected>
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
          <OfflineBoundary>
            <RootNavigator />
          </OfflineBoundary>
          <StatusBar style="auto" />
          <NotificationPrimer />
        </AuthProvider>
      </QueryClientProvider>
      <Toast />
    </SafeAreaProvider>
  );
}
