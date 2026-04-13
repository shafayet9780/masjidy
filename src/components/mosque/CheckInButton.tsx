import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Check, CheckCircle, Clock } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { Button } from '@/components/ui/Button';
import { LiveCount } from '@/components/mosque/LiveCount';
import { useCheckIn } from '@/hooks/useCheckIn';
import { useLocation } from '@/hooks/useLocation';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTheme } from '@/hooks/useTheme';
import { prayerTranslationKey } from '@/lib/formatters';
import type { PrayerType } from '@/types/mosque';

export interface CheckInButtonProps {
  mosqueId: string;
  /** Prayer in active check-in window, or null when outside all windows. */
  activePrayer: PrayerType | null;
}

export function CheckInButton({ mosqueId, activePrayer }: CheckInButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { requireAuth } = useRequireAuth();
  const { permissionStatus } = useLocation();
  const { checkIn, liveCount, isCheckedIn, isLoading, error, clearError } = useCheckIn({
    mosqueId,
    prayer: activePrayer,
  });

  const [successFlash, setSuccessFlash] = useState(false);
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useSharedValue(1);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      sub.remove();
    };
  }, []);

  const bounceStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const runSuccessAnimation = useCallback(() => {
    if (reduceMotion) {
      return;
    }
    scale.value = withSequence(
      withTiming(1.06, { duration: 150, easing: Easing.out(Easing.quad) }),
      withTiming(1, { duration: 200, easing: Easing.out(Easing.quad) }),
    );
  }, [reduceMotion, scale]);

  const onPress = useCallback(() => {
    clearError();
    requireAuth(() => {
      void (async () => {
        if (permissionStatus !== 'granted') {
          return;
        }
        let latest: { latitude: number; longitude: number };
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          latest = {
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          };
        } catch {
          return;
        }
        try {
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
          await checkIn(latest);
          setSuccessFlash(true);
          runSuccessAnimation();
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
          setTimeout(() => {
            setSuccessFlash(false);
          }, 2200);
        } catch {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      })();
    });
  }, [checkIn, clearError, permissionStatus, requireAuth, runSuccessAnimation]);

  const unavailable = activePrayer == null;
  const disabledAfterCheckIn = isCheckedIn && !successFlash;
  const blocked = unavailable || disabledAfterCheckIn || permissionStatus !== 'granted';

  const errorMessage =
    error != null
      ? error === 'DUPLICATE'
        ? t('error.checkInDuplicate')
        : t(`error.${error}`, { defaultValue: t('error.generic') })
      : null;

  const label = (() => {
    if (unavailable) {
      return t('checkIn.button.unavailable');
    }
    if (disabledAfterCheckIn) {
      return t('checkIn.button.disabled', { prayer: t(prayerTranslationKey(activePrayer)) });
    }
    if (successFlash) {
      return t('checkIn.button.success');
    }
    if (isLoading) {
      return t('checkIn.button.loading');
    }
    return t('checkIn.button.available');
  })();

  const leftIcon = (() => {
    if (unavailable) {
      return <Clock size={22} weight="regular" color={colors.textTertiary} />;
    }
    if (disabledAfterCheckIn) {
      return <Check size={22} weight="fill" color={colors.textTertiary} />;
    }
    if (successFlash) {
      return <Check size={22} weight="bold" color={colors.surface} />;
    }
    return <CheckCircle size={22} weight="regular" color={colors.surface} />;
  })();

  const variant = successFlash ? 'primary' : unavailable || disabledAfterCheckIn ? 'secondary' : 'primary';

  const extraButtonClass =
    successFlash
      ? 'min-h-[56px] border-0 bg-success'
      : unavailable || disabledAfterCheckIn
        ? 'min-h-[56px] opacity-70'
        : 'min-h-[56px]';

  return (
    <View className="w-full">
      {permissionStatus !== 'granted' ? (
        <Text
          className="mb-2 font-sans text-sm text-text-secondary"
          accessibilityRole="text"
        >
          {t('checkIn.needsLocation')}
        </Text>
      ) : null}
      <Animated.View style={reduceMotion ? undefined : bounceStyle} className="w-full">
        <Button
          variant={variant}
          size="lg"
          fullWidth
          loading={isLoading && !successFlash}
          disabled={blocked || isLoading}
          className={extraButtonClass}
          leftIcon={isLoading && !successFlash ? undefined : leftIcon}
          onPress={onPress}
          accessibilityLabel={label}
          accessibilityState={{ disabled: blocked || isLoading }}
        >
          {label}
        </Button>
      </Animated.View>
      {activePrayer != null ? <LiveCount count={liveCount} prayer={activePrayer} /> : null}
      {errorMessage != null ? (
        <Text className="mt-2 font-sans text-sm text-danger" accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
