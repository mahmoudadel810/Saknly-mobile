import i18n from '@/i18n';

import { coverImage, formatPrice, placeLabel, statusLabel } from './format';

afterAll(() => i18n.changeLanguage('ar'));

describe('in Arabic', () => {
  beforeAll(() => i18n.changeLanguage('ar'));

  it('formats sale and rent prices', () => {
    expect(formatPrice({ price: 1250000, category: 'sale' })).toBe('١٬٢٥٠٬٠٠٠ ج.م');
    expect(formatPrice({ price: 4500, category: 'rent' })).toBe('٤٬٥٠٠ ج.م / شهرياً');
  });

  it('labels the status whether the server sent English or Arabic', () => {
    expect(statusLabel('available')).toBe('متاح');
    expect(statusLabel('متاح')).toBe('متاح');
    expect(statusLabel('قيد المراجعة')).toBe('قيد المراجعة');
  });

  it.each([0, 1, 2, 3, 11, 100])('shows a count of %i without a missing plural key', (count) => {
    expect(i18n.t('browse.results', { count })).toBe(`النتائج: ${count}`);
    expect(i18n.t('property.bedrooms', { count })).toBe(`${count} غرف`);
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
