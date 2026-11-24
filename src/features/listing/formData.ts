import type { PropertyImage } from '@/api/browseTypes';

import { type ListingDraft, toListingFields } from './draft';
import type { LocalPhoto } from './photos';

/** The multipart file entry React Native's FormData sends. */
export const toUploadFile = (photo: LocalPhoto, index: number) => ({
  uri: photo.uri,
  name: `photo-${index + 1}.jpg`,
  type: 'image/jpeg',
});

/**
 * The optional fields the server can empty on an edit (its CLEARABLE_FIELDS), keyed by the
 * multipart key the form sends for each. An empty value means "not sent" to the server, so an
 * emptied field is listed as `clear[]=<path>` instead. Required fields are never cleared.
 */
const CLEARABLE: [key: string, path: string][] = [
  ['floor', 'floor'],
  ['totalFloors', 'totalFloors'],
  ['location[district]', 'location.district'],
  ['location[latitude]', 'location.latitude'],
  ['location[longitude]', 'location.longitude'],
  ['contactInfo[email]', 'contactInfo.email'],
  ['contactInfo[whatsapp]', 'contactInfo.whatsapp'],
  ['downPayment', 'downPayment'],
  ['installmentPeriodInYears', 'installmentPeriodInYears'],
  ['minInstallmentAmount', 'minInstallmentAmount'],
  ['deliveryDate', 'deliveryDate'],
  ['deliveryTerms', 'deliveryTerms'],
  ['deposit', 'deposit'],
  ['availableFrom', 'availableFrom'],
  ['rules[other]', 'rules.other'],
  ['studentHousingDetails[semester]', 'studentHousingDetails.semester'],
  [
    'studentHousingDetails[nearbyUniversities][0][name]',
    'studentHousingDetails.nearbyUniversities',
  ],
];

/**
 * What an edit empties: every clearable field the listing sent before and the edited form no
 * longer sends (cleared by the owner, or dropped with installments or a section). A server that
 * predates `clear[]` ignores it, since unknown fields pass through untouched.
 */
export const clearedFields = (initial: ListingDraft, draft: ListingDraft): [string, string][] => {
  const before = new Set(toListingFields(initial).map(([key]) => key));
  const now = new Set(toListingFields(draft).map(([key]) => key));
  return CLEARABLE.filter(([key]) => before.has(key) && !now.has(key)).map(([, path]) => [
    'clear[]',
    path,
  ]);
};

/**
 * The listing's photos the owner took out. Matched by id, not by object: a refetch of the listing
 * while the form is open brings new objects, and comparing those would mark every kept photo as
 * removed (and delete them all on save).
 */
export const removedImages = (existing: PropertyImage[], kept: PropertyImage[]) =>
  existing.filter((image) => !kept.some((k) => k.publicId === image.publicId));

/**
 * Text fields for an edit's photos. The server keeps every existing photo when `images` is
 * absent, so removed ones also go in `imagesToDelete`; `images` sets the order of the kept ones.
 * The cover is the kept photo sent with isMain; with none flagged (`coverIsNew`), the server
 * makes its first photo the cover, and it puts new uploads first.
 */
export const toPhotoUpdateFields = (
  kept: PropertyImage[],
  removed: PropertyImage[],
  coverIsNew = false,
): [string, string][] => [
  ...kept.flatMap((image, i): [string, string][] => [
    [`images[${i}][publicId]`, image.publicId],
    [`images[${i}][isMain]`, String(!coverIsNew && i === 0)],
  ]),
  ...removed.map((image): [string, string] => ['imagesToDelete[]', image.publicId]),
];

/** POST /properties/addProperty: the fields plus every photo under `images`. */
export const createBody = (draft: ListingDraft, photos: LocalPhoto[]) => {
  const body = new FormData();
  toListingFields(draft).forEach(([key, value]) => body.append(key, value));
  photos.forEach((photo, i) => body.append('images', toUploadFile(photo, i) as unknown as Blob));
  return body;
};

/** PUT /properties/updateProperty/:id: the fields (category can't change), kept/removed photos, new ones under `newImages`. */
export const updateBody = (
  draft: ListingDraft,
  kept: PropertyImage[],
  removed: PropertyImage[],
  photos: LocalPhoto[],
  coverIsNew = false,
  clear: [string, string][] = [],
) => {
  const body = new FormData();
  toListingFields(draft)
    .filter(([key]) => key !== 'category')
    .forEach(([key, value]) => body.append(key, value));
  clear.forEach(([key, value]) => body.append(key, value));
  toPhotoUpdateFields(kept, removed, coverIsNew && photos.length > 0).forEach(([key, value]) =>
    body.append(key, value),
  );
  photos.forEach((photo, i) => body.append('newImages', toUploadFile(photo, i) as unknown as Blob));
  return body;
};
