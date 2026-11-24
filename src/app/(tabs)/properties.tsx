import { Ionicons } from '@expo/vector-icons';
import { router, useLocalSearchParams } from 'expo-router';
import { useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  ActivityIndicator,
  FlatList,
  Pressable,
  RefreshControl,
  ScrollView,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { TabHeader } from '@/components/TabHeader';
import { FilterSheet } from '@/features/properties/FilterSheet';
import {
  countActiveFilters,
  EMPTY_FILTERS,
  type ListingKind,
  type PropertyFilters,
} from '@/features/properties/filters';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { usePropertyList } from '@/features/properties/queries';
import { useThemeColors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { useDebouncedValue } from '@/utils/useDebouncedValue';
import { Text } from '@/components/Text';

const KINDS: ListingKind[] = ['all', 'sale', 'rent', 'student'];
const isKind = (value: unknown): value is ListingKind => KINDS.includes(value as ListingKind);

export default function PropertiesScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  // The kind lives in the route (?kind=...): home links set it, the chips below update it.
  const params = useLocalSearchParams<{ kind?: string }>();
  const kind: ListingKind = isKind(params.kind) ? params.kind : 'all';
  const setKind = (next: ListingKind) => router.setParams({ kind: next });

  const [filters, setFilters] = useState<PropertyFilters>(EMPTY_FILTERS);
  const [searchText, setSearchText] = useState('');
  const [sheetOpen, setSheetOpen] = useState(false);
  const search = useDebouncedValue(searchText);

  const applied = useMemo(() => ({ ...filters, kind, search }), [filters, kind, search]);
  const list = usePropertyList(applied);
  // Ties in the sort order can repeat a listing across pages; show it once.
  const items = useMemo(() => {
    const seen = new Set<string>();
    return (list.data?.pages.flatMap((page) => page.data) ?? []).filter(
      (item) => !seen.has(item._id) && !!seen.add(item._id),
    );
  }, [list.data]);
  const total = list.data?.pages[0]?.pagination.totalDocs;
  const activeFilters = countActiveFilters(filters);

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <TabHeader
        title={t('browse.title')}
        subtitle={total !== undefined ? t('browse.results', { count: total }) : ' '}
      >
        <View className="flex-row items-center gap-2">
          <View
            className="flex-1 flex-row items-center gap-2 rounded-2xl border border-border bg-surface px-4"
            style={elevation.card}
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              accessibilityLabel={t('browse.searchPlaceholder')}
              placeholder={t('browse.searchPlaceholder')}
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              className="min-h-[50px] flex-1 text-base text-text font-normal"
            />
            {searchText ? (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('browse.clearSearch')}
                hitSlop={8}
                onPress={() => setSearchText('')}
              >
                <Ionicons name="close-circle" size={18} color={colors.muted} />
              </Pressable>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('browse.filters')}
            accessibilityValue={activeFilters ? { text: String(activeFilters) } : undefined}
            onPress={() => setSheetOpen(true)}
            className={`h-[50px] w-[50px] items-center justify-center rounded-2xl ${
              activeFilters ? 'bg-primary' : 'border border-border bg-surface'
            }`}
            style={elevation.card}
          >
            <Ionicons
              name="options-outline"
              size={22}
              color={activeFilters ? colors.onPrimary : colors.primary}
            />
            {activeFilters ? (
              <View className="absolute -end-1.5 -top-1.5 h-5 min-w-5 items-center justify-center rounded-full border-2 border-bg bg-accent px-1">
                <Text className="text-[11px] text-accent-on font-bold">{activeFilters}</Text>
              </View>
            ) : null}
          </Pressable>
        </View>
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerClassName="gap-2"
        >
          {KINDS.map((option) => (
            <Chip
              key={option}
              label={t(`browse.kind.${option}`)}
              selected={kind === option}
              onPress={() => setKind(option)}
            />
          ))}
        </ScrollView>
      </TabHeader>

      {list.isPending ? (
        <LoadingView />
      ) : list.isError ? (
        <ErrorView error={list.error} onRetry={() => list.refetch()} />
      ) : (
        <FlatList
          testID="property-list"
          data={items}
          keyExtractor={(item) => item._id}
          renderItem={({ item }) => <PropertyCard property={item} />}
          contentContainerClassName="gap-4 px-5 pb-8"
          onEndReached={() => {
            if (list.hasNextPage && !list.isFetchingNextPage) list.fetchNextPage();
          }}
          onEndReachedThreshold={0.5}
          refreshControl={
            <RefreshControl
              refreshing={list.isRefetching && !list.isFetchingNextPage}
              onRefresh={() => void list.refetch()}
              tintColor={colors.primary}
            />
          }
          ListEmptyComponent={
            <EmptyView icon="search-outline" message={t('browse.empty')}>
              {activeFilters || search ? (
                <Button
                  title={t('browse.clearFilters')}
                  variant="secondary"
                  onPress={() => {
                    setSearchText('');
                    setFilters(EMPTY_FILTERS);
                  }}
                />
              ) : null}
            </EmptyView>
          }
          ListFooterComponent={
            list.isFetchingNextPage ? <ActivityIndicator color={colors.primary} /> : undefined
          }
        />
      )}

      <FilterSheet
        visible={sheetOpen}
        filters={filters}
        onClose={() => setSheetOpen(false)}
        onApply={(next) => {
          setFilters({ ...next, search: '' });
          setSheetOpen(false);
        }}
      />
    </SafeAreaView>
  );
}
