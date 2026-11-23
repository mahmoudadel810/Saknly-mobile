/**
 * End-to-end: the assistant endpoint of a local Saknly-server (scripts/local-api.mjs).
 * The local server has no Gemini key, so only the answers the server builds itself (greetings,
 * off-topic) come back; anything that needs Gemini is a 503, which is what the app's
 * "assistant unavailable" message is for. Run with `npm run test:e2e`.
 */
import { isAxiosError } from 'axios';

import { chatApi, MAX_QUESTION } from '@/api/chat';
import { api, setApiToken } from '@/api/client';
import { classifyChatError } from '@/features/chat/chat';

beforeEach(() => setApiToken(null));

const failureOf = async (question: string) => {
  try {
    await chatApi.ask(question);
  } catch (error) {
    return error;
  }
  throw new Error('expected the question to fail');
};

describe('POST /chat', () => {
  it('answers a greeting in Arabic without being signed in', async () => {
    const answer = await chatApi.ask('hello');
    expect(answer.length).toBeGreaterThan(0);
    expect(answer).toMatch(/[؀-ۿ]/);
  });

  it("answers an off-topic question with the assistant's own refusal", async () => {
    const answer = await chatApi.ask('عايز وصفة طبخ');
    expect(answer).toMatch(/عقار/);
  });

  it('takes a question of exactly the limit the app enforces', async () => {
    const question = `hello ${'a'.repeat(MAX_QUESTION - 6)}`;
    expect(question).toHaveLength(MAX_QUESTION);
    await expect(chatApi.ask(question)).resolves.toEqual(expect.any(String));
  });

  it('rejects a question one character over the limit with a 400 and an Arabic message', async () => {
    const error = await api
      .post('/chat', { question: 'a'.repeat(MAX_QUESTION + 1) })
      .catch((e) => e);
    expect(isAxiosError(error)).toBe(true);
    expect(error.response.status).toBe(400);
    expect(error.response.data.message).toMatch(/[؀-ۿ]/);
  });

  it('rejects a blank question', async () => {
    const error = await api.post('/chat', { question: '   ' }).catch((e) => e);
    expect(error.response.status).toBe(400);
  });

  it('answers 503 when the assistant itself is down, which the app shows as unavailable', async () => {
    // A listing question goes to Gemini, which this server has no key for.
    const error = await failureOf('شقق للإيجار في شبين الكوم');
    expect(isAxiosError(error) && error.response?.status).toBe(503);
    expect(classifyChatError(error)).toBe('unavailable');
  });
});
