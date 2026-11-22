import { Pressable, Text } from 'react-native';

interface ChipProps {
  label: string;
  selected?: boolean;
  onPress: () => void;
}

export function Chip({ label, selected = false, onPress }: ChipProps) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityState={{ selected }}
      onPress={onPress}
      className={`rounded-full border px-4 py-2 ${
        selected ? 'border-primary bg-primary' : 'border-border bg-surface active:bg-surface-2'
      }`}
    >
      <Text className={`text-sm font-medium ${selected ? 'text-on-primary' : 'text-text'}`}>
        {label}
      </Text>
    </Pressable>
  );
}
