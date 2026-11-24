import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';
import { Alert } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';
import { listing } from '@/test/fixtures';
import { HOUR, makeToken } from '@/test/jwt';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);

const mock = new MockAdapter(api);
const user = {
  _id: 'u1',
  userName: 'mona',
  email: 'mona@example.com',
  role: 'user',
  phone: '01012345678',
};
const flat = listing('p1', 'Sunny flat');

/** The server's wishlist, so GET reflects earlier POST/DELETE calls like the real one. */
let serverWishlist: Property[] = [];
const wishlistBody = () => ({
  success: true,
  data: serverWishlist.map((property) => ({ _id: `w-${property._id}`, property, addedAt: '' })),
});

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
  serverWishlist = [];
  mock.onGet('/properties/featured').reply(200, { success: true, data: [flat] });
  mock.onGet('/agencies/featured').reply(200, { success: true, data: [] });
  mock.onGet('/testimonial').reply(200, { success: true, data: [] });
  mock.onGet('/users/me/wishlist').reply(() => [200, wishlistBody()]);
  mock.onGet('/properties/myProperties').reply(200, { success: true, data: [] });
  mock.onGet('/properties/propertyDetails/p1').reply(200, { success: true, data: flat });
  mock.onGet('/properties/similar/p1').reply(200, { success: true, data: [] });
  mock.onGet('/property-comments/p1').reply(200, { success: true, data: [] });
});

const signIn = async () => {
  await tokenStorage.set(makeToken(20 * HOUR));
  mock.onGet('/auth/getMe').reply(200, { success: true, message: 'ok', data: { user } });
};

const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });
const tab = (name: string) => screen.getByRole('button', { name: new RegExp(`^${name}, tab`) });

describe('wishlist hearts', () => {
  it('sends a signed-out user to sign in', async () => {
    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to wishlist' }));
    expect(await screen.findByLabelText('Password')).toBeTruthy();
    expect(screen).toHavePathname('/login');
  });

  it('fills the heart at once, saves on the server, and shows it in the Wishlist tab', async () => {
    await signIn();
    let finish!: () => void;
    mock.onPost('/users/me/wishlist/p1').reply(
      () =>
        new Promise((resolve) => {
          finish = () => {
            serverWishlist = [flat];
            resolve([200, { success: true, message: 'added' }]);
          };
        }),
    );

    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to wishlist' }));
    // optimistic: filled before the server answers
    expect(await screen.findByRole('button', { name: 'Remove from wishlist' })).toBeTruthy();
    finish();

    await fireEvent.press(tab('Wishlist'));
    expect(await screen.findByText('Clear wishlist')).toBeTruthy();
    expect(mock.history.post.map((r) => r.url)).toEqual(['/users/me/wishlist/p1']);
  });

  it('puts the heart back when the server refuses', async () => {
    await signIn();
    mock
      .onPost('/users/me/wishlist/p1')
      .reply(404, { success: false, message: 'Property not found' });

    await renderApp('/');
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to wishlist' }));
    await waitFor(() =>
      expect(screen.getByRole('button', { name: 'Add to wishlist' })).toBeTruthy(),
    );
    expect(screen.queryByRole('button', { name: 'Remove from wishlist' })).toBeNull();
  });

  it('clears the wishlist after confirming', async () => {
    await signIn();
    serverWishlist = [flat];
    mock.onDelete('/users/me/wishlist').reply(() => {
      serverWishlist = [];
      return [200, { success: true, message: 'cleared' }];
    });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await renderApp('/wishlist');
    await fireEvent.press(await screen.findByRole('button', { name: 'Clear wishlist' }));

    expect(await screen.findByText("You haven't saved any properties yet.")).toBeTruthy();
    expect(alert).toHaveBeenCalledTimes(1);
    expect(mock.history.delete.map((r) => r.url)).toEqual(['/users/me/wishlist']);
    alert.mockRestore();
  });
});

describe('property page actions', () => {
  it('posts a comment and shows it', async () => {
    await signIn();
    mock.onPost('/property-comments/p1').reply((config) => [
      201,
      {
        success: true,
        message: 'ok',
        data: {
          _id: 'c1',
          text: JSON.parse(config.data).text,
          user: { _id: 'u1', userName: 'mona' },
          createdAt: '',
        },
      },
    ]);

    await renderApp('/properties/p1');
    await fireEvent.changeText(await screen.findByLabelText('Write a comment'), '  Lovely place  ');
    await fireEvent.press(screen.getByRole('button', { name: 'Post comment' }));

    expect(await screen.findByText('Lovely place')).toBeTruthy();
    expect(JSON.parse(mock.history.post[0].data)).toEqual({ text: 'Lovely place' });
    expect(screen.getByLabelText('Write a comment').props.value).toBe('');
  });

  it('asks a signed-out user to sign in before commenting', async () => {
    await renderApp('/properties/p1');
    expect(await screen.findByRole('button', { name: 'Sign in to comment' })).toBeTruthy();
    expect(screen.queryByLabelText('Write a comment')).toBeNull();
  });

  it('sends an inquiry prefilled from the account', async () => {
    await signIn();
    mock
      .onPost('/property-inquiry/add-property-inquiry')
      .reply(201, { success: true, message: 'ok' });

    await renderApp('/properties/p1');
    await fireEvent.press(await screen.findByRole('button', { name: 'Send an inquiry' }));
    expect((await screen.findByLabelText('Email')).props.value).toBe('mona@example.com');

    await fireEvent.press(screen.getByRole('button', { name: 'Send inquiry' }));
    expect(await screen.findByText('This field is required')).toBeTruthy();
    await fireEvent.changeText(screen.getByLabelText('Your message'), 'Too short');
    expect(await screen.findByText('Between 10 and 500 characters')).toBeTruthy();
    expect(mock.history.post).toHaveLength(0);

    await fireEvent.changeText(screen.getByLabelText('Your message'), 'Is it still available?');
    await fireEvent.press(screen.getByRole('button', { name: 'Send inquiry' }));

    await waitFor(() => expect(screen).toHavePathname('/properties/p1'));
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      property: 'p1',
      name: 'mona',
      email: 'mona@example.com',
      phone: '01012345678',
      message: 'Is it still available?',
    });
  });
});

describe('signing in and out around signed-in features', () => {
  const signInOnLoginScreen = async () => {
    mock.onPost('/auth/login').reply(200, {
      success: true,
      message: 'ok',
      token: makeToken(24 * HOUR),
      user,
    });
    mock.onGet('/auth/getMe').reply(200, { success: true, message: 'ok', data: { user } });
    await fireEvent.changeText(await screen.findByLabelText('Email'), 'mona@example.com');
    await fireEvent.changeText(screen.getByLabelText('Password'), 'Secret1!');
    await fireEvent.press(screen.getByRole('button', { name: 'Sign in' }));
  };

  it('returns to the listing after signing in to comment', async () => {
    await renderApp('/properties/p1');
    await fireEvent.press(await screen.findByRole('button', { name: 'Sign in to comment' }));
    await signInOnLoginScreen();

    expect(await screen.findByLabelText('Write a comment')).toBeTruthy();
    expect(screen).toHavePathname('/properties/p1');
  });

  it("drops the user's hearts after signing out", async () => {
    await signIn();
    serverWishlist = [flat];
    mock.onPost('/auth/logout').reply(200, { success: true, message: 'ok' });

    await renderApp('/');
    expect(await screen.findByRole('button', { name: 'Remove from wishlist' })).toBeTruthy();

    await fireEvent.press(tab('Account'));
    await fireEvent.press(await screen.findByRole('button', { name: 'Sign out' }));
    await screen.findByText('Sign in to Saknly');
    await fireEvent.press(tab('Home'));

    expect(await screen.findByRole('button', { name: 'Add to wishlist' })).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Remove from wishlist' })).toBeNull();
  });

  it('has a heart in the listing header', async () => {
    await signIn();
    mock.onPost('/users/me/wishlist/p1').reply(() => {
      serverWishlist = [flat];
      return [200, { success: true, message: 'ok' }];
    });
    await renderApp('/properties/p1');
    // similar is empty, so the only heart on this page is the header's
    await fireEvent.press(await screen.findByRole('button', { name: 'Add to wishlist' }));
    expect(await screen.findByRole('button', { name: 'Remove from wishlist' })).toBeTruthy();
    expect(mock.history.post.map((r) => r.url)).toEqual(['/users/me/wishlist/p1']);
  });
});

describe('account tab', () => {
  it('lists my properties with their review state', async () => {
    await signIn();
    mock.onGet('/properties/myProperties').reply(200, {
      success: true,
      data: [
        listing('m1', 'Waiting flat', { isApproved: false, isActive: false }),
        listing('m2', 'Live flat', { isApproved: true, isActive: true }),
      ],
    });

    await renderApp('/account');
    expect(await screen.findByLabelText('Waiting flat, Under review')).toBeTruthy();
    expect(screen.getByLabelText('Live flat, Published')).toBeTruthy();
  });

  it('sends a general review with the optional role left out', async () => {
    await signIn();
    mock.onPost('/testimonial').reply(201, { success: true, message: 'ok' });

    await renderApp('/account');
    await fireEvent.press(await screen.findByRole('button', { name: 'Share your experience' }));
    expect((await screen.findByLabelText('Name')).props.value).toBe('mona');
    await fireEvent.changeText(screen.getByLabelText('Your review'), 'Found a flat in a week');
    await fireEvent.press(screen.getByRole('button', { name: 'Send review' }));

    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      name: 'mona',
      text: 'Found a flat in a week',
      type: 'general',
    });
    await waitFor(() => expect(screen).toHavePathname('/account'));
  });

  it('sends the contact form when signed out', async () => {
    mock.onPost('/contact/contact-us').reply(201, { success: true, message: 'ok' });

    await renderApp('/account');
    await fireEvent.press(await screen.findByRole('button', { name: 'Contact us' }));
    await fireEvent.changeText(await screen.findByLabelText('Name'), 'Mona');
    await fireEvent.changeText(screen.getByLabelText('Email'), 'mona@example.info');
    await fireEvent.changeText(screen.getByLabelText('Subject'), 'Hello');
    await fireEvent.changeText(screen.getByLabelText('Message'), 'A question about listings');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    // the server rejects this ending, so the app does too
    expect(await screen.findByText('Enter a valid email')).toBeTruthy();

    await fireEvent.changeText(screen.getByLabelText('Email'), 'mona@example.com');
    await fireEvent.press(screen.getByRole('button', { name: 'Send' }));
    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    expect(JSON.parse(mock.history.post[0].data)).toEqual({
      name: 'Mona',
      email: 'mona@example.com',
      subject: 'Hello',
      message: 'A question about listings',
    });
  });
});

describe('delete account', () => {
  it('asks for the password, keeps the user signed in on a wrong one, then deletes and signs out', async () => {
    await signIn();
    mock.onGet('/auth/getMe').reply(200, {
      success: true,
      message: 'ok',
      data: { user: { ...user, provider: 'local' } },
    });
    let attempts = 0;
    mock.onDelete('/users/me').reply((config) => {
      attempts += 1;
      return JSON.parse(config.data).password === 'Right-Passw0rd'
        ? [200, { success: true, message: 'Your account was deleted' }]
        : [400, { success: false, message: 'Password is not correct' }];
    });
    mock.onPost('/auth/logout').reply(401, { success: false, message: 'gone' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await renderApp('/account');
    await fireEvent.press(await screen.findByRole('button', { name: 'Delete account' }));
    expect(await screen.findByText('Delete your Saknly account')).toBeTruthy();

    // nothing is sent without the password
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('Enter your password to confirm.')).toBeTruthy();
    expect(attempts).toBe(0);

    // a wrong password is a 400: an error on the form, still signed in
    await fireEvent.changeText(screen.getByLabelText('Password'), 'wrong');
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
    expect(await screen.findByText('The password is not correct.')).toBeTruthy();
    expect(screen).toHavePathname('/delete-account');

    await fireEvent.changeText(screen.getByLabelText('Password'), 'Right-Passw0rd');
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(attempts).toBe(2);
    expect(alert).toHaveBeenCalledTimes(2);
    expect(await tokenStorage.get()).toBeNull();
    await fireEvent.press(tab('Account'));
    expect(await screen.findByText('Sign in to Saknly')).toBeTruthy();
    alert.mockRestore();
  });

  it('needs no password for a Google account', async () => {
    await signIn();
    mock.onGet('/auth/getMe').reply(200, {
      success: true,
      message: 'ok',
      data: { user: { ...user, provider: 'google' } },
    });
    mock.onDelete('/users/me').reply(200, { success: true, message: 'Your account was deleted' });
    const alert = jest.spyOn(Alert, 'alert').mockImplementation((_title, _body, buttons) => {
      buttons?.find((button) => button.style === 'destructive')?.onPress?.();
    });

    await renderApp('/delete-account');
    await screen.findByText('Delete your Saknly account');
    expect(screen.queryByLabelText('Password')).toBeNull();
    await fireEvent.press(screen.getByRole('button', { name: 'Delete my account' }));
    await waitFor(() => expect(screen).toHavePathname('/'));
    expect(JSON.parse(mock.history.delete[0].data)).toEqual({});
    alert.mockRestore();
  });
});
