import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';
import { listing, page } from '@/test/fixtures';
import { HOUR, makeToken } from '@/test/jwt';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);
const user = { _id: 'u1', userName: 'mona', email: 'mona@example.com', role: 'user' };
const me = {
  success: true,
  message: 'User found',
  data: { user: { ...user, phone: '01012345678' } },
};

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
  // Home screen data
  mock
    .onGet('/properties/featured')
    .reply(200, { success: true, data: [listing('p1', 'Sunny flat')] });
  mock.onGet('/agencies/featured').reply(200, { success: true, data: [] });
  mock.onGet('/testimonial').reply(200, { success: true, data: [] });
});

// The real route tree from src/app, with the real AuthProvider and route guards.
const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });

describe('account and route guards', () => {
  it('shows a signed-out account tab with sign-in actions', async () => {
    await renderApp('/account');
    expect(await screen.findByText('Sign in to Saknly')).toBeTruthy();
    expect(screen).toHavePathname('/account');
  });

  it('restores a stored session into the account tab', async () => {
    await tokenStorage.set(makeToken(20 * HOUR));
    mock.onGet('/auth/getMe').reply(200, me);

    await renderApp('/account');
    expect(await screen.findByText('mona@example.com')).toBeTruthy();
    expect(screen.getByText('01012345678')).toBeTruthy();
  });

  it('keeps a signed-in user out of /login', async () => {
    await tokenStorage.set(makeToken(20 * HOUR));
    mock.onGet('/auth/getMe').reply(200, me);

    await renderApp('/login');
    expect(await screen.findByText('Hi, mona')).toBeTruthy();
    expect(screen).toHavePathname('/');
  });

  it('signs in on /login and lands on home', async () => {
    mock.onPost('/auth/login').reply(200, {
      success: true,
      message: 'Login successful',
      token: makeToken(24 * HOUR),
      user,
    });
    mock.onGet('/auth/getMe').reply(200, me);

    await renderApp('/login');
    await fireEvent.changeText(await screen.findByLabelText('Email'), 'mona@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Secret1!');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));

    expect(await screen.findByText('Hi, mona')).toBeTruthy();
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(screen.queryByLabelText('Password')).toBeNull();
  });
});

describe('browsing', () => {
  it('opens a featured listing from home', async () => {
    mock
      .onGet('/properties/propertyDetails/p1')
      .reply(200, { success: true, data: listing('p1', 'Sunny flat') });
    mock.onGet('/properties/similar/p1').reply(200, { success: true, data: [] });
    mock.onGet('/property-comments/p1').reply(200, { success: true, data: [] });

    await renderApp('/');
    await fireEvent.press(await screen.findByLabelText(/^Sunny flat, /));

    expect(await screen.findByText('Sunny flat description')).toBeTruthy();
    expect(screen).toHavePathname('/properties/p1');
    expect(screen.getByRole('button', { name: 'WhatsApp' })).toBeTruthy();
  });

  it('lists properties for the kind chosen on home, with its query params', async () => {
    mock
      .onGet('/properties/allProperties')
      .reply(200, page([listing('p2', 'Flat for rent'), listing('p3', 'Second flat')]));

    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'For rent' }));

    expect(await screen.findByText('Flat for rent')).toBeTruthy();
    expect(screen.getByText('Results: 2')).toBeTruthy();
    expect(screen).toHavePathname('/properties');
    const params = mock.history.get.find((r) => r.url === '/properties/allProperties')?.params;
    expect(params).toMatchObject({ category: 'rent', page: '1', sort: '-createdAt' });
  });

  const listRequests = () =>
    mock.history.get
      .filter((r) => r.url === '/properties/allProperties')
      .map((r) => r.params as Record<string, string>);
  const lastListRequest = () => listRequests().at(-1);

  // The selected kind chip on the list (home's chips are never marked selected).
  const selectedKind = () =>
    ['All', 'For sale', 'For rent', 'Student housing'].filter((name) =>
      screen
        .queryAllByRole('button', { name })
        .some((chip) => chip.props.accessibilityState?.selected),
    );

  it('keeps the kind in one place: chips, home links and "see all" agree', async () => {
    mock.onGet('/properties/allProperties').reply(200, page([listing('p2', 'Flat')]));
    const goHome = () => fireEvent.press(screen.getByRole('button', { name: /^Home, tab/ }));

    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'For rent' }));
    await waitFor(() => expect(selectedKind()).toEqual(['For rent']));
    expect(lastListRequest()?.category).toBe('rent');

    // the "All" chip on the list clears it
    await fireEvent.press(screen.getByRole('button', { name: 'All' }));
    await waitFor(() => expect(selectedKind()).toEqual(['All']));
    expect(lastListRequest()?.category).toBeUndefined();

    // back home, "For rent" again selects rent again
    await goHome();
    await fireEvent.press(await screen.findByRole('button', { name: 'For rent' }));
    await waitFor(() => expect(selectedKind()).toEqual(['For rent']));

    // and "See all" shows every kind
    await goHome();
    await fireEvent.press(await screen.findByRole('button', { name: 'See all' }));
    await waitFor(() => expect(selectedKind()).toEqual(['All']));

    // two distinct queries were made (rent, all); repeats came from the cache
    expect(listRequests().map((r) => r.category ?? 'all')).toEqual(['rent', 'all']);
  });

  it('loads page 2 at the end of the list and shows a repeated listing once', async () => {
    const pageOne = {
      ...page([listing('p1', 'First'), listing('p2', 'Second')]),
      pagination: { ...page([]).pagination, totalPages: 2, totalDocs: 3, hasNext: true },
    };
    const pageTwo = {
      ...page([listing('p2', 'Second'), listing('p3', 'Third')]),
      pagination: {
        ...page([]).pagination,
        currentPage: 2,
        totalPages: 2,
        totalDocs: 3,
        hasPrev: true,
      },
    };
    mock
      .onGet('/properties/allProperties')
      .reply((config) => [200, config.params.page === '2' ? pageTwo : pageOne]);

    await renderApp('/properties');
    expect(await screen.findByText('First')).toBeTruthy();
    expect(screen.queryByText('Third')).toBeNull();

    await fireEvent(screen.getByTestId('property-list'), 'endReached');

    expect(await screen.findByText('Third')).toBeTruthy();
    expect(listRequests().map((r) => r.page)).toEqual(['1', '2']);
    expect(screen.getAllByText('Second')).toHaveLength(1);
  });

  it('applies, keeps and clears the filter sheet choices', async () => {
    mock.onGet('/properties/allProperties').reply(200, page([listing('p2', 'Flat')]));

    await renderApp('/properties');
    await screen.findByText('Flat');

    await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'المنوفية' }));
    await fireEvent.press(await screen.findByRole('button', { name: 'شبين الكوم' }));
    await fireEvent.press(screen.getByRole('button', { name: 'شقة' }));
    await fireEvent.press(screen.getByRole('button', { name: 'Price: low to high' }));
    await fireEvent.changeText(screen.getByLabelText('Max price'), '9,000');
    await fireEvent.press(screen.getByRole('button', { name: 'Show results' }));

    await waitFor(() =>
      expect(lastListRequest()).toMatchObject({
        'location.governorate': 'المنوفية',
        'location.city': 'شبين الكوم',
        type: 'شقة',
        sort: 'price',
        'price[lte]': '9000',
      }),
    );
    expect(screen.getByRole('button', { name: 'Filters' }).props.accessibilityValue).toEqual({
      text: '4',
    });

    // reopening shows the applied choices
    await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
    expect(
      (await screen.findByRole('button', { name: 'شبين الكوم' })).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.getByLabelText('Max price').props.value).toBe('9000');

    await fireEvent.press(screen.getByRole('button', { name: 'Clear filters' }));
    // Back to the starting filters: the first page is served from the cache, no new request.
    await waitFor(() =>
      expect(
        screen.getByRole('button', { name: 'Filters' }).props.accessibilityValue?.text,
      ).toBeUndefined(),
    );
    await fireEvent.press(screen.getByRole('button', { name: 'Filters' }));
    expect(
      (await screen.findByRole('button', { name: 'Newest' })).props.accessibilityState,
    ).toMatchObject({ selected: true });
    expect(screen.queryByRole('button', { name: 'شبين الكوم' })).toBeNull();
    expect(screen.getByLabelText('Max price').props.value).toBe('');
  });

  it('shows the empty state with no results', async () => {
    mock.onGet('/properties/allProperties').reply(200, page([]));
    await renderApp('/properties');
    expect(await screen.findByText('No properties match your search.')).toBeTruthy();
  });

  it('shows a not-found message for a missing listing', async () => {
    mock
      .onGet('/properties/propertyDetails/missing')
      .reply(404, { success: false, message: 'Property not found' });
    await renderApp('/properties/missing');
    expect(await screen.findByText("This property isn't available.")).toBeTruthy();
  });
});
