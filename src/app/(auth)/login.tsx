import { isAxiosError } from 'axios';
import { Link, router, useLocalSearchParams } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { setReturnTo } from '@/auth/returnTo';
import { loginSchema } from '@/auth/schemas';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { GoogleButton } from '@/components/GoogleButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { describeError } from '@/utils/errors';

export default function LoginScreen() {
  const { t } = useTranslation();
  const { signIn } = useAuth();
  const { redirect } = useLocalSearchParams<{ redirect?: string }>();
  const [error, setError] = useState<string | null>(null);
  const [unconfirmed, setUnconfirmed] = useState(false);

  const form = useFormik({
    initialValues: { email: '', password: '' },
    validationSchema: loginSchema,
    onSubmit: async ({ email, password }) => {
      setError(null);
      setUnconfirmed(false);
      try {
        // Success flips the route guard, which leaves the (auth) screens on its own;
        // the root navigator then returns to `redirect`.
        setReturnTo(redirect ?? null);
        await signIn(email.trim(), password);
      } catch (e) {
        setReturnTo(null);
        setUnconfirmed(isAxiosError(e) && e.response?.status === 403);
        setError(describeError(e));
      }
    },
  });

  const fieldError = (name: 'email' | 'password') => form.touched[name] && form.errors[name];

  return (
    <Screen scroll>
      <View className="gap-1">
        <Text className="text-3xl font-bold text-text">{t('auth.loginTitle')}</Text>
        <Text className="text-base text-text-2">{t('auth.loginSubtitle')}</Text>
      </View>

      <FormMessage message={error} />
      {unconfirmed ? (
        <Button
          variant="link"
          title={t('auth.resend')}
          onPress={() =>
            router.push({ pathname: '/check-email', params: { email: form.values.email.trim() } })
          }
        />
      ) : null}

      <TextField
        label={t('common.email')}
        value={form.values.email}
        onChangeText={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        error={fieldError('email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        textContentType="emailAddress"
      />
      <TextField
        label={t('common.password')}
        value={form.values.password}
        onChangeText={form.handleChange('password')}
        onBlur={form.handleBlur('password')}
        error={fieldError('password')}
        secureTextEntry
        autoComplete="current-password"
        textContentType="password"
        onSubmitEditing={() => form.handleSubmit()}
      />

      <Link href="/forgot-password" asChild>
        <Text className="text-sm font-medium text-primary">{t('auth.forgotPassword')}</Text>
      </Link>

      <Button
        testID="login-submit"
        title={t('auth.loginButton')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />

      <GoogleButton redirect={redirect} onError={setError} />

      <View className="flex-row justify-center gap-1">
        <Text className="text-sm text-text-2">{t('auth.noAccount')}</Text>
        <Link href="/register" replace asChild>
          <Text className="text-sm font-semibold text-primary">{t('home.createAccount')}</Text>
        </Link>
      </View>
    </Screen>
  );
}
