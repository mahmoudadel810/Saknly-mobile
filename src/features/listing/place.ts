import type { Place } from '@/api/geo';
import { GOVERNORATES } from '@/constants/property';

import { citiesOf } from './draft';

/** Spelling differences that don't change an Arabic place name: أ/إ/آ, ة/ه, ى/ي, and spacing. */
const normalize = (text: string) =>
  text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

/**
 * "محافظة المنوفية" -> "المنوفية"; "مركز شبين الكوم" / "قسم الزمالك" -> the name alone. "مدينة"
 * stays: it is part of city names ("مدينة نصر").
 */
const withoutPrefix = (text: string) => normalize(text).replace(/^(محافظه|مركز|قسم|حي)\s+/, '');

/**
 * The form's governorate and city for a GeoLink place, when they are in the lists the server
 * accepts. The city is the longest city name of that governorate in the district, else in the
 * address ("مدينة نصر" before "نصر"); the district goes first, since a street can be named after
 * another city. Either can be missing.
 */
export const areaOf = (place: Place): { governorate?: string; city?: string } => {
  const governorate = GOVERNORATES.find(
    (name) => normalize(name) === withoutPrefix(place.governorate ?? ''),
  );
  if (!governorate) return {};
  const cities = [...citiesOf(governorate)].sort((a, b) => b.length - a.length);
  const findIn = (text: string) => cities.find((name) => text.includes(normalize(name)));
  const city =
    findIn(withoutPrefix(place.district ?? '')) ?? findIn(normalize(place.address ?? ''));
  return { governorate, city };
};
