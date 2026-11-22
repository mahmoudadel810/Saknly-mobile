import { router } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { testimonialWriteApi } from '@/api/account';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { testimonialSchema } from '@/features/account/schemas';
import { fieldBinder } from '@/features/account/useFormFields';
import { describeError } from '@/utils/errors';

// A general review of Saknly; the server holds it for admin approval.
export default function TestimonialScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const [error, setError] = useState<string | null>(null);

  const form = useFormik({
    initialValues: { name: user?.userName ?? '', role: '', text: '' },
    validationSchema: testimonialSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        const { name, role, text } = testimonialSchema.cast(values);
        await testimonialWriteApi.submit({
          name,
          text,
          type: 'general',
          ...(role ? { role } : {}),
        });
        Toast.show({ type: 'success', text1: t('testimonial.sent') });
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
      <TextField label={t('testimonial.role')} {...bind('role')} maxLength={50} />
      <TextField
        label={t('testimonial.text')}
        {...bind('text')}
        multiline
        maxLength={1000}
        textAlignVertical="top"
        style={{ minHeight: 140 }}
      />
      <Button
        title={t('testimonial.send')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />
    </Screen>
  );
}
