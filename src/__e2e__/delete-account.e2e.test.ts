/**
 * End-to-end: a user deletes their own account (DELETE /users/me) against a local Saknly-server,
 * and an edit empties optional listing fields with `clear[]`. A freshly registered user is used,
 * so the seeded accounts other suites sign in with are never touched. Run with `npm run test:e2e`.
 */
import { isAxiosError } from 'axios';

import { accountApi, commentWriteApi } from '@/api/account';
import { authApi } from '@/api/auth';
import { propertiesApi } from '@/api/browse';
import { api, setApiToken } from '@/api/client';
import { listingsApi } from '@/api/listings';
import { startSession } from '@/auth/session';
import {
  draftFromProperty,
  EMPTY_DRAFT,
  type ListingDraft,
  toListingFields,
} from '@/features/listing/draft';
import { clearedFields } from '@/features/listing/formData';

const INBOX = process.env.E2E_INBOX_URL || 'http://127.0.0.1:5056/mail';
const JPEG = Uint8Array.from(
  atob(
    '/9j/2wBDAA0JCgsKCA0LCgsODg0PEyAVExISEyccHhcgLikxMC4pLSwzOko+MzZGNywtQFdBRkxOUlNSMj5aYVpQYEpRUk//2wBDAQ4ODhMREyYVFSZPNS01T09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT09PT0//wAARCABIAGADASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAb/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/8QAFgEBAQEAAAAAAAAAAAAAAAAAAAMF/8QAFBEBAAAAAAAAAAAAAAAAAAAAAP/aAAwDAQACEQMRAD8AmwFmSAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAA//9k=',
  ),
  (c) => c.charCodeAt(0),
);

const body = (fields: [string, string][], fileKey: string, photos: number) => {
  const form = new FormData();
  fields.forEach(([key, value]) => form.append(key, value));
  for (let i = 0; i < photos; i++) {
    form.append(fileKey, new Blob([JPEG], { type: 'image/jpeg' }), `photo-${i + 1}.jpg`);
  }
  return form;
};

const decodeQuotedPrintable = (raw: string) =>
  raw
    .replace(/=\r?\n/g, '')
    .replace(/=([0-9A-F]{2})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)));

const waitForMail = async (to: string, match: RegExp): Promise<RegExpMatchArray> => {
  for (let i = 0; i < 50; i++) {
    const mails: { raw: string }[] = await (await fetch(INBOX)).json();
    for (const mail of mails.map((m) => decodeQuotedPrintable(m.raw)).reverse()) {
      const found = mail.includes(to) && mail.match(match);
      if (found) return found;
    }
    await new Promise((r) => setTimeout(r, 200));
  }
  throw new Error(`no email to ${to} matching ${match}`);
};

const status = (error: unknown) => (isAxiosError(error) ? error.response?.status : undefined);
const email = `delete.${Date.now()}@saknly.local`;
const password = 'Mobile1!';

const listing: ListingDraft = {
  ...EMPTY_DRAFT,
  category: 'sale',
  type: 'شقة',
  title: 'شقة للحذف مع الحساب',
  description: 'شقة تجربة',
  price: '1100000',
  area: '120',
  bedrooms: '3',
  bathrooms: '2',
  governorate: 'المنوفية',
  city: 'شبين الكوم',
  paymentMethod: 'installment',
  downPayment: '500000',
  installmentYears: '5',
  deliveryMonth: '2028-03',
  latitude: '30.559123',
  longitude: '31.010123',
  contactName: 'منى عادل',
  contactPhone: '01012345678',
};

afterEach(() => setApiToken(null));

describe('an account deletes itself', () => {
  let token: string;

  beforeAll(async () => {
    await authApi.register({
      userName: 'e2e_delete',
      email,
      phone: '01012345678',
      address: 'Cairo',
      password,
      confirmPassword: password,
    });
    const [, confirmToken] = await waitForMail(email, /\/confirm-email\/([\w.-]+)/);
    await api.get(`/auth/confirm-email/${confirmToken}`);
    ({ token } = await startSession(email, password));
  });

  it('empties the fields an edit cleared', async () => {
    setApiToken(token);
    const created = await listingsApi.create(body(toListingFields(listing), 'images', 1));
    expect(created).toMatchObject({ downPayment: 500000, location: { latitude: 30.559123 } });

    const before = draftFromProperty(created);
    const after: ListingDraft = {
      ...before,
      paymentMethod: 'cash',
      deliveryMonth: '',
      latitude: '',
      longitude: '',
    };
    const fields = [
      ...toListingFields(after).filter(([key]) => key !== 'category'),
      ...clearedFields(before, after),
    ];
    const updated = await listingsApi.update(created._id, body(fields, 'newImages', 0));
    expect(updated.paymentMethod).toBe('cash');
    expect(updated.downPayment).toBeUndefined();
    expect(updated.installmentPeriodInYears).toBeUndefined();
    expect(updated.deliveryDate).toBeUndefined();
    expect(updated.location.latitude).toBeUndefined();
    expect(updated.location).toMatchObject({ city: 'شبين الكوم' });
  });

  it('refuses a wrong password with 400, so the app keeps the session', async () => {
    setApiToken(token);
    const error = await accountApi.delete('Wrong-1!').catch((e) => e);
    expect(status(error)).toBe(400);
    expect((await authApi.getMe(token)).email).toBe(email);
  });

  it('deletes the account and its listings, and the token stops working', async () => {
    setApiToken(token);
    const [published] = (await propertiesApi.list({ limit: '1' })).data;
    await commentWriteApi.add(published._id, 'تعليق سيُحذف مع الحساب');

    await accountApi.delete(password);

    expect(status(await authApi.getMe(token).catch((e) => e))).toBe(401);
    expect(status(await startSession(email, password).catch((e) => e))).toBe(400);
    setApiToken(null);
    const comments = (await api.get(`/property-comments/${published._id}`)).data.data as {
      text: string;
    }[];
    expect(comments.map((c) => c.text)).not.toContain('تعليق سيُحذف مع الحساب');
  });
});
