import { Clock, Compass, Heart, Mosque, User } from 'phosphor-react-native';
import { Tabs } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { useColorScheme } from 'react-native';

export default function TabLayout() {
  const { t } = useTranslation();
  const colorScheme = useColorScheme();
  const active = colorScheme === 'dark' ? '#ffffff' : '#000000';
  const inactive = colorScheme === 'dark' ? '#888888' : '#666666';

  return (
    <Tabs
      screenOptions={{
        headerShown: true,
        tabBarActiveTintColor: active,
        tabBarInactiveTintColor: inactive,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: t('placeholder.tab.mosques'),
          tabBarIcon: ({ color, size }) => <Mosque color={color} size={size ?? 24} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="my-mosques"
        options={{
          title: t('placeholder.tab.myMosques'),
          tabBarIcon: ({ color, size }) => <Heart color={color} size={size ?? 24} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="prayer-times"
        options={{
          title: t('placeholder.tab.prayerTimes'),
          tabBarIcon: ({ color, size }) => <Clock color={color} size={size ?? 24} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="qibla"
        options={{
          title: t('placeholder.tab.qibla'),
          tabBarIcon: ({ color, size }) => <Compass color={color} size={size ?? 24} weight="bold" />,
        }}
      />
      <Tabs.Screen
        name="profile"
        options={{
          title: t('placeholder.tab.profile'),
          tabBarIcon: ({ color, size }) => <User color={color} size={size ?? 24} weight="bold" />,
        }}
      />
    </Tabs>
  );
}
