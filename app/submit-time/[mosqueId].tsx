import { useLocalSearchParams } from 'expo-router';
import { Text, View } from 'react-native';

export default function SubmitTimeScreen() {
  const { mosqueId } = useLocalSearchParams<{ mosqueId: string }>();
  return (
    <View className="flex-1 items-center justify-center p-5">
      <Text>
        submit-time/[mosqueId] — {String(mosqueId ?? '')}
      </Text>
    </View>
  );
}
