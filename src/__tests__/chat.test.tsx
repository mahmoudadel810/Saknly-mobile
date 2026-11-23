import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
});

const renderChat = () => renderRouter('./src/app', { initialUrl: '/chat' });
const typeQuestion = async (text: string) =>
  fireEvent.changeText(screen.getByLabelText('Your question'), text);
const sendButton = () => screen.getByRole('button', { name: 'Send question' });
const asked = () => mock.history.post.map((request) => JSON.parse(request.data).question);

describe('assistant tab', () => {
  it('shows the suggestions first, and a tapped suggestion is asked and answered', async () => {
    mock.onPost('/chat').reply(200, { answer: 'I found three apartments.' });
    await renderChat();

    expect(await screen.findByText('How can I help?')).toBeTruthy();
    await fireEvent.press(screen.getByRole('button', { name: 'Apartments for sale in New Cairo' }));

    expect(await screen.findByText('I found three apartments.')).toBeTruthy();
    expect(screen.getByText('Apartments for sale in New Cairo')).toBeTruthy();
    expect(screen.queryByText('How can I help?')).toBeNull();
    expect(asked()).toEqual(['Apartments for sale in New Cairo']);
  });

  it('sends the typed question trimmed and clears the field', async () => {
    mock.onPost('/chat').reply(200, { answer: 'Welcome!' });
    await renderChat();

    await typeQuestion('  hello  ');
    await fireEvent.press(sendButton());

    expect(await screen.findByText('Welcome!')).toBeTruthy();
    expect(asked()).toEqual(['hello']);
    expect(screen.getByLabelText('Your question').props.value).toBe('');
  });

  it("can't send an empty question", async () => {
    await renderChat();
    await screen.findByText('How can I help?');

    expect(sendButton()).toBeDisabled();
    await typeQuestion('   ');
    expect(sendButton()).toBeDisabled();
    await typeQuestion('hi');
    expect(sendButton()).toBeEnabled();
    expect(mock.history.post).toHaveLength(0);
  });

  it('counts characters only near the 500 limit', async () => {
    await renderChat();
    await screen.findByText('How can I help?');

    await typeQuestion('a'.repeat(100));
    expect(screen.queryByText('100 / 500')).toBeNull();
    await typeQuestion('a'.repeat(480));
    expect(screen.getByText('480 / 500')).toBeTruthy();
    expect(screen.getByLabelText('Your question').props.maxLength).toBe(500);
  });

  it('says the assistant is down on a 503 and resends the same question without repeating it', async () => {
    mock
      .onPost('/chat')
      .replyOnce(503, { success: false, message: 'المساعد الذكي غير متاح حالياً' })
      .onPost('/chat')
      .reply(200, { answer: 'Back again.' });
    await renderChat();

    await typeQuestion('hello');
    await fireEvent.press(sendButton());

    expect(
      await screen.findByText('The assistant is unavailable right now. Try again in a moment.'),
    ).toBeTruthy();
    // The user's question stays in the thread; the Arabic server text is not shown in English.
    expect(screen.getByText('hello')).toBeTruthy();
    expect(screen.queryByText('المساعد الذكي غير متاح حالياً')).toBeNull();

    await fireEvent.press(screen.getByRole('button', { name: 'Send the question again' }));

    expect(await screen.findByText('Back again.')).toBeTruthy();
    expect(screen.getAllByText('hello')).toHaveLength(1);
    expect(asked()).toEqual(['hello', 'hello']);
    expect(
      screen.queryByText('The assistant is unavailable right now. Try again in a moment.'),
    ).toBeNull();
    expect(screen.queryByRole('button', { name: 'Send the question again' })).toBeNull();
  });

  it('explains a missing connection', async () => {
    mock.onPost('/chat').networkError();
    await renderChat();

    await typeQuestion('hello');
    await fireEvent.press(sendButton());

    expect(
      await screen.findByText("Couldn't reach the server. Check your connection and try again."),
    ).toBeTruthy();
  });

  it('shows the server message for a rejected question', async () => {
    mock.onPost('/chat').reply(400, { success: false, message: 'السؤال مطلوب' });
    await renderChat();

    await typeQuestion('hello');
    await fireEvent.press(sendButton());

    expect(await screen.findByText('السؤال مطلوب')).toBeTruthy();
  });

  it('treats an empty answer as the assistant being unavailable', async () => {
    mock.onPost('/chat').reply(200, { answer: '   ' });
    await renderChat();

    await typeQuestion('hello');
    await fireEvent.press(sendButton());

    expect(
      await screen.findByText('The assistant is unavailable right now. Try again in a moment.'),
    ).toBeTruthy();
  });

  it('keeps the conversation in order across questions', async () => {
    mock.onPost('/chat').replyOnce(200, { answer: 'First answer' });
    mock.onPost('/chat').replyOnce(200, { answer: 'Second answer' });
    await renderChat();

    await typeQuestion('one');
    await fireEvent.press(sendButton());
    await screen.findByText('First answer');
    await typeQuestion('two');
    await fireEvent.press(sendButton());
    await waitFor(() => expect(screen.getByText('Second answer')).toBeTruthy());

    expect(asked()).toEqual(['one', 'two']);
    expect(screen.getByLabelText('You: one')).toBeTruthy();
    expect(screen.getByLabelText('Assistant: Second answer')).toBeTruthy();
  });
});
