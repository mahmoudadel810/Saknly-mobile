import type { Property } from '@/api/browseTypes';
import i18n from '@/i18n';

/** "12,500 ج.م" / "EGP 12,500"; rent listings add "/month". */
export const formatPrice = (property: Pick<Property, 'price' | 'category'>): string => {
  const price = formatMoney(property.price);
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

/** "1,250,000 ج.م" / "EGP 1,250,000" for any amount (a down payment, a deposit). */
export const formatMoney = (amount: number): string =>
  i18n.t('property.price', {
    amount: new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG', {
      maximumFractionDigits: 0,
    }).format(amount),
  });

/** "12 months" / "12 شهرًا": i18next picks the Arabic plural form (six of them) from the count. */
export const monthsLabel = (count: number): string => i18n.t('units.months', { count });
export const yearsLabel = (count: number): string => i18n.t('units.years', { count });

/** "2028-03" -> "مارس 2028" / "March 2028". Names come from the strings, not Intl. */
export const monthLabel = (month: string): string => {
  const [year, m] = month.split('-').map(Number);
  const names = i18n.t('dates.months', { returnObjects: true }) as unknown as string[];
  return names[m - 1] ? `${names[m - 1]} ${year}` : month;
};

/** The photos with the cover first: on an edit the server puts new uploads before kept ones. */
export const coverFirst = <T extends { isMain?: boolean }>(images: T[]): T[] => {
  const main = images.findIndex((image) => image.isMain);
  return main > 0 ? [images[main], ...images.filter((_, i) => i !== main)] : images;
};
