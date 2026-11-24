import { Link, router } from 'expo-router';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { type TextInputProps, View } from 'react-native';

import { authApi } from '@/api/auth';
import type { RegisterInput } from '@/api/types';
import { registerSchema } from '@/auth/schemas';
import { AuthHeader } from '@/components/AuthHeader';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { GoogleButton } from '@/components/GoogleButton';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { describeError } from '@/utils/errors';
import { Text } from '@/components/Text';

type Field = keyof RegisterInput;

const initialValues: RegisterInput = {
  firstName: '',
  lastName: '',
  userName: '',
  email: '',
  phone: '',
  address: '',
  password: '',
  confirmPassword: '',
};

const fieldProps: Record<Field, { label: string } & TextInputProps> = {
  firstName: { label: 'auth.firstName', autoComplete: 'given-name' },
  lastName: { label: 'auth.lastName', autoComplete: 'family-name' },
  userName: { label: 'auth.userName', autoCapitalize: 'none', autoComplete: 'username' },
  email: {
    label: 'common.email',
    autoCapitalize: 'none',
    autoComplete: 'email',
    keyboardType: 'email-address',
  },
  phone: { label: 'auth.phone', keyboardType: 'phone-pad', autoComplete: 'tel', maxLength: 11 },
  address: { label: 'auth.address', autoComplete: 'street-address' },
  password: { label: 'common.password', secureTextEntry: true, autoComplete: 'new-password' },
  confirmPassword: {
    label: 'common.confirmPassword',
    secureTextEntry: true,
    autoComplete: 'new-password',
  },
};

export default function RegisterScreen() {
  const { t } = useTranslation();
  const [error, setError] = useState<string | null>(null);

  const form = useFormik({
    initialValues,
    validationSchema: registerSchema,
    onSubmit: async (values) => {
      setError(null);
      try {
        const input = registerSchema.cast(values) as RegisterInput;
        const { emailSent } = await authApi.register({
          ...input,
          firstName: input.firstName || undefined,
          lastName: input.lastName || undefined,
        });
        router.replace({
          pathname: '/check-email',
          params: { email: input.email, sent: emailSent ? '1' : '0' },
        });
      } catch (e) {
        setError(describeError(e));
      }
    },
  });

  return (
    <Screen scroll>
      <AuthHeader icon="person-add" title={t('auth.registerTitle')} />
      <FormMessage message={error} />

      {(Object.keys(fieldProps) as Field[]).map((name) => {
        const { label, ...input } = fieldProps[name];
        return (
          <TextField
            key={name}
            label={t(label)}
            value={form.values[name]}
            onChangeText={form.handleChange(name)}
            onBlur={form.handleBlur(name)}
            error={form.touched[name] && form.errors[name]}
            {...input}
          />
        );
      })}

      <Button
        title={t('auth.registerButton')}
        onPress={() => form.handleSubmit()}
        loading={form.isSubmitting}
      />

      <GoogleButton onError={setError} />

      <View className="flex-row justify-center gap-1">
        <Text className="text-sm text-text-2">{t('auth.haveAccount')}</Text>
        <Link href="/login" replace asChild>
          <Text className="text-sm text-primary font-semibold">{t('home.signIn')}</Text>
        </Link>
      </View>
    </Screen>
  );
}
