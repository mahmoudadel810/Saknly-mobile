import { Ionicons } from '@expo/vector-icons';
import { isAxiosError } from 'axios';
import * as Location from 'expo-location';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import { geoApi, type Place } from '@/api/geo';
import { Button } from '@/components/Button';
import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { coordinatesUrl } from '@/features/properties/contact';
import { useThemeColors } from '@/theme/colors';
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
  /** The address of the new pin (GeoLink, through the server), to fill in what's still empty. */
  onPlace: (place: Place) => void;
}

/** What went wrong with a /geo call, for the owner. */
const geoError = (error: unknown) => {
  const status = isAxiosError(error) ? error.response?.status : undefined;
  return status === 429 ? 'listing.pin.tooMany' : 'listing.pin.searchFailed';
};

/**
 * The listing's map pin: from the phone's location for an owner standing at the property, or
 * from a search for the address or a landmark (GeoLink, through the server). The web form uses a
 * map for this, which needs a map provider here. "Open in Maps" on the listing page then goes to
 * the pin instead of searching for the address.
 */
export function LocationPin({ latitude, longitude, onChange, onPlace }: LocationPinProps) {
  const { t, i18n } = useTranslation();
  const colors = useThemeColors();
  const [locating, setLocating] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [query, setQuery] = useState('');
  const [searching, setSearching] = useState(false);
  const [results, setResults] = useState<Place[] | null>(null);
  const pinned = latitude !== '' && longitude !== '';
  const busy = locating || searching;

  const search = async () => {
    const text = query.trim();
    if (text.length < 2) return;
    setMessage(null);
    setSearching(true);
    try {
      // Near the current pin first, when there is one.
      const near = pinned
        ? { latitude: Number(latitude), longitude: Number(longitude) }
        : undefined;
      const places = (await geoApi.search(text, i18n.language, near)).filter((place) =>
        inEgypt(place.latitude, place.longitude),
      );
      setResults(places);
      if (!places.length) setMessage(t('listing.pin.noResults'));
    } catch (error) {
      setResults(null);
      setMessage(t(geoError(error)));
    } finally {
      setSearching(false);
    }
  };

  const choose = (place: Place) => {
    onChange(toCoordinate(place.latitude), toCoordinate(place.longitude));
    onPlace(place);
    setResults(null);
    setQuery('');
  };

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
      // The pin is saved; its address is a bonus, so a failure here says nothing.
      geoApi
        .reverse(coords.latitude, coords.longitude, i18n.language)
        .then(onPlace)
        .catch(() => {});
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
        disabled={searching}
      />
      <View className="flex-row items-end gap-2">
        <View className="flex-1">
          <TextField
            label={t('listing.pin.searchLabel')}
            placeholder={t('listing.pin.searchPlaceholder')}
            value={query}
            onChangeText={setQuery}
            onSubmitEditing={search}
            returnKeyType="search"
            maxLength={100}
          />
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('listing.pin.search')}
          accessibilityState={{ disabled: busy || query.trim().length < 2 }}
          disabled={busy || query.trim().length < 2}
          onPress={search}
          className="h-[52px] w-[52px] items-center justify-center rounded-2xl bg-primary active:bg-primary-hover"
        >
          <Ionicons name="search" size={20} color={colors.onPrimary} />
        </Pressable>
      </View>
      {searching ? (
        <Text className="text-left text-sm text-muted">{t('listing.pin.searching')}</Text>
      ) : null}
      {results?.length ? (
        <View className="overflow-hidden rounded-2xl border border-border">
          {results.map((place, i) => (
            <Pressable
              key={`${place.latitude},${place.longitude},${i}`}
              accessibilityRole="button"
              accessibilityLabel={`${place.name}، ${place.address}`}
              onPress={() => choose(place)}
              className={`flex-row items-center gap-3 px-3 py-3 active:bg-surface-2 ${
                i ? 'border-t border-border' : ''
              }`}
            >
              <Ionicons name="location-outline" size={18} color={colors.primary} />
              <View className="flex-1 gap-0.5">
                <Text className="text-left text-base text-text font-medium">{place.name}</Text>
                <Text numberOfLines={2} className="text-left text-sm text-text-2">
                  {place.address}
                </Text>
              </View>
            </Pressable>
          ))}
        </View>
      ) : null}
      {pinned ? (
        <View className="flex-row gap-3">
          <View className="flex-1">
            <Button
              title={t('property.openInMaps')}
              variant="link"
              onPress={() => openLink(coordinatesUrl(Number(latitude), Number(longitude)))}
            />
          </View>
          <View className="flex-1">
            {/* Not while locating: the fix arriving afterwards would put the pin back. */}
            <Button
              title={t('listing.pin.remove')}
              variant="link"
              onPress={() => onChange('', '')}
              disabled={busy}
            />
          </View>
        </View>
      ) : null}
    </View>
  );
}
