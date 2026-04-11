import * as Location from 'expo-location';
import { Compass, MapPin, User } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';
import { useRouter } from 'expo-router';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useTheme } from '@/hooks/useTheme';
import { i18n } from '@/i18n';
import { usePreferencesStore, type SupportedLanguage } from '@/store/preferencesStore';
import { prayerCalcMethod, type PrayerCalcMethod } from '@/types/user';

const SUPPORTED_LANGUAGES: SupportedLanguage[] = ['en', 'ar', 'bn', 'ur'];

export default function OnboardingScreen() {
  const router = useRouter();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const completeOnboarding = usePreferencesStore((state) => state.completeOnboarding);
  const storedLanguage = usePreferencesStore((state) => state.language);
  const storedPrayerCalcMethod = usePreferencesStore((state) => state.prayerCalcMethod);
  const storedDisplayName = usePreferencesStore((state) => state.displayName);
  const storedLocationGranted = usePreferencesStore((state) => state.locationGranted);

  const fallbackLanguage = SUPPORTED_LANGUAGES.includes(i18n.resolvedLanguage as SupportedLanguage)
    ? (i18n.resolvedLanguage as SupportedLanguage)
    : storedLanguage;

  const [displayName, setDisplayName] = useState(storedDisplayName ?? '');
  const [language, setLanguage] = useState<SupportedLanguage>(fallbackLanguage);
  const [selectedMethod, setSelectedMethod] = useState<PrayerCalcMethod>(storedPrayerCalcMethod);
  const [locationGranted, setLocationGranted] = useState(storedLocationGranted);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isRequestingLocation, setIsRequestingLocation] = useState(false);

  const languageOptions = useMemo<SelectOption[]>(
    () => [
      { label: t('auth.language.en'), value: 'en' },
      { label: t('auth.language.ar'), value: 'ar' },
      { label: t('auth.language.bn'), value: 'bn' },
      { label: t('auth.language.ur'), value: 'ur' },
    ],
    [t],
  );

  const methodOptions = useMemo<SelectOption[]>(
    () => [
      { label: t('auth.calcMethod.mwl'), value: prayerCalcMethod.mwl },
      { label: t('auth.calcMethod.isna'), value: prayerCalcMethod.isna },
      { label: t('auth.calcMethod.karachi'), value: prayerCalcMethod.karachi },
      { label: t('auth.calcMethod.ummAlQura'), value: prayerCalcMethod.umm_al_qura },
    ],
    [t],
  );

  const locationStatusKey = locationGranted
    ? 'auth.onboarding.locationGranted'
    : 'auth.onboarding.locationPending';

  async function requestLocationPermission() {
    setIsRequestingLocation(true);
    setErrorKey(null);

    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      const granted = status === Location.PermissionStatus.GRANTED;
      setLocationGranted(granted);

      if (!granted) {
        setErrorKey('auth.onboarding.locationDenied');
      }
    } catch {
      setErrorKey('auth.error.generic');
    } finally {
      setIsRequestingLocation(false);
    }
  }

  async function handleSubmit() {
    const normalizedName = displayName.trim();

    if (normalizedName && normalizedName.length < 2) {
      setErrorKey('auth.error.nameTooShort');
      return;
    }

    if (normalizedName.length > 50) {
      setErrorKey('auth.error.nameTooLong');
      return;
    }

    setIsSubmitting(true);
    setErrorKey(null);

    completeOnboarding({
      displayName: normalizedName || null,
      language,
      prayerCalcMethod: selectedMethod,
      locationGranted,
    });

    await i18n.changeLanguage(language);
    router.replace('/(tabs)');
  }

  return (
    <ScreenContainer contentClassName="justify-center">
      <View className="mb-8 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
          <Compass color={colors.primary} size={34} weight="fill" />
        </View>
        <Text className="text-center font-sans-bold text-3xl text-text-primary">
          {t('auth.onboarding.title')}
        </Text>
        <Text className="mt-2 max-w-[320px] text-center font-sans text-base text-text-secondary">
          {t('auth.onboarding.subtitle')}
        </Text>
      </View>

      <Card className="border border-border px-4 py-5" variant="outlined">
        {errorKey ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            className="mb-4 rounded-md border border-danger px-3 py-2 font-sans text-sm text-danger"
          >
            {t(errorKey)}
          </Text>
        ) : null}

        <View className="gap-4">
          <View className="rounded-md border border-border bg-surface-elevated px-4 py-4">
            <View className="flex-row items-start gap-3">
              <View className="mt-0.5 rounded-full bg-primary-soft p-2">
                <MapPin color={colors.primary} size={18} weight="fill" />
              </View>
              <View className="flex-1 gap-1">
                <Text className="font-sans-medium text-base text-text-primary">
                  {t('auth.onboarding.locationTitle')}
                </Text>
                <Text className="font-sans text-sm text-text-secondary">
                  {t(locationStatusKey)}
                </Text>
              </View>
            </View>
            <Button
              className="mt-4"
              fullWidth
              loading={isRequestingLocation}
              onPress={() => void requestLocationPermission()}
              variant="secondary"
            >
              {locationGranted
                ? t('auth.onboarding.locationUpdate')
                : t('auth.onboarding.locationButton')}
            </Button>
          </View>

          <Input
            accessibilityLabel={t('auth.onboarding.displayNameLabel')}
            autoCapitalize="words"
            autoCorrect={false}
            helperText={t('auth.onboarding.displayNameHelper')}
            label={t('auth.onboarding.displayNameLabel')}
            leftIcon={<User color={colors.textSecondary} size={18} weight="regular" />}
            onChangeText={setDisplayName}
            placeholder={t('auth.onboarding.displayNamePlaceholder')}
            value={displayName}
          />

          <Select
            label={t('auth.onboarding.languageLabel')}
            onValueChange={(value) => setLanguage(value as SupportedLanguage)}
            options={languageOptions}
            placeholder={t('auth.onboarding.languagePlaceholder')}
            selectedValue={language}
          />

          <Select
            label={t('auth.onboarding.calcMethodLabel')}
            onValueChange={(value) => setSelectedMethod(value as PrayerCalcMethod)}
            options={methodOptions}
            placeholder={t('auth.onboarding.calcMethodPlaceholder')}
            selectedValue={selectedMethod}
          />

          <Button fullWidth loading={isSubmitting} onPress={() => void handleSubmit()}>
            {t('auth.onboarding.submit')}
          </Button>
        </View>
      </Card>
    </ScreenContainer>
  );
}
