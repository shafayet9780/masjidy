import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function MosqueProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  return (
    <View className="flex-1 items-center justify-center p-5">
      <Text>
        mosque/[id] — {String(id ?? '')}
      </Text>
    </View>
  );
}
