import { Image } from 'expo-image';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, Text, useWindowDimensions, View } from 'react-native';

import type { PropertyImage } from '@/api/browseTypes';
import { useThemeColors } from '@/theme/colors';

export function Gallery({ images }: { images: PropertyImage[] }) {
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
      {images.length > 1 ? (
        <View className="absolute bottom-3 end-3 rounded-full bg-black/60 px-3 py-1">
          <Text className="text-xs font-semibold text-white">
            {index + 1} / {images.length}
          </Text>
        </View>
      ) : null}
    </View>
  );
}
