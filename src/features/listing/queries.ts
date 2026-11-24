import { useMutation, useQueryClient } from '@tanstack/react-query';

import { listingsApi } from '@/api/listings';
import { accountKeys } from '@/features/account/queries';

import { createBody, updateBody } from './formData';
import type { ListingSubmit } from './ListingForm';

/** A saved listing can appear in my properties, its own page and every list. */
const useRefreshListings = () => {
  const client = useQueryClient();
  return () =>
    Promise.all([
      client.invalidateQueries({ queryKey: accountKeys.myProperties }),
      client.invalidateQueries({ queryKey: accountKeys.wishlist }),
      client.invalidateQueries({ queryKey: ['properties'] }),
    ]);
};

export const useCreateListing = () => {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: ({ draft, photos, onProgress }: ListingSubmit) =>
      listingsApi.create(createBody(draft, photos), { onProgress }),
    onSuccess: refresh,
  });
};

export const useUpdateListing = (id: string) => {
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: ({ draft, kept, removed, photos, coverIsNew, onProgress }: ListingSubmit) =>
      listingsApi.update(id, updateBody(draft, kept, removed, photos, coverIsNew), {
        onProgress,
      }),
    onSuccess: refresh,
  });
};

export const useDeleteListing = () => {
  const client = useQueryClient();
  const refresh = useRefreshListings();
  return useMutation({
    mutationFn: (id: string) => listingsApi.remove(id),
    onSuccess: async (_result, id) => {
      // The page of a deleted listing must not refetch into a 404 while it closes.
      client.removeQueries({ queryKey: ['properties', 'detail', id] });
      await refresh();
    },
  });
};
