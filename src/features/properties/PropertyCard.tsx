import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import type { Property } from '@/api/browseTypes';
import { useThemeColors } from '@/theme/colors';

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
    <Pressable
      accessibilityRole="link"
      accessibilityLabel={`${property.title}, ${formatPrice(property)}`}
      onPress={() => router.push({ pathname: '/properties/[id]', params: { id: property._id } })}
      className={`overflow-hidden rounded-2xl border border-border bg-surface active:opacity-90 ${
        compact ? 'w-64' : 'w-full'
      }`}
    >
      <View>
        <Image
          source={image ? { uri: image } : undefined}
          style={{ width: '100%', aspectRatio: 16 / 10, backgroundColor: colors.field }}
          contentFit="cover"
          transition={150}
          accessibilityIgnoresInvertColors
        />
        <View className="absolute start-3 top-3 rounded-full bg-primary px-3 py-1">
          <Text className="text-xs font-semibold text-on-primary">{categoryLabel(property)}</Text>
        </View>
      </View>
      <View className="gap-1.5 p-3">
        <Text className="text-lg font-bold text-primary">{formatPrice(property)}</Text>
        <Text numberOfLines={1} className="text-base font-semibold text-text">
          {property.title}
        </Text>
        <View className="flex-row items-center gap-1">
          <Ionicons name="location-outline" size={14} color={colors.muted} />
          <Text numberOfLines={1} className="flex-1 text-sm text-muted">
            {placeLabel(property)}
          </Text>
        </View>
        <View className="flex-row gap-4 pt-1">
          <Fact icon="bed-outline" text={t('property.bedrooms', { count: property.bedrooms })} />
          <Fact
            icon="water-outline"
            text={t('property.bathrooms', { count: property.bathrooms })}
          />
          <Fact icon="resize-outline" text={t('property.area', { count: property.area })} />
        </View>
      </View>
    </Pressable>
  );
}

function Fact({ icon, text }: { icon: keyof typeof Ionicons.glyphMap; text: string }) {
  const colors = useThemeColors();
  return (
    <View className="flex-row items-center gap-1">
      <Ionicons name={icon} size={14} color={colors.text2} />
      <Text className="text-sm text-text-2">{text}</Text>
    </View>
  );
}
