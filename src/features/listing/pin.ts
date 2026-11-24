/** A generous box around Egypt: every city the server accepts is inside it. */
const EGYPT = { south: 21.5, north: 32, west: 24.5, east: 37.5 };

export const inEgypt = (latitude: number, longitude: number) =>
  latitude >= EGYPT.south &&
  latitude <= EGYPT.north &&
  longitude >= EGYPT.west &&
  longitude <= EGYPT.east;

/** Six decimals is about 10 cm: more than a phone's GPS knows, and short in the request. */
export const toCoordinate = (value: number) => String(Math.round(value * 1e6) / 1e6);
