import { Ionicons } from '@expo/vector-icons';
import { useState } from 'react';
import { Pressable, Text, View } from 'react-native';

import { useThemeColors } from '@/theme/colors';

import type { FaqItem } from './usePages';

/** Questions that open to show their answer, one at a time. */
export function FaqList({ items }: { items: FaqItem[] }) {
  const colors = useThemeColors();
  const [open, setOpen] = useState<number | null>(null);

  return (
    <View className="overflow-hidden rounded-2xl border border-border bg-surface">
      {items.map((item, index) => {
        const expanded = open === index;
        return (
          <View key={item.question} className={index > 0 ? 'border-t border-border' : ''}>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel={item.question}
              accessibilityState={{ expanded }}
              onPress={() => setOpen(expanded ? null : index)}
              className="min-h-14 flex-row items-center gap-3 px-4 py-3 active:bg-surface-2"
            >
              <Text className="flex-1 text-left text-base font-semibold text-text">
                {item.question}
              </Text>
              <Ionicons
                name={expanded ? 'chevron-up' : 'chevron-down'}
                size={18}
                color={colors.muted}
              />
            </Pressable>
            {expanded ? (
              <Text className="px-4 pb-4 text-left text-base leading-7 text-text-2">
                {item.answer}
              </Text>
            ) : null}
          </View>
        );
      })}
    </View>
  );
}
