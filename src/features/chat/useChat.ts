import { useCallback, useRef, useState } from 'react';

import { chatApi } from '@/api/chat';

import { type ChatFailure, type ChatMessage, classifyChatError, prepareQuestion } from './chat';

export interface ChatFailureState {
  question: string;
  kind: ChatFailure;
  error: unknown;
}

/**
 * The conversation: one question at a time. A failed question is kept so it can be sent again
 * without typing it twice; the thread lives as long as the screen does.
 */
export function useChat() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(false);
  const [failure, setFailure] = useState<ChatFailureState | null>(null);
  const nextId = useRef(1);
  // A ref as well as state: two quick taps must not send two questions before the first re-render.
  const busy = useRef(false);

  const ask = useCallback(async (raw: string, { retry = false } = {}): Promise<boolean> => {
    const question = prepareQuestion(raw);
    if (!question || busy.current) return false;
    busy.current = true;
    setFailure(null);
    if (!retry) {
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'user', text: question }]);
    }
    setLoading(true);
    try {
      const answer = await chatApi.ask(question);
      setMessages((prev) => [...prev, { id: nextId.current++, role: 'assistant', text: answer }]);
    } catch (error) {
      setFailure({ question, kind: classifyChatError(error), error });
    } finally {
      busy.current = false;
      setLoading(false);
    }
    return true;
  }, []);

  const retry = useCallback(() => {
    if (failure) void ask(failure.question, { retry: true });
  }, [ask, failure]);

  return { messages, loading, failure, ask, retry };
}
