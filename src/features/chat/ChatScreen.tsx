import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Pressable,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_QUESTION } from '@/api/chat';
import { Button } from '@/components/Button';
import { useThemeColors } from '@/theme/colors';
import { describeError } from '@/utils/errors';

import { type ChatMessage, prepareQuestion, showCounter } from './chat';
import { type ChatFailureState, useChat } from './useChat';
import { Text } from '@/components/Text';

export function ChatScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { messages, loading, failure, ask, retry } = useChat();
  const [input, setInput] = useState('');
  const listRef = useRef<FlatList<ChatMessage>>(null);

  const canSend = !loading && prepareQuestion(input) !== null;

  const send = () => {
    if (!canSend) return;
    const question = input;
    setInput('');
    void ask(question);
  };

  const suggestions = t('chat.suggestions', { returnObjects: true }) as unknown as string[];

  return (
    <SafeAreaView className="flex-1 bg-bg" edges={['top']}>
      <KeyboardAvoidingView className="flex-1" behavior="padding">
        <View className="flex-row items-center gap-3 border-b border-border px-5 pb-3 pt-3">
          <View className="h-11 w-11 items-center justify-center rounded-2xl bg-primary">
            <Ionicons name="sparkles" size={22} color={colors.onPrimary} />
          </View>
          <View className="flex-1 gap-0.5">
            <Text accessibilityRole="header" className="text-left text-xl text-text font-bold">
              {t('chat.title')}
            </Text>
            <Text numberOfLines={2} className="text-left text-xs leading-5 text-muted">
              {t('chat.disclaimer')}
            </Text>
          </View>
        </View>

        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(message) => String(message.id)}
          renderItem={({ item }) => <Bubble message={item} />}
          contentContainerClassName="grow gap-3 px-5 py-4"
          keyboardShouldPersistTaps="handled"
          onContentSizeChange={() => {
            if (messages.length > 0 || loading) listRef.current?.scrollToEnd({ animated: true });
          }}
          ListEmptyComponent={
            <View className="my-auto items-center gap-3">
              <View className="h-16 w-16 items-center justify-center rounded-3xl bg-primary-soft">
                <Ionicons name="sparkles" size={30} color={colors.primary} />
              </View>
              <Text className="text-xl text-text font-bold">{t('chat.emptyTitle')}</Text>
              <Text className="mb-2 text-center text-base leading-7 text-text-2">
                {t('chat.emptyBody')}
              </Text>
              <View className="w-full gap-2">
                {suggestions.map((suggestion) => (
                  <Pressable
                    key={suggestion}
                    accessibilityRole="button"
                    accessibilityLabel={suggestion}
                    onPress={() => {
                      if (!loading) void ask(suggestion);
                    }}
                    className="flex-row items-center gap-3 rounded-2xl border border-border bg-surface px-4 py-3.5 active:bg-surface-2"
                  >
                    <Ionicons name="search-outline" size={18} color={colors.primary} />
                    <Text className="flex-1 text-left text-sm text-text font-medium">
                      {suggestion}
                    </Text>
                    <Ionicons
                      name={I18nManager.isRTL ? 'arrow-back' : 'arrow-forward'}
                      size={16}
                      color={colors.muted}
                    />
                  </Pressable>
                ))}
              </View>
            </View>
          }
          ListFooterComponent={
            <View className="gap-3">
              {loading ? (
                <View
                  className="flex-row items-center gap-2"
                  accessibilityLiveRegion="polite"
                  accessibilityRole="progressbar"
                  accessibilityLabel={t('chat.thinking')}
                >
                  <ActivityIndicator size="small" color={colors.muted} />
                  <Text className="text-sm text-text-2">{t('chat.thinking')}</Text>
                </View>
              ) : null}
              {failure && !loading ? <FailureNotice failure={failure} onRetry={retry} /> : null}
            </View>
          }
        />

        <View className="gap-1 border-t border-border bg-surface px-4 py-3">
          {showCounter(input.length) ? (
            <Text className="text-xs text-muted" accessibilityLiveRegion="polite">
              {input.length} / {MAX_QUESTION}
            </Text>
          ) : null}
          <View className="flex-row items-end gap-2">
            <TextInput
              accessibilityLabel={t('chat.inputLabel')}
              placeholder={t('chat.inputLabel')}
              placeholderTextColor={colors.muted}
              value={input}
              onChangeText={setInput}
              multiline
              maxLength={MAX_QUESTION}
              textAlignVertical="top"
              style={{ maxHeight: 120 }}
              className="min-h-12 flex-1 rounded-3xl border border-border bg-field px-4 py-3 text-base text-text font-normal"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('chat.send')}
              accessibilityState={{ disabled: !canSend }}
              disabled={!canSend}
              onPress={send}
              className={`size-12 items-center justify-center rounded-full bg-primary ${
                canSend ? 'active:bg-primary-hover' : 'opacity-40'
              }`}
            >
              {/* The send arrow points right; mirror it so it points along the reading direction. */}
              <Ionicons
                name="send"
                size={20}
                color={colors.onPrimary}
                style={I18nManager.isRTL ? { transform: [{ scaleX: -1 }] } : undefined}
              />
            </Pressable>
          </View>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function Bubble({ message }: { message: ChatMessage }) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const mine = message.role === 'user';
  const label = `${mine ? t('chat.you') : t('chat.assistant')}: ${message.text}`;
  if (mine) {
    return (
      <View className="max-w-[85%] self-end rounded-3xl rounded-ee-md bg-primary px-4 py-3">
        <Text
          selectable
          accessibilityLabel={label}
          className="text-left text-base leading-7 text-on-primary"
        >
          {message.text}
        </Text>
      </View>
    );
  }
  return (
    <View className="max-w-[90%] flex-row items-end gap-2 self-start">
      <View className="h-7 w-7 items-center justify-center rounded-full bg-primary-soft">
        <Ionicons name="sparkles" size={14} color={colors.primary} />
      </View>
      <View className="flex-shrink rounded-3xl rounded-es-md border border-border bg-surface px-4 py-3">
        <Text
          selectable
          accessibilityLabel={label}
          className="text-left text-base leading-7 text-text"
        >
          {message.text}
        </Text>
      </View>
    </View>
  );
}

function FailureNotice({ failure, onRetry }: { failure: ChatFailureState; onRetry: () => void }) {
  const { t } = useTranslation();
  const message =
    failure.kind === 'unavailable'
      ? t('chat.unavailable')
      : failure.kind === 'network'
        ? t('common.networkError')
        : describeError(failure.error);
  return (
    <View
      accessibilityRole="alert"
      className="max-w-[85%] items-start gap-1 self-start rounded-2xl border border-error px-3.5 py-2.5"
    >
      <Text className="text-left text-sm text-error">{message}</Text>
      <Button title={t('chat.retry')} variant="link" onPress={onRetry} />
    </View>
  );
}
