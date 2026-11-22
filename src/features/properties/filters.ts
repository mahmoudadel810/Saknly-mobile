import type { PropertyCategory } from '@/api/browseTypes';

export type ListingKind = 'all' | PropertyCategory;

export const SORT_VALUES = ['-createdAt', 'price', '-price', '-views'] as const;
export type SortValue = (typeof SORT_VALUES)[number];

export const PAGE_SIZE = 12;

export interface PropertyFilters {
  kind: ListingKind;
  search: string;
  governorate: string | null;
  city: string | null;
  type: string | null;
  /** Exact match, as on the web filters. */
  bedrooms: number | null;
  minPrice: number | null;
  maxPrice: number | null;
  sort: SortValue;
}

export const EMPTY_FILTERS: PropertyFilters = {
  kind: 'all',
  search: '',
  governorate: null,
  city: null,
  type: null,
  bedrooms: null,
  minPrice: null,
  maxPrice: null,
  sort: '-createdAt',
};

/**
 * Query params for GET /properties/allProperties, with the same keys the web listing page sends.
 * Student housing uses isStudentFriendly=true (it also matches rent listings marked for students).
 */
export const toQueryParams = (filters: PropertyFilters, page: number): Record<string, string> => {
  const params: Record<string, string> = {
    page: String(page),
    limit: String(PAGE_SIZE),
    sort: filters.sort,
  };
  if (filters.kind === 'sale' || filters.kind === 'rent') params.category = filters.kind;
  if (filters.kind === 'student') params.isStudentFriendly = 'true';

  const search = filters.search.trim().slice(0, 100);
  if (search) params.search = search;
  if (filters.governorate) params['location.governorate'] = filters.governorate;
  if (filters.city) params['location.city'] = filters.city;
  if (filters.type) params.type = filters.type;
  if (filters.bedrooms !== null) params.bedrooms = String(filters.bedrooms);
  if (filters.minPrice !== null) params['price[gte]'] = String(filters.minPrice);
  if (filters.maxPrice !== null) params['price[lte]'] = String(filters.maxPrice);
  return params;
};

/** How many filters (beyond kind, search and sort) are set, for the filter button badge. */
export const countActiveFilters = (filters: PropertyFilters) =>
  [
    filters.governorate,
    filters.city,
    filters.type,
    filters.bedrooms,
    filters.minPrice,
    filters.maxPrice,
  ].filter((value) => value !== null).length;

/** A typed price: digits only, empty for none. */
export const parsePrice = (text: string): number | null => {
  const digits = text.replace(/[^\d]/g, '');
  return digits ? Number(digits) : null;
};
