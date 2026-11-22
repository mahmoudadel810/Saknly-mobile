import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { Screen } from '@/components/Screen';

// Public home. Phase 2 fills it with featured properties, agencies and testimonials.
export default function Home() {
  const { t } = useTranslation();
  const { status, user } = useAuth();
  const signedIn = status === 'signedIn';

  return (
    <Screen>
      <View className="flex-1 justify-center gap-3">
        <Text className="text-center text-4xl font-bold text-primary">{t('common.appName')}</Text>
        <Text className="text-center text-xl font-semibold text-text">
          {signedIn && user ? t('home.welcomeUser', { name: user.userName }) : t('home.welcome')}
        </Text>
        <Text className="text-center text-base text-text-2">{t('home.subtitle')}</Text>
      </View>
      <View className="gap-3">
        {signedIn ? (
          <Button title={t('home.profile')} onPress={() => router.push('/profile')} />
        ) : (
          <>
            <Button title={t('home.signIn')} onPress={() => router.push('/login')} />
            <Button
              title={t('home.createAccount')}
              variant="secondary"
              onPress={() => router.push('/register')}
            />
          </>
        )}
      </View>
    </Screen>
  );
}
