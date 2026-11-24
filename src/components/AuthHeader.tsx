import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';

interface AuthHeaderProps {
  title: string;
  subtitle?: string;
  icon: keyof typeof Ionicons.glyphMap;
}

/** The top of the sign-in, register and password screens: an icon tile, a title, a line. */
export function AuthHeader({ title, subtitle, icon }: AuthHeaderProps) {
  const colors = useThemeColors();
  return (
    <View className="gap-4 pb-2">
      <View className="h-14 w-14 items-center justify-center rounded-2xl bg-primary">
        <Ionicons name={icon} size={26} color={colors.onPrimary} />
      </View>
      <View className="gap-1.5">
        <Text
          accessibilityRole="header"
          className="text-left text-[28px] leading-10 text-text font-bold"
        >
          {title}
        </Text>
        {subtitle ? (
          <Text className="text-left text-base leading-7 text-text-2">{subtitle}</Text>
        ) : null}
      </View>
    </View>
  );
}
