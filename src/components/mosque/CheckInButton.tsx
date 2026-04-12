import * as Haptics from 'expo-haptics';
import { CheckCircle } from 'phosphor-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTheme } from '@/hooks/useTheme';

export interface CheckInButtonProps {
  mosqueId: string;
}

export function CheckInButton({ mosqueId }: CheckInButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { requireAuth } = useRequireAuth();
  void mosqueId;

  const onPress = useCallback(() => {
    requireAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      // FR-008: invoke check-in Edge Function via useCheckIn (use mosqueId in payload)
    });
  }, [requireAuth]);

  return (
    <Button
      variant="primary"
      size="lg"
      fullWidth
      leftIcon={<CheckCircle size={22} weight="regular" color={colors.surface} />}
      onPress={onPress}
      accessibilityLabel={t('mosque.profile.checkIn')}
    >
      {t('mosque.profile.checkIn')}
    </Button>
  );
}
