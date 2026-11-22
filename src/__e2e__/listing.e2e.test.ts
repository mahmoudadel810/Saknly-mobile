/**
 * End-to-end: adding, editing and deleting a listing with photos against a seeded Saknly-server.
 * scripts/local-api.mjs runs a fake Cloudinary, so uploads complete without a real account.
 * Run with `npm run test:e2e`.
 */
import { isAxiosError } from 'axios';

import { myPropertiesApi } from '@/api/account';
import { propertiesApi } from '@/api/browse';
import type { Property, PropertyImage } from '@/api/browseTypes';
import { api, setApiToken } from '@/api/client';
import { listingsApi } from '@/api/listings';
import { startSession } from '@/auth/session';
import { publicationState } from '@/features/account/publication';
import { EMPTY_DRAFT, type ListingDraft, toListingFields } from '@/features/listing/draft';
import { toPhotoUpdateFields } from '@/features/listing/formData';

const MEDIA = process.env.E2E_MEDIA_URL || 'http://127.0.0.1:5057';
// A 96×72 JPEG made by the server's own sharp.
const JPEG = Uint8Array.from(
  atob(
    '/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCABIAGADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAMF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmwFmSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k=',
  ),
  (c) => c.charCodeAt(0),
);

/** The same fields as the app's createBody/updateBody, with Node's FormData and real files. */
const body = (fields: [string, string][], fileKey: string, photos: number) => {
  const form = new FormData();
  fields.forEach(([key, value]) => form.append(key, value));
  for (let i = 0; i < photos; i++) {
    form.append(fileKey, new Blob([JPEG], { type: 'image/jpeg' }), `photo-${i + 1}.jpg`);
  }
  return form;
};

const signInAs = async (name: string, password = 'LocalDemo1!') => {
  const { token } = await startSession(`${name}@saknly.example.com`, password);
  setApiToken(token);
};

const rental: ListingDraft = {
  ...EMPTY_DRAFT,
  category: 'rent',
  type: 'شقة',
  title: 'شقة تجربة من التطبيق',
  description: 'شقة هادئة قريبة من الجامعة',
  price: '5000',
  area: '90',
  bedrooms: '2',
  bathrooms: '1',
  governorate: 'المنوفية',
  city: 'شبين الكوم',
  district: 'الجامعة',
  amenities: ['تكييف', 'مصعد'],
  leaseDuration: '12',
  contactName: 'فاطمة حسن',
  contactPhone: '01012345678',
  contactWhatsapp: '01012345678',
};

const uploads = async (): Promise<{ stored: string[]; deleted: string[] }> =>
  (await fetch(`${MEDIA}/uploads`)).json();

const status = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);

let created: Property;

afterEach(() => setApiToken(null));

describe('add a listing with photos', () => {
  it('uploads a rental that waits for review', async () => {
    await signInAs('fatma.hassan');
    created = await listingsApi.create(body(toListingFields(rental), 'images', 2));

    expect(created).toMatchObject({
      title: rental.title,
      category: 'rent',
      price: 5000,
      leaseDuration: 12,
      amenities: ['تكييف', 'مصعد'],
      isApproved: false,
      isActive: false,
      location: { governorate: 'المنوفية', city: 'شبين الكوم', address: 'الجامعة، شبين الكوم' },
      contactInfo: { name: 'فاطمة حسن', phone: '01012345678', whatsapp: '01012345678' },
    });
    expect(publicationState(created)).toBe('pending');
    expect(created.images).toHaveLength(2);
    expect(created.images[0].isMain).toBe(true);

    // the photo is really stored and served (compressed by the server's sharp)
    const photo = await fetch(created.images[0].url);
    expect(photo.status).toBe(200);
    expect(photo.headers.get('content-type')).toBe('image/jpeg');
  });

  it('shows it in my properties but not to the public', async () => {
    await signInAs('fatma.hassan');
    expect((await myPropertiesApi.list()).map((p) => p._id)).toContain(created._id);
    setApiToken(null);
    expect(status(await propertiesApi.details(created._id).catch((e) => e))).toBe(404);
  });

  it('stores student housing details and a shop with no bedrooms', async () => {
    await signInAs('fatma.hassan');
    const student = await listingsApi.create(
      body(
        toListingFields({
          ...rental,
          category: 'student',
          type: 'استوديو',
          area: '40',
          roomType: 'shared',
          studentsPerRoom: '2',
          genderPolicy: 'female',
        }),
        'images',
        1,
      ),
    );
    expect(student.isStudentFriendly).toBe(true);
    expect(student.studentHousingDetails).toMatchObject({
      isEnabled: true,
      roomType: 'shared',
      studentsPerRoom: 2,
      genderPolicy: 'female',
    });

    const shop = await listingsApi.create(
      body(
        toListingFields({ ...rental, category: 'sale', type: 'محل', bedrooms: '', area: '50' }),
        'images',
        1,
      ),
    );
    expect(shop).toMatchObject({ type: 'محل', bedrooms: 0, category: 'sale' });
    await listingsApi.remove(student._id);
    await listingsApi.remove(shop._id);
  });

  it('rejects a listing without contact details', async () => {
    await signInAs('fatma.hassan');
    const fields = toListingFields({ ...rental, contactName: '', contactPhone: '' });
    const error = await listingsApi.create(body(fields, 'images', 1)).catch((e) => e);
    expect(status(error)).toBe(400);
    expect(error.response.data.message).toMatch(/contactInfo/);
  });
});

describe('edit and delete', () => {
  const ids = (images: PropertyImage[]) => images.map((image) => image.publicId);

  it('keeps one photo, removes the other, adds a new one and updates the price', async () => {
    await signInAs('fatma.hassan');
    const [first, second] = created.images;
    const fields = [
      ...toListingFields({ ...rental, price: '6500' }).filter(([key]) => key !== 'category'),
      ...toPhotoUpdateFields([second], [first]),
    ];
    const updated = await listingsApi.update(created._id, body(fields, 'newImages', 1));

    expect(updated.price).toBe(6500);
    expect(updated.images).toHaveLength(2);
    expect(ids(updated.images)).toContain(second.publicId);
    expect(ids(updated.images)).not.toContain(first.publicId);
    // the kept photo stays the cover
    expect(updated.images.find((image) => image.isMain)?.publicId).toBe(second.publicId);
    expect((await uploads()).deleted).toContain(first.publicId);
    created = updated;
  });

  it('replaces every old photo when none are kept', async () => {
    await signInAs('fatma.hassan');
    const old = created.images;
    const updated = await listingsApi.update(
      created._id,
      body(toPhotoUpdateFields([], old), 'newImages', 1),
    );
    expect(updated.images).toHaveLength(1);
    expect(ids(updated.images).some((id) => ids(old).includes(id))).toBe(false);
    expect(updated.images[0].isMain).toBe(true);
    created = updated;
  });

  it('sends an approved listing back to review when the owner edits it', async () => {
    await signInAs('admin', 'LocalAdmin1!');
    await api.put(`/properties/${created._id}/approve`);
    setApiToken(null);
    expect((await propertiesApi.details(created._id)).title).toBe(rental.title);

    await signInAs('fatma.hassan');
    const updated = await listingsApi.update(
      created._id,
      body([['description', 'وصف جديد للشقة']], 'newImages', 0),
    );
    expect(publicationState(updated)).toBe('pending');
    // a partial edit keeps the photos
    expect(ids(updated.images)).toEqual(ids(created.images));
  });

  it("refuses another user's edit and delete", async () => {
    await signInAs('mona.adel');
    expect(
      status(
        await listingsApi
          .update(created._id, body([['price', '1']], 'newImages', 0))
          .catch((e) => e),
      ),
    ).toBe(403);
    expect(status(await listingsApi.remove(created._id).catch((e) => e))).toBe(403);
  });

  it('deletes the listing and its photos', async () => {
    await signInAs('fatma.hassan');
    const photoIds = ids(created.images);
    await listingsApi.remove(created._id);
    expect((await myPropertiesApi.list()).map((p) => p._id)).not.toContain(created._id);
    const { deleted } = await uploads();
    expect(photoIds.every((id) => deleted.includes(id))).toBe(true);
  });
});
