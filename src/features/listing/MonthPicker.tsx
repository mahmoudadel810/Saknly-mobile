import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Chip } from '@/components/Chip';
import { Text } from '@/components/Text';

interface MonthPickerProps {
  label: string;
  /** "YYYY-MM", "YYYY" while only the year is chosen (the form flags it), or "" for no date. */
  value: string;
  onChange: (month: string) => void;
  /** The years to offer, in order. */
  years: number[];
  error?: string;
}

/**
 * A month and a year from chips: both dates on a listing (delivery, available from) are about
 * a month, and chips need no native picker, so they work the same in Expo Go and every build.
 */
export function MonthPicker({ label, value, onChange, years, error }: MonthPickerProps) {
  const { t } = useTranslation();
  const [year = '', valueMonth = ''] = value ? value.split('-') : [];
  const months = t('dates.months', { returnObjects: true }) as unknown as string[];
  // An older listing's date can be in a year no longer offered; it still shows as chosen.
  const shown = year && !years.includes(Number(year)) ? [Number(year), ...years] : years;

  // Keeps the month when the year changes; a year alone stays in the form, which asks for a month.
  const pickYear = (next: string) => onChange(valueMonth ? `${next}-${valueMonth}` : next);

  return (
    <View className="gap-2">
      <Text className="text-left text-sm text-text-2 font-medium">{label}</Text>
      <View className="flex-row flex-wrap gap-2">
        <Chip label={t('listing.noDate')} selected={!value} onPress={() => onChange('')} />
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
                onPress={() => onChange(`${year}-${month}`)}
              />
            );
          })}
        </View>
      ) : null}
      {error ? <Text className="text-left text-sm text-error">{error}</Text> : null}
    </View>
  );
}

/** This year and the next `count - 1`. */
export const yearsFrom = (start: number, count: number) =>
  Array.from({ length: count }, (_, i) => start + i);
