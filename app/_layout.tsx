import '../global.css';

import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { GestureHandlerRootView } from 'react-native-gesture-handler';

import { GluestackUIProvider } from '@/components/gluestack-ui/gluestack-ui-provider';
import { ThemeProvider } from '@/theme/ThemeProvider';

import '@/i18n';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    NotoSansArabic_400Regular,
    JetBrainsMono_400Regular,
    JetBrainsMono_500Medium,
  });

  useEffect(() => {
    if (fontsLoaded) {
      void SplashScreen.hideAsync();
    }
  }, [fontsLoaded]);

  if (!fontsLoaded) {
    return null;
  }

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <ThemeProvider>
        <GluestackUIProvider>
          <StatusBar style="auto" />
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
            <Stack.Screen name="mosque/[id]" options={{ headerShown: true, title: '' }} />
            <Stack.Screen name="auth/login" options={{ presentation: 'modal' }} />
            <Stack.Screen name="auth/onboarding" options={{ presentation: 'modal' }} />
            <Stack.Screen name="submit-time/[mosqueId]" options={{ presentation: 'modal' }} />
            <Stack.Screen name="settings/index" options={{ headerShown: true }} />
            <Stack.Screen name="settings/theme" options={{ headerShown: true }} />
            <Stack.Screen name="settings/notifications" options={{ headerShown: true }} />
            <Stack.Screen name="settings/language" options={{ headerShown: true }} />
          </Stack>
        </GluestackUIProvider>
      </ThemeProvider>
    </GestureHandlerRootView>
  );
}
