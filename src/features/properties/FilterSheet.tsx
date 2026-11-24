import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Modal, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { Button } from '@/components/Button';
import { Chip } from '@/components/Chip';
import { TextField } from '@/components/TextField';
import { citiesFor, GOVERNORATES, PROPERTY_TYPE_VALUES } from '@/constants/property';

import { EMPTY_FILTERS, parsePrice, type PropertyFilters, SORT_VALUES } from './filters';
import { Text } from '@/components/Text';

const BEDROOMS = [1, 2, 3, 4, 5];

interface FilterSheetProps {
  visible: boolean;
  filters: PropertyFilters;
  onApply: (filters: PropertyFilters) => void;
  onClose: () => void;
}

export function FilterSheet({ visible, ...props }: FilterSheetProps) {
  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={props.onClose}
    >
      {/* Mounted only while open, so each opening starts from the applied filters. */}
      {visible ? <SheetBody {...props} /> : null}
    </Modal>
  );
}

function SheetBody({ filters, onApply, onClose }: Omit<FilterSheetProps, 'visible'>) {
  const { t } = useTranslation();
  const [draft, setDraft] = useState(filters);
  const [minPrice, setMinPrice] = useState(filters.minPrice?.toString() ?? '');
  const [maxPrice, setMaxPrice] = useState(filters.maxPrice?.toString() ?? '');

  const set = (patch: Partial<PropertyFilters>) =>
    setDraft((current) => ({ ...current, ...patch }));
  const toggle = <K extends keyof PropertyFilters>(key: K, value: PropertyFilters[K]) =>
    set({ [key]: draft[key] === value ? null : value } as Partial<PropertyFilters>);

  const apply = () =>
    onApply({ ...draft, minPrice: parsePrice(minPrice), maxPrice: parsePrice(maxPrice) });

  return (
    <SafeAreaView className="flex-1 bg-bg">
      <View className="flex-row items-center justify-between border-b border-border px-5 py-4">
        <Text accessibilityRole="header" className="text-xl text-text font-bold">
          {t('browse.filters')}
        </Text>
        <Button title={t('common.back')} variant="link" onPress={onClose} />
      </View>

      <ScrollView contentContainerClassName="gap-6 px-5 py-5">
        <Section title={t('browse.sort')}>
          {SORT_VALUES.map((sort) => (
            <Chip
              key={sort}
              label={t(`browse.sortOptions.${sort}`)}
              selected={draft.sort === sort}
              onPress={() => set({ sort })}
            />
          ))}
        </Section>

        <Section title={t('browse.governorate')}>
          {GOVERNORATES.map((governorate) => (
            <Chip
              key={governorate}
              label={governorate}
              selected={draft.governorate === governorate}
              onPress={() =>
                set({
                  governorate: draft.governorate === governorate ? null : governorate,
                  city: null,
                })
              }
            />
          ))}
        </Section>

        {draft.governorate ? (
          <Section title={t('browse.city')}>
            {citiesFor([draft.governorate]).map((city) => (
              <Chip
                key={city}
                label={city}
                selected={draft.city === city}
                onPress={() => toggle('city', city)}
              />
            ))}
          </Section>
        ) : null}

        <Section title={t('browse.type')}>
          {PROPERTY_TYPE_VALUES.map((type) => (
            <Chip
              key={type}
              label={type}
              selected={draft.type === type}
              onPress={() => toggle('type', type)}
            />
          ))}
        </Section>

        <Section title={t('browse.bedrooms')}>
          {BEDROOMS.map((count) => (
            <Chip
              key={count}
              label={String(count)}
              selected={draft.bedrooms === count}
              onPress={() => toggle('bedrooms', count)}
            />
          ))}
        </Section>

        <View className="flex-row gap-3">
          <View className="flex-1">
            <TextField
              label={t('browse.minPrice')}
              value={minPrice}
              onChangeText={setMinPrice}
              keyboardType="number-pad"
            />
          </View>
          <View className="flex-1">
            <TextField
              label={t('browse.maxPrice')}
              value={maxPrice}
              onChangeText={setMaxPrice}
              keyboardType="number-pad"
            />
          </View>
        </View>
      </ScrollView>

      <View className="flex-row gap-3 border-t border-border px-5 py-4">
        <View className="flex-1">
          <Button
            title={t('browse.clearFilters')}
            variant="secondary"
            onPress={() => onApply(EMPTY_FILTERS)}
          />
        </View>
        <View className="flex-1">
          <Button title={t('browse.apply')} onPress={apply} />
        </View>
      </View>
    </SafeAreaView>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <View className="gap-2">
      <Text className="text-base text-text font-semibold">{title}</Text>
      <View className="flex-row flex-wrap gap-2">{children}</View>
    </View>
  );
}
