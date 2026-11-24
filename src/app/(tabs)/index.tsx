import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router, useIsFocused } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import type { Agency, Testimonial } from '@/api/browseTypes';
import { initial } from '@/utils/initial';
import { useAuth } from '@/auth/AuthProvider';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { Text } from '@/components/Text';
import type { ListingKind } from '@/features/properties/filters';
import { PropertyCard } from '@/features/properties/PropertyCard';
import {
  useFeaturedAgencies,
  useFeaturedProperties,
  useTestimonials,
} from '@/features/properties/queries';
import { useThemeColors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';

type Kind = Exclude<ListingKind, 'all'>;

const TILES: { kind: Kind; icon: keyof typeof Ionicons.glyphMap }[] = [
  { kind: 'sale', icon: 'home' },
  { kind: 'rent', icon: 'key' },
  { kind: 'student', icon: 'school' },
];

// Always pass the kind, so "see all" after "for rent" shows everything again.
const openList = (kind: ListingKind = 'all') =>
  router.navigate({ pathname: '/properties', params: { kind } });

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();
  const { status, user } = useAuth();
  const focused = useIsFocused();
  const featured = useFeaturedProperties();
  const agencies = useFeaturedAgencies();
  const testimonials = useTestimonials();

  const refreshing = featured.isRefetching || agencies.isRefetching || testimonials.isRefetching;
  const refresh = () => {
    featured.refetch();
    agencies.refetch();
    testimonials.refetch();
  };

  return (
    <ScrollView
      className="flex-1 bg-bg"
      contentContainerClassName="gap-8 pb-10"
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={refresh}
          // iOS draws it in the overscroll above the hero, on the page background, not the teal.
          tintColor={colors.primary}
          progressViewOffset={insets.top}
        />
      }
    >
      {/* Light status bar icons over the teal hero, only while Home is the visible tab. */}
      {focused ? <StatusBar style="light" /> : null}
      {/* The hero runs under the status bar; the search card overlaps its bottom edge. */}
      <View>
        <View
          className="overflow-hidden rounded-b-[32px] bg-primary px-5 pb-16"
          style={{ paddingTop: insets.top + 20 }}
        >
          {/* Two soft rings for depth; decoration only. */}
          <View
            pointerEvents="none"
            className="absolute -end-16 -top-10 h-56 w-56 rounded-full border-[28px] border-white/10"
          />
          <View
            pointerEvents="none"
            className="absolute -bottom-20 -start-10 h-40 w-40 rounded-full bg-white/5"
          />
          <View className="flex-row items-center justify-between">
            <Text className="text-2xl text-on-primary font-bold">{t('common.appName')}</Text>
            <View className="rounded-full bg-white/15 px-3 py-1">
              <Text numberOfLines={1} className="max-w-48 text-sm text-on-primary font-medium">
                {status === 'signedIn' && user
                  ? t('home.welcomeUser', { name: user.userName })
                  : t('home.welcome')}
              </Text>
            </View>
          </View>
          <Text
            accessibilityRole="header"
            className="mt-7 text-left text-[30px] leading-[44px] text-on-primary font-bold"
          >
            {t('home.heroTitle')}
          </Text>
          <Text className="mt-2 text-left text-base text-on-primary opacity-80">
            {t('home.subtitle')}
          </Text>
        </View>

        <Pressable
          accessibilityRole="search"
          accessibilityLabel={t('browse.searchPlaceholder')}
          onPress={() => openList()}
          className="mx-5 -mt-8 flex-row items-center gap-3 rounded-2xl bg-surface px-4 py-4 active:opacity-95"
          style={elevation.raised}
        >
          <View className="h-9 w-9 items-center justify-center rounded-xl bg-primary">
            <Ionicons name="search" size={18} color={colors.onPrimary} />
          </View>
          <Text numberOfLines={1} className="flex-1 text-left text-base text-muted">
            {t('browse.searchPlaceholder')}
          </Text>
          <Ionicons name="options-outline" size={20} color={colors.text2} />
        </Pressable>
      </View>

      <View className="flex-row gap-3 px-5">
        {TILES.map(({ kind, icon }) => (
          <Pressable
            key={kind}
            accessibilityRole="button"
            accessibilityLabel={t(`browse.kind.${kind}`)}
            onPress={() => openList(kind)}
            className="flex-1 gap-3 rounded-2xl border border-border bg-surface p-3 active:bg-surface-2"
            style={elevation.card}
          >
            <View className="h-10 w-10 items-center justify-center rounded-xl bg-primary-soft">
              <Ionicons name={icon} size={20} color={colors.primary} />
            </View>
            <View className="gap-0.5">
              <Text numberOfLines={1} className="text-left text-sm text-text font-bold">
                {t(`browse.kind.${kind}`)}
              </Text>
              <Text numberOfLines={1} className="text-left text-xs text-muted">
                {t(`home.tiles.${kind}`)}
              </Text>
            </View>
          </Pressable>
        ))}
      </View>

      <View className="gap-4">
        <SectionHeader
          title={t('browse.featured')}
          action={{ label: t('browse.seeAll'), onPress: () => openList() }}
        />
        {featured.isPending ? (
          <LoadingView />
        ) : featured.isError ? (
          <ErrorView error={featured.error} onRetry={() => featured.refetch()} />
        ) : featured.data.length === 0 ? (
          <EmptyView message={t('browse.noFeatured')} />
        ) : (
          <FlatList
            horizontal
            data={featured.data}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <PropertyCard property={item} compact />}
            contentContainerClassName="gap-4 px-5 pb-2"
            showsHorizontalScrollIndicator={false}
          />
        )}
      </View>

      {agencies.isError ? (
        <ErrorView error={agencies.error} onRetry={() => agencies.refetch()} />
      ) : agencies.data?.length ? (
        <View className="gap-4">
          <SectionHeader title={t('browse.agencies')} />
          <FlatList
            horizontal
            data={agencies.data}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <AgencyCard agency={item} />}
            contentContainerClassName="gap-3 px-5 pb-2"
            showsHorizontalScrollIndicator={false}
          />
        </View>
      ) : null}

      {testimonials.data?.length ? (
        <View className="gap-4">
          <SectionHeader title={t('browse.testimonials')} />
          <FlatList
            horizontal
            data={testimonials.data.slice(0, 6)}
            keyExtractor={(item) => item._id}
            renderItem={({ item }) => <TestimonialCard testimonial={item} />}
            contentContainerClassName="gap-3 px-5 pb-2"
            showsHorizontalScrollIndicator={false}
          />
        </View>
      ) : null}
    </ScrollView>
  );
}

// No listing count: /agencies/featured sends bare ids, unpublished listings included.
function AgencyCard({ agency }: { agency: Agency }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={agency.name}
      onPress={() => router.push({ pathname: '/agencies/[id]', params: { id: agency._id } })}
      className="w-44 gap-3 rounded-2xl border border-border bg-surface p-4 active:bg-surface-2"
      style={elevation.card}
    >
      {agency.logo?.url ? (
        <Image
          source={{ uri: agency.logo.url }}
          style={{ width: 52, height: 52, borderRadius: 14 }}
          contentFit="cover"
          accessibilityIgnoresInvertColors
        />
      ) : (
        <View className="h-[52px] w-[52px] items-center justify-center rounded-[14px] bg-accent">
          <Text className="text-2xl text-accent-on font-bold">{initial(agency.name)}</Text>
        </View>
      )}
      <Text numberOfLines={2} className="text-left text-base leading-6 text-text font-semibold">
        {agency.name}
      </Text>
    </Pressable>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  const colors = useThemeColors();
  return (
    <View
      className="w-72 justify-between gap-4 rounded-2xl border border-border bg-surface p-5"
      style={elevation.card}
    >
      <View className="gap-2">
        <Ionicons name="chatbox-ellipses" size={22} color={colors.accent} />
        <Text numberOfLines={4} className="text-left text-base leading-7 text-text">
          {testimonial.text}
        </Text>
      </View>
      <View className="flex-row items-center gap-3">
        <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
          <Text className="text-sm text-primary font-bold">{initial(testimonial.name)}</Text>
        </View>
        <View className="flex-1">
          <Text numberOfLines={1} className="text-left text-sm text-text font-semibold">
            {testimonial.name}
          </Text>
          {testimonial.role ? (
            <Text numberOfLines={1} className="text-left text-xs text-muted">
              {testimonial.role}
            </Text>
          ) : null}
        </View>
      </View>
    </View>
  );
}
