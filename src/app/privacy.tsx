import { ContentPage, Sections } from '@/features/pages/ContentPage';
import { usePages } from '@/features/pages/usePages';
import { Text } from '@/components/Text';

export default function PrivacyScreen() {
  const { privacy } = usePages();
  return (
    <ContentPage title={privacy.title}>
      <Text className="-mt-3 text-sm text-muted">{privacy.updated}</Text>
      <Sections sections={privacy.sections} />
    </ContentPage>
  );
}
