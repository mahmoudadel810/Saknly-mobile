import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { Button } from '@/components/Button';
import { ContentPage, Sections } from '@/features/pages/ContentPage';
import { usePages } from '@/features/pages/usePages';

export default function AboutScreen() {
  const { t } = useTranslation();
  const { about } = usePages();
  return (
    <ContentPage title={about.title} intro={about.intro}>
      <Sections sections={about.sections} />
      <View className="gap-3">
        <Button title={about.browse} onPress={() => router.navigate('/properties')} />
        <Button
          title={t('contact.title')}
          variant="secondary"
          onPress={() => router.push('/contact')}
        />
      </View>
    </ContentPage>
  );
}
