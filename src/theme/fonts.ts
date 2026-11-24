// The embedded font files (see the expo-font plugin in app.json). Android names an embedded
// font after its file, iOS after its PostScript name, so the files are named after the
// PostScript names and one string works on both. Keep in sync with tailwind.config.js.
export const fonts = {
  regular: 'IBMPlexSansArabic-Regular',
  medium: 'IBMPlexSansArabic-Medium',
  semibold: 'IBMPlexSansArabic-SemiBold',
  bold: 'IBMPlexSansArabic-Bold',
} as const;
