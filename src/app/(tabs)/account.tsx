import { Ionicons } from '@expo/vector-icons';
import { router } from 'expo-router';
import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { View } from 'react-native';

import { useAuth } from '@/auth/AuthProvider';
import { initial } from '@/utils/initial';
import { useSignInPrompt } from '@/auth/returnTo';
import { Button } from '@/components/Button';
import { FormMessage } from '@/components/FormMessage';
import { LinkRow } from '@/components/LinkRow';
import { Screen } from '@/components/Screen';
import { MyProperties } from '@/features/account/MyProperties';
import { useThemeColors } from '@/theme/colors';
import { elevation } from '@/theme/elevation';
import { Text } from '@/components/Text';
import { Preferences } from '@/features/account/Preferences';

export default function AccountScreen() {
  const { status } = useAuth();
  return status === 'signedIn' ? <SignedIn /> : <SignedOut />;
}

/** Contact, reviews and the info pages work signed out too. */
function MoreLinks() {
  const { t } = useTranslation();
  const links = [
    { title: t('contact.title'), href: '/contact', icon: 'mail-outline' },
    { title: t('testimonial.title'), href: '/testimonial', icon: 'star-outline' },
    { title: t('pages.about.title'), href: '/about', icon: 'information-circle-outline' },
    { title: t('pages.faq.title'), href: '/faq', icon: 'help-circle-outline' },
    { title: t('pages.privacy.title'), href: '/privacy', icon: 'shield-checkmark-outline' },
  ] as const;
  return (
    <View className="gap-2">
      <Text accessibilityRole="header" className="px-1 text-left text-sm text-muted font-semibold">
        {t('account.more')}
      </Text>
      <View className="overflow-hidden rounded-2xl border border-border bg-surface">
        {links.map((link, index) => (
          <View key={link.href} className={index > 0 ? 'border-t border-border' : ''}>
            <LinkRow title={link.title} icon={link.icon} onPress={() => router.push(link.href)} />
          </View>
        ))}
      </View>
    </View>
  );
}

function SignedOut() {
  const { t } = useTranslation();
  const colors = useThemeColors();
  const promptSignIn = useSignInPrompt();
  return (
    <Screen scroll>
      <View className="items-center gap-4 rounded-3xl bg-primary px-6 py-8">
        <View className="h-16 w-16 items-center justify-center rounded-3xl bg-white/15">
          <Ionicons name="person" size={30} color={colors.onPrimary} />
        </View>
        <View className="gap-2">
          <Text className="text-center text-2xl text-on-primary font-bold">
            {t('account.signedOutTitle')}
          </Text>
          <Text className="text-center text-base leading-7 text-on-primary opacity-80">
            {t('account.signedOutBody')}
          </Text>
        </View>
      </View>
      <View className="gap-3">
        <Button title={t('home.signIn')} icon="log-in-outline" onPress={promptSignIn} />
        <Button
          title={t('home.createAccount')}
          icon="person-add-outline"
          variant="secondary"
          onPress={() => router.push('/register')}
        />
      </View>
      <Preferences />
      <MoreLinks />
    </Screen>
  );
}

function SignedIn() {
  const { t } = useTranslation();
  const { user, isAdmin, signOut } = useAuth();
  const [signingOut, setSigningOut] = useState(false);

  const phone = user && 'phone' in user ? user.phone : undefined;
  // The name and role are in the card's header; these are the details under it.
  const details: [string, string | undefined][] = [
    [t('common.email'), user?.email],
    [t('auth.phone'), phone],
  ];

  return (
    <Screen scroll>
      <Text
        accessibilityRole="header"
        className="text-left text-[28px] leading-10 text-text font-bold"
      >
        {t('profile.title')}
      </Text>
      <FormMessage message={user ? null : t('profile.offline')} tone="info" />
      <View
        className="gap-4 rounded-3xl border border-border bg-surface p-5"
        style={elevation.card}
      >
        <View className="flex-row items-center gap-4">
          <View className="h-16 w-16 items-center justify-center rounded-3xl bg-primary">
            <Text className="text-2xl text-on-primary font-bold">{initial(user?.userName)}</Text>
          </View>
          <View className="flex-1 gap-1">
            <Text numberOfLines={1} className="text-left text-lg text-text font-bold">
              {user?.userName}
            </Text>
            <View className="self-start rounded-full bg-primary-soft px-2.5 py-0.5">
              <Text className="text-xs text-primary font-semibold">
                {isAdmin ? t('profile.roleAdmin') : t('profile.roleUser')}
              </Text>
            </View>
          </View>
        </View>
        <View className="gap-3 border-t border-border pt-4">
          {details
            .filter(([, value]) => value)
            .map(([label, value]) => (
              <View key={label} className="gap-0.5">
                <Text className="text-left text-xs text-muted">{label}</Text>
                <Text className="text-left text-base text-text">{value}</Text>
              </View>
            ))}
        </View>
      </View>
      <Button
        title={t('listing.add')}
        icon="add-circle-outline"
        onPress={() => router.push('/listing/new')}
      />
      <MyProperties />
      <Preferences />
      <MoreLinks />
      <Button
        title={t('profile.signOut')}
        icon="log-out-outline"
        variant="secondary"
        loading={signingOut}
        onPress={async () => {
          setSigningOut(true);
          try {
            await signOut();
          } finally {
            setSigningOut(false);
          }
        }}
      />
    </Screen>
  );
}
