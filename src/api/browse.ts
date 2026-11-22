import type { Agency, Property, PropertyComment, PropertyPage, Testimonial } from './browseTypes';
import { api } from './client';

type Data<T> = { success: boolean; data: T };

export const propertiesApi = {
  /** Approved, active listings with filters, sorting and pagination (the web listing page's endpoint). */
  list: async (params: Record<string, string>) =>
    (await api.get<PropertyPage>('/properties/allProperties', { params })).data,

  /** The ten most viewed public listings. */
  featured: async () => (await api.get<Data<Property[]>>('/properties/featured')).data.data,

  details: async (id: string) =>
    (await api.get<Data<Property>>(`/properties/propertyDetails/${id}`)).data.data,

  similar: async (id: string) =>
    (await api.get<Data<Property[]>>(`/properties/similar/${id}`)).data.data,
};

export const agenciesApi = {
  featured: async () => (await api.get<Data<Agency[]>>('/agencies/featured')).data.data,
  details: async (id: string) => (await api.get<Data<Agency>>(`/agencies/${id}`)).data.data,
};

export const testimonialsApi = {
  /** Approved testimonials only (the server filters for non-admins). */
  approved: async () => (await api.get<Data<Testimonial[]>>('/testimonial')).data.data,
};

export const commentsApi = {
  forProperty: async (propertyId: string) =>
    (await api.get<Data<PropertyComment[]>>(`/property-comments/${propertyId}`)).data.data,
};
