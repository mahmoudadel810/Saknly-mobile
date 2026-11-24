import type { Property } from '@/api/browseTypes';
import i18n from '@/i18n';

/** "12,500 ج.م" / "EGP 12,500"; rent listings add "/month". */
export const formatPrice = (property: Pick<Property, 'price' | 'category'>): string => {
  const amount = new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG', {
    maximumFractionDigits: 0,
  }).format(property.price);
  const price = i18n.t('property.price', { amount });
  return property.category === 'sale' ? price : `${price} ${i18n.t('property.perMonth')}`;
};

// /properties/featured sends the status in Arabic, the other endpoints in English.
const STATUS_KEYS: Record<string, string> = {
  available: 'available',
  rented: 'rented',
  sold: 'sold',
  pending: 'pending',
  inactive: 'inactive',
  متاح: 'available',
  مؤجر: 'rented',
  مباع: 'sold',
  'قيد المراجعة': 'pending',
  'غير نشط': 'inactive',
};

export const statusLabel = (status: string): string => {
  const key = STATUS_KEYS[status];
  return key ? i18n.t(`property.status.${key}`) : status;
};

export const categoryLabel = (property: Pick<Property, 'category' | 'isStudentFriendly'>) =>
  i18n.t(`property.category.${property.category}`);

/** The image to show first: the one marked main, else the first, else none. */
export const coverImage = (property: Pick<Property, 'images' | 'mainImage'>): string | undefined =>
  property.images?.find((image) => image.isMain)?.url ??
  property.images?.[0]?.url ??
  property.mainImage;

export const placeLabel = (property: Pick<Property, 'location'>) =>
  [property.location?.city, property.location?.governorate].filter(Boolean).join('، ');
