/**
 * A rough outline of Egypt (latitude, longitude), drawn through the sea where a coast is near a
 * neighbour: Gaza, Eilat, Aqaba, Tabuk and Wadi Halfa fall outside it, every Egyptian city in it.
 */
const EGYPT: [number, number][] = [
  [31.6, 25.0], // Sallum, on the Libyan border
  [31.5, 29.9], // the Mediterranean coast
  [31.6, 32.3], // Port Said
  [31.33, 34.22], // Rafah, the Gaza border
  [29.49, 34.9], // Taba, the Israeli border
  [27.9, 34.45], // down the Gulf of Aqaba
  [23.9, 35.6], // the Red Sea
  [22.0, 36.9], // Halaib
  [22.0, 31.3], // the Sudanese border along 22°N
  [22.0, 25.0],
];

/** Ray casting: a point is inside when a line from it crosses the outline an odd number of times. */
export const inEgypt = (latitude: number, longitude: number) => {
  let inside = false;
  for (let i = 0, j = EGYPT.length - 1; i < EGYPT.length; j = i++) {
    const [latI, lngI] = EGYPT[i];
    const [latJ, lngJ] = EGYPT[j];
    const crosses =
      latI > latitude !== latJ > latitude &&
      longitude < ((lngJ - lngI) * (latitude - latI)) / (latJ - latI) + lngI;
    if (crosses) inside = !inside;
  }
  return inside;
};

/** Six decimals is about 10 cm: finer than any phone fix, and short in the request. */
export const toCoordinate = (value: number) => String(Math.round(value * 1e6) / 1e6);

/** A pin must be within this many metres to be worth saving: about the size of a building. */
export const MAX_ERROR_METRES = 50;
/** How long to wait for a fix before telling the owner it didn't work. */
export const LOCATE_TIMEOUT_MS = 20_000;
