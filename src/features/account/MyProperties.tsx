import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { ErrorView, LoadingView } from '@/components/StateViews';
import { formatPrice, placeLabel } from '@/features/properties/format';

import { useMyProperties } from './queries';

/** Where a listing stands: waiting for an admin, live, or approved but hidden. */
export const publicationState = (property: Pick<Property, 'isApproved' | 'isActive'>) =>
  !property.isApproved ? 'pending' : property.isActive ? 'published' : 'hidden';

const stateClass = {
  pending: 'bg-surface-2 text-warning',
  published: 'bg-primary-soft text-primary',
  hidden: 'bg-surface-2 text-muted',
} as const;

export function MyProperties() {
  const { t } = useTranslation();
  const mine = useMyProperties();

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="text-xl font-bold text-text">
        {t('myProperties.title')}
      </Text>
      {mine.isPending ? (
        <LoadingView />
      ) : mine.isError ? (
        <ErrorView error={mine.error} onRetry={() => mine.refetch()} />
      ) : mine.data.length === 0 ? (
        <Text className="text-sm text-muted">{t('myProperties.empty')}</Text>
      ) : (
        mine.data.map((property) => {
          const state = publicationState(property);
          return (
            <Pressable
              key={property._id}
              accessibilityRole="link"
              accessibilityLabel={`${property.title}, ${t(`myProperties.${state}`)}`}
              onPress={() =>
                router.push({ pathname: '/properties/[id]', params: { id: property._id } })
              }
              className="gap-1 rounded-2xl border border-border bg-surface p-4 active:opacity-90"
            >
              <View className="flex-row items-start justify-between gap-2">
                <Text numberOfLines={1} className="flex-1 text-base font-semibold text-text">
                  {property.title}
                </Text>
                <Text
                  className={`rounded-full px-3 py-1 text-xs font-semibold ${stateClass[state]}`}
                >
                  {t(`myProperties.${state}`)}
                </Text>
              </View>
              <Text className="text-sm text-primary">{formatPrice(property)}</Text>
              <Text className="text-sm text-muted">{placeLabel(property)}</Text>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
