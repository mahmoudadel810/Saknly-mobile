import MockAdapter from 'axios-mock-adapter';
import { useNetworkState } from 'expo-network';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';
import { ar } from '@/i18n/ar';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);
const network = jest.mocked(useNetworkState);
const online = { isConnected: true, isInternetReachable: true };

beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
  await i18n.changeLanguage('en');
  mock.onGet('/properties/featured').reply(200, { success: true, data: [] });
  mock.onGet('/agencies/featured').reply(200, { success: true, data: [] });
  mock.onGet('/testimonial').reply(200, { success: true, data: [] });
  network.mockReturnValue(online as never);
});
afterAll(() => i18n.changeLanguage('en'));

const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });

describe('info pages', () => {
  it('opens About from the Account tab', async () => {
    await renderApp('/account');
    await fireEvent.press(await screen.findByRole('button', { name: 'About Saknly' }));

    expect(await screen.findByText('What is Saknly?')).toBeTruthy();
    expect(screen.getByText('How does it work?')).toBeTruthy();
    expect(screen.getByRole('button', { name: 'Browse properties' })).toBeTruthy();
  });

  it('opens the FAQ and shows one answer at a time', async () => {
    await renderApp('/account');
    await fireEvent.press(await screen.findByRole('button', { name: 'FAQ' }));

    const question = await screen.findByRole('button', { name: 'How do I delete my listing?' });
    const other = screen.getByRole('button', { name: 'Do I need an account to browse?' });
    expect(screen.queryByText(/Deleting is permanent/)).toBeNull();

    await fireEvent.press(question);
    expect(screen.getByText(/Deleting is permanent/)).toBeTruthy();
    expect(question).toBeExpanded();

    await fireEvent.press(other);
    expect(screen.queryByText(/Deleting is permanent/)).toBeNull();
    expect(screen.getByText(/Browsing and searching are open to everyone/)).toBeTruthy();

    await fireEvent.press(other);
    expect(screen.queryByText(/Browsing and searching are open to everyone/)).toBeNull();
  });

  it('says editing sends a listing back for review, as the app does', async () => {
    await renderApp('/faq');
    await fireEvent.press(
      await screen.findByRole('button', { name: 'Can I edit my listing after it is published?' }),
    );
    // Edit is on the listing's own page, not in the My properties list.
    expect(screen.getByText(/open the listing and tap "Edit"/)).toBeTruthy();
    expect(screen.getByText(/sends the listing back for review/)).toBeTruthy();
  });

  it('reaches Contact us from the FAQ', async () => {
    await renderApp('/faq');
    await fireEvent.press(await screen.findByRole('button', { name: 'Contact us' }));
    expect(await screen.findByLabelText('Subject')).toBeTruthy();
  });

  it('opens the privacy policy, including what the app does with the camera', async () => {
    await renderApp('/account');
    await fireEvent.press(await screen.findByRole('button', { name: 'Privacy policy' }));

    expect(await screen.findByText('What we collect')).toBeTruthy();
    expect(screen.getByText('Camera and photos')).toBeTruthy();
    expect(screen.getByText('Last updated: 23 November 2026')).toBeTruthy();
  });

  it('shows the pages in Arabic when that is the language', async () => {
    await i18n.changeLanguage('ar');
    await renderApp('/privacy');

    expect(await screen.findByText(ar.pages.privacy.sections[0].title)).toBeTruthy();
    expect(screen.getByText(ar.pages.privacy.updated)).toBeTruthy();
  });
});

describe('offline banner', () => {
  it('is hidden while online', async () => {
    await renderApp('/');
    await screen.findByText('Welcome to Saknly');
    expect(screen.queryByText(/You're offline/)).toBeNull();
  });

  it('is hidden until the first reading arrives', async () => {
    network.mockReturnValue({} as never);
    await renderApp('/');
    await screen.findByText('Welcome to Saknly');
    expect(screen.queryByText(/You're offline/)).toBeNull();
  });

  it('shows when the phone has no connection', async () => {
    network.mockReturnValue({ isConnected: false, isInternetReachable: false } as never);
    await renderApp('/');
    expect(await screen.findByText(/You're offline/)).toBeTruthy();
    expect(screen.getByRole('alert')).toBeTruthy();
  });

  it('shows when connected to a network that has no internet', async () => {
    network.mockReturnValue({ isConnected: true, isInternetReachable: false } as never);
    await renderApp('/');
    expect(await screen.findByText(/You're offline/)).toBeTruthy();
  });
});
