import type { Place } from '@/api/geo';
import { GOVERNORATES } from '@/constants/property';

import { citiesOf } from './draft';

/** Spelling differences that don't change an Arabic place name: أ/إ/آ, ة/ه, ى/ي, and spacing. */
const normalize = (text: string) =>
  text.replace(/[أإآ]/g, 'ا').replace(/ة/g, 'ه').replace(/ى/g, 'ي').replace(/\s+/g, ' ').trim();

/** "محافظة المنوفية" -> "المنوفية"; "مركز شبين الكوم" / "قسم الزمالك" -> the name alone. */
const withoutPrefix = (text: string) =>
  normalize(text).replace(/^(محافظه|مركز|قسم|حي|مدينه)\s+/, '');

/**
 * The form's governorate and city for a GeoLink place, when they are in the lists the server
 * accepts. The city is the longest city name of that governorate found in the district or the
 * address ("مدينة نصر" before "نصر"); either can be missing.
 */
export const areaOf = (place: Place): { governorate?: string; city?: string } => {
  const governorate = GOVERNORATES.find(
    (name) => normalize(name) === withoutPrefix(place.governorate),
  );
  if (!governorate) return {};
  const haystack = `${withoutPrefix(place.district)} ${normalize(place.address)}`;
  const city = [...citiesOf(governorate)]
    .sort((a, b) => b.length - a.length)
    .find((name) => haystack.includes(normalize(name)));
  return { governorate, city };
};
