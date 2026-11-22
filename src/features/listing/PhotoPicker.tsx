import { Ionicons } from '@expo/vector-icons';
import { Image } from 'expo-image';
import * as ImagePicker from 'expo-image-picker';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ActivityIndicator, Pressable, Text, View } from 'react-native';
import Toast from 'react-native-toast-message';

import type { PropertyImage } from '@/api/browseTypes';
import { Button } from '@/components/Button';
import { useThemeColors } from '@/theme/colors';

import {
  fitPhotos,
  type LocalPhoto,
  MAX_PHOTOS,
  MAX_TOTAL_BYTES,
  preparePhoto,
  totalBytes,
} from './photos';

const mb = (bytes: number) => `${(bytes / (1024 * 1024)).toFixed(1)} MB`;

interface PhotoPickerProps {
  /** Photos already on the listing (edit only). */
  existing: PropertyImage[];
  onRemoveExisting: (image: PropertyImage) => void;
  photos: LocalPhoto[];
  onChange: (photos: LocalPhoto[]) => void;
  error?: string;
}

export function PhotoPicker({
  existing,
  onRemoveExisting,
  photos,
  onChange,
  error,
}: PhotoPickerProps) {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const [preparing, setPreparing] = useState(false);
  const count = existing.length + photos.length;
  const full = count >= MAX_PHOTOS;

  const addAssets = async (assets: ImagePicker.ImagePickerAsset[]) => {
    setPreparing(true);
    try {
      const prepared: LocalPhoto[] = [];
      // One at a time: decoding several full-size photos at once can run a phone out of memory.
      for (const asset of assets) prepared.push(await preparePhoto(asset));
      const { kept, skipped } = fitPhotos(photos, prepared, existing.length);
      onChange([...photos, ...kept]);
      if (skipped) {
        Toast.show({
          type: 'info',
          text1: t('listing.photosSkipped', {
            count: skipped,
            max: MAX_PHOTOS,
            limit: mb(MAX_TOTAL_BYTES),
          }),
        });
      }
    } finally {
      setPreparing(false);
    }
  };

  const pick = async () => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted)
      return Toast.show({ type: 'error', text1: t('listing.photosPermission') });
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsMultipleSelection: true,
      selectionLimit: MAX_PHOTOS - count,
      quality: 1,
    });
    if (!result.canceled) await addAssets(result.assets);
  };

  const capture = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted)
      return Toast.show({ type: 'error', text1: t('listing.cameraPermission') });
    const result = await ImagePicker.launchCameraAsync({ mediaTypes: ['images'], quality: 1 });
    if (!result.canceled) await addAssets(result.assets);
  };

  // The cover is shown first: on an edit that is the first kept photo (sent with isMain),
  // and a new upload becomes the cover only when no old photo is kept.
  const tiles = [
    ...existing.map((image) => ({
      key: image.publicId,
      uri: image.url,
      remove: () => onRemoveExisting(image),
    })),
    ...photos.map((photo) => ({
      key: photo.uri,
      uri: photo.uri,
      remove: () => onChange(photos.filter((p) => p !== photo)),
    })),
  ];

  return (
    <View className="gap-3">
      <View className="flex-row flex-wrap gap-2">
        {tiles.map((tile, i) => (
          <View key={tile.key} className="h-24 w-24 overflow-hidden rounded-xl bg-field">
            <Image
              source={{ uri: tile.uri }}
              style={{ width: '100%', height: '100%' }}
              contentFit="cover"
            />
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={t('listing.removePhoto', { index: i + 1 })}
              onPress={tile.remove}
              hitSlop={6}
              className="absolute end-1 top-1 h-7 w-7 items-center justify-center rounded-full bg-black/60"
            >
              <Ionicons name="close" size={16} color="#FFFFFF" />
            </Pressable>
          </View>
        ))}
        {preparing ? (
          <View className="h-24 w-24 items-center justify-center rounded-xl border border-border">
            <ActivityIndicator color={colors.primary} accessibilityLabel={t('listing.preparing')} />
          </View>
        ) : null}
      </View>
      <Text className="text-sm text-muted">
        {t('listing.photosHint', {
          max: MAX_PHOTOS,
          size: mb(totalBytes(photos)),
          limit: mb(MAX_TOTAL_BYTES),
        })}
      </Text>
      {error ? (
        <Text className="text-sm text-error" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      <View className="flex-row gap-3">
        <View className="flex-1">
          <Button
            title={t('listing.pickPhotos')}
            variant="secondary"
            onPress={pick}
            disabled={full || preparing}
          />
        </View>
        <View className="flex-1">
          <Button
            title={t('listing.takePhoto')}
            variant="secondary"
            onPress={capture}
            disabled={full || preparing}
          />
        </View>
      </View>
    </View>
  );
}
