import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, useWindowDimensions, View } from 'react-native';

import type { PropertyImage } from '@/api/browseTypes';
import { useThemeColors } from '@/theme/colors';

import { coverFirst } from './format';
import { Text } from '@/components/Text';

export function Gallery({ images: all }: { images: PropertyImage[] }) {
  const images = coverFirst(all);
  const { t } = useTranslation();
  const colors = useThemeColors();
  const { width } = useWindowDimensions();
  const [index, setIndex] = useState(0);
  const height = Math.round((width * 3) / 4);

  if (!images.length) {
    return <View style={{ width, height, backgroundColor: colors.field }} />;
  }

  return (
    <View>
      <FlatList
        horizontal
        pagingEnabled
        data={images}
        keyExtractor={(image, i) => image._id ?? `${i}`}
        showsHorizontalScrollIndicator={false}
        onMomentumScrollEnd={(event) =>
          setIndex(Math.round(Math.abs(event.nativeEvent.contentOffset.x) / width))
        }
        renderItem={({ item, index: i }) => (
          <Image
            source={{ uri: item.url }}
            style={{ width, height, backgroundColor: colors.field }}
            contentFit="cover"
            transition={150}
            accessibilityLabel={t('property.photo', { index: i + 1, total: images.length })}
          />
        )}
      />
      {/* At the top: the summary card on the listing page overlaps the bottom of the photo. */}
      {images.length > 1 ? (
        <View className="absolute start-4 top-4 rounded-full bg-black/60 px-3 py-1">
          <Text className="text-xs text-white font-semibold">
            {index + 1} / {images.length}
          </Text>
        </View>
      ) : null}
      {images.length > 1 && images.length <= 10 ? (
        <View
          pointerEvents="none"
          className="absolute inset-x-0 bottom-12 flex-row justify-center gap-1.5"
        >
          {images.map((image, i) => (
            <View
              key={image._id ?? i}
              className={`h-1.5 rounded-full ${i === index ? 'w-5 bg-white' : 'w-1.5 bg-white/60'}`}
            />
          ))}
        </View>
      ) : null}
    </View>
  );
}
