import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import { router, Stack, useLocalSearchParams } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, ScrollView, View } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import Toast from 'react-native-toast-message';

import type { Property } from '@/api/browseTypes';
import { useAuth } from '@/auth/AuthProvider';
import { useSignInPrompt } from '@/auth/returnTo';
import { Button } from '@/components/Button';
import { SectionHeader } from '@/components/SectionHeader';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { TextField } from '@/components/TextField';
import { FavoriteButton } from '@/features/account/FavoriteButton';
import { useAddComment } from '@/features/account/queries';
import { COMMENT_MAX } from '@/features/account/schemas';
import { useDeleteListing } from '@/features/listing/queries';
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
import { elevation } from '@/theme/elevation';
import { describeError } from '@/utils/errors';
import { openLink } from '@/utils/openLink';
import { Text } from '@/components/Text';

export default function PropertyScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = useProperty(id);
  const colors = useThemeColors();
  const insets = useSafeAreaInsets();

  if (property.isPending) return <LoadingView />;
  if (property.isError) {
    return isAxiosError(property.error) && property.error.response?.status === 404 ? (
      <EmptyView icon="home-outline" message={t('property.notFound')} />
    ) : (
      <ErrorView error={property.error} onRetry={() => property.refetch()} />
    );
  }

  const p = property.data;
  const whatsapp = p.contactInfo?.whatsapp || p.contactInfo?.phone;
  const whatsappLink = whatsapp ? whatsAppUrl(whatsapp) : null;
  const ownerName = typeof p.owner === 'object' ? p.owner?.userName : undefined;
  const isPublic = p.isApproved !== false && p.isActive !== false;

  return (
    <View className="flex-1 bg-bg">
      <ScrollView
        contentContainerClassName="gap-4"
        contentContainerStyle={{ paddingBottom: p.contactInfo ? 120 : 40 }}
      >
        <Stack.Screen
          options={{
            title: p.title,
            // Hearts, inquiries and comments are for published listings (an owner can open a pending one).
            headerRight: isPublic ? () => <FavoriteButton property={p} /> : undefined,
          }}
        />
        <Gallery images={p.images} />

        {/* The summary card overlaps the bottom of the photo. */}
        <View
          className="mx-4 -mt-8 gap-3 rounded-3xl border border-border bg-surface p-5"
          style={elevation.raised}
        >
          <View className="flex-row flex-wrap gap-2">
            <Badge text={categoryLabel(p)} tone="primary" />
            <Badge text={statusLabel(p.status)} />
            {p.isNegotiable ? <Badge text={t('property.negotiable')} tone="accent" /> : null}
          </View>
          <Text className="text-left text-[26px] leading-9 text-primary font-bold">
            {formatPrice(p)}
          </Text>
          <Text
            accessibilityRole="header"
            className="text-left text-xl leading-8 text-text font-bold"
          >
            {p.title}
          </Text>
          <View className="flex-row items-center gap-1.5">
            <Ionicons name="location" size={16} color={colors.accent} />
            <Text className="flex-1 text-left text-base text-text-2">{placeLabel(p)}</Text>
          </View>
          <View className="flex-row gap-2 pt-1">
            <Stat icon="bed-outline" text={t('property.bedrooms', { count: p.bedrooms })} />
            <Stat icon="water-outline" text={t('property.bathrooms', { count: p.bathrooms })} />
            <Stat icon="resize-outline" text={t('property.area', { count: p.area })} />
            <Stat icon="eye-outline" text={t('property.views', { count: p.views })} />
          </View>
        </View>

        <Block title={t('property.description')} icon="document-text-outline">
          <Text className="text-left text-base leading-8 text-text">{p.description}</Text>
          {typeof p.floor === 'number' ? (
            <View className="flex-row items-center gap-2 self-start rounded-xl bg-field px-3 py-2">
              <Ionicons name="layers-outline" size={16} color={colors.text2} />
              <Text className="text-sm text-text-2">
                {t('property.floor')}: {p.floor}
                {p.totalFloors ? ` / ${p.totalFloors}` : ''}
              </Text>
            </View>
          ) : null}
        </Block>

        {p.amenities?.length ? (
          <Block title={t('property.amenities')} icon="sparkles-outline">
            <View className="flex-row flex-wrap gap-2">
              {p.amenities.map((amenity) => (
                <View
                  key={amenity}
                  className="flex-row items-center gap-1.5 rounded-xl bg-field px-3 py-2"
                >
                  <Ionicons name="checkmark-circle" size={16} color={colors.primary} />
                  <Text className="text-sm text-text">{amenity}</Text>
                </View>
              ))}
            </View>
          </Block>
        ) : null}

        <Block title={t('property.location')} icon="map-outline">
          <Text className="text-left text-base leading-7 text-text">{p.location.address}</Text>
          <Button
            title={t('property.openInMaps')}
            icon="navigate-outline"
            variant="secondary"
            onPress={() => openLink(mapsUrl(p))}
          />
        </Block>

        {p.contactInfo ? (
          <Block title={t('property.contact')} icon="person-circle-outline">
            <View className="flex-row items-center gap-3">
              <View className="h-12 w-12 items-center justify-center rounded-2xl bg-accent">
                <Text className="text-lg text-accent-on font-bold">
                  {p.contactInfo.name.trim().charAt(0)}
                </Text>
              </View>
              <View className="flex-1 gap-0.5">
                <Text className="text-left text-base text-text font-semibold">
                  {p.contactInfo.name}
                </Text>
                {ownerName ? (
                  <Text className="text-left text-sm text-muted">
                    {t('property.listedBy', { name: ownerName })}
                  </Text>
                ) : null}
              </View>
            </View>
            {isPublic ? (
              <Button
                title={t('inquiry.open')}
                icon="mail-outline"
                variant="secondary"
                onPress={() => router.push({ pathname: '/inquiry/[id]', params: { id: p._id } })}
              />
            ) : null}
          </Block>
        ) : null}

        {p.agency ? (
          <View className="px-4">
            <Button
              title={t('property.viewAgency')}
              icon="business-outline"
              variant="secondary"
              onPress={() => router.push({ pathname: '/agencies/[id]', params: { id: p.agency! } })}
            />
          </View>
        ) : null}

        <OwnerActions property={p} />

        <Similar id={p._id} />
        <Comments id={p._id} canComment={isPublic} />
      </ScrollView>

      {/* Calling is the main action on a listing, so it stays in reach while scrolling. */}
      {p.contactInfo ? (
        <View
          className="absolute inset-x-0 bottom-0 flex-row gap-3 border-t border-border bg-surface px-4 pt-3"
          style={{ paddingBottom: Math.max(insets.bottom, 12) }}
        >
          <View className="flex-1">
            <Button
              title={t('property.call')}
              icon="call"
              onPress={() => openLink(callUrl(p.contactInfo!.phone))}
            />
          </View>
          {whatsappLink ? (
            <View className="flex-1">
              <Button
                title={t('property.whatsapp')}
                icon="logo-whatsapp"
                variant="secondary"
                onPress={() => openLink(whatsappLink)}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}

/** Edit and delete, for the listing's owner. */
function OwnerActions({ property }: { property: Property }) {
  const { t } = useTranslation();
  const { user } = useAuth();
  const remove = useDeleteListing();
  const ownerId = typeof property.owner === 'object' ? property.owner?._id : property.owner;
  if (!user || !ownerId || ownerId !== user._id) return null;

  const confirmDelete = () =>
    Alert.alert(t('listing.deleteConfirmTitle'), t('listing.deleteConfirmBody'), [
      { text: t('wishlist.cancel'), style: 'cancel' },
      {
        text: t('listing.delete'),
        style: 'destructive',
        onPress: () =>
          remove.mutate(property._id, {
            onSuccess: () => {
              Toast.show({ type: 'success', text1: t('listing.deleted') });
              router.back();
            },
            onError: (error) => Toast.show({ type: 'error', text1: describeError(error) }),
          }),
      },
    ]);

  return (
    <View className="flex-row gap-3 px-4">
      <View className="flex-1">
        <Button
          title={t('listing.edit')}
          icon="create-outline"
          onPress={() =>
            router.push({ pathname: '/listing/edit/[id]', params: { id: property._id } })
          }
        />
      </View>
      <View className="flex-1">
        <Button
          title={t('listing.delete')}
          icon="trash-outline"
          variant="secondary"
          loading={remove.isPending}
          onPress={confirmDelete}
        />
      </View>
    </View>
  );
}

function Similar({ id }: { id: string }) {
  const { t } = useTranslation();
  const similar = useSimilarProperties(id);
  if (!similar.data?.length) return null;
  return (
    <View className="gap-4 pt-2">
      <SectionHeader title={t('property.similar')} />
      <FlatList
        horizontal
        data={similar.data}
        keyExtractor={(item) => item._id}
        renderItem={({ item }) => <PropertyCard property={item} compact />}
        contentContainerClassName="gap-4 px-5 pb-2"
        showsHorizontalScrollIndicator={false}
      />
    </View>
  );
}

function Comments({ id, canComment }: { id: string; canComment: boolean }) {
  const { t } = useTranslation();
  const comments = usePropertyComments(id);
  return (
    <Block title={t('property.comments')} icon="chatbubbles-outline">
      {comments.isPending ? (
        <LoadingView />
      ) : comments.isError ? (
        <ErrorView error={comments.error} onRetry={() => comments.refetch()} />
      ) : (
        <>
          {canComment ? <CommentComposer propertyId={id} /> : null}
          {comments.data.length === 0 ? (
            <Text className="text-sm text-muted">{t('property.noComments')}</Text>
          ) : (
            comments.data.map((comment) => (
              <View key={comment._id} className="flex-row gap-3 rounded-2xl bg-field p-3">
                <View className="h-9 w-9 items-center justify-center rounded-full bg-primary-soft">
                  <Text className="text-sm text-primary font-bold">
                    {(comment.user?.userName ?? '?').charAt(0).toUpperCase()}
                  </Text>
                </View>
                <View className="flex-1 gap-0.5">
                  <Text className="text-left text-sm text-text font-semibold">
                    {comment.user?.userName ?? '—'}
                  </Text>
                  <Text className="text-left text-base leading-7 text-text">{comment.text}</Text>
                </View>
              </View>
            ))
          )}
        </>
      )}
    </Block>
  );
}

function CommentComposer({ propertyId }: { propertyId: string }) {
  const { t } = useTranslation();
  const { status } = useAuth();
  const [text, setText] = useState('');
  const add = useAddComment(propertyId);
  const promptSignIn = useSignInPrompt();

  if (status !== 'signedIn') {
    return (
      <Button
        title={t('comment.signInToComment')}
        icon="log-in-outline"
        variant="secondary"
        onPress={promptSignIn}
      />
    );
  }

  return (
    <View className="gap-2">
      <TextField
        label={t('comment.placeholder')}
        value={text}
        onChangeText={setText}
        multiline
        maxLength={COMMENT_MAX}
        error={add.isError ? describeError(add.error) : undefined}
      />
      <Button
        title={t('comment.send')}
        icon="send"
        disabled={!text.trim()}
        loading={add.isPending}
        onPress={() => add.mutate(text.trim(), { onSuccess: () => setText('') })}
      />
    </View>
  );
}

function Block({
  title,
  icon,
  children,
}: {
  title: string;
  icon: keyof typeof Ionicons.glyphMap;
  children: React.ReactNode;
}) {
  const colors = useThemeColors();
  return (
    <View
      className="mx-4 gap-4 rounded-3xl border border-border bg-surface p-5"
      style={elevation.card}
    >
      <View className="flex-row items-center gap-2">
        <Ionicons name={icon} size={20} color={colors.primary} />
        <Text accessibilityRole="header" className="text-left text-lg text-text font-bold">
          {title}
        </Text>
      </View>
      {children}
    </View>
  );
}

function Badge({
  text,
  tone = 'neutral',
}: {
  text: string;
  tone?: 'primary' | 'accent' | 'neutral';
}) {
  const box = tone === 'primary' ? 'bg-primary' : tone === 'accent' ? 'bg-accent' : 'bg-field';
  const label =
    tone === 'primary' ? 'text-on-primary' : tone === 'accent' ? 'text-accent-on' : 'text-text-2';
  return (
    <View className={`rounded-full px-3 py-1 ${box}`}>
      <Text className={`text-xs font-semibold ${label}`}>{text}</Text>
    </View>
  );
}

/** One fact in the summary card: an icon over a short value. */
function Stat({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-1 items-center gap-1.5 rounded-2xl bg-field px-1 py-3">
      <Ionicons name={icon} size={20} color={colors.primary} />
      <Text numberOfLines={1} className="text-xs text-text font-medium">
        {text}
      </Text>
    </View>
  );
}
