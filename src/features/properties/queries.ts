import { useInfiniteQuery, useQuery } from '@tanstack/react-query';

import { agenciesApi, commentsApi, propertiesApi, testimonialsApi } from '@/api/browse';

import { type PropertyFilters, toQueryParams } from './filters';

export const queryKeys = {
  featured: ['properties', 'featured'] as const,
  list: (filters: PropertyFilters) => ['properties', 'list', filters] as const,
  property: (id: string) => ['properties', 'detail', id] as const,
  similar: (id: string) => ['properties', 'similar', id] as const,
  comments: (id: string) => ['comments', id] as const,
  agencies: ['agencies', 'featured'] as const,
  agency: (id: string) => ['agencies', 'detail', id] as const,
  testimonials: ['testimonials'] as const,
};

export const useFeaturedProperties = () =>
  useQuery({ queryKey: queryKeys.featured, queryFn: propertiesApi.featured });

export const usePropertyList = (filters: PropertyFilters) =>
  useInfiniteQuery({
    queryKey: queryKeys.list(filters),
    queryFn: ({ pageParam }) => propertiesApi.list(toQueryParams(filters, pageParam)),
    initialPageParam: 1,
    getNextPageParam: (last) =>
      last.pagination.hasNext ? last.pagination.currentPage + 1 : undefined,
  });

export const useProperty = (id: string) =>
  useQuery({ queryKey: queryKeys.property(id), queryFn: () => propertiesApi.details(id) });

export const useSimilarProperties = (id: string) =>
  useQuery({ queryKey: queryKeys.similar(id), queryFn: () => propertiesApi.similar(id) });

export const usePropertyComments = (id: string) =>
  useQuery({ queryKey: queryKeys.comments(id), queryFn: () => commentsApi.forProperty(id) });

export const useFeaturedAgencies = () =>
  useQuery({ queryKey: queryKeys.agencies, queryFn: agenciesApi.featured });

export const useAgency = (id: string) =>
  useQuery({ queryKey: queryKeys.agency(id), queryFn: () => agenciesApi.details(id) });

export const useTestimonials = () =>
  useQuery({ queryKey: queryKeys.testimonials, queryFn: testimonialsApi.approved });
