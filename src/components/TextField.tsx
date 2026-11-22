import { Text, TextInput, type TextInputProps, View } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string | false;
}

export function TextField({ label, error, ...input }: TextFieldProps) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-medium text-text-2">{label}</Text>
      <TextInput
        accessibilityLabel={label}
        placeholderTextColor="#82908D"
        className={`rounded-xl border bg-field px-4 py-3 text-base text-text ${
          error ? 'border-error' : 'border-border'
        }`}
        {...input}
      />
      {error ? (
        <Text className="text-sm text-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
    </View>
  );
}
