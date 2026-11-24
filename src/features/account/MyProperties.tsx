import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { ErrorView, LoadingView } from '@/components/StateViews';
import { coverImage, formatPrice, placeLabel } from '@/features/properties/format';
import { useThemeColors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';

import { publicationState } from './publication';
import { useMyProperties } from './queries';
import { Text } from '@/components/Text';

const stateClass = {
  pending: 'bg-surface-2 text-warning',
  published: 'bg-primary-soft text-primary',
  hidden: 'bg-surface-2 text-muted',
} as const;

export function MyProperties() {
  const { t } = useTranslation();
  const mine = useMyProperties();
  const colors = useThemeColors();

  return (
    <View className="gap-3">
      <Text accessibilityRole="header" className="px-1 text-left text-sm text-muted font-semibold">
        {t('myProperties.title')}
      </Text>
      {mine.isPending ? (
        <LoadingView />
      ) : mine.isError ? (
        <ErrorView error={mine.error} onRetry={() => mine.refetch()} />
      ) : mine.data.length === 0 ? (
        <View className="items-center gap-2 rounded-2xl border border-dashed border-border-strong px-4 py-6">
          <Ionicons name="home-outline" size={24} color={colors.muted} />
          <Text className="text-center text-sm text-muted">{t('myProperties.empty')}</Text>
        </View>
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
              className="flex-row gap-3 rounded-2xl border border-border bg-surface p-3 active:bg-surface-2"
              style={elevation.card}
            >
              <Image
                source={coverImage(property) ? { uri: coverImage(property) } : undefined}
                style={{ width: 76, height: 76, borderRadius: 14, backgroundColor: colors.field }}
                contentFit="cover"
                accessibilityIgnoresInvertColors
              />
              <View className="flex-1 justify-center gap-1">
                <Text numberOfLines={1} className="text-left text-base text-text font-semibold">
                  {property.title}
                </Text>
                <Text className="text-left text-sm text-primary font-bold">
                  {formatPrice(property)}
                </Text>
                <View className="flex-row items-center justify-between gap-2">
                  <Text numberOfLines={1} className="flex-1 text-left text-xs text-muted">
                    {placeLabel(property)}
                  </Text>
                  <Text
                    className={`rounded-full px-2.5 py-0.5 text-xs font-semibold ${stateClass[state]}`}
                  >
                    {t(`myProperties.${state}`)}
                  </Text>
                </View>
              </View>
            </Pressable>
          );
        })
      )}
    </View>
  );
}
