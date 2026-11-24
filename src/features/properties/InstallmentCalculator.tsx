import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Text } from '@/components/Text';
import { TextField } from '@/components/TextField';
import { toDecimal, toDigits } from '@/features/listing/draft';

import { formatMoney } from './format';
import { monthlyPayment } from './installments';

interface InstallmentCalculatorProps {
  price: number;
  downPayment?: number;
  years?: number;
}

/**
 * Starts from the listing's own down payment and period, at a 0% rate (developer installments
 * in Egypt are usually interest-free); the visitor can change all three.
 */
export function InstallmentCalculator({ price, downPayment, years }: InstallmentCalculatorProps) {
  const { t } = useTranslation();
  const [down, setDown] = useState(downPayment ? String(downPayment) : '');
  const [period, setPeriod] = useState(years ? String(years) : '');
  const [rate, setRate] = useState('0');

  const principal = Math.max(0, price - (Number(down) || 0));
  const monthly = monthlyPayment(principal, Number(rate) || 0, Number(period) || 0);

  return (
    <View className="gap-3">
      <TextField
        label={t('property.calculator.downPayment')}
        value={down}
        onChangeText={(text) => setDown(toDigits(text))}
        keyboardType="number-pad"
      />
      <View className="flex-row gap-3">
        <View className="flex-1">
          <TextField
            label={t('property.calculator.years')}
            value={period}
            onChangeText={(text) => setPeriod(toDigits(text))}
            keyboardType="number-pad"
            maxLength={2}
          />
        </View>
        <View className="flex-1">
          <TextField
            label={t('property.calculator.rate')}
            value={rate}
            onChangeText={(text) => setRate(toDecimal(text))}
            keyboardType="decimal-pad"
            maxLength={5}
          />
        </View>
      </View>
      <View
        accessible
        accessibilityLiveRegion="polite"
        className="gap-1 rounded-2xl bg-primary-soft px-4 py-3"
      >
        {monthly === null ? (
          <Text className="text-left text-sm text-text-2">
            {t('property.calculator.needInputs')}
          </Text>
        ) : (
          <>
            <Text className="text-left text-sm text-text-2">
              {t('property.calculator.monthly')}
            </Text>
            <Text className="text-left text-2xl text-primary font-bold">
              {formatMoney(Math.round(monthly))}
            </Text>
          </>
        )}
      </View>
      <Text className="text-left text-xs leading-5 text-muted">
        {t('property.calculator.note')}
      </Text>
    </View>
  );
}
