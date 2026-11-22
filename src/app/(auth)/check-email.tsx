import { router, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { authApi } from '@/api/auth';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { describeError } from '@/utils/errors';

// The confirmation link in the email opens the web app, which confirms the account.
export default function CheckEmailScreen() {
  const { t } = useTranslation();
  const { email = '', sent } = useLocalSearchParams<{ email?: string; sent?: string }>();
  const [message, setMessage] = useState<{ text: string; tone: 'success' | 'error' } | null>(
    sent === '0' ? { text: t('auth.checkEmailNotSent'), tone: 'error' } : null,
  );
  const [sending, setSending] = useState(false);

  const resend = async () => {
    setSending(true);
    try {
      await authApi.resendConfirmation(email);
      setMessage({ text: t('auth.resent'), tone: 'success' });
    } catch (e) {
      setMessage({ text: describeError(e), tone: 'error' });
    } finally {
      setSending(false);
    }
  };

  return (
    <Screen>
      <Text className="text-3xl font-bold text-text">{t('auth.checkEmailTitle')}</Text>
      <Text className="text-base leading-6 text-text-2">{t('auth.checkEmailBody', { email })}</Text>
      <FormMessage message={message?.text} tone={message?.tone} />
      <Button
        title={t('auth.resend')}
        variant="secondary"
        onPress={resend}
        loading={sending}
        disabled={!email}
      />
      <Button title={t('auth.goToLogin')} onPress={() => router.replace('/login')} />
    </Screen>
  );
}
