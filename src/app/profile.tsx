import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';

// Phase 3 adds my properties and settings here.
export default function ProfileScreen() {
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
    <Screen>
      <Text className="text-3xl font-bold text-text">{t('profile.title')}</Text>
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
      <View className="flex-1" />
      <Button
        title={t('profile.signOut')}
        variant="secondary"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          await signOut();
        }}
      />
    </Screen>
  );
}
