// Signed-in and form endpoints, taken from Saknly-server controllers and validators.
import type { Property, PropertyComment } from './browseTypes';
import { api } from './client';
import type { ApiMessage } from './types';

type Data<T> = ApiMessage & { data: T };

export interface WishlistItem {
  _id: string;
  property: Property;
  addedAt: string;
}

export interface InquiryInput {
  property: string;
  name: string;
  email: string;
  phone: string;
  message: string;
}

export interface ContactInput {
  name: string;
  email: string;
  subject: string;
  message: string;
}

export interface TestimonialInput {
  name: string;
  text: string;
  role?: string;
  type: 'general' | 'property' | 'agency';
  propertyId?: string;
  agencyId?: string;
}

export const wishlistApi = {
  /** Public listings only: the server drops deleted or unpublished ones. */
  list: async () => (await api.get<Data<WishlistItem[]>>('/users/me/wishlist')).data.data,
  add: async (propertyId: string) =>
    (await api.post<ApiMessage>(`/users/me/wishlist/${propertyId}`)).data,
  remove: async (propertyId: string) =>
    (await api.delete<ApiMessage>(`/users/me/wishlist/${propertyId}`)).data,
  clear: async () => (await api.delete<ApiMessage>('/users/me/wishlist')).data,
};

export const myPropertiesApi = {
  /** Every listing the user owns, including pending and inactive ones. */
  list: async () => (await api.get<Data<Property[]>>('/properties/myProperties')).data.data,
};

export const commentWriteApi = {
  add: async (propertyId: string, text: string) =>
    (await api.post<Data<PropertyComment>>(`/property-comments/${propertyId}`, { text })).data.data,
};

export const inquiryApi = {
  create: async (input: InquiryInput) =>
    (await api.post<ApiMessage>('/property-inquiry/add-property-inquiry', input)).data,
};

export const contactApi = {
  submit: async (input: ContactInput) =>
    (await api.post<ApiMessage>('/contact/contact-us', input)).data,
};

export const testimonialWriteApi = {
  /** Saved as pending: an admin approves it before it shows on the home screen. */
  submit: async (input: TestimonialInput) =>
    (await api.post<ApiMessage>('/testimonial', input)).data,
};
