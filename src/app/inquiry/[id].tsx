import { router, useLocalSearchParams } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text } from 'react-native';
import Toast from 'react-native-toast-message';

import { inquiryApi } from '@/api/account';
import { useAuth } from '@/auth/AuthProvider';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { inquirySchema } from '@/features/account/schemas';
import { fieldBinder } from '@/features/account/useFormFields';
import { useProperty } from '@/features/properties/queries';
import { describeError } from '@/utils/errors';

export default function InquiryScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const { user } = useAuth();
  const property = useProperty(id);
  const [error, setError] = useState<string | null>(null);
  const phone = user && 'phone' in user ? (user.phone ?? '') : '';

  const form = useFormik({
    initialValues: { name: user?.userName ?? '', email: user?.email ?? '', phone, message: '' },
    validationSchema: inquirySchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        await inquiryApi.create({ property: id, ...inquirySchema.cast(values) });
        Toast.show({ type: 'success', text1: t('inquiry.sent') });
        router.back();
      } catch (e) {
        setError(describeError(e));
      }
    },
  });
  const bind = fieldBinder(form);

  return (
    <Screen scroll>
      {property.data ? (
        <Text className="text-base font-semibold text-text-2">{property.data.title}</Text>
      ) : null}
      <FormMessage message={error} />
      <TextField label={t('inquiry.name')} {...bind('name')} autoComplete="name" />
      <TextField
        label={t('common.email')}
        {...bind('email')}
        autoCapitalize="none"
        autoComplete="email"
        keyboardType="email-address"
      />
      <TextField label={t('auth.phone')} {...bind('phone')} keyboardType="phone-pad" />
      <TextField
        label={t('inquiry.message')}
        {...bind('message')}
        multiline
        numberOfLines={5}
        maxLength={500}
        textAlignVertical="top"
        style={{ minHeight: 120 }}
      />
      <Button
        title={t('inquiry.send')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />
    </Screen>
  );
}
