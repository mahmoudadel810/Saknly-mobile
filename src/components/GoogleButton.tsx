import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { clearGoogleAccount, getGoogleIdToken, isGoogleSignInEnabled } from '@/auth/google';
import { classifyGoogleError, type GoogleFailure } from '@/auth/googleErrors';
import { setReturnTo } from '@/auth/returnTo';
import { describeError } from '@/utils/errors';

import { Button } from './Button';

interface GoogleButtonProps {
  /** Where to go after signing in (the screen that asked for sign-in). */
  redirect?: string;
  /** Called with a message to show when sign-in fails, and with null when a new attempt starts. */
  onError: (message: string | null) => void;
}

/** "Continue with Google" with an "or" divider above it. Renders nothing until Google is configured. */
export function GoogleButton({ redirect, onError }: GoogleButtonProps) {
  const { t } = useTranslation();
  const { signInWithGoogle } = useAuth();
  const [loading, setLoading] = useState(false);

  if (!isGoogleSignInEnabled()) return null;

  const messages: Record<GoogleFailure, (error: unknown) => string> = {
    playServices: () => t('auth.googlePlayServices'),
    emailRegistered: () => t('auth.googleEmailRegistered'),
    failed: () => t('auth.googleFailed'),
    network: (error) => describeError(error),
    other: () => t('auth.googleFailed'),
  };

  const press = async () => {
    onError(null);
    setLoading(true);
    let pickedAccount = false;
    try {
      const idToken = await getGoogleIdToken();
      if (!idToken) return;
      pickedAccount = true;
      // Success flips the route guard; the root navigator then returns to `redirect`.
      setReturnTo(redirect ?? null);
      await signInWithGoogle(idToken);
    } catch (error) {
      setReturnTo(null);
      onError(messages[classifyGoogleError(error)](error));
      // Google remembers the account it just returned; forget it, so a refused account (say, one
      // whose email belongs to a password account) can be swapped for another at the next tap.
      if (pickedAccount) void clearGoogleAccount();
    } finally {
      setLoading(false);
    }
  };

  return (
    <View className="gap-4">
      <View className="flex-row items-center gap-3">
        <View className="h-px flex-1 bg-border" />
        <Text className="text-sm text-muted">{t('auth.or')}</Text>
        <View className="h-px flex-1 bg-border" />
      </View>
      <Button
        testID="google-sign-in"
        title={t('auth.continueWithGoogle')}
        variant="secondary"
        loading={loading}
        onPress={press}
      />
    </View>
  );
}
