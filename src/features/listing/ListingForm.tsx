import { Ionicons } from '@expo/vector-icons';
import { useFormik } from 'formik';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, View } from 'react-native';

import type { PropertyImage } from '@/api/browseTypes';
import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { FormMessage } from '@/components/FormMessage';
import { Screen } from '@/components/Screen';
import { TextField } from '@/components/TextField';
import { AMENITIES, GOVERNORATES, PROPERTY_TYPE_VALUES } from '@/constants/property';
import { describeError } from '@/utils/errors';

import { Text } from '@/components/Text';
import { useThemeColors } from '@/theme/colors';

import {
  citiesOf,
  isShop,
  LIMITS,
  type ListingDraft,
  listingSchema,
  MAX_UNIVERSITIES,
  toDecimal,
  toDigits,
} from './draft';
import { clearedFields, removedImages } from './formData';
import { LocationPin } from './LocationPin';
import { MonthPicker, yearsFrom } from './MonthPicker';
import { PhotoPicker } from './PhotoPicker';
import type { LocalPhoto } from './photos';

export interface ListingSubmit {
  draft: ListingDraft;
  kept: PropertyImage[];
  removed: PropertyImage[];
  photos: LocalPhoto[];
  /** The cover is the first new photo, not the first kept one (edit only). */
  coverIsNew: boolean;
  /** `clear[]` fields for what the owner emptied (edit only). */
  clear: [string, string][];
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
const OWNERSHIP = ['firstOwner', 'resale'] as const;
const CONDITIONS = ['ready', 'underConstruction'] as const;
const PAYMENTS = ['cash', 'installment', 'cashOrInstallment'] as const;
const SEMESTERS = ['fall', 'spring', 'summer', 'academic-year', 'full-year'] as const;
const THIS_YEAR = new Date().getFullYear();
// Delivery can be years away on an off-plan sale; a rental is available soon.
const DELIVERY_YEARS = yearsFrom(THIS_YEAR, 8);
const AVAILABLE_YEARS = yearsFrom(THIS_YEAR, 2);

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
  'downPayment',
  'installmentYears',
  'minInstallment',
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
  const colors = useThemeColors();
  const [kept, setKept] = useState(existingImages);
  const [photos, setPhotos] = useState<LocalPhoto[]>([]);
  const [coverNew, setCoverNew] = useState(false);
  // With no old photo kept, the first new one is the cover whatever was picked before.
  const coverIsNew = photos.length > 0 && (coverNew || kept.length === 0);
  const [photoError, setPhotoError] = useState<string>();
  const [error, setError] = useState<string | null>(null);
  const [progress, setProgress] = useState<number | null>(null);

  const removed = removedImages(existingImages, kept);
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
        const clear = editing ? clearedFields(initial, draft) : [];
        await onSubmit({
          draft,
          kept,
          removed,
          photos,
          coverIsNew,
          clear,
          onProgress: setProgress,
        });
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
  const installments = v.paymentMethod !== 'cash';
  const multiline = (max: number) => ({
    multiline: true,
    maxLength: max,
    textAlignVertical: 'top',
    style: { minHeight: 80 },
  });

  const universityError = (index: number, key: 'name' | 'distanceInKm') => {
    const errors = form.errors.universities as { [k: string]: string }[] | string | undefined;
    return form.touched.universities && typeof errors === 'object'
      ? errors[index]?.[key]
      : undefined;
  };
  const setUniversity = (index: number, key: 'name' | 'distanceInKm', value: string) =>
    set(
      'universities',
      v.universities.map((u, i) => (i === index ? { ...u, [key]: value } : u)),
    );

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
              onPress={() => {
                if (editing) return;
                set('category', category);
                // As on the web: student rooms usually include the bills, other rentals don't.
                set('utilitiesIncluded', category === 'student');
              }}
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
          ...multiline(LIMITS.description),
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

      {v.category === 'sale' ? (
        <Section title={t('listing.sections.sale')}>
          <Label text={t('listing.ownershipType')} />
          <Choices>
            {OWNERSHIP.map((value) => (
              <Chip
                key={value}
                label={t(`listing.ownership.${value}`)}
                selected={v.ownershipType === value}
                onPress={() => set('ownershipType', value)}
              />
            ))}
          </Choices>
          <Label text={t('listing.propertyStatus')} />
          <Choices>
            {CONDITIONS.map((value) => (
              <Chip
                key={value}
                label={t(`listing.statuses.${value}`)}
                selected={v.propertyStatus === value}
                onPress={() => set('propertyStatus', value)}
              />
            ))}
          </Choices>
          <Label text={t('listing.paymentMethod')} />
          <Choices>
            {PAYMENTS.map((value) => (
              <Chip
                key={value}
                label={t(`listing.payments.${value}`)}
                selected={v.paymentMethod === value}
                onPress={() => set('paymentMethod', value)}
              />
            ))}
          </Choices>
          {installments ? (
            <>
              {field('downPayment', t('listing.downPayment'))}
              {field('installmentYears', t('listing.installmentYears'), { maxLength: 2 })}
              {field('minInstallment', t('listing.minInstallment'))}
            </>
          ) : null}
          <MonthPicker
            label={t('listing.deliveryDate')}
            value={v.deliveryMonth}
            onChange={(month) => set('deliveryMonth', month)}
            years={DELIVERY_YEARS}
            error={fieldError('deliveryMonth')}
          />
          {field('deliveryTerms', t('listing.deliveryTerms'), multiline(LIMITS.terms))}
        </Section>
      ) : null}

      {rental ? (
        <Section title={t('listing.sections.rental')}>
          {field('leaseDuration', t('listing.leaseDuration'))}
          {field('deposit', t('listing.deposit'))}
          <MonthPicker
            label={t('listing.availableFrom')}
            value={v.availableMonth}
            onChange={(month) => set('availableMonth', month)}
            years={AVAILABLE_YEARS}
            error={fieldError('availableMonth')}
          />
          <Choices>
            <Chip
              label={t('listing.utilitiesIncluded')}
              selected={v.utilitiesIncluded}
              onPress={() => set('utilitiesIncluded', !v.utilitiesIncluded)}
            />
            <Chip
              label={t('listing.pets')}
              selected={v.petsAllowed}
              onPress={() => set('petsAllowed', !v.petsAllowed)}
            />
            <Chip
              label={t('listing.parties')}
              selected={v.partiesAllowed}
              onPress={() => set('partiesAllowed', !v.partiesAllowed)}
            />
          </Choices>
          {field('rulesOther', t('listing.rulesOther'), {
            ...multiline(LIMITS.terms),
            placeholder: t('listing.rulesPlaceholder'),
          })}
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
          <Label text={t('listing.semester')} />
          <Choices>
            {SEMESTERS.map((semester) => (
              <Chip
                key={semester}
                label={t(`listing.semesters.${semester}`)}
                selected={v.semester === semester}
                // Optional, so a second tap clears it.
                onPress={() => set('semester', v.semester === semester ? '' : semester)}
              />
            ))}
          </Choices>
          <Chip
            label={t('listing.academicYearOnly')}
            selected={v.academicYearOnly}
            onPress={() => set('academicYearOnly', !v.academicYearOnly)}
          />
          <Label text={t('listing.universities')} />
          {v.universities.map((university, index) => (
            <View key={index} className="flex-row items-start gap-2">
              <View className="flex-[2]">
                <TextField
                  label={t('listing.universityName', { index: index + 1 })}
                  value={university.name}
                  onChangeText={(text) => setUniversity(index, 'name', text)}
                  maxLength={LIMITS.university}
                  error={universityError(index, 'name')}
                />
              </View>
              <View className="flex-1">
                <TextField
                  label={t('listing.universityDistance')}
                  value={university.distanceInKm}
                  onChangeText={(text) => setUniversity(index, 'distanceInKm', toDecimal(text))}
                  keyboardType="decimal-pad"
                  maxLength={5}
                  error={universityError(index, 'distanceInKm')}
                />
              </View>
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t('listing.removeUniversity', { index: index + 1 })}
                onPress={() =>
                  set(
                    'universities',
                    v.universities.filter((_, i) => i !== index),
                  )
                }
                hitSlop={8}
                className="mt-8 h-11 w-11 items-center justify-center rounded-xl active:bg-surface-2"
              >
                <Ionicons name="trash-outline" size={20} color={colors.error} />
              </Pressable>
            </View>
          ))}
          {v.universities.length < MAX_UNIVERSITIES ? (
            <Button
              title={t('listing.addUniversity')}
              icon="add"
              variant="secondary"
              onPress={() =>
                set('universities', [...v.universities, { name: '', distanceInKm: '' }])
              }
            />
          ) : null}
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
        <LocationPin
          latitude={v.latitude}
          longitude={v.longitude}
          // One update, so the schema runs once for both.
          onChange={(latitude, longitude) =>
            form.setValues((values) => ({ ...values, latitude, longitude }))
          }
        />
      </Section>

      <Section title={t('listing.sections.photos')}>
        <PhotoPicker
          existing={kept}
          onRemoveExisting={(image) => setKept(kept.filter((k) => k !== image))}
          coverIsNew={coverIsNew}
          onCoverExisting={(image) => {
            setKept([image, ...kept.filter((k) => k !== image)]);
            setCoverNew(false);
          }}
          onCoverNew={(photo) => {
            setPhotos([photo, ...photos.filter((p) => p !== photo)]);
            setCoverNew(true);
          }}
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
      <Text accessibilityRole="header" className="text-lg text-text font-bold">
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
      <Text className="text-sm text-text-2 font-medium">{text}</Text>
      {error ? <Text className="text-sm text-error">{error}</Text> : null}
    </View>
  );
}

function Choices({ children }: { children: React.ReactNode }) {
  return <View className="flex-row flex-wrap gap-2">{children}</View>;
}
