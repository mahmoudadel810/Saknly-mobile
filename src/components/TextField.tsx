import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { TextInput, type TextInputProps, View } from 'react-native';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | false;
}

export function TextField({ label, error, onFocus, onBlur, ...input }: TextFieldProps) {
  const colors = useThemeColors();
  const [focused, setFocused] = useState(false);
  const border = error ? 'border-error' : focused ? 'border-primary' : 'border-border';
  return (
    <View className="gap-2">
      <Text className="text-left text-sm text-text font-medium">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor={colors.muted}
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`min-h-[52px] rounded-2xl border-[1.5px] bg-field px-4 py-3 text-base text-text font-normal ${border} ${
          focused && !error ? 'bg-surface' : ''
        }`}
        {...input}
      />
      {error ? (
        <View className="flex-row items-center gap-1.5" accessibilityLiveRegion="polite">
          <Ionicons name="alert-circle" size={15} color={colors.error} />
          <Text className="flex-1 text-left text-sm text-error">{error}</Text>
        </View>
      ) : null}
    </View>
  );
}
