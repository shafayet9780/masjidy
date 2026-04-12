import { Clock, Compass, Heart, Mosque, User } from 'phosphor-react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { useThemeContext } from '@/theme/ThemeProvider';

export default function TabLayout() {
  const { t } = useTranslation();
  const { colors } = useThemeContext();
  const { bottom } = useSafeAreaInsets();

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: {
          backgroundColor: colors.surfaceElevated,
          borderTopColor: colors.border,
          height: 56 + bottom,
          paddingTop: 4,
          paddingBottom: bottom,
        },
        tabBarIconStyle: {
          marginTop: 4,
        },
        tabBarLabelStyle: {
          fontFamily: 'InterMedium',
          fontSize: 12,
        },
        headerStyle: {
          backgroundColor: colors.surface,
        },
        headerTintColor: colors.textPrimary,
        headerTitleStyle: {
          fontFamily: 'InterSemiBold',
        },
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('placeholder.tab.mosques'),
          headerShown: false,
          tabBarIcon: ({ color, focused }) => (
            <Mosque color={color} size={24} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="my-mosques"
        options={{
          title: t('placeholder.tab.myMosques'),
          tabBarIcon: ({ color, focused }) => (
            <Heart color={color} size={24} weight={focused ? 'fill' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: t('placeholder.tab.prayerTimes'),
          tabBarIcon: ({ color, focused }) => (
            <Clock color={color} size={24} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('placeholder.tab.qibla'),
          tabBarIcon: ({ color, focused }) => (
            <Compass color={color} size={24} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('placeholder.tab.profile'),
          tabBarIcon: ({ color, focused }) => (
            <User color={color} size={24} weight={focused ? 'bold' : 'regular'} />
          ),
        }}
      />
    </Tabs>
  );
}
