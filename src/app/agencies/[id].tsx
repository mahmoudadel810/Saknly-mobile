import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, View } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { useAgency } from '@/features/properties/queries';
import { useThemeColors } from '@/theme/colors';
import { Text } from '@/components/Text';

export default function AgencyScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agency = useAgency(id);
  const colors = useThemeColors();

  if (agency.isPending) return <LoadingView />;
  if (agency.isError) {
    return isAxiosError(agency.error) && agency.error.response?.status === 404 ? (
      <EmptyView icon="business-outline" message={t('agency.notFound')} />
    ) : (
      <ErrorView error={agency.error} onRetry={() => agency.refetch()} />
    );
  }

  const a = agency.data;
  // GET /agencies/:id populates the approved, active listings.
  const listings = a.properties.filter((p): p is Property => typeof p === 'object' && !!p);

  return (
    <FlatList
      data={listings}
      keyExtractor={(item) => item._id}
      renderItem={({ item }) => <PropertyCard property={item} />}
      contentContainerClassName="gap-4 px-5 pb-10"
      ListHeaderComponent={
        <View className="items-center gap-3 py-6">
          <Stack.Screen options={{ title: a.name }} />
          {a.logo?.url ? (
            <Image
              source={{ uri: a.logo.url }}
              style={{ width: 88, height: 88, borderRadius: 24 }}
              contentFit="cover"
              accessibilityIgnoresInvertColors
            />
          ) : (
            <View className="h-[88px] w-[88px] items-center justify-center rounded-3xl bg-accent">
              <Text className="text-4xl text-accent-on font-bold">{a.name.trim().charAt(0)}</Text>
            </View>
          )}
          <Text accessibilityRole="header" className="text-center text-2xl text-text font-bold">
            {a.name}
          </Text>
          {a.description ? (
            <Text className="text-center text-base leading-6 text-text-2">{a.description}</Text>
          ) : null}
          <View className="flex-row items-center gap-2 rounded-full bg-primary-soft px-3 py-1">
            <Ionicons name="home" size={14} color={colors.primary} />
            <Text className="text-sm text-primary font-semibold">
              {t('agency.listingCount', { count: listings.length })}
            </Text>
          </View>
          <Text className="self-start pt-4 text-left text-lg text-text font-bold">
            {t('agency.properties')}
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyView icon="business-outline" message={t('agency.noProperties')} />}
    />
  );
}
