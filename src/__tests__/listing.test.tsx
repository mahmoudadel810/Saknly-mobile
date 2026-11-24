import MockAdapter from 'axios-mock-adapter';
import { fireEvent, renderRouter, screen, waitFor } from 'expo-router/testing-library';

import { api, setApiToken } from '@/api/client';
import { tokenStorage } from '@/auth/tokenStorage';
import i18n from '@/i18n';
import { listing } from '@/test/fixtures';
import { HOUR, makeToken } from '@/test/jwt';

jest.mock(
  'react-native-safe-area-context',
  () => jest.requireActual('react-native-safe-area-context/jest/mock').default,
);
// The phone's gallery returns two full-size photos; the native image tools are stubbed.
jest.mock('expo-image-picker', () => ({
  requestMediaLibraryPermissionsAsync: async () => ({ granted: true }),
  requestCameraPermissionsAsync: async () => ({ granted: true }),
  launchImageLibraryAsync: async () => ({
    canceled: false,
    assets: [
      { uri: 'file:///DCIM/a.heic', width: 4032, height: 3024 },
      { uri: 'file:///DCIM/b.jpg', width: 3024, height: 4032 },
    ],
  }),
}));
jest.mock('expo-image-manipulator', () => ({
  SaveFormat: { JPEG: 'jpeg' },
  ImageManipulator: {
    manipulate: (uri: string) => {
      const context = {
        resize: () => context,
        renderAsync: async () => ({
          saveAsync: async () => ({ uri: `${uri}.small.jpg`, width: 1280, height: 960 }),
        }),
      };
      return context;
    },
  },
}));
jest.mock('expo-file-system', () => ({
  File: class {
    size = 300_000;
  },
}));

const mock = new MockAdapter(api);
const user = {
  _id: 'u1',
  userName: 'mona',
  email: 'mona@example.com',
  role: 'user',
  phone: '01012345678',
};

/** The entries of a React Native FormData (it keeps them in `_parts`). */
const entries = (body: unknown) => (body as { _parts: [string, unknown][] })._parts;

beforeAll(() => i18n.changeLanguage('en'));
beforeEach(async () => {
  mock.reset();
  setApiToken(null);
  await tokenStorage.clear();
  await tokenStorage.set(makeToken(20 * HOUR));
  mock.onGet('/auth/getMe').reply(200, { success: true, message: 'ok', data: { user } });
  mock.onGet('/users/me/wishlist').reply(200, { success: true, data: [] });
  mock.onGet('/properties/myProperties').reply(200, { success: true, data: [] });
  mock.onGet(/\/properties\/similar\//).reply(200, { success: true, data: [] });
  mock.onGet(/\/property-comments\//).reply(200, { success: true, data: [] });
});

const renderApp = (initialUrl: string) => renderRouter('./src/app', { initialUrl });
const press = async (name: string) => fireEvent.press(await screen.findByRole('button', { name }));
const type = async (label: string, text: string) =>
  fireEvent.changeText(await screen.findByLabelText(label), text);

describe('add a property', () => {
  it('shows what is missing instead of sending an incomplete listing', async () => {
    await renderApp('/listing/new');
    await press('Publish listing');
    expect(await screen.findByText('Check the fields marked in red.')).toBeTruthy();
    expect(screen.getByText('Add at least one photo.')).toBeTruthy();
    expect(mock.history.post).toHaveLength(0);
  });

  it('uploads a rental with its photos using the web form keys', async () => {
    mock.onPost('/properties/addProperty').reply(201, {
      success: true,
      message: 'ok',
      data: listing('new1', 'شقة قريبة من الجامعة', { isApproved: false, isActive: false }),
    });

    await renderApp('/listing/new');
    await press('For rent');
    await press('شقة');
    await type('Listing title', 'شقة قريبة من الجامعة');
    await type('Description', 'شقة هادئة ومفروشة');
    await type('Price (EGP)', '٥٠٠٠');
    await type('Area (m²)', '90');
    await type('Bedrooms', '2');
    await type('Bathrooms', '1');
    await type('Lease length (months)', '12');
    await press('تكييف');
    await press('المنوفية');
    await press('شبين الكوم');
    await type('Who answers calls', 'منى عادل');
    expect((await screen.findByLabelText('Phone number')).props.value).toBe('01012345678');

    await press('Choose from gallery');
    expect(await screen.findByRole('button', { name: 'Remove photo 2' })).toBeTruthy();

    await press('Publish listing');
    await waitFor(() => expect(mock.history.post).toHaveLength(1));

    // a real multipart body, not JSON
    expect(mock.history.post[0].headers?.['Content-Type']).not.toBe('application/json');
    const sent = entries(mock.history.post[0].data);
    const fields = sent.filter(([, value]) => typeof value === 'string');
    expect(fields).toEqual(
      expect.arrayContaining([
        ['category', 'rent'],
        ['type', 'شقة'],
        ['price', '5000'],
        ['bedrooms', '2'],
        ['leaseDuration', '12'],
        ['amenities[]', 'تكييف'],
        ['location[governorate]', 'المنوفية'],
        ['location[city]', 'شبين الكوم'],
        ['location[address]', 'شبين الكوم'],
        ['contactInfo[name]', 'منى عادل'],
        ['contactInfo[phone]', '01012345678'],
      ]),
    );
    const files = sent.filter(([key]) => key === 'images').map(([, file]) => file);
    expect(files).toEqual([
      { uri: 'file:///DCIM/a.heic.small.jpg', name: 'photo-1.jpg', type: 'image/jpeg' },
      { uri: 'file:///DCIM/b.jpg.small.jpg', name: 'photo-2.jpg', type: 'image/jpeg' },
    ]);
    expect(mock.history.post[0].timeout).toBe(120_000);

    // lands on the new listing's page
    await waitFor(() => expect(screen).toHavePathname('/properties/new1'));
  });

  it('keeps signed-out users out of the form', async () => {
    await tokenStorage.clear();
    await renderApp('/listing/new');
    expect(await screen.findByText('Welcome to Saknly')).toBeTruthy();
    expect(screen.queryByRole('button', { name: 'Publish listing' })).toBeNull();
  });
});

describe('edit and delete my listing', () => {
  const mine = listing('m1', 'My flat', {
    leaseDuration: 12,
    owner: { _id: 'u1', userName: 'mona' },
    images: [
      { publicId: 'img-a', url: 'https://x/a.jpg', isMain: true },
      { publicId: 'img-b', url: 'https://x/b.jpg' },
    ],
    isApproved: true,
    isActive: true,
  });

  beforeEach(() => {
    mock.onGet('/properties/propertyDetails/m1').reply(200, { success: true, data: mine });
  });

  it('saves edits, keeping and removing photos', async () => {
    mock
      .onPut('/properties/updateProperty/m1')
      .reply(200, { success: true, message: 'ok', data: mine });

    await renderApp('/properties/m1');
    await press('Edit');
    await type('Price (EGP)', '6000');
    await press('Remove photo 1');
    await press('Save changes');

    await waitFor(() => expect(mock.history.put).toHaveLength(1));
    const sent = entries(mock.history.put[0].data);
    expect(sent).toEqual(
      expect.arrayContaining([
        ['price', '6000'],
        ['images[0][publicId]', 'img-b'],
        ['images[0][isMain]', 'true'],
        ['imagesToDelete[]', 'img-a'],
      ]),
    );
    expect(sent.map(([key]) => key)).not.toContain('category');
    await waitFor(() => expect(screen).toHavePathname('/properties/m1'));
  });

  it('shows Edit and Delete to the owner only', async () => {
    mock
      .onGet('/properties/propertyDetails/o1')
      .reply(200, { success: true, data: listing('o1', 'Other flat') });
    await renderApp('/properties/o1');
    await screen.findByText('Other flat description');
    expect(screen.queryByRole('button', { name: 'Edit' })).toBeNull();
    expect(screen.queryByRole('button', { name: 'Delete property' })).toBeNull();
  });
});

describe('sale terms', () => {
  const year = new Date().getFullYear() + 2;

  it('uploads a sale on installments with a delivery month and the chosen cover', async () => {
    mock.onPost('/properties/addProperty').reply(201, {
      success: true,
      message: 'ok',
      data: listing('sale1', 'شقة للبيع', { category: 'sale' }),
    });

    await renderApp('/listing/new');
    await press('For sale');
    await press('شقة');
    await type('Listing title', 'شقة للبيع بالتقسيط');
    await type('Description', 'شقة واسعة');
    await type('Price (EGP)', '1100000');
    await type('Area (m²)', '120');
    await type('Bedrooms', '3');
    await type('Bathrooms', '2');
    await press('Resale');
    await press('Under construction');

    // installment figures only appear once installments are offered
    expect(screen.queryByLabelText('Down payment (EGP)')).toBeNull();
    await press('Installments');
    await type('Down payment (EGP)', '١١٠٠٠٠٠');
    await type('Installment period (years)', '5');
    await press(String(year));
    await press('March');
    await press('المنوفية');
    await press('شبين الكوم');
    await type('Who answers calls', 'منى عادل');
    await press('Choose from gallery');
    await press('Make photo 2 the cover');

    // a down payment as large as the price is refused
    await press('Publish listing');
    expect(await screen.findByText('Less than the price.')).toBeTruthy();
    expect(mock.history.post).toHaveLength(0);

    await type('Down payment (EGP)', '500000');
    await press('Publish listing');
    await waitFor(() => expect(mock.history.post).toHaveLength(1));
    const sent = entries(mock.history.post[0].data);
    expect(sent.filter(([, value]) => typeof value === 'string')).toEqual(
      expect.arrayContaining([
        ['category', 'sale'],
        ['ownershipType', 'resale'],
        ['propertyStatus', 'underConstruction'],
        ['paymentMethod', 'installment'],
        ['downPayment', '500000'],
        ['installmentPeriodInYears', '5'],
        ['deliveryDate', `${year}-03-01`],
      ]),
    );
    // the chosen cover goes first, so the server marks it as the main photo
    expect(
      sent.filter(([key]) => key === 'images').map(([, file]) => (file as { uri: string }).uri),
    ).toEqual(['file:///DCIM/b.jpg.small.jpg', 'file:///DCIM/a.heic.small.jpg']);
  });

  it('shows the plan on the listing and works out the monthly installment', async () => {
    mock.onGet('/properties/propertyDetails/s9').reply(200, {
      success: true,
      data: listing('s9', 'شقة بالتقسيط', {
        category: 'sale',
        price: 1_100_000,
        paymentMethod: 'installment',
        downPayment: 500_000,
        installmentPeriodInYears: 5,
        propertyStatus: 'ready',
      }),
    });

    await renderApp('/properties/s9');
    expect(await screen.findByText('Terms')).toBeTruthy();
    expect(screen.getByText('EGP 500,000')).toBeTruthy();
    expect(screen.getByText('5 years')).toBeTruthy();
    expect(screen.getByText('Ready to move in')).toBeTruthy();

    // 600,000 left over 60 months, interest-free
    expect(screen.getByText('EGP 10,000')).toBeTruthy();
    await type('Interest rate (% a year)', '10');
    expect(await screen.findByText('EGP 12,748')).toBeTruthy();
  });
});
