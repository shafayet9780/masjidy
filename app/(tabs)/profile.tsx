import { useRouter } from 'expo-router';
import { Gear, SignIn, SignOut, User } from 'phosphor-react-native';
import { useMemo } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useAuth } from '@/hooks/useAuth';
import { i18n } from '@/i18n';
import { useTheme } from '@/hooks/useTheme';
import { usePreferencesStore } from '@/store/preferencesStore';
import type { SupportedLanguage } from '@/store/preferencesStore';
import { prayerCalcMethod, type PrayerCalcMethod } from '@/types/user';

export default function ProfileTabScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isAuthenticated, profile, signOut } = useAuth();
  const displayName = usePreferencesStore((state) => state.displayName);
  const language = usePreferencesStore((state) => state.language);
  const selectedPrayerCalcMethod = usePreferencesStore((state) => state.prayerCalcMethod);
  const setLanguage = usePreferencesStore((state) => state.setLanguage);
  const setPrayerCalcMethod = usePreferencesStore((state) => state.setPrayerCalcMethod);

  const languageOptions = useMemo<SelectOption[]>(
    () => [
      { label: t('auth.language.en'), value: 'en' },
      { label: t('auth.language.ar'), value: 'ar' },
      { label: t('auth.language.bn'), value: 'bn' },
      { label: t('auth.language.ur'), value: 'ur' },
    ],
    [t],
  );

  const prayerMethodOptions = useMemo<SelectOption[]>(
    () => [
      { label: t('auth.calcMethod.mwl'), value: prayerCalcMethod.mwl },
      { label: t('auth.calcMethod.isna'), value: prayerCalcMethod.isna },
      { label: t('auth.calcMethod.karachi'), value: prayerCalcMethod.karachi },
      { label: t('auth.calcMethod.ummAlQura'), value: prayerCalcMethod.umm_al_qura },
    ],
    [t],
  );

  async function handleSignOut() {
    await signOut();
    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer contentClassName="gap-4">
      <Card className="border border-border px-4 py-5" variant="outlined">
        <View className="flex-row items-start gap-3">
          <View className="rounded-full bg-primary-soft p-3">
            <User color={colors.primary} size={20} weight="fill" />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-sans-bold text-xl text-text-primary">
              {isAuthenticated
                ? profile?.display_name || displayName || t('profile.authenticatedFallback')
                : displayName || t('profile.anonymousTitle')}
            </Text>
            <Text className="font-sans text-sm text-text-secondary">
              {isAuthenticated ? t('profile.authenticatedSubtitle') : t('profile.anonymousSubtitle')}
            </Text>
          </View>
        </View>
      </Card>

      <Card className="border border-border px-4 py-5" variant="outlined">
        <Text className="font-sans-medium text-base text-text-primary">
          {t('profile.localPreferences')}
        </Text>
        <View className="mt-3 gap-4">
          <Select
            label={t('profile.languageSettings')}
            onValueChange={(value) => {
              const nextLanguage = value as SupportedLanguage;
              setLanguage(nextLanguage);
              void i18n.changeLanguage(nextLanguage);
            }}
            options={languageOptions}
            placeholder={t('auth.onboarding.languagePlaceholder')}
            selectedValue={language}
          />
          <Select
            label={t('profile.calcMethodSettings')}
            onValueChange={(value) => setPrayerCalcMethod(value as PrayerCalcMethod)}
            options={prayerMethodOptions}
            placeholder={t('auth.onboarding.calcMethodPlaceholder')}
            selectedValue={selectedPrayerCalcMethod}
          />
        </View>
      </Card>

      {!isAuthenticated ? (
        <Card className="border border-border px-4 py-5" variant="outlined">
          <Text className="font-sans-medium text-base text-text-primary">
            {t('profile.signInCardTitle')}
          </Text>
          <Text className="mt-1 font-sans text-sm text-text-secondary">
            {t('profile.signInCardSubtitle')}
          </Text>
          <Button
            className="mt-4"
            fullWidth
            leftIcon={<SignIn color={colors.surface} size={18} weight="bold" />}
            onPress={() => router.push({ pathname: '/auth/login', params: { returnTo: '/profile' } })}
          >
            {t('profile.signInCta')}
          </Button>
        </Card>
      ) : (
        <Button
          fullWidth
          leftIcon={<SignOut color={colors.danger} size={18} weight="bold" />}
          onPress={() => void handleSignOut()}
          variant="danger"
        >
          {t('auth.signOut')}
        </Button>
      )}

      <Card className="border border-border px-4 py-5" variant="outlined">
        <Text className="mb-3 font-sans-medium text-base text-text-primary">
          {t('profile.settingsTitle')}
        </Text>
        <View className="gap-3">
          <Button
            fullWidth
            leftIcon={<Gear color={colors.textPrimary} size={18} weight="regular" />}
            onPress={() => router.push('/settings')}
            variant="secondary"
          >
            {t('profile.openSettings')}
          </Button>
          <Button fullWidth onPress={() => router.push('/settings/theme')} variant="secondary">
            {t('profile.themeSettings')}
          </Button>
          <Button fullWidth onPress={() => router.push('/settings/notifications')} variant="secondary">
            {t('profile.notificationSettings')}
          </Button>
        </View>
      </Card>
    </ScreenContainer>
  );
}
