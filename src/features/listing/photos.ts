import { File } from 'expo-file-system';
import { ImageManipulator, SaveFormat } from 'expo-image-manipulator';

// Saknly-server limits (utils/multer.js, same as the web form's UPLOAD_LIMITS): 8 files, 4 MB each,
// and Vercel rejects a request body over ~4.5 MB in total, so all photos together stay under 4 MB.
export const MAX_PHOTOS = 8;
export const MAX_TOTAL_BYTES = 4 * 1024 * 1024;
/** The server shrinks every photo to fit 800×600 anyway; 1280 keeps a margin for its crop. */
export const LONG_EDGE = 1280;
/** Recompress a photo that is still bigger than this after the first pass. */
const TARGET_BYTES = 450 * 1024;

export interface LocalPhoto {
  uri: string;
  width: number;
  height: number;
  bytes: number;
}

/** The resize that fits the long edge into LONG_EDGE; null when the photo is already small enough. */
export const resizeFor = (width: number, height: number) => {
  if (Math.max(width, height) <= LONG_EDGE) return null;
  return width >= height ? { width: LONG_EDGE, height: null } : { width: null, height: LONG_EDGE };
};

const render = async (uri: string, width: number, height: number, compress: number) => {
  const context = ImageManipulator.manipulate(uri);
  const resize = resizeFor(width, height);
  if (resize) context.resize(resize);
  const image = await context.renderAsync();
  // JPEG always: HEIC from iPhones isn't accepted by the server.
  const saved = await image.saveAsync({ compress, format: SaveFormat.JPEG });
  return {
    uri: saved.uri,
    width: saved.width,
    height: saved.height,
    bytes: new File(saved.uri).size,
  };
};

/** A picked or captured photo as an upload-ready JPEG. */
export const preparePhoto = async (asset: {
  uri: string;
  width: number;
  height: number;
}): Promise<LocalPhoto> => {
  const first = await render(asset.uri, asset.width, asset.height, 0.7);
  return first.bytes > TARGET_BYTES ? render(asset.uri, asset.width, asset.height, 0.5) : first;
};

export const totalBytes = (photos: Pick<LocalPhoto, 'bytes'>[]) =>
  photos.reduce((sum, photo) => sum + photo.bytes, 0);

/** Photos to keep from a new selection: within the count limit and the total size budget. */
export const fitPhotos = (current: LocalPhoto[], picked: LocalPhoto[], existingCount = 0) => {
  const kept: LocalPhoto[] = [];
  let bytes = totalBytes(current);
  let skipped = 0;
  for (const photo of picked) {
    const count = existingCount + current.length + kept.length;
    if (count >= MAX_PHOTOS || bytes + photo.bytes > MAX_TOTAL_BYTES) {
      skipped++;
      continue;
    }
    kept.push(photo);
    bytes += photo.bytes;
  }
  return { kept, skipped };
};
