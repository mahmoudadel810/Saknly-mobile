import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, View } from 'react-native';
import Toast from 'react-native-toast-message';

import { accountApi } from '@/api/account';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { useThemeColors } from '@/theme/colors';
import { describeError } from '@/utils/errors';

/** Deleting the account from inside the app, as both app stores require. */
export default function DeleteAccountScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { user, signOut } = useAuth();
  // A Google-only account has no password: being signed in is the confirmation. A user restored
  // offline from the token alone has no provider yet, so the password is asked for.
  const needsPassword = !(user && 'provider' in user && user.provider === 'google');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [deleting, setDeleting] = useState(false);
  const gone = t('deleteAccount.gone', { returnObjects: true }) as unknown as string[];

  const remove = async () => {
    setError(null);
    setDeleting(true);
    try {
      await accountApi.delete(needsPassword ? password : undefined);
      // The token is no longer valid; this only clears it on the phone (and the Google account).
      await signOut();
      Toast.show({ type: 'success', text1: t('deleteAccount.done') });
      router.replace('/');
    } catch (e) {
      const status = isAxiosError(e) ? e.response?.status : undefined;
      setError(
        status === 400
          ? t('deleteAccount.wrongPassword')
          : status === 409
            ? t('deleteAccount.lastAdmin')
            : describeError(e),
      );
    } finally {
      setDeleting(false);
    }
  };

  const confirm = () => {
    if (needsPassword && !password) {
      setError(t('deleteAccount.passwordRequired'));
      return;
    }
    Alert.alert(t('deleteAccount.confirmTitle'), t('deleteAccount.confirmBody'), [
      { text: t('deleteAccount.cancel'), style: 'cancel' },
      { text: t('deleteAccount.confirm'), style: 'destructive', onPress: remove },
    ]);
  };

  return (
    <Screen scroll>
      <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
        <View className="flex-row items-center gap-2">
          <Ionicons name="warning-outline" size={20} color={colors.error} />
          <Text accessibilityRole="header" className="flex-1 text-left text-lg text-text font-bold">
            {t('deleteAccount.heading')}
          </Text>
        </View>
        <Text className="text-left text-base leading-7 text-text-2">
          {t('deleteAccount.intro')}
        </Text>
        {gone.map((line) => (
          <View key={line} className="flex-row gap-2">
            <Text className="text-base text-text-2">•</Text>
            <Text className="flex-1 text-left text-base leading-7 text-text">{line}</Text>
          </View>
        ))}
        <Text className="text-left text-sm leading-6 text-muted">{t('deleteAccount.final')}</Text>
      </View>
      {needsPassword ? (
        <TextField
          label={t('common.password')}
          value={password}
          onChangeText={setPassword}
          secureTextEntry
          autoCapitalize="none"
          autoComplete="current-password"
        />
      ) : null}
      <FormMessage message={error} />
      <Button title={t('deleteAccount.submit')} onPress={confirm} loading={deleting} />
    </Screen>
  );
}
