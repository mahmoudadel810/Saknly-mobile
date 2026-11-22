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
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
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
import { useDebouncedValue } from '@/utils/useDebouncedValue';

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
      <View className="gap-3 px-5 pb-3 pt-4">
        <Text accessibilityRole="header" className="text-3xl font-bold text-text">
          {t('browse.title')}
        </Text>
        <View className="flex-row items-center gap-2">
          <View className="flex-1 flex-row items-center gap-2 rounded-xl border border-border bg-field px-4">
            <Ionicons name="search" size={18} color={colors.muted} />
            <TextInput
              accessibilityLabel={t('browse.searchPlaceholder')}
              placeholder={t('browse.searchPlaceholder')}
              placeholderTextColor={colors.muted}
              value={searchText}
              onChangeText={setSearchText}
              returnKeyType="search"
              className="flex-1 py-3 text-base text-text"
            />
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('browse.filters')}
            accessibilityValue={activeFilters ? { text: String(activeFilters) } : undefined}
            onPress={() => setSheetOpen(true)}
            className="h-12 w-12 items-center justify-center rounded-xl border border-border bg-surface"
          >
            <Ionicons name="options-outline" size={22} color={colors.primary} />
            {activeFilters ? (
              <View className="absolute -end-1 -top-1 h-5 min-w-5 items-center justify-center rounded-full bg-primary px-1">
                <Text className="text-xs font-bold text-on-primary">{activeFilters}</Text>
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
        {total !== undefined ? (
          <Text className="text-sm text-muted">{t('browse.results', { count: total })}</Text>
        ) : null}
      </View>

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
            <EmptyView message={t('browse.empty')}>
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
