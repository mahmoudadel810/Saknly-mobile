import { AxiosError } from 'axios';

import { EmptyAnswerError, MAX_QUESTION } from '@/api/chat';

import { classifyChatError, prepareQuestion, showCounter } from './chat';

const httpError = (status: number) =>
  new AxiosError('failed', undefined, undefined, undefined, {
    status,
    statusText: '',
    headers: {},
    config: {} as never,
    data: {},
  });

describe('prepareQuestion', () => {
  it('trims the question', () => {
    expect(prepareQuestion('  شقق في القاهرة \n')).toBe('شقق في القاهرة');
  });

  it('has nothing to send for blank text', () => {
    expect(prepareQuestion('')).toBeNull();
    expect(prepareQuestion('  \n ')).toBeNull();
  });

  it('accepts exactly the limit and rejects one more', () => {
    expect(prepareQuestion('a'.repeat(MAX_QUESTION))).toHaveLength(MAX_QUESTION);
    expect(prepareQuestion('a'.repeat(MAX_QUESTION + 1))).toBeNull();
  });
});

describe('showCounter', () => {
  it('appears only near the limit', () => {
    expect(showCounter(0)).toBe(false);
    expect(showCounter(MAX_QUESTION - 50)).toBe(false);
    expect(showCounter(MAX_QUESTION - 49)).toBe(true);
  });
});

describe('classifyChatError', () => {
  it('treats the 503 the server sends when the assistant is down as unavailable', () => {
    expect(classifyChatError(httpError(503))).toBe('unavailable');
  });

  it('treats any 5xx and an empty answer the same way', () => {
    expect(classifyChatError(httpError(500))).toBe('unavailable');
    expect(classifyChatError(new EmptyAnswerError())).toBe('unavailable');
  });

  it('recognises no answer at all as a network problem', () => {
    expect(classifyChatError(new AxiosError('Network Error'))).toBe('network');
  });

  it('leaves other failures (a 400, a surprise) to show the server message', () => {
    expect(classifyChatError(httpError(400))).toBe('other');
    expect(classifyChatError(new Error('boom'))).toBe('other');
  });
});
