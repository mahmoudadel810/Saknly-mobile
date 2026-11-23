// Pure chat logic, free of React Native so the e2e tests and unit tests can import it.
import { isAxiosError } from 'axios';

import { EmptyAnswerError, MAX_QUESTION } from '@/api/chat';
import { isNetworkError } from '@/api/client';

/** What to tell the user when a question failed. */
export type ChatFailure = 'unavailable' | 'network' | 'other';

export interface ChatMessage {
  id: number;
  role: 'user' | 'assistant';
  text: string;
}

/** The question as it will be sent: trimmed. Null when there is nothing to send. */
export const prepareQuestion = (raw: string): string | null => {
  const question = raw.trim();
  return question && question.length <= MAX_QUESTION ? question : null;
};

/** Show the character counter only when the limit is near. */
export const showCounter = (length: number): boolean => length > MAX_QUESTION - 50;

/**
 * Sorts a failed request into the message to show. The server answers 503 when the assistant
 * is down; an empty answer or any other 5xx is treated the same way, since the user can only retry.
 */
export const classifyChatError = (error: unknown): ChatFailure => {
  if (error instanceof EmptyAnswerError) return 'unavailable';
  if (isNetworkError(error)) return 'network';
  if (isAxiosError(error) && (error.response?.status ?? 0) >= 500) return 'unavailable';
  return 'other';
};
