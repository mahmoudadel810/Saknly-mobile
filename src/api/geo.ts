// Place search and reverse geocoding through Saknly-server (GET /geo/*), which calls GeoLink with
// its private key: the app never holds the key.
import { api } from './client';
import type { ApiMessage } from './types';

export interface Place {
  /** A short name ("بازار الجمهورية"). */
  name: string;
  /** The full address. */
  address: string;
  latitude: number;
  longitude: number;
  /** As GeoLink writes it: "محافظة المنوفية". */
  governorate: string;
  /** As GeoLink writes it: "مركز شبين الكوم", "قسم الزمالك". */
  district: string;
}

type Data<T> = ApiMessage & { data: T };

export const geoApi = {
  search: async (query: string, language: string, near?: { latitude: number; longitude: number }) =>
    (await api.get<Data<Place[]>>('/geo/search', { params: { query, language, ...near } })).data
      .data,
  reverse: async (latitude: number, longitude: number, language: string) =>
    (await api.get<Data<Place>>('/geo/reverse', { params: { latitude, longitude, language } })).data
      .data,
};
