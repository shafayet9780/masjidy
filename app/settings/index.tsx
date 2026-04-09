import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function SettingsIndexScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-5">
      <Text>settings/index</Text>
      <Link href="/settings/theme">theme</Link>
      <Link href="/settings/notifications">notifications</Link>
      <Link href="/settings/language">language</Link>
    </View>
  );
}
