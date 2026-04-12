import { ShieldCheck, ShieldSlash, Users, Warning } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface TrustBadgeProps {
  score: number;
  size?: 'sm' | 'md';
}

export function TrustBadge({ score, size = 'sm' }: TrustBadgeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const iconSize = size === 'md' ? 18 : 16;

  const variant =
    score >= 80 ? 'verified' : score >= 50 ? 'community' : score >= 10 ? 'unverified' : 'stale';

  const labelKey =
    variant === 'verified'
      ? 'trustBadge.verified'
      : variant === 'community'
        ? 'trustBadge.community'
        : variant === 'unverified'
          ? 'trustBadge.unverified'
          : 'trustBadge.stale';

  const iconColor =
    variant === 'verified'
      ? colors.success
      : variant === 'community'
        ? colors.warning
        : variant === 'unverified'
          ? colors.textTertiary
          : colors.danger;

  const colorClass =
    variant === 'verified'
      ? 'text-success'
      : variant === 'community'
        ? 'text-warning'
        : variant === 'unverified'
          ? 'text-text-tertiary'
          : 'text-danger';

  const icon =
    variant === 'verified' ? (
      <ShieldCheck size={iconSize} weight="fill" color={iconColor} />
    ) : variant === 'community' ? (
      <Users size={iconSize} weight="regular" color={iconColor} />
    ) : variant === 'unverified' ? (
      <ShieldSlash size={iconSize} weight="regular" color={iconColor} />
    ) : (
      <Warning size={iconSize} weight="regular" color={iconColor} />
    );

  return (
    <View className="flex-row items-center gap-1" accessibilityRole="text">
      {icon}
      <Text className={`font-sans text-xs ${colorClass}`}>{t(labelKey)}</Text>
    </View>
  );
}
