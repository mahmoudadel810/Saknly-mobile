import type { Property } from './browseTypes';
import { api } from './client';
import type { ApiMessage } from './types';

type Data<T> = ApiMessage & { data: T };

/** Photo uploads take longer than the client's default timeout on a slow connection. */
const UPLOAD_TIMEOUT_MS = 120_000;

interface UploadOptions {
  /** 0–1, as the request body goes out. */
  onProgress?: (fraction: number) => void;
}

const upload = (onProgress?: (fraction: number) => void) => ({
  timeout: UPLOAD_TIMEOUT_MS,
  // Hand the FormData to React Native's networking untouched: it writes the multipart body and
  // boundary itself. Axios would otherwise JSON-encode a FormData it fails to recognise.
  transformRequest: [(data: unknown) => data],
  onUploadProgress: onProgress
    ? (event: { loaded: number; total?: number }) =>
        event.total && onProgress(Math.min(1, event.loaded / event.total))
    : undefined,
});

export const listingsApi = {
  /** A user's new listing is saved as pending until an admin approves it. */
  create: async (body: FormData, { onProgress }: UploadOptions = {}) =>
    (await api.post<Data<Property>>('/properties/addProperty', body, upload(onProgress))).data.data,

  /** New files go under `newImages`; `images[i][publicId]` lists the photos to keep, in order. */
  update: async (id: string, body: FormData, { onProgress }: UploadOptions = {}) =>
    (await api.put<Data<Property>>(`/properties/updateProperty/${id}`, body, upload(onProgress)))
      .data.data,

  remove: async (id: string) =>
    (await api.delete<ApiMessage>(`/properties/deleteProperty/${id}`)).data,
};
