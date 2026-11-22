import * as yup from 'yup';

import i18n from '@/i18n';

// Same rules as Saknly-server modules/Auth/authValidation.js, so the server never rejects a valid form.
export const PASSWORD_PATTERN = /^(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*(),.?":{}|<>]).*$/;
export const PHONE_PATTERN = /^01[0-9]{9}$/;

const t = (key: string) => () => i18n.t(key);

const email = () =>
  yup.string().trim().email(t('validation.email')).required(t('validation.required'));

const newPassword = () =>
  yup
    .string()
    .min(5, t('validation.passwordMin'))
    .max(30, t('validation.passwordMax'))
    .matches(PASSWORD_PATTERN, t('validation.passwordPattern'))
    .required(t('validation.required'));

export const loginSchema = yup.object({
  email: email(),
  password: yup
    .string()
    .min(5, t('validation.passwordMin'))
    .max(30, t('validation.passwordMax'))
    .required(t('validation.required')),
});

export const registerSchema = yup.object({
  firstName: yup.string().trim().max(20, t('validation.nameMax')),
  lastName: yup.string().trim().max(20, t('validation.nameMax')),
  userName: yup
    .string()
    .trim()
    .min(3, t('validation.userNameMin'))
    .max(30, t('validation.userNameMax'))
    .required(t('validation.required')),
  email: email(),
  phone: yup
    .string()
    .trim()
    .matches(PHONE_PATTERN, t('validation.phone'))
    .required(t('validation.required')),
  address: yup
    .string()
    .trim()
    .max(200, t('validation.addressMax'))
    .required(t('validation.required')),
  password: newPassword(),
  confirmPassword: yup
    .string()
    .oneOf([yup.ref('password')], t('validation.passwordMatch'))
    .required(t('validation.required')),
});

export const emailSchema = yup.object({ email: email() });

export const resetPasswordSchema = yup.object({
  email: email(),
  code: yup.string().trim().required(t('validation.required')),
  newPassword: newPassword(),
  confirmNewPassword: yup
    .string()
    .oneOf([yup.ref('newPassword')], t('validation.passwordMatch'))
    .required(t('validation.required')),
});
