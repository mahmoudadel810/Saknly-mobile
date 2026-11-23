import { Ionicons } from '@expo/vector-icons';
import { I18nManager, Pressable, Text } from 'react-native';

import { useThemeColors } from '@/theme/colors';

interface LinkRowProps {
  title: string;
  onPress: () => void;
}

/** A tappable row that opens another screen; the chevron points along the reading direction. */
export function LinkRow({ title, onPress }: LinkRowProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      // Without a label the chevron's glyph becomes part of the name a screen reader speaks.
      accessibilityLabel={title}
      onPress={onPress}
      className="min-h-14 flex-row items-center justify-between gap-3 px-4 py-3 active:bg-surface-2"
    >
      <Text className="flex-1 text-left text-base text-text">{title}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color={colors.muted}
      />
    </Pressable>
  );
}
