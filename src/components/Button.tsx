import { ActivityIndicator, Pressable, Text } from 'react-native';

import { useThemeColors } from '@/theme/colors';

interface ButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'primary' | 'secondary' | 'link';
  loading?: boolean;
  disabled?: boolean;
}

const containerClass = {
  primary: 'bg-primary active:bg-primary-hover',
  secondary: 'border border-border-strong bg-surface active:bg-surface-2',
  link: 'bg-transparent',
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
  loading = false,
  disabled = false,
}: ButtonProps) {
  const colors = useThemeColors();
  const inactive = disabled || loading;
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ disabled: inactive, busy: loading }}
      disabled={inactive}
      onPress={onPress}
      className={`min-h-12 flex-row items-center justify-center rounded-xl px-5 ${
        containerClass[variant]
      } ${inactive ? 'opacity-60' : ''}`}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? colors.onPrimary : colors.primary} />
      ) : (
        <Text className={`text-base font-semibold ${textClass[variant]}`}>{title}</Text>
      )}
    </Pressable>
  );
}
