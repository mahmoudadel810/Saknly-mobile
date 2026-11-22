import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import type { PropertyImage } from '@/api/browseTypes';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { AMENITIES, GOVERNORATES, PROPERTY_TYPE_VALUES } from '@/constants/property';
import { describeError } from '@/utils/errors';

import { citiesOf, isShop, type ListingDraft, listingSchema, toDigits } from './draft';
import { PhotoPicker } from './PhotoPicker';
import type { LocalPhoto } from './photos';

export interface ListingSubmit {
  draft: ListingDraft;
  kept: PropertyImage[];
  removed: PropertyImage[];
  photos: LocalPhoto[];
  onProgress: (fraction: number) => void;
}

interface ListingFormProps {
  initial: ListingDraft;
  existingImages?: PropertyImage[];
  /** Category can't change after creation: it selects the server's schema. */
  editing?: boolean;
  onSubmit: (submit: ListingSubmit) => Promise<void>;
}

const CATEGORIES = ['sale', 'rent', 'student'] as const;
const ROOM_TYPES = ['private', 'shared', 'dormitory'] as const;
const GENDERS = ['male', 'female', 'mixed'] as const;
const STUDENTS_PER_ROOM = ['1', '2', '3', '4'];

type TextKey = {
  [K in keyof ListingDraft]: ListingDraft[K] extends string ? K : never;
}[keyof ListingDraft];

const NUMERIC: TextKey[] = [
  'price',
  'area',
  'bedrooms',
  'bathrooms',
  'floor',
  'totalFloors',
  'leaseDuration',
  'deposit',
  'contactPhone',
  'contactWhatsapp',
];

export function ListingForm({
  initial,
  existingImages = [],
  editing = false,
  onSubmit,
}: ListingFormProps) {
  const { t } = useTranslation();
  const [kept, setKept] = useState(existingImages);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [photoError, setPhotoError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const removed = existingImages.filter((image) => !kept.includes(image));
  const hasPhotos = kept.length + photos.length > 0;

  const form = useFormik({
    initialValues: initial,
    validationSchema: listingSchema,
    onSubmit: async (draft) => {
      setError(null);
      if (!hasPhotos) {
        setPhotoError(t('listing.errors.photos'));
        return;
      }
      setProgress(0);
      try {
        await onSubmit({ draft, kept, removed, photos, onProgress: setProgress });
      } catch (e) {
        setError(describeError(e));
      } finally {
        setProgress(null);
      }
    },
  });

  const submit = async () => {
    if (!hasPhotos) setPhotoError(t('listing.errors.photos'));
    const errors = await form.validateForm();
    if (Object.keys(errors).length || !hasPhotos) {
      form.setTouched(
        Object.fromEntries(Object.keys(form.values).map((key) => [key, true])),
        false,
      );
      setError(t('listing.fixErrors'));
      return;
    }
    form.handleSubmit();
  };

  const v = form.values;
  const set = <K extends keyof ListingDraft>(key: K, value: ListingDraft[K]) =>
    form.setFieldValue(key, value);
  const fieldError = (key: keyof ListingDraft) =>
    (form.touched[key] && (form.errors[key] as string | undefined)) || undefined;
  const field = (key: TextKey, label: string, extra: object = {}) => (
    <TextField
      label={label}
      value={v[key] as string}
      onChangeText={(text) => set(key, NUMERIC.includes(key) ? toDigits(text) : text)}
      onBlur={form.handleBlur(key)}
      error={fieldError(key)}
      keyboardType={NUMERIC.includes(key) ? 'number-pad' : 'default'}
      {...extra}
    />
  );
  const rental = v.category === 'rent' || v.category === 'student';

  return (
    <Screen scroll>
      <FormMessage message={t('listing.reviewNote')} tone="info" />

      <Section title={t('listing.sections.basics')} error={fieldError('category')}>
        <Choices>
          {CATEGORIES.map((category) => (
            <Chip
              key={category}
              label={t(`browse.kind.${category}`)}
              selected={v.category === category}
              onPress={() => !editing && set('category', category)}
            />
          ))}
        </Choices>
        <Label text={t('browse.type')} error={fieldError('type')} />
        <Choices>
          {PROPERTY_TYPE_VALUES.map((type) => (
            <Chip
              key={type}
              label={type}
              selected={v.type === type}
              onPress={() => set('type', type)}
            />
          ))}
        </Choices>
        {field('title', t('listing.title'), { maxLength: 70 })}
        {field('description', t('listing.description'), {
          multiline: true,
          maxLength: 400,
          textAlignVertical: 'top',
          style: { minHeight: 110 },
        })}
      </Section>

      <Section title={t('listing.sections.details')}>
        {field('price', t('listing.price'))}
        <Chip
          label={t('listing.negotiable')}
          selected={v.isNegotiable}
          onPress={() => set('isNegotiable', !v.isNegotiable)}
        />
        {field('area', t('listing.area'))}
        <View className="flex-row gap-3">
          {isShop(v.type) ? null : (
            <View className="flex-1">{field('bedrooms', t('listing.bedrooms'))}</View>
          )}
          <View className="flex-1">{field('bathrooms', t('listing.bathrooms'))}</View>
        </View>
        <View className="flex-row gap-3">
          <View className="flex-1">{field('floor', t('listing.floor'))}</View>
          <View className="flex-1">{field('totalFloors', t('listing.totalFloors'))}</View>
        </View>
        <Label text={t('property.amenities')} />
        <Choices>
          {AMENITIES.map((amenity) => (
            <Chip
              key={amenity}
              label={amenity}
              selected={v.amenities.includes(amenity)}
              onPress={() =>
                set(
                  'amenities',
                  v.amenities.includes(amenity)
                    ? v.amenities.filter((a) => a !== amenity)
                    : [...v.amenities, amenity],
                )
              }
            />
          ))}
        </Choices>
      </Section>

      {rental ? (
        <Section title={t('listing.sections.rental')}>
          {field('leaseDuration', t('listing.leaseDuration'))}
          {field('deposit', t('listing.deposit'))}
        </Section>
      ) : null}

      {v.category === 'student' ? (
        <Section title={t('listing.sections.student')}>
          <Label text={t('listing.roomType')} error={fieldError('roomType')} />
          <Choices>
            {ROOM_TYPES.map((room) => (
              <Chip
                key={room}
                label={t(`listing.roomTypes.${room}`)}
                selected={v.roomType === room}
                onPress={() => set('roomType', room)}
              />
            ))}
          </Choices>
          <Label text={t('listing.studentsPerRoom')} error={fieldError('studentsPerRoom')} />
          <Choices>
            {STUDENTS_PER_ROOM.map((n) => (
              <Chip
                key={n}
                label={n}
                selected={v.studentsPerRoom === n}
                onPress={() => set('studentsPerRoom', n)}
              />
            ))}
          </Choices>
          <Label text={t('listing.genderPolicy')} error={fieldError('genderPolicy')} />
          <Choices>
            {GENDERS.map((gender) => (
              <Chip
                key={gender}
                label={t(`listing.genders.${gender}`)}
                selected={v.genderPolicy === gender}
                onPress={() => set('genderPolicy', gender)}
              />
            ))}
          </Choices>
        </Section>
      ) : null}

      <Section title={t('listing.sections.place')}>
        <Label text={t('browse.governorate')} error={fieldError('governorate')} />
        <Choices>
          {GOVERNORATES.map((governorate) => (
            <Chip
              key={governorate}
              label={governorate}
              selected={v.governorate === governorate}
              onPress={() => {
                set('governorate', governorate);
                if (!citiesOf(governorate).includes(v.city)) set('city', '');
              }}
            />
          ))}
        </Choices>
        {v.governorate ? (
          <>
            <Label text={t('browse.city')} error={fieldError('city')} />
            <Choices>
              {citiesOf(v.governorate).map((city) => (
                <Chip
                  key={city}
                  label={city}
                  selected={v.city === city}
                  onPress={() => set('city', city)}
                />
              ))}
            </Choices>
          </>
        ) : null}
        {field('district', t('listing.district'), { maxLength: 50 })}
        {field('address', t('listing.address'), { maxLength: 300 })}
      </Section>

      <Section title={t('listing.sections.photos')}>
        <PhotoPicker
          existing={kept}
          onRemoveExisting={(image) => setKept(kept.filter((k) => k !== image))}
          photos={photos}
          onChange={(next) => {
            setPhotos(next);
            if (next.length + kept.length) setPhotoError(undefined);
          }}
          error={photoError}
        />
      </Section>

      <Section title={t('listing.sections.contact')}>
        {field('contactName', t('listing.contactName'), { maxLength: 25, autoComplete: 'name' })}
        {field('contactPhone', t('listing.contactPhone'), {
          keyboardType: 'phone-pad',
          maxLength: 11,
        })}
        {field('contactWhatsapp', t('listing.contactWhatsapp'), {
          keyboardType: 'phone-pad',
          maxLength: 11,
        })}
        {field('contactEmail', t('listing.contactEmail'), {
          autoCapitalize: 'none',
          keyboardType: 'email-address',
        })}
      </Section>

      <FormMessage message={error} />
      <Button
        title={
          progress === null
            ? t(editing ? 'listing.submitEdit' : 'listing.submitNew')
            : t('listing.uploading', { percent: Math.round(progress * 100) })
        }
        onPress={submit}
        loading={form.isSubmitting && progress === null}
        disabled={form.isSubmitting}
      />
    </Screen>
  );
}

function Section({
  title,
  error,
  children,
}: {
  title: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
      <Text accessibilityRole="header" className="text-lg font-bold text-text">
        {title}
      </Text>
      {error ? <Text className="text-sm text-error">{error}</Text> : null}
      {children}
    </View>
  );
}

function Label({ text, error }: { text: string; error?: string }) {
  return (
    <View className="gap-0.5">
      <Text className="text-sm font-medium text-text-2">{text}</Text>
      {error ? <Text className="text-sm text-error">{error}</Text> : null}
    </View>
  );
}

function Choices({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-2">{children}</View>;
}
