import type { Property } from '@/api/browseTypes';

import {
  draftFromProperty,
  EMPTY_DRAFT,
  type ListingDraft,
  listingSchema,
  toDigits,
  toListingFields,
} from './draft';
import { toPhotoUpdateFields } from './formData';
import { fitPhotos, MAX_PHOTOS, MAX_TOTAL_BYTES, resizeFor } from './photos';

const rent: ListingDraft = {
  ...EMPTY_DRAFT,
  category: 'rent',
  type: 'شقة',
  title: 'شقة قريبة من الجامعة',
  description: 'شقة هادئة',
  price: '5000',
  area: '90',
  bedrooms: '2',
  bathrooms: '1',
  governorate: 'المنوفية',
  city: 'شبين الكوم',
  district: 'الجامعة',
  amenities: ['تكييف', 'مصعد'],
  leaseDuration: '12',
  contactName: 'منى عادل',
  contactPhone: '01012345678',
};

const errorsOf = (draft: ListingDraft) => {
  try {
    listingSchema.validateSync(draft, { abortEarly: false });
    return [];
  } catch (e) {
    return (e as { inner: { path: string }[] }).inner.map((i) => i.path);
  }
};

describe('toListingFields (the web form keys)', () => {
  it('sends a rental with bracket keys and an address fallback', () => {
    const fields = toListingFields(rent);
    expect(fields).toEqual(
      expect.arrayContaining([
        ['category', 'rent'],
        ['bedrooms', '2'],
        ['location[governorate]', 'المنوفية'],
        ['location[city]', 'شبين الكوم'],
        ['location[address]', 'الجامعة، شبين الكوم'],
        ['contactInfo[phone]', '01012345678'],
        ['isNegotiable', 'false'],
        ['amenities[]', 'تكييف'],
        ['amenities[]', 'مصعد'],
        ['leaseDuration', '12'],
      ]),
    );
    expect(fields.map(([key]) => key)).not.toContain('isStudentFriendly');
    expect(fields.map(([key]) => key)).not.toContain('contactInfo[email]');
  });

  it('sends 0 bedrooms for a shop and no rental fields for a sale', () => {
    const fields = toListingFields({ ...rent, category: 'sale', type: 'محل', bedrooms: '' });
    expect(fields).toContainEqual(['bedrooms', '0']);
    expect(fields.map(([key]) => key)).not.toContain('leaseDuration');
  });

  it('marks student housing the way the web does', () => {
    const fields = toListingFields({
      ...rent,
      category: 'student',
      roomType: 'shared',
      studentsPerRoom: '2',
      genderPolicy: 'female',
    });
    expect(fields).toEqual(
      expect.arrayContaining([
        ['isStudentFriendly', 'true'],
        ['studentHousingDetails[isEnabled]', 'true'],
        ['studentHousingDetails[roomType]', 'shared'],
        ['studentHousingDetails[studentsPerRoom]', '2'],
        ['studentHousingDetails[genderPolicy]', 'female'],
      ]),
    );
  });
});

describe('listingSchema (the web form rules)', () => {
  it('accepts a complete rental', () => {
    expect(errorsOf(rent)).toEqual([]);
  });

  it('checks the area range of the chosen type', () => {
    expect(errorsOf({ ...rent, type: 'فيلا', area: '120' })).toContain('area');
    expect(errorsOf({ ...rent, type: 'استوديو', area: '120' })).toEqual([]);
  });

  it('needs bedrooms except for a shop', () => {
    expect(errorsOf({ ...rent, bedrooms: '' })).toContain('bedrooms');
    expect(errorsOf({ ...rent, type: 'محل', bedrooms: '', area: '50' })).toEqual([]);
  });

  it('needs a lease length for rentals and the student fields for student housing', () => {
    expect(errorsOf({ ...rent, leaseDuration: '' })).toContain('leaseDuration');
    expect(errorsOf({ ...rent, category: 'sale', leaseDuration: '' })).toEqual([]);
    expect(errorsOf({ ...rent, category: 'student' })).toEqual(
      expect.arrayContaining(['roomType', 'studentsPerRoom', 'genderPolicy']),
    );
  });

  it('checks contact name, phone, WhatsApp and floors', () => {
    expect(errorsOf({ ...rent, contactName: 'Mo' })).toContain('contactName');
    expect(errorsOf({ ...rent, contactName: 'Mona 2' })).toContain('contactName');
    expect(errorsOf({ ...rent, contactPhone: '1012345678' })).toContain('contactPhone');
    expect(errorsOf({ ...rent, contactPhone: '0482223344' })).toEqual([]);
    expect(errorsOf({ ...rent, contactWhatsapp: '0482223344' })).toContain('contactWhatsapp');
    expect(errorsOf({ ...rent, floor: '5', totalFloors: '4' })).toContain('floor');
  });
});

describe('toDigits', () => {
  it('converts Arabic-Indic and Persian digits and drops the rest', () => {
    expect(toDigits('٥٠٠٠ ج.م')).toBe('5000');
    expect(toDigits('۱۲')).toBe('12');
    expect(toDigits('01-012 345')).toBe('01012345');
  });
});

describe('draftFromProperty', () => {
  it('fills the edit form from a listing and round-trips its fields', () => {
    const property = {
      _id: 'p1',
      title: 'شقة',
      description: 'وصف',
      type: 'شقة',
      category: 'student',
      price: 3000,
      area: 80,
      bedrooms: 2,
      bathrooms: 1,
      location: { address: 'شارع', governorate: '', city: 'طنطا' },
      images: [],
      amenities: ['تكييف', 'unknown'],
      status: 'pending',
      views: 0,
      createdAt: '',
      leaseDuration: 9,
      studentHousingDetails: { roomType: 'private', studentsPerRoom: 1, genderPolicy: 'male' },
      contactInfo: { name: 'منى', phone: '01012345678' },
    } as unknown as Property & { leaseDuration: number };
    const draft = draftFromProperty(property);
    expect(draft).toMatchObject({
      governorate: 'الغربية',
      price: '3000',
      leaseDuration: '9',
      roomType: 'private',
      studentsPerRoom: '1',
      amenities: ['تكييف'],
      contactWhatsapp: '',
    });
  });
});

describe('photos', () => {
  const photo = (bytes: number, uri = `${bytes}-${Math.random()}`) => ({
    uri,
    width: 1280,
    height: 960,
    bytes,
  });

  it('fits the long edge into 1280 px and leaves small photos alone', () => {
    expect(resizeFor(4032, 3024)).toEqual({ width: 1280, height: null });
    expect(resizeFor(3024, 4032)).toEqual({ width: null, height: 1280 });
    expect(resizeFor(1000, 800)).toBeNull();
  });

  it('keeps a selection within 8 photos, counting the listing’s existing ones', () => {
    const picked = Array.from({ length: 10 }, () => photo(100_000));
    expect(fitPhotos([], picked).kept).toHaveLength(MAX_PHOTOS);
    const { kept, skipped } = fitPhotos([], picked, 6);
    expect(kept).toHaveLength(2);
    expect(skipped).toBe(8);
  });

  it('keeps all photos together under the 4 MB request budget', () => {
    const big = Array.from({ length: 5 }, () => photo(1_000_000));
    const { kept, skipped } = fitPhotos([], big);
    expect(kept.reduce((s, p) => s + p.bytes, 0)).toBeLessThanOrEqual(MAX_TOTAL_BYTES);
    expect(kept).toHaveLength(4);
    expect(skipped).toBe(1);
  });
});

describe('toPhotoUpdateFields', () => {
  const image = (publicId: string) => ({ publicId, url: `https://x/${publicId}` });

  it('lists kept photos in order with the first as cover, and removed ones to delete', () => {
    expect(toPhotoUpdateFields([image('b'), image('c')], [image('a')])).toEqual([
      ['images[0][publicId]', 'b'],
      ['images[0][isMain]', 'true'],
      ['images[1][publicId]', 'c'],
      ['images[1][isMain]', 'false'],
      ['imagesToDelete[]', 'a'],
    ]);
  });

  it('still lists removed photos when none are kept (the server would keep them otherwise)', () => {
    expect(toPhotoUpdateFields([], [image('a')])).toEqual([['imagesToDelete[]', 'a']]);
  });
});
