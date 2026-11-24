import { isRunningInExpoGo } from 'expo';
import { type FontSource, useFonts } from 'expo-font';
import { Platform } from 'react-native';

import { fonts } from './fonts';

// Builds embed the fonts at build time (the expo-font plugin in app.json). Expo Go and the web
// preview have no such step, so there they are loaded at runtime under the same names.
const atRuntime = Platform.OS === 'web' || isRunningInExpoGo();

const files: Record<string, FontSource> = atRuntime
  ? {
      [fonts.regular]: require('../../assets/fonts/IBMPlexSansArabic-Regular.ttf'),
      [fonts.medium]: require('../../assets/fonts/IBMPlexSansArabic-Medium.ttf'),
      [fonts.semibold]: require('../../assets/fonts/IBMPlexSansArabic-SemiBold.ttf'),
      [fonts.bold]: require('../../assets/fonts/IBMPlexSansArabic-Bold.ttf'),
    }
  : {};

/** True once the app font can be used. A load error counts as ready: the system font shows. */
export function useAppFonts(): boolean {
  const [loaded, error] = useFonts(files);
  return !atRuntime || loaded || !!error;
}
