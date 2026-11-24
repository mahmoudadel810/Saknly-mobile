import { router } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Alert, FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { useAuth } from '@/auth/AuthProvider';
import { useSignInPrompt } from '@/auth/returnTo';
import { Button } from '@/components/Button';
import { EmptyView, ErrorView, LoadingView } from '@/components/StateViews';
import { TabHeader } from '@/components/TabHeader';
import { useClearWishlist, useWishlist } from '@/features/account/queries';
import { PropertyCard } from '@/features/properties/PropertyCard';
import { useThemeColors } from '@/theme/colors';

export default function WishlistScreen() {
  const { t } = useTranslation();
  const { status } = useAuth();
  const promptSignIn = useSignInPrompt();

  return (
    <SafeAreaView edges={['top']} className="flex-1 bg-bg">
      <TabHeader title={t('wishlist.title')} />
      {status === 'signedIn' ? (
        <Wishlist />
      ) : (
        <EmptyView icon="heart-outline" message={t('wishlist.signedOut')}>
          <Button title={t('home.signIn')} icon="log-in-outline" onPress={promptSignIn} />
        </EmptyView>
      )}
    </SafeAreaView>
  );
}

function Wishlist() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const wishlist = useWishlist();
  const clear = useClearWishlist();

  if (wishlist.isPending) return <LoadingView />;
  if (wishlist.isError) {
    return <ErrorView error={wishlist.error} onRetry={() => wishlist.refetch()} />;
  }

  const confirmClear = () =>
    Alert.alert(t('wishlist.clearConfirmTitle'), t('wishlist.clearConfirmBody'), [
      { text: t('wishlist.cancel'), style: 'cancel' },
      { text: t('wishlist.clear'), style: 'destructive', onPress: () => clear.mutate() },
    ]);

  return (
    <FlatList
      data={wishlist.data}
      keyExtractor={(item) => item.property._id}
      renderItem={({ item }) => <PropertyCard property={item.property} />}
      contentContainerClassName="gap-4 px-5 pb-8"
      refreshControl={
        <RefreshControl
          refreshing={wishlist.isRefetching}
          onRefresh={() => void wishlist.refetch()}
          tintColor={colors.primary}
        />
      }
      ListEmptyComponent={
        <EmptyView icon="heart-outline" message={t('wishlist.empty')}>
          <Button
            title={t('browse.seeAll')}
            variant="secondary"
            onPress={() => router.navigate({ pathname: '/properties', params: { kind: 'all' } })}
          />
        </EmptyView>
      }
      ListFooterComponent={
        wishlist.data.length ? (
          <View className="pt-2">
            <Button
              title={t('wishlist.clear')}
              icon="trash-outline"
              variant="secondary"
              loading={clear.isPending}
              onPress={confirmClear}
            />
          </View>
        ) : undefined
      }
    />
  );
}
