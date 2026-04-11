import { type Href, useLocalSearchParams, useRouter } from 'expo-router';
import { AppleLogo, ArrowLeft, EnvelopeSimple, GoogleLogo, Mosque, Phone } from 'phosphor-react-native';
import { useEffect, useMemo, useState } from 'react';
import { Platform, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';
import { consumePendingAuthenticatedAction } from '@/hooks/useRequireAuth';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';

type AuthStep = 'input' | 'verify';
type ActiveMethod = 'email' | 'phone' | 'google' | 'apple' | 'verify' | 'resend' | null;

interface OtpTarget {
  type: 'email' | 'sms';
  email?: string;
  phone?: string;
  destinationLabel: string;
}

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

function digitsOnly(value: string): string {
  return value.replace(/\D/g, '');
}

export default function LoginScreen() {
  const router = useRouter();
  const { returnTo } = useLocalSearchParams<{ returnTo?: string }>();
  const { t } = useTranslation();
  const { colors } = useTheme();
  const {
    isAuthenticated,
    isLoading,
    signInWithApple,
    signInWithEmailOtp,
    signInWithGoogle,
    signInWithPhoneOtp,
    verifyOtp,
  } = useAuth();

  const [step, setStep] = useState<AuthStep>('input');
  const [activeMethod, setActiveMethod] = useState<ActiveMethod>(null);
  const [errorKey, setErrorKey] = useState<string | null>(null);
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [countryCode, setCountryCode] = useState('+880');
  const [otpCode, setOtpCode] = useState('');
  const [otpTarget, setOtpTarget] = useState<OtpTarget | null>(null);
  const [resendSeconds, setResendSeconds] = useState(0);

  useEffect(() => {
    if (step !== 'verify' || resendSeconds <= 0) {
      return undefined;
    }

    const timer = setTimeout(() => {
      setResendSeconds((current) => Math.max(current - 1, 0));
    }, 1000);

    return () => clearTimeout(timer);
  }, [resendSeconds, step]);

  useEffect(() => {
    if (!isAuthenticated || isLoading) {
      return;
    }

    const pendingAction = consumePendingAuthenticatedAction();

    if (pendingAction) {
      pendingAction();
    }

    if (typeof returnTo === 'string' && returnTo.length > 0) {
      router.replace(returnTo as Href);
      return;
    }

    router.replace('/(tabs)');
  }, [isAuthenticated, isLoading, returnTo, router]);

  const countryOptions = useMemo<SelectOption[]>(
    () => [
      { label: t('auth.country.bd'), value: '+880' },
      { label: t('auth.country.in'), value: '+91' },
      { label: t('auth.country.sa'), value: '+966' },
      { label: t('auth.country.ae'), value: '+971' },
      { label: t('auth.country.uk'), value: '+44' },
      { label: t('auth.country.us'), value: '+1' },
      { label: t('auth.country.pk'), value: '+92' },
    ],
    [t],
  );

  const currentError = errorKey ? t(errorKey) : null;

  function handleSkip() {
    if (typeof returnTo === 'string' && returnTo.length > 0) {
      router.replace(returnTo as Href);
      return;
    }

    router.replace('/(tabs)');
  }

  async function startEmailOtp() {
    const normalizedEmail = email.trim().toLowerCase();

    if (!EMAIL_REGEX.test(normalizedEmail)) {
      setErrorKey('auth.error.invalidEmail');
      return;
    }

    setActiveMethod('email');
    setErrorKey(null);

    const result = await signInWithEmailOtp(normalizedEmail);

    setActiveMethod(null);

    if (!result.success) {
      setErrorKey(result.errorKey ?? 'auth.error.generic');
      return;
    }

    setOtpTarget({
      type: 'email',
      email: normalizedEmail,
      destinationLabel: normalizedEmail,
    });
    setOtpCode('');
    setResendSeconds(60);
    setStep('verify');
  }

  async function startPhoneOtp() {
    const normalizedPhone = `${countryCode}${digitsOnly(phone)}`;

    if (digitsOnly(phone).length < 6) {
      setErrorKey('auth.error.invalidPhone');
      return;
    }

    setActiveMethod('phone');
    setErrorKey(null);

    const result = await signInWithPhoneOtp(normalizedPhone);

    setActiveMethod(null);

    if (!result.success) {
      setErrorKey(result.errorKey ?? 'auth.error.generic');
      return;
    }

    setOtpTarget({
      type: 'sms',
      phone: normalizedPhone,
      destinationLabel: normalizedPhone,
    });
    setOtpCode('');
    setResendSeconds(60);
    setStep('verify');
  }

  async function handleResend() {
    if (!otpTarget || resendSeconds > 0) {
      return;
    }

    setActiveMethod('resend');
    setErrorKey(null);

    const result =
      otpTarget.type === 'email' && otpTarget.email
        ? await signInWithEmailOtp(otpTarget.email)
        : await signInWithPhoneOtp(otpTarget.phone ?? '');

    setActiveMethod(null);

    if (!result.success) {
      setErrorKey(result.errorKey ?? 'auth.error.generic');
      return;
    }

    setResendSeconds(60);
  }

  async function handleVerify(nextCode = otpCode) {
    if (!otpTarget) {
      return;
    }

    if (nextCode.length !== 6) {
      setErrorKey('auth.error.codeLength');
      return;
    }

    setActiveMethod('verify');
    setErrorKey(null);

    const result = await verifyOtp({
      email: otpTarget.email,
      phone: otpTarget.phone,
      token: nextCode,
      type: otpTarget.type,
    });

    setActiveMethod(null);

    if (!result.success) {
      setErrorKey(result.errorKey ?? 'auth.error.generic');
    }
  }

  async function handleGoogle() {
    setActiveMethod('google');
    setErrorKey(null);

    const result = await signInWithGoogle();

    setActiveMethod(null);

    if (!result.success && result.errorKey !== 'auth.error.cancelled') {
      setErrorKey(result.errorKey ?? 'auth.error.generic');
    }
  }

  async function handleApple() {
    setActiveMethod('apple');
    setErrorKey(null);

    const result = await signInWithApple();

    setActiveMethod(null);

    if (!result.success && result.errorKey !== 'auth.error.cancelled') {
      setErrorKey(result.errorKey ?? 'auth.error.generic');
    }
  }

  return (
    <ScreenContainer contentClassName="justify-center py-8">
      <View className="mb-8 items-center">
        <View className="mb-4 h-20 w-20 items-center justify-center rounded-full bg-primary-soft">
          <Mosque color={colors.primary} size={36} weight="fill" />
        </View>
        <Text className="text-center font-sans-bold text-3xl text-text-primary">
          {t('auth.login.brand')}
        </Text>
        <Text className="mt-2 max-w-[280px] text-center font-sans text-base text-text-secondary">
          {t('auth.login.subtitle')}
        </Text>
      </View>

      <Card className="border border-border px-4 py-5" variant="outlined">
        {currentError ? (
          <Text
            accessibilityLiveRegion="polite"
            accessibilityRole="alert"
            className="mb-4 rounded-md border border-danger px-3 py-2 font-sans text-sm text-danger"
          >
            {currentError}
          </Text>
        ) : null}

        {step === 'input' ? (
          <View className="gap-5">
            <View className="gap-3">
              <Input
                accessibilityLabel={t('auth.login.emailLabel')}
                autoCapitalize="none"
                autoCorrect={false}
                keyboardType="email-address"
                label={t('auth.login.emailLabel')}
                leftIcon={<EnvelopeSimple color={colors.textSecondary} size={18} weight="regular" />}
                onChangeText={setEmail}
                placeholder={t('auth.login.emailPlaceholder')}
                value={email}
              />
              <Button
                fullWidth
                loading={activeMethod === 'email'}
                onPress={() => void startEmailOtp()}
              >
                {t('auth.login.emailButton')}
              </Button>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="font-sans text-sm text-text-tertiary">{t('auth.login.divider')}</Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <View className="gap-3">
              <Select
                label={t('auth.login.countryCodeLabel')}
                onValueChange={setCountryCode}
                options={countryOptions}
                placeholder={t('auth.login.countryCodePlaceholder')}
                selectedValue={countryCode}
              />
              <Input
                accessibilityLabel={t('auth.login.phoneLabel')}
                keyboardType="phone-pad"
                label={t('auth.login.phoneLabel')}
                leftIcon={<Phone color={colors.textSecondary} size={18} weight="regular" />}
                onChangeText={setPhone}
                placeholder={t('auth.login.phonePlaceholder')}
                value={phone}
              />
              <Button
                fullWidth
                loading={activeMethod === 'phone'}
                onPress={() => void startPhoneOtp()}
              >
                {t('auth.login.phoneButton')}
              </Button>
            </View>

            <View className="flex-row items-center gap-3">
              <View className="h-px flex-1 bg-border" />
              <Text className="font-sans text-sm text-text-tertiary">{t('auth.login.divider')}</Text>
              <View className="h-px flex-1 bg-border" />
            </View>

            <View className="gap-3">
              <Button
                fullWidth
                leftIcon={<GoogleLogo color={colors.textPrimary} size={18} weight="regular" />}
                loading={activeMethod === 'google'}
                onPress={() => void handleGoogle()}
                variant="secondary"
              >
                {t('auth.login.googleButton')}
              </Button>
              {Platform.OS === 'ios' ? (
                <Button
                  fullWidth
                  leftIcon={<AppleLogo color={colors.textPrimary} size={18} weight="fill" />}
                  loading={activeMethod === 'apple'}
                  onPress={() => void handleApple()}
                  variant="secondary"
                >
                  {t('auth.login.appleButton')}
                </Button>
              ) : null}
            </View>
          </View>
        ) : (
          <View className="gap-4">
            <View>
              <Text className="font-sans-bold text-xl text-text-primary">
                {t('auth.otp.title')}
              </Text>
              <Text className="mt-1 font-sans text-sm text-text-secondary">
                {t('auth.otp.subtitle', { destination: otpTarget?.destinationLabel ?? '' })}
              </Text>
            </View>

            <Input
              accessibilityLabel={t('auth.otp.codeLabel')}
              inputClassName="text-center font-mono text-2xl tracking-[8px]"
              keyboardType="number-pad"
              label={t('auth.otp.codeLabel')}
              maxLength={6}
              onChangeText={(value) => {
                const nextValue = digitsOnly(value).slice(0, 6);
                setOtpCode(nextValue);

                if (nextValue.length === 6 && activeMethod !== 'verify') {
                  void handleVerify(nextValue);
                }
              }}
              placeholder={t('auth.otp.codePlaceholder')}
              textAlign="center"
              value={otpCode}
            />

            <Button
              fullWidth
              loading={activeMethod === 'verify'}
              onPress={() => void handleVerify()}
            >
              {t('auth.otp.verifyButton')}
            </Button>

            <Pressable
              accessibilityLabel={t('auth.otp.back')}
              accessibilityRole="button"
              className="flex-row items-center justify-center gap-2 py-1"
              onPress={() => {
                setStep('input');
                setOtpCode('');
                setErrorKey(null);
              }}
            >
              <ArrowLeft color={colors.textSecondary} size={16} weight="regular" />
              <Text className="font-sans-medium text-sm text-text-secondary">
                {t('auth.otp.back')}
              </Text>
            </Pressable>

            <Button
              fullWidth
              disabled={resendSeconds > 0}
              loading={activeMethod === 'resend'}
              onPress={() => void handleResend()}
              variant="ghost"
            >
              {resendSeconds > 0
                ? t('auth.otp.resendIn', { seconds: resendSeconds })
                : t('auth.otp.resend')}
            </Button>
          </View>
        )}
      </Card>

      <Pressable
        accessibilityLabel={t('auth.login.skip')}
        accessibilityRole="button"
        className="mt-4 flex-row items-center justify-center gap-2 py-2"
        onPress={handleSkip}
      >
        <ArrowLeft color={colors.textSecondary} size={16} weight="regular" />
        <Text className="font-sans-medium text-sm text-text-secondary">{t('auth.login.skip')}</Text>
      </Pressable>
    </ScreenContainer>
  );
}
