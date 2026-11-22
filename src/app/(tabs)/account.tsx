import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { useSignInPrompt } from '@/auth/returnTo';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { MyProperties } from '@/features/account/MyProperties';

export default function AccountScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <SignedIn /> : <SignedOut />;
}

/** Contact and reviews work signed out too. */
function MoreLinks() {
  const { t } = useTranslation();
  return (
    <View className="gap-3">
      <Button
        title={t('contact.title')}
        variant="secondary"
        onPress={() => router.push('/contact')}
      />
      <Button
        title={t('testimonial.title')}
        variant="secondary"
        onPress={() => router.push('/testimonial')}
      />
    </View>
  );
}

function SignedOut() {
  const { t } = useTranslation();
  const promptSignIn = useSignInPrompt();
  return (
    <Screen scroll>
      <View className="flex-1 justify-center gap-2 py-10">
        <Text className="text-center text-2xl font-bold text-text">
          {t('account.signedOutTitle')}
        </Text>
        <Text className="text-center text-base text-text-2">{t('account.signedOutBody')}</Text>
      </View>
      <View className="gap-3">
        <Button title={t('home.signIn')} onPress={promptSignIn} />
        <Button
          title={t('home.createAccount')}
          variant="secondary"
          onPress={() => router.push('/register')}
        />
      </View>
      <MoreLinks />
    </Screen>
  );
}

function SignedIn() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const phone = user && 'phone' in user ? user.phone : undefined;
  const rows: [string, string | undefined][] = user
    ? [
        [t('auth.userName'), user.userName],
        [t('common.email'), user.email],
        [t('auth.phone'), phone],
        [t('profile.role'), isAdmin ? t('profile.roleAdmin') : t('profile.roleUser')],
      ]
    : [];

  return (
    <Screen scroll>
      <Text accessibilityRole="header" className="text-3xl font-bold text-text">
        {t('profile.title')}
      </Text>
      <FormMessage message={user ? null : t('profile.offline')} tone="info" />
      <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
        {rows
          .filter(([, value]) => value)
          .map(([label, value]) => (
            <View key={label} className="gap-0.5">
              <Text className="text-xs text-muted">{label}</Text>
              <Text className="text-base text-text">{value}</Text>
            </View>
          ))}
      </View>
      <Button title={t('listing.add')} onPress={() => router.push('/listing/new')} />
      <MyProperties />
      <MoreLinks />
      <Button
        title={t('profile.signOut')}
        variant="secondary"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          try {
            await signOut();
          } finally {
            setSigningOut(false);
          }
        }}
      />
    </Screen>
  );
}
