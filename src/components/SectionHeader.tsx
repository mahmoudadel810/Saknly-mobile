import { Pressable, View } from 'react-native';
import { Text } from '@/components/Text';

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5">
      <Text accessibilityRole="header" className="text-xl text-text font-bold">
        {title}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text className="text-sm text-primary font-semibold">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
