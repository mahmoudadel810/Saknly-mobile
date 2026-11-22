import { router, useLocalSearchParams } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { authApi } from '@/api/auth';
import type { ResetPasswordInput } from '@/api/types';
import { resetPasswordSchema } from '@/auth/schemas';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { describeError } from '@/utils/errors';

type Field = keyof ResetPasswordInput;

export default function ResetPasswordScreen() {
  const { t } = useTranslation();
  const { email = '' } = useLocalSearchParams<{ email?: string }>();
  const [error, setError] = useState<string | null>(null);

  const form = useFormik<ResetPasswordInput>({
    initialValues: { email, code: '', newPassword: '', confirmNewPassword: '' },
    validationSchema: resetPasswordSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        await authApi.resetPassword(resetPasswordSchema.cast(values) as ResetPasswordInput);
        Toast.show({ type: 'success', text1: t('auth.resetDone') });
        router.dismissTo('/login');
      } catch (e) {
        setError(describeError(e));
      }
    },
  });

  const bind = (name: Field) => ({
    value: form.values[name],
    onChangeText: form.handleChange(name),
    onBlur: form.handleBlur(name),
    error: form.touched[name] && form.errors[name],
  });

  return (
    <Screen scroll>
      <Text className="text-3xl font-bold text-text">{t('auth.resetTitle')}</Text>
      <Text className="text-base text-text-2">{t('auth.resetBody')}</Text>
      <FormMessage message={error} />
      <TextField
        label={t('common.email')}
        {...bind('email')}
        autoCapitalize="none"
        keyboardType="email-address"
      />
      <TextField
        label={t('auth.code')}
        {...bind('code')}
        autoCapitalize="none"
        autoCorrect={false}
        autoComplete="one-time-code"
        textContentType="oneTimeCode"
      />
      <TextField
        label={t('auth.newPassword')}
        {...bind('newPassword')}
        secureTextEntry
        autoComplete="new-password"
      />
      <TextField
        label={t('auth.confirmNewPassword')}
        {...bind('confirmNewPassword')}
        secureTextEntry
        autoComplete="new-password"
      />
      <Button
        title={t('auth.resetButton')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />
    </Screen>
  );
}
