import * as Haptics from 'expo-haptics';
import { UserCheck } from 'phosphor-react-native';
import React, { useCallback } from 'react';
import { useTranslation } from 'react-i18next';

import { Button } from '@/components/ui/Button';
import { useRequireAuth } from '@/hooks/useRequireAuth';
import { useTheme } from '@/hooks/useTheme';

export interface ConfirmMosqueButtonProps {
  mosqueId: string;
}

export function ConfirmMosqueButton({ mosqueId }: ConfirmMosqueButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { requireAuth } = useRequireAuth();
  void mosqueId;

  const onPress = useCallback(() => {
    requireAuth(() => {
      void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      // FR-008B: invoke confirm-mosque Edge Function via useConfirmMosque (use mosqueId in payload)
    });
  }, [requireAuth]);

  return (
    <Button
      variant="secondary"
      size="md"
      fullWidth
      leftIcon={<UserCheck size={20} weight="regular" color={colors.textPrimary} />}
      onPress={onPress}
      accessibilityLabel={t('mosque.profile.confirmMosque')}
    >
      {t('mosque.profile.confirmMosque')}
    </Button>
  );
}
