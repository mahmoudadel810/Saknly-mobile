import { router } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';

import { authApi } from '@/api/auth';
import { emailSchema } from '@/auth/schemas';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { describeError } from '@/utils/errors';

export default function ForgotPasswordScreen() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const form = useFormik({
    initialValues: { email: '' },
    validationSchema: emailSchema,
    onSubmit: async ({ email }) => {
      setError(null);
      try {
        await authApi.forgotPassword(email.trim());
        router.push({ pathname: '/reset-password', params: { email: email.trim() } });
      } catch (e) {
        setError(describeError(e));
      }
    },
  });

  return (
    <Screen scroll>
      <Text className="text-3xl font-bold text-text">{t('auth.forgotTitle')}</Text>
      <Text className="text-base text-text-2">{t('auth.forgotBody')}</Text>
      <FormMessage message={error} />
      <TextField
        label={t('common.email')}
        value={form.values.email}
        onChangeText={form.handleChange('email')}
        onBlur={form.handleBlur('email')}
        error={form.touched.email && form.errors.email}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
        onSubmitEditing={() => form.handleSubmit()}
      />
      <Button
        title={t('auth.sendCode')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />
      <Button title={t('common.back')} variant="link" onPress={() => router.back()} />
    </Screen>
  );
}
