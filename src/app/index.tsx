import { Text, View } from 'react-native';

import { env } from '@/config/env';

export default function Home() {
  return (
    <View className="flex-1 items-center justify-center gap-3 bg-bg px-6">
      <Text className="text-3xl font-bold text-primary">سكنلي</Text>
      <Text className="text-center text-base text-text-2">Saknly mobile is set up.</Text>
      <Text className="text-center text-xs text-muted">{env.apiUrl}</Text>
    </View>
  );
}
