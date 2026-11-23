import { api } from './client';

/** The server rejects a question over 500 characters (modules/chatBot/chat.routes.js). */
export const MAX_QUESTION = 500;

/** The assistant is a Gemini call behind the server, so give it longer than the default timeout. */
const CHAT_TIMEOUT = 40_000;

export class EmptyAnswerError extends Error {
  constructor() {
    super('The assistant returned an empty answer');
    this.name = 'EmptyAnswerError';
  }
}

export const chatApi = {
  /** The assistant's reply (in Arabic). A 503 means the assistant is down. */
  ask: async (question: string): Promise<string> => {
    const { data } = await api.post<{ answer?: unknown }>(
      '/chat',
      { question },
      { timeout: CHAT_TIMEOUT },
    );
    const answer = typeof data?.answer === 'string' ? data.answer.trim() : '';
    if (!answer) throw new EmptyAnswerError();
    return answer;
  },
};
