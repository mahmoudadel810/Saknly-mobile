import type { ViewStyle } from 'react-native';

// Soft, tinted shadows (React Native's boxShadow works on both platforms with the new
// architecture). Tinted with the brand teal rather than black, so cards lift off the warm
// background instead of looking dirty.
export const elevation = {
  card: { boxShadow: '0 4px 16px rgba(14, 94, 87, 0.08)' },
  raised: { boxShadow: '0 10px 28px rgba(14, 94, 87, 0.16)' },
} satisfies Record<string, ViewStyle>;
