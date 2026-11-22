import { Ionicons } from '@expo/vector-icons';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { useAuth } from '@/auth/AuthProvider';
import { useSignInPrompt } from '@/auth/returnTo';
import { useThemeColors } from '@/theme/colors';

import { useFavoriteIds, useToggleFavorite } from './queries';

interface FavoriteButtonProps {
  property: Property;
  /** Over a photo: white on a dark circle. Otherwise in the app's colors. */
  overPhoto?: boolean;
}

export function FavoriteButton({ property, overPhoto = false }: FavoriteButtonProps) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const favorite = useFavoriteIds().has(property._id);
  const toggle = useToggleFavorite();
  const colors = useThemeColors();
  const promptSignIn = useSignInPrompt();

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={favorite ? t('wishlist.remove') : t('wishlist.add')}
      accessibilityState={{ selected: favorite }}
      hitSlop={8}
      onPress={() => {
        if (status !== 'signedIn') return promptSignIn();
        // One request at a time per heart: overlapping add/remove could land out of order.
        if (toggle.isPending) return;
        toggle.mutate({ property, favorite: !favorite });
      }}
      className={overPhoto ? 'h-9 w-9 items-center justify-center rounded-full bg-black/45' : 'p-1'}
    >
      <Ionicons
        name={favorite ? 'heart' : 'heart-outline'}
        size={22}
        color={favorite ? '#E5484D' : overPhoto ? '#FFFFFF' : colors.primary}
      />
    </Pressable>
  );
}
