import { callUrl, mapsUrl, toWhatsAppNumber, whatsAppUrl } from './contact';

describe('WhatsApp links', () => {
  it.each([
    ['01234567893', '201234567893'],
    ['+20 123 456 7893', '201234567893'],
    ['00201234567893', '201234567893'],
    ['0123-456-7893', '201234567893'],
  ])('%s -> %s', (phone, expected) => expect(toWhatsAppNumber(phone)).toBe(expected));

  it('gives no link for a number that is not an Egyptian mobile', () => {
    expect(whatsAppUrl('0482223344')).toBeNull();
    expect(whatsAppUrl('01234567893')).toBe('https://wa.me/201234567893');
  });
});

describe('callUrl', () => {
  it('keeps digits and a leading +', () => {
    expect(callUrl('+20 123 456-7893')).toBe('tel:+201234567893');
  });
});

describe('mapsUrl', () => {
  const location = { address: 'شارع كلية التجارة', city: 'شبين الكوم', governorate: 'المنوفية' };

  it('uses the pin when the listing has coordinates', () => {
    expect(mapsUrl({ location: { ...location, latitude: 30.55, longitude: 31.01 } })).toBe(
      'https://www.google.com/maps/search/?api=1&query=30.55%2C31.01',
    );
  });

  it('falls back to the address', () => {
    expect(decodeURIComponent(mapsUrl({ location }))).toContain('شارع كلية التجارة، شبين الكوم');
  });
});
