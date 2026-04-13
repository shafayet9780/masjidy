import * as Haptics from 'expo-haptics';
import * as Location from 'expo-location';
import { Check, UserCheck } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';
import { useConfirmMosque } from '@/hooks/useConfirmMosque';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTheme } from '@/hooks/useTheme';

export interface ConfirmMosqueButtonProps {
  mosqueId: string;
  initialConfirmationCount: number;
  /** Called after a successful confirm so the parent can refetch mosque row. */
  onConfirmed?: () => void;
}

function formatConfirmDate(iso: string, locale: string): string {
  const t = Date.parse(iso);
  if (Number.isNaN(t)) {
    return '';
  }
  return new Intl.DateTimeFormat(locale, { dateStyle: 'medium' }).format(new Date(t));
}

export function ConfirmMosqueButton({
  mosqueId,
  initialConfirmationCount,
  onConfirmed,
}: ConfirmMosqueButtonProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();
  const { requireAuth } = useRequireAuth();
  const {
    confirmMosqueAtLocation,
    isLoading,
    error,
    clearError,
    lastConfirmedAt,
    isOnCooldown,
  } = useConfirmMosque({ mosqueId });

  const [count, setCount] = useState(initialConfirmationCount);
  const [toastVisible, setToastVisible] = useState(false);

  useEffect(() => {
    setCount(initialConfirmationCount);
  }, [initialConfirmationCount]);

  const onPress = useCallback(() => {
    clearError();
    requireAuth(() => {
      void (async () => {
        try {
          const pos = await Location.getCurrentPositionAsync({
            accuracy: Location.Accuracy.Balanced,
          });
          void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
          const result = await confirmMosqueAtLocation({
            latitude: pos.coords.latitude,
            longitude: pos.coords.longitude,
          });
          setCount(result.confirmation_count);
          setToastVisible(true);
          setTimeout(() => {
            setToastVisible(false);
          }, 3200);
          onConfirmed?.();
        } catch {
          void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
        }
      })();
    });
  }, [clearError, confirmMosqueAtLocation, onConfirmed, requireAuth]);

  const cooldownLabel =
    lastConfirmedAt != null
      ? t('confirm.button.cooldown', {
          date: formatConfirmDate(lastConfirmedAt, i18n.language),
        })
      : t('confirm.button.cooldownShort');

  const errorMessage =
    error != null ? t(`error.${error}`, { defaultValue: t('error.generic') }) : null;

  const blocked = isOnCooldown || isLoading;

  return (
    <View className="w-full gap-2">
      <Text
        className="font-sans text-sm text-text-secondary"
        accessibilityRole="text"
      >
        {t('confirm.summary', { count })}
      </Text>
      {lastConfirmedAt != null && isOnCooldown ? (
        <Text className="font-sans text-xs text-text-tertiary" accessibilityRole="text">
          {cooldownLabel}
        </Text>
      ) : null}
      <Button
        variant="secondary"
        size="md"
        fullWidth
        className="min-h-[48px]"
        loading={isLoading}
        disabled={blocked}
        leftIcon={
          isOnCooldown ? (
            <Check size={20} weight="regular" color={colors.textTertiary} />
          ) : (
            <UserCheck size={20} weight="regular" color={colors.textPrimary} />
          )
        }
        onPress={onPress}
        accessibilityLabel={
          isOnCooldown ? cooldownLabel : t('confirm.button.available')
        }
        accessibilityState={{ disabled: blocked }}
      >
        {isOnCooldown ? cooldownLabel : t('confirm.button.available')}
      </Button>
      {toastVisible ? (
        <View
          className="rounded-md bg-primary-soft px-3 py-2"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text className="text-center font-sans text-sm text-text-primary">
            {t('confirm.toast.success')}
          </Text>
        </View>
      ) : null}
      {errorMessage != null ? (
        <Text className="font-sans text-sm text-danger" accessibilityRole="alert">
          {errorMessage}
        </Text>
      ) : null}
    </View>
  );
}
