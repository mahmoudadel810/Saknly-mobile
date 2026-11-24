import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { Text } from '@/components/Text';
import { FavoriteButton } from '@/features/account/FavoriteButton';
import { useThemeColors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';

import { categoryLabel, coverImage, formatPrice, placeLabel } from './format';

interface PropertyCardProps {
  property: Property;
  /** Fixed width for horizontal rails; full width otherwise. */
  compact?: boolean;
}

export function PropertyCard({ property, compact = false }: PropertyCardProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const image = coverImage(property);

  return (
    <View className={compact ? 'w-72' : 'w-full'}>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={`${property.title}, ${formatPrice(property)}`}
        onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property._id } })}
        className="overflow-hidden rounded-3xl border border-border bg-surface active:opacity-95"
        style={elevation.card}
      >
        <View>
          <Image
            source={image ? { uri: image } : undefined}
            style={{ width: '100%', aspectRatio: 4 / 3, backgroundColor: colors.field }}
            contentFit="cover"
            transition={200}
            accessibilityIgnoresInvertColors
          />
          <View className="absolute start-3 top-3 rounded-full bg-surface px-3 py-1">
            <Text className="text-xs text-primary font-semibold">{categoryLabel(property)}</Text>
          </View>
          {/* The price sits on the photo: the first thing a renter or buyer looks for. */}
          <View className="absolute bottom-3 start-3 rounded-xl bg-black/60 px-3 py-1.5">
            <Text className="text-base text-white font-bold">{formatPrice(property)}</Text>
          </View>
        </View>
        <View className="gap-2 px-4 pb-4 pt-3">
          <Text
            numberOfLines={compact ? 1 : 2}
            className="text-left text-base leading-6 text-text font-semibold"
          >
            {property.title}
          </Text>
          <View className="flex-row items-center gap-1">
            <Ionicons name="location" size={14} color={colors.accent} />
            <Text numberOfLines={1} className="flex-1 text-left text-sm text-muted">
              {placeLabel(property)}
            </Text>
          </View>
          <View className="flex-row flex-wrap gap-2 pt-1">
            <Fact icon="bed-outline" text={t('property.bedrooms', { count: property.bedrooms })} />
            <Fact
              icon="water-outline"
              text={t('property.bathrooms', { count: property.bathrooms })}
            />
            <Fact icon="resize-outline" text={t('property.area', { count: property.area })} />
          </View>
        </View>
      </Pressable>
      {/* A sibling, not a child: inside the card it would be unreachable for screen readers. */}
      <View className="absolute end-3 top-3">
        <FavoriteButton property={property} overPhoto />
      </View>
    </View>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1.5 rounded-lg bg-field px-2.5 py-1">
      <Ionicons name={icon} size={14} color={colors.text2} />
      <Text className="text-xs text-text-2 font-medium">{text}</Text>
    </View>
  );
}
