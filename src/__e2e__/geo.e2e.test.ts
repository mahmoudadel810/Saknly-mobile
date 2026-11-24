/**
 * End-to-end: place search and reverse geocoding through Saknly-server (GET /geo/*), which calls
 * GeoLink with its key. scripts/local-api.mjs points the server at a fake GeoLink, so no real
 * request is spent. Run with `npm run test:e2e`.
 */
import { isAxiosError } from 'axios';

import { setApiToken } from '@/api/client';
import { geoApi } from '@/api/geo';
import { startSession } from '@/auth/session';
import { areaOf } from '@/features/listing/place';

const status = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);

afterEach(() => setApiToken(null));

describe('finding a place through the server', () => {
  it('is for signed-in users only', async () => {
    expect(status(await geoApi.search('شبين الكوم', 'ar').catch((e) => e))).toBe(401);
  });

  it('searches, and the result fits the listing form', async () => {
    const { token } = await startSession('sara.ibrahim@saknly.example.com', 'LocalDemo1!');
    setApiToken(token);
    const places = await geoApi.search('جامعة المنوفية', 'ar');
    expect(places[0]).toMatchObject({
      name: 'الإدارة العامة لجامعة المنوفية',
      governorate: 'محافظة المنوفية',
    });
    expect(areaOf(places[0])).toEqual({ governorate: 'المنوفية', city: 'شبين الكوم' });
  });

  it('turns a pin into an address', async () => {
    const { token } = await startSession('sara.ibrahim@saknly.example.com', 'LocalDemo1!');
    setApiToken(token);
    const place = await geoApi.reverse(30.0459, 31.2243, 'ar');
    expect(place).toMatchObject({ name: 'برج القاهرة', latitude: 30.0459, longitude: 31.2243 });
    expect(areaOf(place)).toEqual({ governorate: 'القاهرة', city: 'الزمالك' });
  });
});
