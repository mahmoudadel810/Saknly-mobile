import type { PropsWithChildren } from 'react';
import { View } from 'react-native';

import { Text } from '@/components/Text';

interface TabHeaderProps extends PropsWithChildren {
  title: string;
  /** A short line under the title (a count, a hint). */
  subtitle?: string;
}

/** The large title at the top of a tab, with room for controls underneath (search, chips). */
export function TabHeader({ title, subtitle, children }: TabHeaderProps) {
  return (
    <View className="gap-4 px-5 pb-4 pt-3">
      <View className="gap-1">
        <Text
          accessibilityRole="header"
          className="text-left text-[28px] leading-10 text-text font-bold"
        >
          {title}
        </Text>
        {subtitle ? <Text className="text-left text-sm text-muted">{subtitle}</Text> : null}
      </View>
      {children}
    </View>
  );
}
