import { Ionicons } from '@expo/vector-icons';
import { useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  I18nManager,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MAX_QUESTION } from '@/api/chat';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { useThemeColors } from '@/theme/colors';
import { describeError } from '@/utils/errors';

import { type ChatMessage, prepareQuestion, showCounter } from './chat';
import { type ChatFailureState, useChat } from './useChat';

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
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View className="gap-0.5 border-b border-border px-5 pb-3 pt-4">
          <Text accessibilityRole="header" className="text-left text-2xl font-bold text-text">
            {t('chat.title')}
          </Text>
          <Text className="text-left text-sm text-text-2">{t('chat.disclaimer')}</Text>
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
            <View className="my-auto items-center gap-2 px-2">
              <Text className="text-lg font-semibold text-text">{t('chat.emptyTitle')}</Text>
              <Text className="mb-3 text-center text-base text-text-2">{t('chat.emptyBody')}</Text>
              <View className="flex-row flex-wrap justify-center gap-2">
                {suggestions.map((suggestion) => (
                  <Chip
                    key={suggestion}
                    label={suggestion}
                    onPress={() => {
                      if (!loading) void ask(suggestion);
                    }}
                  />
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
              className="min-h-12 flex-1 rounded-2xl border border-border bg-field px-4 py-3 text-base text-text"
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
  const mine = message.role === 'user';
  return (
    <View
      className={`max-w-[85%] rounded-2xl border px-3.5 py-2.5 ${
        mine
          ? 'self-end border-transparent bg-primary-soft'
          : 'self-start border-border bg-surface-2'
      }`}
    >
      <Text
        selectable
        accessibilityLabel={`${mine ? t('chat.you') : t('chat.assistant')}: ${message.text}`}
        className="text-left text-base text-text"
      >
        {message.text}
      </Text>
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
