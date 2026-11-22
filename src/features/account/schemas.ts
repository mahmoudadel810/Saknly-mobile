import * as yup from 'yup';

import i18n from '@/i18n';

// Same rules as the Saknly-server Joi validators for each endpoint.
const t =
  (key: string, options: Record<string, number> = {}) =>
  () =>
    i18n.t(key, options);
const required = t('validation.required');

const length = (min: number, max: number) =>
  yup
    .string()
    .trim()
    .min(min, t('validation.lengthBetween', { min, max }))
    .max(max, t('validation.lengthBetween', { min, max }))
    .required(required);

/** property-inquiry: phone pattern from createInquiryValidator. */
export const INQUIRY_PHONE = /^[+]*[(]{0,1}[0-9]{1,4}[)]{0,1}[-\s./0-9]*$/;
/** contact: the server also rejects addresses whose last part isn't 2–3 letters. */
export const CONTACT_EMAIL = /^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/;

export const inquirySchema = yup.object({
  name: length(2, 50),
  email: yup.string().trim().email(t('validation.email')).required(required),
  phone: yup
    .string()
    .trim()
    .max(30, t('validation.lengthBetween', { min: 1, max: 30 }))
    .matches(INQUIRY_PHONE, t('validation.phoneFormat'))
    .required(required),
  message: length(10, 500),
});

export const contactSchema = yup.object({
  name: yup.string().trim().required(required),
  email: yup
    .string()
    .trim()
    .email(t('validation.email'))
    .matches(CONTACT_EMAIL, t('validation.email'))
    .required(required),
  subject: yup
    .string()
    .trim()
    .max(100, t('validation.lengthBetween', { min: 1, max: 100 }))
    .required(required),
  message: yup
    .string()
    .trim()
    .max(2000, t('validation.lengthBetween', { min: 1, max: 2000 }))
    .required(required),
});

export const testimonialSchema = yup.object({
  name: length(2, 50),
  role: yup
    .string()
    .trim()
    .max(50, t('validation.lengthBetween', { min: 0, max: 50 })),
  text: length(5, 1000),
});

export const COMMENT_MAX = 1000;
