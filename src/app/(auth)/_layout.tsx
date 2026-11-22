import { Stack } from 'expo-router';

import { useThemeColors } from '@/theme/colors';

// The header lives on this inner stack, so its back arrow steps between the auth screens
// (reset → forgot → login) and leaves the group only from its first screen.
export default function AuthLayout() {
  const colors = useThemeColors();
  return (
    <Stack
      screenOptions={{
        title: '',
        headerTintColor: colors.primary,
        headerStyle: { backgroundColor: colors.bg },
        headerShadowVisible: false,
        headerBackButtonDisplayMode: 'minimal',
        contentStyle: { backgroundColor: colors.bg },
      }}
    />
  );
}
