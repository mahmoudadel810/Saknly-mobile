import { isAxiosError } from 'axios';
import { Image } from 'expo-image';
import { Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, View } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { useAgency } from '@/features/properties/queries';

export default function AgencyScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const agency = useAgency(id);

  if (agency.isPending) return <LoadingView />;
  if (agency.isError) {
    return isAxiosError(agency.error) && agency.error.response?.status === 404 ? (
      <EmptyView message={t('agency.notFound')} />
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
              style={{ width: 96, height: 96, borderRadius: 24 }}
              contentFit="contain"
            />
          ) : null}
          <Text accessibilityRole="header" className="text-center text-2xl font-bold text-text">
            {a.name}
          </Text>
          {a.description ? (
            <Text className="text-center text-base leading-6 text-text-2">{a.description}</Text>
          ) : null}
          <Text className="self-start pt-2 text-lg font-bold text-text">
            {t('agency.properties')}
          </Text>
        </View>
      }
      ListEmptyComponent={<EmptyView message={t('agency.noProperties')} />}
    />
  );
}
