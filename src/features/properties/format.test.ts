import i18n from '@/i18n';

import { coverImage, formatPrice, placeLabel, statusLabel } from './format';

afterAll(() => i18n.changeLanguage('ar'));

describe('in Arabic', () => {
  beforeAll(() => i18n.changeLanguage('ar'));

  // Western digits, like the counts beside them (bedrooms, area), so one card never mixes two.
  it('formats sale and rent prices', () => {
    expect(formatPrice({ price: 1250000, category: 'sale' })).toBe('1,250,000 ج.م');
    expect(formatPrice({ price: 4500, category: 'rent' })).toBe('4,500 ج.م / شهرياً');
  });

  it('labels the status whether the server sent English or Arabic', () => {
    expect(statusLabel('available')).toBe('متاح');
    expect(statusLabel('متاح')).toBe('متاح');
    expect(statusLabel('قيد المراجعة')).toBe('قيد المراجعة');
  });

  // Arabic has six plural forms: 0, 1, 2, 3–10, 11–99, 100+.
  it.each([
    [0, 'غرف', 'حمام'],
    [1, 'غرفة', 'حمام'],
    [2, 'غرفتان', 'حمامان'],
    [3, 'غرف', 'حمامات'],
    [11, 'غرفة', 'حمامًا'],
    [100, 'غرفة', 'حمام'],
  ])('shows a count of %i in the right plural form', (count, rooms, baths) => {
    expect(i18n.t('browse.results', { count })).toBe(`النتائج: ${count}`);
    expect(i18n.t('property.bedrooms', { count })).toBe(`${count} ${rooms}`);
    expect(i18n.t('property.bathrooms', { count })).toBe(`${count} ${baths}`);
  });
});

describe('in English', () => {
  beforeAll(() => i18n.changeLanguage('en'));

  it('formats prices and labels', () => {
    expect(formatPrice({ price: 4500, category: 'student' })).toBe('EGP 4,500 / month');
    expect(statusLabel('مباع')).toBe('Sold');
    expect(statusLabel('something-new')).toBe('something-new');
  });
});

describe('coverImage and placeLabel', () => {
  const image = (url: string, isMain = false) => ({ publicId: url, url, isMain });

  it('prefers the main image, then the first, then mainImage', () => {
    expect(coverImage({ images: [image('a'), image('b', true)] })).toBe('b');
    expect(coverImage({ images: [image('a'), image('b')] })).toBe('a');
    expect(coverImage({ images: [], mainImage: 'm' })).toBe('m');
  });

  it('joins city and governorate', () => {
    expect(placeLabel({ location: { address: 'x', city: 'طنطا', governorate: 'الغربية' } })).toBe(
      'طنطا، الغربية',
    );
  });
});
