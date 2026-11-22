import * as yup from 'yup';

import type { Property, PropertyCategory } from '@/api/browseTypes';
import { AMENITIES, CITIES_BY_GOVERNORATE, governorateOf } from '@/constants/property';
import i18n from '@/i18n';

// The add/edit form, mirroring Saknly-client's PropertyFormForSale + propertyFormValidation
// and Saknly-server's PropertyValidator. Every value is a string while editing.

export interface ListingDraft {
  category: PropertyCategory | '';
  type: string;
  title: string;
  description: string;
  price: string;
  area: string;
  bedrooms: string;
  bathrooms: string;
  governorate: string;
  city: string;
  district: string;
  address: string;
  floor: string;
  totalFloors: string;
  amenities: string[];
  isNegotiable: boolean;
  // rent and student
  leaseDuration: string;
  deposit: string;
  // student
  roomType: '' | 'private' | 'shared' | 'dormitory';
  studentsPerRoom: string;
  genderPolicy: '' | 'male' | 'female' | 'mixed';
  // contact
  contactName: string;
  contactPhone: string;
  contactWhatsapp: string;
  contactEmail: string;
}

export const EMPTY_DRAFT: ListingDraft = {
  category: '',
  type: '',
  title: '',
  description: '',
  price: '',
  area: '',
  bedrooms: '',
  bathrooms: '',
  governorate: '',
  city: '',
  district: '',
  address: '',
  floor: '',
  totalFloors: '',
  amenities: [],
  isNegotiable: false,
  leaseDuration: '',
  deposit: '',
  roomType: '',
  studentsPerRoom: '',
  genderPolicy: '',
  contactName: '',
  contactPhone: '',
  contactWhatsapp: '',
  contactEmail: '',
};

export const LIMITS = { title: 70, description: 400, address: 300, district: 50, contactName: 25 };
const MAX_PRICE = 500_000_000;

// Area ranges per type (the web form's client rule).
export const AREA_RANGES: Record<string, { min: number; max: number }> = {
  شقة: { min: 30, max: 600 },
  محل: { min: 20, max: 1000 },
  استوديو: { min: 20, max: 150 },
  دوبلكس: { min: 100, max: 800 },
  فيلا: { min: 150, max: 3000 },
};
const areaRange = (type: string) => AREA_RANGES[type] ?? { min: 20, max: 5000 };

export const isShop = (type: string) => type === 'محل';
const isRental = (category: string) => category === 'rent' || category === 'student';

/** Western digits only: Arabic-Indic (٠-٩) and Persian (۰-۹) digits are converted. */
export const toDigits = (value: string) =>
  value
    .replace(/[٠-٩]/g, (d) => String(d.charCodeAt(0) - 0x0660))
    .replace(/[۰-۹]/g, (d) => String(d.charCodeAt(0) - 0x06f0))
    .replace(/\D/g, '');

const PHONE = /^0\d{9,10}$/;
const MOBILE = /^01\d{9}$/;
const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const NAME = /^[A-Za-zء-ي\s]+$/;

const t =
  (key: string, options: Record<string, number> = {}) =>
  () =>
    i18n.t(key, options);
const required = t('validation.required');
const number = () => yup.string().matches(/^\d*$/, t('validation.required'));

export const listingSchema = yup.object({
  category: yup.string().oneOf(['sale', 'rent', 'student'], required).required(required),
  type: yup.string().required(required),
  title: yup
    .string()
    .trim()
    .required(required)
    .max(LIMITS.title, t('validation.maxChars', { max: LIMITS.title })),
  description: yup
    .string()
    .trim()
    .required(required)
    .max(LIMITS.description, t('validation.maxChars', { max: LIMITS.description })),
  price: number()
    .required(required)
    .test('max', t('listing.errors.price'), (v) => !v || Number(v) <= MAX_PRICE),
  area: number()
    .required(required)
    .test('range', (v, ctx) => {
      const { min, max } = areaRange(ctx.parent.type);
      return (
        !v ||
        (Number(v) >= min && Number(v) <= max) ||
        ctx.createError({ message: i18n.t('listing.errors.area', { min, max }) })
      );
    }),
  bedrooms: number().when('type', {
    is: (type: string) => !isShop(type),
    then: (s) =>
      s.required(required).test('max', t('listing.errors.bedrooms'), (v) => !v || Number(v) <= 10),
  }),
  bathrooms: number()
    .required(required)
    .test('range', t('listing.errors.bathrooms'), (v) => !v || (Number(v) >= 1 && Number(v) <= 10)),
  governorate: yup.string().required(required),
  city: yup.string().required(required),
  district: yup
    .string()
    .trim()
    .max(LIMITS.district, t('validation.maxChars', { max: LIMITS.district })),
  address: yup
    .string()
    .trim()
    .max(LIMITS.address, t('validation.maxChars', { max: LIMITS.address })),
  floor: number().test('floor', t('listing.errors.floor'), function (v) {
    const total = this.parent.totalFloors;
    return !v || !total || Number(v) <= Number(total);
  }),
  totalFloors: number().test('min', t('listing.errors.totalFloors'), (v) => !v || Number(v) >= 1),
  leaseDuration: number().when('category', {
    is: isRental,
    then: (s) =>
      s
        .required(required)
        .test(
          'range',
          t('listing.errors.leaseDuration'),
          (v) => !v || (Number(v) >= 1 && Number(v) <= 120),
        ),
  }),
  deposit: number().test('max', t('listing.errors.price'), (v) => !v || Number(v) <= MAX_PRICE),
  roomType: yup.string().when('category', { is: 'student', then: (s) => s.required(required) }),
  studentsPerRoom: yup
    .string()
    .when('category', { is: 'student', then: (s) => s.required(required) }),
  genderPolicy: yup.string().when('category', { is: 'student', then: (s) => s.required(required) }),
  contactName: yup
    .string()
    .trim()
    .required(required)
    .matches(NAME, t('listing.errors.contactName'))
    .min(3, t('validation.lengthBetween', { min: 3, max: LIMITS.contactName }))
    .max(LIMITS.contactName, t('validation.lengthBetween', { min: 3, max: LIMITS.contactName })),
  contactPhone: yup.string().required(required).matches(PHONE, t('listing.errors.phone')),
  contactWhatsapp: yup
    .string()
    .matches(MOBILE, { message: t('validation.phone'), excludeEmptyString: true }),
  contactEmail: yup
    .string()
    .trim()
    .matches(EMAIL, { message: t('validation.email'), excludeEmptyString: true }),
});

/**
 * The text fields of the multipart body, with the keys the web form sends
 * (bracket keys, which the server's multer expands into nested objects).
 */
export const toListingFields = (draft: ListingDraft): [string, string][] => {
  const fields: [string, string][] = [];
  const add = (key: string, value: string | undefined) => {
    const v = value?.trim();
    if (v) fields.push([key, v]);
  };
  add('category', draft.category);
  add('type', draft.type);
  add('title', draft.title);
  add('description', draft.description);
  add('price', draft.price);
  add('area', draft.area);
  // The server requires bedrooms; a shop has none.
  add('bedrooms', isShop(draft.type) ? '0' : draft.bedrooms);
  add('bathrooms', draft.bathrooms);
  add('location[governorate]', draft.governorate);
  add('location[city]', draft.city);
  add('location[district]', draft.district);
  // The server requires an address: fall back to "district، city", as the web does.
  add(
    'location[address]',
    draft.address.trim() || [draft.district.trim(), draft.city].filter(Boolean).join('، '),
  );
  add('floor', draft.floor);
  add('totalFloors', draft.totalFloors);
  add('contactInfo[name]', draft.contactName);
  add('contactInfo[phone]', draft.contactPhone);
  add('contactInfo[email]', draft.contactEmail);
  add('contactInfo[whatsapp]', draft.contactWhatsapp);
  fields.push(['isNegotiable', String(draft.isNegotiable)]);
  draft.amenities.forEach((amenity) => fields.push(['amenities[]', amenity]));
  if (isRental(draft.category)) {
    add('leaseDuration', draft.leaseDuration);
    add('deposit', draft.deposit);
  }
  if (draft.category === 'student') {
    fields.push(['isStudentFriendly', 'true']);
    fields.push(['studentHousingDetails[isEnabled]', 'true']);
    add('studentHousingDetails[roomType]', draft.roomType);
    add('studentHousingDetails[studentsPerRoom]', draft.studentsPerRoom);
    add('studentHousingDetails[genderPolicy]', draft.genderPolicy);
  }
  return fields;
};

const text = (value: unknown) => (value === undefined || value === null ? '' : String(value));

/** An existing listing as a draft, for editing. */
export const draftFromProperty = (p: Property): ListingDraft => ({
  category: p.category,
  type: p.type,
  title: p.title,
  description: p.description,
  price: text(p.price),
  area: text(p.area),
  bedrooms: text(p.bedrooms),
  bathrooms: text(p.bathrooms),
  governorate: p.location.governorate || governorateOf(p.location.city) || '',
  city: p.location.city,
  district: text(p.location.district),
  address: text(p.location.address),
  floor: text(p.floor),
  totalFloors: text(p.totalFloors),
  amenities: (p.amenities ?? []).filter((a) => (AMENITIES as readonly string[]).includes(a)),
  isNegotiable: !!p.isNegotiable,
  leaseDuration: text(p.leaseDuration),
  deposit: text(p.deposit),
  roomType: p.studentHousingDetails?.roomType ?? '',
  studentsPerRoom: text(p.studentHousingDetails?.studentsPerRoom),
  genderPolicy: p.studentHousingDetails?.genderPolicy ?? '',
  contactName: text(p.contactInfo?.name),
  contactPhone: text(p.contactInfo?.phone),
  contactWhatsapp: text(p.contactInfo?.whatsapp),
  contactEmail: text(p.contactInfo?.email),
});

export const citiesOf = (governorate: string): readonly string[] =>
  (CITIES_BY_GOVERNORATE as Record<string, readonly string[]>)[governorate]?.filter(
    (city) => city !== 'اشمون',
  ) ?? [];
