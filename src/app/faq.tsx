import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/Button';
import { ContentPage } from '@/features/pages/ContentPage';
import { FaqList } from '@/features/pages/FaqList';
import { usePages } from '@/features/pages/usePages';

export default function FaqScreen() {
  const { t } = useTranslation();
  const { faq } = usePages();
  return (
    <ContentPage title={faq.title} intro={faq.intro}>
      <FaqList items={faq.items} />
      <View className="gap-3 rounded-2xl border border-border bg-surface p-4">
        <View className="gap-0.5">
          <Text accessibilityRole="header" className="text-lg font-semibold text-text">
            {faq.moreTitle}
          </Text>
          <Text className="text-sm text-text-2">{faq.moreBody}</Text>
        </View>
        <Button
          title={t('contact.title')}
          variant="secondary"
          onPress={() => router.push('/contact')}
        />
      </View>
    </ContentPage>
  );
}
