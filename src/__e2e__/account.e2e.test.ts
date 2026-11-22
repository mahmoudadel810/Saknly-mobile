/**
 * End-to-end: signed-in features against a seeded Saknly-server (scripts/local-api.mjs).
 * Uses the seed's demo accounts. Run with `npm run test:e2e`.
 */
import {
  commentWriteApi,
  contactApi,
  inquiryApi,
  myPropertiesApi,
  testimonialWriteApi,
  wishlistApi,
} from '@/api/account';
import { commentsApi, propertiesApi, testimonialsApi } from '@/api/browse';
import type { Property } from '@/api/browseTypes';
import { api, setApiToken } from '@/api/client';
import { startSession } from '@/auth/session';
import { EMPTY_FILTERS, toQueryParams } from '@/features/properties/filters';

const DEMO_USERS = [
  'ahmed.ali',
  'fatma.hassan',
  'karim.mahmoud',
  'sara.ibrahim',
  'omar.khaled',
  'mona.adel',
];
const email = (name: string) => `${name}@saknly.example.com`;
const signInAs = async (name: string, password = 'LocalDemo1!') => {
  const { token } = await startSession(email(name), password);
  setApiToken(token);
  return token;
};
const asAdmin = () => signInAs('admin', 'LocalAdmin1!');
const marker = `e2e-${Date.now()}`;

/** What the web app's heart reads: GET /properties/:id/favorite. */
const webIsFavorite = async (id: string) =>
  (await api.get(`/properties/${id}/favorite`)).data.data.isFavorite as boolean;

let listings: Property[] = [];

beforeAll(async () => {
  listings = (await propertiesApi.list({ ...toQueryParams(EMPTY_FILTERS, 1), limit: '50' })).data;
  expect(listings.length).toBeGreaterThan(2);
});

afterEach(() => setApiToken(null));

describe('wishlist: the app and the web app see the same favorites', () => {
  it('saves, reads and clears favorites', async () => {
    await signInAs('mona.adel');
    await wishlistApi.clear();
    const [a, b] = listings;

    // saved from the app, seen by the web app's endpoint
    await wishlistApi.add(a._id);
    expect((await wishlistApi.list()).map((i) => i.property._id)).toEqual([a._id]);
    expect(await webIsFavorite(a._id)).toBe(true);

    // saved from the web app's endpoint, seen by the app
    await api.post(`/properties/${b._id}/favorite`);
    expect((await wishlistApi.list()).map((i) => i.property._id).sort()).toEqual(
      [a._id, b._id].sort(),
    );

    // adding twice keeps one entry
    await wishlistApi.add(a._id);
    expect((await wishlistApi.list()).filter((i) => i.property._id === a._id)).toHaveLength(1);

    await wishlistApi.remove(a._id);
    expect(await webIsFavorite(a._id)).toBe(false);

    await wishlistApi.clear();
    expect(await wishlistApi.list()).toEqual([]);
    expect(await webIsFavorite(b._id)).toBe(false);
  });

  it('refuses the wishlist without a session', async () => {
    const error = await wishlistApi.list().catch((e) => e);
    expect(error.response?.status).toBe(401);
  });
});

describe('my properties', () => {
  it('lists each owner their own listings, pending ones included', async () => {
    const all: Property[] = [];
    for (const name of DEMO_USERS) {
      await signInAs(name);
      const mine = await myPropertiesApi.list();
      expect(mine.every((p) => typeof p.owner === 'object' && p.owner?.userName === name)).toBe(
        true,
      );
      all.push(...mine);
    }
    const pending = all.find((p) => !p.isApproved);
    expect(pending).toBeTruthy();
    expect(all.some((p) => p.isApproved && p.isActive)).toBe(true);

    // the owner can open a pending listing; the public can't
    const owner = (pending!.owner as { userName: string }).userName;
    await signInAs(owner);
    expect((await propertiesApi.details(pending!._id)).title).toBe(pending!.title);
    setApiToken(null);
    const error = await propertiesApi.details(pending!._id).catch((e) => e);
    expect(error.response?.status).toBe(404);
  });
});

describe('comments', () => {
  it('posts a comment that the listing then shows', async () => {
    await signInAs('sara.ibrahim');
    const text = `Lovely place ${marker}`;
    const created = await commentWriteApi.add(listings[0]._id, `  ${text}  `);
    expect(created.text).toBe(text);
    expect(created.user?.userName).toBe('sara.ibrahim');

    setApiToken(null);
    const comments = await commentsApi.forProperty(listings[0]._id);
    expect(comments[0]).toMatchObject({ _id: created._id, text });
  });
});

describe('forms an admin receives', () => {
  it('delivers an inquiry about a listing', async () => {
    const message = `Is it still available? ${marker}`;
    await inquiryApi.create({
      property: listings[1]._id,
      name: 'Mona',
      email: 'mona@example.com',
      phone: '+20 101-234-5678',
      message,
    });
    await asAdmin();
    const { data } = await api.get('/property-inquiry/get-all-property-inquiries');
    expect(JSON.stringify(data)).toContain(message);
  });

  it('delivers a contact message', async () => {
    const subject = `Question ${marker}`;
    await contactApi.submit({
      name: 'Mona',
      email: 'mona@example.com',
      subject,
      message: 'About listings',
    });
    await asAdmin();
    const { data } = await api.get('/contact/get-all-contacts');
    expect(JSON.stringify(data)).toContain(subject);
  });

  it('holds a review for approval', async () => {
    const text = `Great service ${marker}`;
    await testimonialWriteApi.submit({ name: 'Mona', text, type: 'general' });

    expect((await testimonialsApi.approved()).some((t) => t.text === text)).toBe(false);
    await asAdmin();
    const { data } = await api.get('/testimonial/all');
    const saved = (data.data as { text: string; status: string }[]).find((t) => t.text === text);
    expect(saved?.status).toBe('pending');
  });
});
