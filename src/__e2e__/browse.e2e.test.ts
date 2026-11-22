/**
 * End-to-end: the app's browse API code and query params against a seeded Saknly-server
 * (scripts/local-api.mjs runs the server's seed script). Run with `npm run test:e2e`.
 */
import { agenciesApi, commentsApi, propertiesApi, testimonialsApi } from '@/api/browse';
import type { Property } from '@/api/browseTypes';
import {
  EMPTY_FILTERS,
  PAGE_SIZE,
  type PropertyFilters,
  toQueryParams,
} from '@/features/properties/filters';
import { statusLabel } from '@/features/properties/format';

const list = (filters: Partial<PropertyFilters>, page = 1) =>
  propertiesApi.list(toQueryParams({ ...EMPTY_FILTERS, ...filters }, page));

let all: Property[] = [];

beforeAll(async () => {
  const first = await list({});
  all = first.data;
  for (let page = 2; page <= first.pagination.totalPages; page++) {
    all.push(...(await list({}, page)).data);
  }
});

describe('browse against a seeded Saknly-server', () => {
  it('pages through every public listing with no duplicates', async () => {
    const first = await list({});
    expect(first.pagination.itemsPerPage).toBe(PAGE_SIZE);
    expect(all.length).toBe(first.pagination.totalDocs);
    expect(new Set(all.map((p) => p._id)).size).toBe(all.length);
    expect(all.length).toBeGreaterThan(0);
  });

  it('serves a second page the way the infinite list asks for it', async () => {
    // The seed has fewer listings than PAGE_SIZE, so ask for smaller pages here.
    const params = { ...toQueryParams(EMPTY_FILTERS, 1), limit: '4' };
    const one = await propertiesApi.list(params);
    const two = await propertiesApi.list({ ...params, page: '2' });
    expect(one.pagination).toMatchObject({ currentPage: 1, hasNext: true, hasPrev: false });
    expect(two.pagination).toMatchObject({ currentPage: 2, hasPrev: true });
    expect(two.data.length).toBeGreaterThan(0);
    expect(two.data[0]._id).not.toBe(one.data[0]._id);
  });

  it('filters by kind exactly as the server stores it', async () => {
    const rent = await list({ kind: 'rent' });
    expect(rent.data.length).toBeGreaterThan(0);
    expect(rent.data.every((p) => p.category === 'rent')).toBe(true);

    const student = await list({ kind: 'student' });
    expect(student.data.length).toBeGreaterThan(0);
    expect(student.data.every((p) => p.isStudentFriendly)).toBe(true);
  });

  it('applies price bounds, place, type and bedrooms', async () => {
    const cheap = await list({ kind: 'rent', maxPrice: 10000 });
    expect(cheap.data.every((p) => p.price <= 10000)).toBe(true);

    const sample = all[0];
    const exact = await list({
      governorate: sample.location.governorate,
      city: sample.location.city,
      type: sample.type,
      bedrooms: sample.bedrooms,
    });
    expect(exact.data.map((p) => p._id)).toContain(sample._id);
    expect(
      exact.data.every(
        (p) =>
          p.location.city === sample.location.city &&
          p.type === sample.type &&
          p.bedrooms === sample.bedrooms,
      ),
    ).toBe(true);
  });

  it('searches the title text', async () => {
    const word = all[0].title.split(' ').find((w) => w.length > 2)!;
    const found = await list({ search: word });
    expect(found.data.map((p) => p._id)).toContain(all[0]._id);
  });

  it('sorts by price both ways', async () => {
    const asc = (await list({ sort: 'price' })).data.map((p) => p.price);
    const desc = (await list({ sort: '-price' })).data.map((p) => p.price);
    expect(asc).toEqual([...asc].sort((a, b) => a - b));
    expect(desc).toEqual([...desc].sort((a, b) => b - a));
  });

  it('returns featured listings with a status the app can label', async () => {
    const featured = await propertiesApi.featured();
    expect(featured.length).toBeGreaterThan(0);
    // featured sends Arabic status text; the label must still resolve
    expect(statusLabel(featured[0].status)).not.toBe('');
    expect(['متاح', 'Available']).toContain(statusLabel(featured[0].status));
  });

  it('loads a listing with contact info, similar listings and comments', async () => {
    const detail = await propertiesApi.details(all[0]._id);
    expect(detail.title).toBe(all[0].title);
    expect(detail.contactInfo?.phone).toBeTruthy();
    expect(typeof detail.owner === 'object' && detail.owner?.userName).toBeTruthy();

    const similar = await propertiesApi.similar(detail._id);
    expect(similar.every((p) => p._id !== detail._id)).toBe(true);

    expect(Array.isArray(await commentsApi.forProperty(detail._id))).toBe(true);
  });

  it('finds a listing with comments among the seed data', async () => {
    const counts = await Promise.all(all.map((p) => commentsApi.forProperty(p._id)));
    const withComments = counts.find((c) => c.length > 0);
    expect(withComments?.[0].text).toBeTruthy();
    expect(withComments?.[0].user?.userName).toBeTruthy();
  });

  it('loads featured agencies and an agency with its public listings', async () => {
    const agencies = await agenciesApi.featured();
    expect(agencies.length).toBeGreaterThan(0);
    const agency = await agenciesApi.details(agencies[0]._id);
    expect(agency.name).toBe(agencies[0].name);
    const listings = agency.properties.filter((p): p is Property => typeof p === 'object');
    expect(listings.every((p) => typeof p.title === 'string')).toBe(true);
  });

  it('returns approved testimonials only', async () => {
    const testimonials = await testimonialsApi.approved();
    expect(testimonials.length).toBeGreaterThan(0);
    expect(testimonials.every((t) => t.text && t.name)).toBe(true);
  });

  it('answers 404 for a missing listing', async () => {
    const error = await propertiesApi.details('6b0000000000000000000000').catch((e) => e);
    expect(error.response?.status).toBe(404);
  });
});
