import * as Location from 'expo-location';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { coordinatesUrl } from '@/features/properties/contact';
import { openLink } from '@/utils/openLink';

import { inEgypt, LOCATE_TIMEOUT_MS, MAX_ERROR_METRES, toCoordinate } from './pin';

/** The promise, or a rejection once the wait is over; the timer stops when it settles. */
const withTimeout = <T,>(promise: Promise<T>) =>
  new Promise<T>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error('location timeout')), LOCATE_TIMEOUT_MS);
    promise.then(
      (value) => {
        clearTimeout(timer);
        resolve(value);
      },
      (error) => {
        clearTimeout(timer);
        reject(error);
      },
    );
  });

interface LocationPinProps {
  latitude: string;
  longitude: string;
  onChange: (latitude: string, longitude: string) => void;
  /** False on an edit of a listing that already had a pin: the server can't clear one. */
  canRemove: boolean;
}

/**
 * The listing's map pin from the phone's location, for an owner standing at the property; the
 * web form uses a map for this, which needs a Google Maps key here. "Open in Maps" on the
 * listing page then goes to the pin instead of searching for the address.
 */
export function LocationPin({ latitude, longitude, onChange, canRemove }: LocationPinProps) {
  const { t } = useTranslation();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const pinned = latitude !== '' && longitude !== '';

  const locate = async () => {
    setMessage(null);
    setLocating(true);
    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (!permission.granted) {
        setMessage(t('listing.pin.permission'));
        return;
      }
      // "Approximate location" (Android) or Precise Location off (iOS) is kilometres out.
      if (permission.android?.accuracy === 'coarse' || permission.ios?.accuracy === 'reduced') {
        setMessage(t('listing.pin.approximate'));
        return;
      }
      // GPS, once: Balanced is about 100 m, a block away. A fix that never comes times out.
      const { coords } = await withTimeout(
        Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
      );
      if (coords.accuracy === null || coords.accuracy > MAX_ERROR_METRES) {
        setMessage(t('listing.pin.imprecise'));
        return;
      }
      if (!inEgypt(coords.latitude, coords.longitude)) {
        setMessage(t('listing.pin.outsideEgypt'));
        return;
      }
      onChange(toCoordinate(coords.latitude), toCoordinate(coords.longitude));
    } catch {
      // Location services off, or no fix in time.
      setMessage(t('listing.pin.failed'));
    } finally {
      setLocating(false);
    }
  };

  return (
    <View className="gap-2">
      <Text className="text-left text-sm text-text-2 font-medium">{t('listing.pin.title')}</Text>
      <Text className="text-left text-sm leading-6 text-muted">
        {pinned ? t('listing.pin.saved') : t('listing.pin.hint')}
      </Text>
      {message ? (
        <Text className="text-left text-sm text-error" accessibilityLiveRegion="polite">
          {message}
        </Text>
      ) : null}
      <Button
        title={pinned ? t('listing.pin.update') : t('listing.pin.use')}
        icon="locate-outline"
        variant="secondary"
        onPress={locate}
        loading={locating}
      />
      {pinned ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title={t('property.openInMaps')}
              variant="link"
              onPress={() => openLink(coordinatesUrl(Number(latitude), Number(longitude)))}
            />
          </View>
          {canRemove ? (
            <View className="flex-1">
              {/* Not while locating: the fix arriving afterwards would put the pin back. */}
              <Button
                title={t('listing.pin.remove')}
                variant="link"
                onPress={() => onChange('', '')}
                disabled={locating}
              />
            </View>
          ) : null}
        </View>
      ) : null}
    </View>
  );
}
