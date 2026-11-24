import type { PropsWithChildren } from 'react';
import { KeyboardAvoidingView, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

interface ScreenProps extends PropsWithChildren {
  /** Scrollable content that moves above the keyboard (forms). */
  scroll?: boolean;
}

export function Screen({ children, scroll = false }: ScreenProps) {
  const content = <View className="flex-1 gap-4 px-5 py-6">{children}</View>;
  return (
    <SafeAreaView className="flex-1 bg-bg">
      {scroll ? (
        <KeyboardAvoidingView className="flex-1" behavior="padding">
          <ScrollView contentContainerClassName="grow" keyboardShouldPersistTaps="handled">
            {content}
          </ScrollView>
        </KeyboardAvoidingView>
      ) : (
        content
      )}
    </SafeAreaView>
  );
}
