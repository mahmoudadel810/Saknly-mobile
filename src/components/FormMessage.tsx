import { Text, View } from 'react-native';

interface FormMessageProps {
  message?: string | null;
  tone?: 'error' | 'success' | 'info';
}

const toneClass = {
  error: 'border-error bg-surface text-error',
  success: 'border-success bg-surface text-success',
  info: 'border-info bg-surface text-info',
} as const;

export function FormMessage({ message, tone = 'error' }: FormMessageProps) {
  if (!message) return null;
  return (
    <View
      accessibilityRole={tone === 'error' ? 'alert' : 'text'}
      className={`rounded-xl border px-4 py-3 ${toneClass[tone]}`}
    >
      <Text className={`text-sm ${toneClass[tone]}`}>{message}</Text>
    </View>
  );
}
