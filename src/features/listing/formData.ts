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
 * Text fields for an edit's photos. The server keeps every existing photo when `images` is
 * absent, so removed ones also go in `imagesToDelete`; `images` sets the order of the kept ones.
 */
export const toPhotoUpdateFields = (
  kept: PropertyImage[],
  removed: PropertyImage[],
): [string, string][] => [
  ...kept.flatMap((image, i): [string, string][] => [
    [`images[${i}][publicId]`, image.publicId],
    [`images[${i}][isMain]`, String(i === 0)],
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
) => {
  const body = new FormData();
  toListingFields(draft)
    .filter(([key]) => key !== 'category')
    .forEach(([key, value]) => body.append(key, value));
  toPhotoUpdateFields(kept, removed).forEach(([key, value]) => body.append(key, value));
  photos.forEach((photo, i) => body.append('newImages', toUploadFile(photo, i) as unknown as Blob));
  return body;
};
