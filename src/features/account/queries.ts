import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useMemo } from 'react';
import Toast from 'react-native-toast-message';

import { commentWriteApi, myPropertiesApi, wishlistApi, type WishlistItem } from '@/api/account';
import type { Property, PropertyComment } from '@/api/browseTypes';
import { useAuth } from '@/auth/AuthProvider';
import { queryKeys } from '@/features/properties/queries';
import { describeError } from '@/utils/errors';

export const accountKeys = {
  wishlist: ['account', 'wishlist'] as const,
  myProperties: ['account', 'myProperties'] as const,
};

const useSignedIn = () => useAuth().status === 'signedIn';

export const useWishlist = () =>
  useQuery({ queryKey: accountKeys.wishlist, queryFn: wishlistApi.list, enabled: useSignedIn() });

/** Ids in the wishlist; empty when signed out. One request serves every heart on screen. */
export const useFavoriteIds = () => {
  const { data } = useWishlist();
  return useMemo(() => new Set(data?.map((item) => item.property._id)), [data]);
};

export const withFavorite = (
  items: WishlistItem[] | undefined,
  property: Property,
  favorite: boolean,
): WishlistItem[] => {
  const rest = (items ?? []).filter((item) => item.property._id !== property._id);
  return favorite
    ? [{ _id: `pending-${property._id}`, property, addedAt: new Date().toISOString() }, ...rest]
    : rest;
};

/** Adds or removes a listing, updating the hearts at once and rolling back if the server refuses. */
export const useToggleFavorite = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: ({ property, favorite }: { property: Property; favorite: boolean }) =>
      favorite ? wishlistApi.add(property._id) : wishlistApi.remove(property._id),
    onMutate: async ({ property, favorite }) => {
      await client.cancelQueries({ queryKey: accountKeys.wishlist });
      const previous = client.getQueryData<WishlistItem[]>(accountKeys.wishlist);
      client.setQueryData(accountKeys.wishlist, withFavorite(previous, property, favorite));
      return { previous };
    },
    onError: (error, _vars, context) => {
      client.setQueryData(accountKeys.wishlist, context?.previous);
      Toast.show({ type: 'error', text1: describeError(error) });
    },
    onSettled: () => client.invalidateQueries({ queryKey: accountKeys.wishlist }),
  });
};

export const useClearWishlist = () => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: wishlistApi.clear,
    onSuccess: () => client.setQueryData(accountKeys.wishlist, []),
    onError: (error) => Toast.show({ type: 'error', text1: describeError(error) }),
    onSettled: () => client.invalidateQueries({ queryKey: accountKeys.wishlist }),
  });
};

export const useMyProperties = () =>
  useQuery({
    queryKey: accountKeys.myProperties,
    queryFn: myPropertiesApi.list,
    enabled: useSignedIn(),
  });

export const useAddComment = (propertyId: string) => {
  const client = useQueryClient();
  return useMutation({
    mutationFn: (text: string) => commentWriteApi.add(propertyId, text),
    onSuccess: (comment) =>
      client.setQueryData<PropertyComment[]>(queryKeys.comments(propertyId), (current) => [
        comment,
        ...(current ?? []),
      ]),
  });
};
