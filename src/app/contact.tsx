import { router } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { contactApi } from '@/api/account';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { contactSchema } from '@/features/account/schemas';
import { fieldBinder } from '@/features/account/useFormFields';
import { describeError } from '@/utils/errors';

export default function ContactScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useFormik({
    initialValues: {
      name: user?.userName ?? '',
      email: user?.email ?? '',
      subject: '',
      message: '',
    },
    validationSchema: contactSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        await contactApi.submit(contactSchema.cast(values));
        Toast.show({ type: 'success', text1: t('contact.sent') });
        router.back();
      } catch (e) {
        setError(describeError(e));
      }
    },
  });
  const bind = fieldBinder(form);

  return (
    <Screen scroll>
      <FormMessage message={error} />
      <TextField label={t('inquiry.name')} {...bind('name')} autoComplete="name" />
      <TextField
        label={t('common.email')}
        {...bind('email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField label={t('contact.subject')} {...bind('subject')} maxLength={100} />
      <TextField
        label={t('contact.message')}
        {...bind('message')}
        multiline
        maxLength={2000}
        textAlignVertical="top"
        style={{ minHeight: 140 }}
      />
      <Button
        title={t('contact.send')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />
    </Screen>
  );
}
