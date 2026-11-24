import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';

interface MonthPickerProps {
  label: string;
  /** "YYYY-MM", or "" for no date. */
  value: string;
  onChange: (month: string) => void;
  /** The years to offer, in order. */
  years: number[];
}

/**
 * A month and a year from chips: both dates on a listing (delivery, available from) are about
 * a month, and chips need no native picker, so they work the same in Expo Go and every build.
 */
export function MonthPicker({ label, value, onChange, years }: MonthPickerProps) {
  const { t } = useTranslation();
  const [valueYear, valueMonth] = value ? value.split('-') : ['', ''];
  // A year tapped before any month: shown as chosen, saved once a month is picked.
  const [pendingYear, setPendingYear] = useState('');
  const year = valueYear || pendingYear;
  const months = t('dates.months', { returnObjects: true }) as unknown as string[];
  // An older listing's date can be in a year no longer offered; it still shows as chosen.
  const shown =
    valueYear && !years.includes(Number(valueYear)) ? [Number(valueYear), ...years] : years;

  const pickYear = (next: string) => {
    if (valueMonth) onChange(`${next}-${valueMonth}`);
    else setPendingYear(next);
  };

  return (
    <View className="gap-2">
      <Text className="text-left text-sm text-text-2 font-medium">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Chip
          label={t('listing.noDate')}
          selected={!value && !pendingYear}
          onPress={() => {
            setPendingYear('');
            onChange('');
          }}
        />
        {shown.map((y) => (
          <Chip
            key={y}
            label={String(y)}
            selected={year === String(y)}
            onPress={() => pickYear(String(y))}
          />
        ))}
      </View>
      {year ? (
        <View className="flex-row flex-wrap gap-2">
          {months.map((name, i) => {
            const month = String(i + 1).padStart(2, '0');
            return (
              <Chip
                key={month}
                label={name}
                selected={valueMonth === month}
                onPress={() => {
                  setPendingYear('');
                  onChange(`${year}-${month}`);
                }}
              />
            );
          })}
        </View>
      ) : null}
    </View>
  );
}

/** This year and the next `count - 1`. */
export const yearsFrom = (start: number, count: number) =>
  Array.from({ length: count }, (_, i) => start + i);
