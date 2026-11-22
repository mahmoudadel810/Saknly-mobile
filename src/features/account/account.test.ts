import type { WishlistItem } from '@/api/account';
import type { Property } from '@/api/browseTypes';

import { publicationState } from './MyProperties';
import { withFavorite } from './queries';
import { contactSchema, inquirySchema, testimonialSchema } from './schemas';

const property = (id: string) => ({ _id: id, title: id }) as Property;
const item = (id: string): WishlistItem => ({
  _id: `w-${id}`,
  property: property(id),
  addedAt: '',
});

describe('withFavorite (optimistic wishlist update)', () => {
  it('puts an added listing first, once', () => {
    const next = withFavorite([item('a'), item('b')], property('b'), true);
    expect(next.map((i) => i.property._id)).toEqual(['b', 'a']);
  });

  it('removes a listing and copes with no cache yet', () => {
    expect(
      withFavorite([item('a'), item('b')], property('a'), false).map((i) => i.property._id),
    ).toEqual(['b']);
    expect(withFavorite(undefined, property('a'), true)).toHaveLength(1);
  });
});

describe('publicationState', () => {
  it.each([
    [{ isApproved: false, isActive: false }, 'pending'],
    [{ isApproved: true, isActive: true }, 'published'],
    [{ isApproved: true, isActive: false }, 'hidden'],
  ] as const)('%j -> %s', (flags, state) => expect(publicationState(flags)).toBe(state));
});

const valid = (schema: { isValidSync: (v: object) => boolean }, values: object) =>
  schema.isValidSync(values);

describe('form rules (mirror the server Joi validators)', () => {
  const inquiry = {
    name: 'Mona',
    email: 'mona@example.com',
    phone: '+20 101-234-5678',
    message: 'Is it still available?',
  };

  it('inquiry: name 2-50, message 10-500, the server phone pattern', () => {
    expect(valid(inquirySchema, inquiry)).toBe(true);
    expect(valid(inquirySchema, { ...inquiry, name: 'M' })).toBe(false);
    expect(valid(inquirySchema, { ...inquiry, message: 'Too short' })).toBe(false);
    expect(valid(inquirySchema, { ...inquiry, message: 'x'.repeat(501) })).toBe(false);
    expect(valid(inquirySchema, { ...inquiry, phone: 'call me' })).toBe(false);
    expect(valid(inquirySchema, { ...inquiry, phone: '(010) 1234 5678' })).toBe(true);
    expect(valid(inquirySchema, { ...inquiry, phone: '+20 (10) 1234-5678' })).toBe(false);
  });

  const contact = { name: 'Mona', email: 'mona@example.com', subject: 'Hi', message: 'Hello' };

  it('contact: the server only accepts a 2-3 letter domain ending', () => {
    expect(valid(contactSchema, contact)).toBe(true);
    expect(valid(contactSchema, { ...contact, email: 'mona@example.eg' })).toBe(true);
    expect(valid(contactSchema, { ...contact, email: 'mona@example.info' })).toBe(false);
    expect(valid(contactSchema, { ...contact, subject: 'x'.repeat(101) })).toBe(false);
  });

  it('testimonial: name 2-50, text 5-1000, optional role', () => {
    expect(valid(testimonialSchema, { name: 'Mona', text: 'Great service', role: '' })).toBe(true);
    expect(valid(testimonialSchema, { name: 'Mona', text: 'Good' })).toBe(false);
    expect(valid(testimonialSchema, { name: 'Mona', text: 'Great', role: 'x'.repeat(51) })).toBe(
      false,
    );
  });
});
