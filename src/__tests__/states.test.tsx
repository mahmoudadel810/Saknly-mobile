import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';
import { listing } from '@/test/fixtures';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);
const flat = listing('p1', 'Sunny flat');

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
});

const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });

describe('home', () => {
  it('says so when there are no properties to feature', async () => {
    mock.onGet('/properties/featured').reply(200, { success: true, data: [] });
    mock.onGet('/agencies/featured').reply(200, { success: true, data: [] });
    mock.onGet('/testimonial').reply(200, { success: true, data: [] });
    await renderApp('/');

    expect(await screen.findByText('No properties to show right now.')).toBeTruthy();
  });
});

describe('property comments', () => {
  beforeEach(() => {
    mock.onGet('/properties/propertyDetails/p1').reply(200, { success: true, data: flat });
    mock.onGet('/properties/similar/p1').reply(200, { success: true, data: [] });
  });

  it('shows a retry instead of silently dropping the section when they fail to load', async () => {
    mock
      .onGet('/property-comments/p1')
      .replyOnce(404, { success: false, message: 'Comments not found' })
      .onGet('/property-comments/p1')
      .reply(200, {
        success: true,
        data: [{ _id: 'c1', text: 'Great place', user: { userName: 'mona' } }],
      });
    await renderApp('/properties/p1');

    expect(await screen.findByText('Comments')).toBeTruthy();
    expect(await screen.findByText('Comments not found')).toBeTruthy();

    await fireEvent.press(screen.getByRole('button', { name: 'Try again' }));

    expect(await screen.findByText('Great place')).toBeTruthy();
    expect(screen.queryByText('Comments not found')).toBeNull();
  });
});
