import { Link, Stack } from 'expo-router';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

export default function NotFoundScreen() {
  const { t } = useTranslation();
  return (
    <>
      <Stack.Screen options={{ title: '404' }} />
      <View className="flex-1 items-center justify-center gap-4 p-5">
        <Text className="text-lg font-semibold">+not-found</Text>
        <Link href="/">
          <Text>{t('placeholder.tab.mosques')}</Text>
        </Link>
      </View>
    </>
  );
}
