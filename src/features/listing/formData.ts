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
) => {
  const body = new FormData();
  toListingFields(draft)
    .filter(([key]) => key !== 'category')
    .forEach(([key, value]) => body.append(key, value));
  toPhotoUpdateFields(kept, removed, coverIsNew && photos.length > 0).forEach(([key, value]) =>
    body.append(key, value),
  );
  photos.forEach((photo, i) => body.append('newImages', toUploadFile(photo, i) as unknown as Blob));
  return body;
};
