import { Ionicons } from '@expo/vector-icons';
import { Tabs } from 'expo-router/js-tabs';
import { useTranslation } from 'react-i18next';
import type { ColorValue } from 'react-native';

import { useThemeColors } from '@/theme/colors';
import { fonts } from '@/theme/fonts';

type IconName = keyof typeof Ionicons.glyphMap;
type TabIconProps = { color: ColorValue; focused: boolean; size: number };

function TabIcon({
  name,
  focusedName,
  color,
  focused,
  size,
}: TabIconProps & {
  name: IconName;
  focusedName: IconName;
}) {
  return <Ionicons name={focused ? focusedName : name} color={color as string} size={size} />;
}

export default function TabLayout() {
  const { t } = useTranslation();
  const colors = useThemeColors();

  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.muted,
        tabBarStyle: { backgroundColor: colors.surface, borderTopColor: colors.border },
        tabBarLabelStyle: { fontFamily: fonts.medium, fontSize: 11 },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('tabs.home'),
          tabBarIcon: (props: TabIconProps) => (
            <TabIcon {...props} name="home-outline" focusedName="home" />
          ),
        }}
      />
      <Tabs.Screen
        name="properties"
        options={{
          title: t('tabs.properties'),
          tabBarIcon: (props: TabIconProps) => (
            <TabIcon {...props} name="search-outline" focusedName="search" />
          ),
        }}
      />
      <Tabs.Screen
        name="wishlist"
        options={{
          title: t('tabs.wishlist'),
          tabBarIcon: (props: TabIconProps) => (
            <TabIcon {...props} name="heart-outline" focusedName="heart" />
          ),
        }}
      />
      <Tabs.Screen
        name="chat"
        options={{
          title: t('tabs.assistant'),
          // The composer sits at the bottom: the tab bar would eat the space above the keyboard.
          tabBarHideOnKeyboard: true,
          tabBarIcon: (props: TabIconProps) => (
            <TabIcon {...props} name="chatbubbles-outline" focusedName="chatbubbles" />
          ),
        }}
      />
      <Tabs.Screen
        name="account"
        options={{
          title: t('tabs.account'),
          tabBarIcon: (props: TabIconProps) => (
            <TabIcon {...props} name="person-outline" focusedName="person" />
          ),
        }}
      />
    </Tabs>
  );
}
