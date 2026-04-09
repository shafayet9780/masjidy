import { Link } from 'expo-router';
import { Text, View } from 'react-native';

export default function ProfileTabScreen() {
  return (
    <View className="flex-1 items-center justify-center gap-3 p-5">
      <Text>profile</Text>
      <Link href="/settings">settings</Link>
    </View>
  );
}
