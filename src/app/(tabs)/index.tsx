import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, Pressable, RefreshControl, ScrollView, Text, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import type { Agency, Testimonial } from '@/api/browseTypes';
import { useAuth } from '@/auth/AuthProvider';
import { Chip } from '@/components/Chip';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import type { ListingKind } from '@/features/properties/filters';
import { PropertyCard } from '@/features/properties/PropertyCard';
import {
  useFeaturedAgencies,
  useFeaturedProperties,
  useTestimonials,
} from '@/features/properties/queries';
import { useThemeColors } from '@/theme/colors';

const KINDS: ListingKind[] = ['sale', 'rent', 'student'];

// Always pass the kind, so "see all" after "for rent" shows everything again.
const openList = (kind: ListingKind = 'all') =>
  router.navigate({ pathname: '/properties', params: { kind } });

export default function HomeScreen() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { status, user } = useAuth();
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
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <ScrollView
        contentContainerClassName="gap-6 pb-8"
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={refresh} tintColor={colors.primary} />
        }
      >
        <View className="gap-3 px-5 pt-4">
          <Text className="text-3xl font-bold text-primary">{t('common.appName')}</Text>
          <Text className="text-xl font-semibold text-text">
            {status === 'signedIn' && user
              ? t('home.welcomeUser', { name: user.userName })
              : t('home.welcome')}
          </Text>
          <Pressable
            accessibilityRole="search"
            accessibilityLabel={t('browse.searchPlaceholder')}
            onPress={() => openList()}
            className="flex-row items-center gap-2 rounded-xl border border-border bg-field px-4 py-3"
          >
            <Ionicons name="search" size={18} color={colors.muted} />
            <Text className="text-base text-muted">{t('browse.searchPlaceholder')}</Text>
          </Pressable>
          <View className="flex-row flex-wrap gap-2">
            {KINDS.map((kind) => (
              <Chip key={kind} label={t(`browse.kind.${kind}`)} onPress={() => openList(kind)} />
            ))}
          </View>
        </View>

        <View className="gap-3">
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
              contentContainerClassName="gap-3 px-5"
              showsHorizontalScrollIndicator={false}
            />
          )}
        </View>

        {agencies.isError ? (
          <ErrorView error={agencies.error} onRetry={() => agencies.refetch()} />
        ) : agencies.data?.length ? (
          <View className="gap-3">
            <SectionHeader title={t('browse.agencies')} />
            <FlatList
              horizontal
              data={agencies.data}
              keyExtractor={(item) => item._id}
              renderItem={({ item }) => <AgencyCard agency={item} />}
              contentContainerClassName="gap-3 px-5"
              showsHorizontalScrollIndicator={false}
            />
          </View>
        ) : null}

        {testimonials.data?.length ? (
          <View className="gap-3">
            <SectionHeader title={t('browse.testimonials')} />
            <View className="gap-3 px-5">
              {testimonials.data.slice(0, 4).map((item) => (
                <TestimonialCard key={item._id} testimonial={item} />
              ))}
            </View>
          </View>
        ) : null}
      </ScrollView>
    </SafeAreaView>
  );
}

function AgencyCard({ agency }: { agency: Agency }) {
  return (
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={agency.name}
      onPress={() => router.push({ pathname: '/agencies/[id]', params: { id: agency._id } })}
      className="w-40 items-center gap-2 rounded-2xl border border-border bg-surface p-4 active:opacity-90"
    >
      <Image
        source={agency.logo?.url ? { uri: agency.logo.url } : undefined}
        style={{ width: 64, height: 64, borderRadius: 16 }}
        contentFit="contain"
      />
      <Text numberOfLines={2} className="text-center text-sm font-semibold text-text">
        {agency.name}
      </Text>
    </Pressable>
  );
}

function TestimonialCard({ testimonial }: { testimonial: Testimonial }) {
  return (
    <View className="gap-2 rounded-2xl border border-border bg-surface p-4">
      <Text className="text-base leading-6 text-text">“{testimonial.text}”</Text>
      <Text className="text-sm font-semibold text-text-2">
        {testimonial.name}
        {testimonial.role ? ` · ${testimonial.role}` : ''}
      </Text>
    </View>
  );
}
