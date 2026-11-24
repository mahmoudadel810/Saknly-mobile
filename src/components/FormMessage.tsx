import { Ionicons } from '@expo/vector-icons';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';

interface FormMessageProps {
  message?: string | null;
  tone?: 'error' | 'success' | 'info';
}

const tones = {
  error: { box: 'border-error', text: 'text-error', icon: 'alert-circle' },
  success: { box: 'border-success', text: 'text-success', icon: 'checkmark-circle' },
  info: { box: 'border-info', text: 'text-info', icon: 'information-circle' },
} as const;

export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  const colors = useThemeColors();
  if (!message) return null;
  const style = tones[tone];
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      className={`flex-row items-start gap-2.5 rounded-2xl border bg-surface px-4 py-3 ${style.box}`}
    >
      <Ionicons name={style.icon} size={20} color={colors[tone]} />
      <Text className={`flex-1 text-left text-sm leading-6 ${style.text}`}>{message}</Text>
    </View>
  );
}
