import { useColorScheme } from 'react-native';

// The same tokens as src/global.css, for props that take a color value instead of a class
// (icons, ActivityIndicator, tab bar, placeholder text).
const light = {
  primary: '#0E5E57',
  onPrimary: '#FFFFFF',
  text: '#17201F',
  text2: '#4A5654',
  muted: '#66706E',
  border: '#DDE2E1',
  surface: '#FFFFFF',
  bg: '#F7F6F3',
  field: '#F2F5F4',
  accent: '#C08A3E',
  error: '#B42318',
  success: '#1E7A46',
  info: '#1F5F99',
};

const dark: typeof light = {
  primary: '#4FB3A6',
  onPrimary: '#0F1413',
  text: '#E8EDEC',
  text2: '#B3BEBC',
  muted: '#82908D',
  border: '#2A3533',
  surface: '#161D1C',
  bg: '#0D1312',
  field: '#1B2422',
  accent: '#E0B36A',
  error: '#F07A6E',
  success: '#5CC48A',
  info: '#7FB2E5',
};

export type ThemeColors = typeof light;

export const useThemeColors = (): ThemeColors => (useColorScheme() === 'dark' ? dark : light);
