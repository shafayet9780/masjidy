import '../global.css';

import type { Href } from 'expo-router';
import {
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  useFonts,
} from '@expo-google-fonts/inter';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic';
import { Stack, useRouter, useSegments } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { useEffect } from 'react';
import { View } from 'react-native';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import { SafeAreaProvider } from 'react-native-safe-area-context';

import { GluestackUIProvider } from '@/components/gluestack-ui/gluestack-ui-provider';
import { useAuth } from '@/hooks/useAuth';
import { useNotifications } from '@/hooks/useNotifications';
import { i18n } from '@/i18n';
import { useAppStore } from '@/store/appStore';
import { useFollowStore } from '@/store/followStore';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { SupportedLanguage } from '@/store/preferencesStore';
import { ThemeProvider } from '@/theme/ThemeProvider';

import '@/i18n';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    InterMedium: Inter_500Medium,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
    NotoSansArabic: NotoSansArabic_400Regular,
    JetBrainsMono: JetBrainsMono_400Regular,
    JetBrainsMonoMedium: JetBrainsMono_500Medium,
  });
  const router = useRouter();
  const segments = useSegments();
  const { initAuth } = useAuth();
  useNotifications();
  const hydratePreferences = usePreferencesStore((state) => state.hydrate);
  const hydrateAppStore = useAppStore((state) => state.hydrate);
  const hydrateFollowStore = useFollowStore((state) => state.hydrate);
  const preferencesHydrated = usePreferencesStore((state) => state.hydrated);
  const onboardingCompleted = usePreferencesStore((state) => state.onboardingCompleted);
  const isAppReady = fontsLoaded && preferencesHydrated;
  const routeRoot = String(segments[0] ?? '');
  const isOnboardingRoute = routeRoot === 'onboarding' || (routeRoot === 'auth' && segments[1] === 'onboarding');

  useEffect(() => initAuth(), [initAuth]);
  useEffect(() => {
    void hydratePreferences();
  }, [hydratePreferences]);

  useEffect(() => {
    void hydrateAppStore();
    void hydrateFollowStore();
  }, [hydrateAppStore, hydrateFollowStore]);

  useEffect(() => {
    if (!preferencesHydrated) {
      return;
    }
    const { language } = usePreferencesStore.getState();
    const supported: SupportedLanguage[] = ['en', 'ar', 'bn', 'ur'];
    if (supported.includes(language)) {
      void i18n.changeLanguage(language);
    }
  }, [preferencesHydrated]);

  useEffect(() => {
    if (isAppReady) {
      void SplashScreen.hideAsync();
    }
  }, [isAppReady]);

  useEffect(() => {
    if (!isAppReady) {
      return;
    }

    if (!onboardingCompleted) {
      if (!isOnboardingRoute) {
        router.replace('/onboarding' as Href);
      }
      return;
    }

    if (isOnboardingRoute) {
      router.replace('/(tabs)');
    }
  }, [isAppReady, isOnboardingRoute, onboardingCompleted, router]);

  return (
    <SafeAreaProvider>
      <GestureHandlerRootView style={{ flex: 1 }}>
        <ThemeProvider>
          <GluestackUIProvider>
            {isAppReady ? (
              <>
                <StatusBar style="auto" />
                <Stack screenOptions={{ headerShown: false }}>
                  <Stack.Screen name="(tabs)" />
                  <Stack.Screen name="mosque/[id]" options={{ headerShown: true, title: '' }} />
                  <Stack.Screen name="onboarding" />
                  <Stack.Screen name="auth/login" />
                  <Stack.Screen name="auth/onboarding" />
                  <Stack.Screen
                    name="submit-time/[mosqueId]"
                    options={{ presentation: 'modal', headerShown: true, title: '' }}
                  />
                  <Stack.Screen name="settings/index" options={{ headerShown: true }} />
                  <Stack.Screen name="settings/theme" options={{ headerShown: true }} />
                  <Stack.Screen name="settings/notifications" options={{ headerShown: true }} />
                  <Stack.Screen name="settings/language" options={{ headerShown: true }} />
                </Stack>
              </>
            ) : (
              <View className="flex-1 bg-surface" />
            )}
          </GluestackUIProvider>
        </ThemeProvider>
      </GestureHandlerRootView>
    </SafeAreaProvider>
  );
}
