import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { FlatList, ScrollView, Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { callUrl, mapsUrl, whatsAppUrl } from '@/features/properties/contact';
import { categoryLabel, formatPrice, placeLabel, statusLabel } from '@/features/properties/format';
import { Gallery } from '@/features/properties/Gallery';
import { PropertyCard } from '@/features/properties/PropertyCard';
import {
  useProperty,
  usePropertyComments,
  useSimilarProperties,
} from '@/features/properties/queries';
import { useThemeColors } from '@/theme/colors';
import { openLink } from '@/utils/openLink';

export default function PropertyScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = useProperty(id);

  if (property.isPending) return <LoadingView />;
  if (property.isError) {
    return isAxiosError(property.error) && property.error.response?.status === 404 ? (
      <EmptyView message={t('property.notFound')} />
    ) : (
      <ErrorView error={property.error} onRetry={() => property.refetch()} />
    );
  }

  const p = property.data;
  const whatsapp = p.contactInfo?.whatsapp || p.contactInfo?.phone;
  const whatsappLink = whatsapp ? whatsAppUrl(whatsapp) : null;
  const ownerName = typeof p.owner === 'object' ? p.owner?.userName : undefined;

  return (
    <ScrollView contentContainerClassName="gap-6 pb-10">
      <Stack.Screen options={{ title: p.title }} />
      <Gallery images={p.images} />

      <View className="gap-2 px-5">
        <View className="flex-row flex-wrap gap-2">
          <Badge text={categoryLabel(p)} />
          <Badge text={statusLabel(p.status)} />
          {p.isNegotiable ? <Badge text={t('property.negotiable')} /> : null}
        </View>
        <Text className="text-2xl font-bold text-primary">{formatPrice(p)}</Text>
        <Text accessibilityRole="header" className="text-xl font-bold text-text">
          {p.title}
        </Text>
        <Text className="text-base text-text-2">{placeLabel(p)}</Text>
        <View className="flex-row flex-wrap gap-4 pt-1">
          <Fact icon="bed-outline" text={t('property.bedrooms', { count: p.bedrooms })} />
          <Fact icon="water-outline" text={t('property.bathrooms', { count: p.bathrooms })} />
          <Fact icon="resize-outline" text={t('property.area', { count: p.area })} />
          <Fact icon="eye-outline" text={t('property.views', { count: p.views })} />
        </View>
      </View>

      <Block title={t('property.description')}>
        <Text className="text-base leading-7 text-text">{p.description}</Text>
        {typeof p.floor === 'number' ? (
          <Text className="text-sm text-text-2">
            {t('property.floor')}: {p.floor}
            {p.totalFloors ? ` / ${p.totalFloors}` : ''}
          </Text>
        ) : null}
      </Block>

      {p.amenities?.length ? (
        <Block title={t('property.amenities')}>
          <View className="flex-row flex-wrap gap-2">
            {p.amenities.map((amenity) => (
              <Badge key={amenity} text={amenity} />
            ))}
          </View>
        </Block>
      ) : null}

      <Block title={t('property.location')}>
        <Text className="text-base text-text">{p.location.address}</Text>
        <Button
          title={t('property.openInMaps')}
          variant="secondary"
          onPress={() => openLink(mapsUrl(p))}
        />
      </Block>

      {p.contactInfo ? (
        <Block title={t('property.contact')}>
          <Text className="text-base text-text">{p.contactInfo.name}</Text>
          {ownerName ? (
            <Text className="text-sm text-muted">
              {t('property.listedBy', { name: ownerName })}
            </Text>
          ) : null}
          <View className="flex-row gap-3">
            <View className="flex-1">
              <Button
                title={t('property.call')}
                onPress={() => openLink(callUrl(p.contactInfo!.phone))}
              />
            </View>
            {whatsappLink ? (
              <View className="flex-1">
                <Button
                  title={t('property.whatsapp')}
                  variant="secondary"
                  onPress={() => openLink(whatsappLink)}
                />
              </View>
            ) : null}
          </View>
        </Block>
      ) : null}

      {p.agency ? (
        <View className="px-5">
          <Button
            title={t('property.viewAgency')}
            variant="secondary"
            onPress={() => router.push({ pathname: '/agencies/[id]', params: { id: p.agency! } })}
          />
        </View>
      ) : null}

      <Similar id={p._id} />
      <Comments id={p._id} />
    </ScrollView>
  );
}

function Similar({ id }: { id: string }) {
  const { t } = useTranslation();
  const similar = useSimilarProperties(id);
  if (!similar.data?.length) return null;
  return (
    <View className="gap-3">
      <SectionHeader title={t('property.similar')} />
      <FlatList
        horizontal
        data={similar.data}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PropertyCard property={item} compact />}
        contentContainerClassName="gap-3 px-5"
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function Comments({ id }: { id: string }) {
  const { t } = useTranslation();
  const comments = usePropertyComments(id);
  if (comments.isPending || comments.isError) return null;
  return (
    <Block title={t('property.comments')}>
      {comments.data.length === 0 ? (
        <Text className="text-sm text-muted">{t('property.noComments')}</Text>
      ) : (
        comments.data.map((comment) => (
          <View key={comment._id} className="gap-1 rounded-xl border border-border bg-surface p-3">
            <Text className="text-sm font-semibold text-text">{comment.user?.userName ?? '—'}</Text>
            <Text className="text-base text-text">{comment.text}</Text>
          </View>
        ))
      )}
    </Block>
  );
}

function Block({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-3 px-5">
      <Text accessibilityRole="header" className="text-lg font-bold text-text">
        {title}
      </Text>
      {children}
    </View>
  );
}

function Badge({ text }: { text: string }) {
  return (
    <View className="rounded-full bg-primary-soft px-3 py-1">
      <Text className="text-xs font-semibold text-primary">{text}</Text>
    </View>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={16} color={colors.text2} />
      <Text className="text-sm text-text-2">{text}</Text>
    </View>
  );
}
