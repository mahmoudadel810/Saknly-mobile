import { router, useLocalSearchParams } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { ErrorView, LoadingView } from '@/components/StateViews';
import { draftFromProperty } from '@/features/listing/draft';
import { ListingForm } from '@/features/listing/ListingForm';
import { useUpdateListing } from '@/features/listing/queries';
import { useProperty } from '@/features/properties/queries';

export default function EditListingScreen() {
  const { t } = useTranslation();
  const { id } = useLocalSearchParams<{ id: string }>();
  const property = useProperty(id);
  const update = useUpdateListing(id);

  if (property.isPending) return <LoadingView />;
  if (property.isError)
    return <ErrorView error={property.error} onRetry={() => property.refetch()} />;

  return (
    <ListingForm
      editing
      initial={draftFromProperty(property.data)}
      existingImages={property.data.images}
      onSubmit={async (submit) => {
        await update.mutateAsync(submit);
        Toast.show({ type: 'success', text1: t('listing.saved') });
        router.back();
      }}
    />
  );
}
