import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import Toast from 'react-native-toast-message';

import { useAuth } from '@/auth/AuthProvider';
import { EMPTY_DRAFT } from '@/features/listing/draft';
import { ListingForm } from '@/features/listing/ListingForm';
import { useCreateListing } from '@/features/listing/queries';
import { offerNotifications } from '@/notifications/primer';
import { haptics } from '@/utils/haptics';

export default function NewListingScreen() {
  const { t } = useTranslation();
  const { user } = useAuth();
  const create = useCreateListing();
  const phone = user && 'phone' in user ? (user.phone ?? '') : '';

  return (
    <ListingForm
      initial={{ ...EMPTY_DRAFT, contactPhone: phone }}
      onSubmit={async (submit) => {
        const listing = await create.mutateAsync(submit);
        haptics.success();
        Toast.show({ type: 'success', text1: t('listing.created') });
        router.replace({ pathname: '/properties/[id]', params: { id: listing._id } });
        offerNotifications('listing');
      }}
    />
  );
}
