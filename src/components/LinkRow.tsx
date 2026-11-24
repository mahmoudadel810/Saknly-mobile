import { Ionicons } from '@expo/vector-icons';
import { I18nManager, Pressable, View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';

interface LinkRowProps {
  title: string;
  onPress: () => void;
  /** A small icon tile before the title. */
  icon?: keyof typeof Ionicons.glyphMap;
}

/** A tappable row that opens another screen; the chevron points along the reading direction. */
export function LinkRow({ title, onPress, icon }: LinkRowProps) {
  const colors = useThemeColors();
  return (
    <Pressable
      accessibilityRole="button"
      // Without a label the chevron's glyph becomes part of the name a screen reader speaks.
      accessibilityLabel={title}
      onPress={onPress}
      className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-surface-2"
    >
      {icon ? (
        <View className="h-9 w-9 items-center justify-center rounded-xl bg-field">
          <Ionicons name={icon} size={18} color={colors.text2} />
        </View>
      ) : null}
      <Text className="flex-1 text-left text-base text-text">{title}</Text>
      <Ionicons
        name={I18nManager.isRTL ? 'chevron-back' : 'chevron-forward'}
        size={18}
        color={colors.muted}
      />
    </Pressable>
  );
}
