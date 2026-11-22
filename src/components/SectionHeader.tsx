import { Pressable, Text, View } from 'react-native';

interface SectionHeaderProps {
  title: string;
  action?: { label: string; onPress: () => void };
}

export function SectionHeader({ title, action }: SectionHeaderProps) {
  return (
    <View className="flex-row items-center justify-between px-5">
      <Text accessibilityRole="header" className="text-xl font-bold text-text">
        {title}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text className="text-sm font-semibold text-primary">{action.label}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
