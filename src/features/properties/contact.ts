import type { Property } from '@/api/browseTypes';

/** An Egyptian mobile number (01xxxxxxxxx, +20…, 0020…) in the international digits wa.me expects. */
export const toWhatsAppNumber = (phone: string): string | null => {
  const digits = phone.replace(/[^\d]/g, '').replace(/^00/, '');
  if (/^01\d{9}$/.test(digits)) return `2${digits}`;
  if (/^201\d{9}$/.test(digits)) return digits;
  return null;
};

export const whatsAppUrl = (phone: string): string | null => {
  const number = toWhatsAppNumber(phone);
  return number ? `https://wa.me/${number}` : null;
};

export const callUrl = (phone: string) => `tel:${phone.replace(/[^\d+]/g, '')}`;

const searchUrl = (query: string) =>
  `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(query)}`;

/** A maps link straight to a pin. */
export const coordinatesUrl = (latitude: number, longitude: number) =>
  searchUrl(`${latitude},${longitude}`);

/** A maps link that opens the native maps app (or the browser): the pin when known, else the address. */
export const mapsUrl = ({ location }: Pick<Property, 'location'>): string => {
  const { latitude, longitude, address, city, governorate } = location;
  return typeof latitude === 'number' && typeof longitude === 'number'
    ? coordinatesUrl(latitude, longitude)
    : searchUrl([address, city, governorate, 'مصر'].filter(Boolean).join('، '));
};
