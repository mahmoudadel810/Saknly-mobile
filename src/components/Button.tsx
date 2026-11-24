import { Ionicons } from '@expo/vector-icons';
import { ActivityIndicator, Pressable } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  /** An icon before the label (it follows the reading direction). */
  icon?: keyof typeof Ionicons.glyphMap;
  loading?: boolean;
  disabled?: boolean;
  /** A stable handle for end-to-end flows when the label is not unique on the screen. */
  testID?: string;
}

const containerClass = {
  primary: 'bg-primary active:bg-primary-hover',
  secondary: 'border border-border bg-surface active:bg-surface-2',
  link: 'bg-transparent active:opacity-70',
} as const;

const textClass = {
  primary: 'text-on-primary',
  secondary: 'text-text',
  link: 'text-primary',
} as const;

export function Button({
  title,
  onPress,
  variant = 'primary',
  icon,
  loading = false,
  disabled = false,
  testID,
}: ButtonProps) {
  const colors = useThemeColors();
  const inactive = disabled || loading;
  const tint =
    variant === 'primary' ? colors.onPrimary : variant === 'link' ? colors.primary : colors.text;
  return (
    <Pressable
      testID={testID}
      accessibilityRole="button"
      // Without a label the icon's glyph becomes part of the name a screen reader speaks.
      accessibilityLabel={title}
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`min-h-[52px] flex-row items-center justify-center gap-2 rounded-2xl px-5 ${
        containerClass[variant]
      } ${inactive ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <>
          {icon ? <Ionicons name={icon} size={18} color={tint} /> : null}
          <Text className={`text-base font-semibold ${textClass[variant]}`}>{title}</Text>
        </>
      )}
    </Pressable>
  );
}
