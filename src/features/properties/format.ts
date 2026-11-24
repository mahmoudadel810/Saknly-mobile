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

/** "1,250,000 ج.م" / "EGP 1,250,000" for any amount (a down payment, a deposit). */
export const formatMoney = (amount: number): string =>
  i18n.t('property.price', {
    amount: new Intl.NumberFormat(i18n.language === 'ar' ? 'ar-EG-u-nu-latn' : 'en-EG', {
      maximumFractionDigits: 0,
    }).format(amount),
  });

/**
 * Counted units by hand, like the web: Arabic counts change the noun's form (1 شهر واحد,
 * 2 شهران, 3–10 أشهر, 11+ شهرًا), and English needs only one and many.
 */
const counted =
  (unit: 'month' | 'year') =>
  (n: number): string => {
    if (i18n.language !== 'ar') return `${n} ${unit}${n === 1 ? '' : 's'}`;
    const [one, two, few, many] =
      unit === 'month'
        ? ['شهر واحد', 'شهران', 'أشهر', 'شهرًا']
        : ['سنة واحدة', 'سنتان', 'سنوات', 'سنة'];
    if (n === 1) return one;
    if (n === 2) return two;
    return `${n} ${n <= 10 ? few : many}`;
  };

export const monthsLabel = counted('month');
export const yearsLabel = counted('year');

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
