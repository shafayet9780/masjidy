import { ShieldCheck, ShieldSlash, Users, Warning } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';
import { tv } from 'tailwind-variants';

import { useTheme } from '@/hooks/useTheme';

const badgeRoot = tv({
  base: 'flex-row items-center gap-1 rounded-sm px-2 py-0.5',
  variants: {
    variant: {
      verified: 'bg-success/15',
      community: 'bg-warning/15',
      unverified: 'bg-surface-muted',
      stale: 'bg-danger/15',
    },
    size: {
      sm: 'px-1.5 py-0.5',
      md: 'px-2 py-1',
    },
  },
  defaultVariants: {
    variant: 'verified',
    size: 'md',
  },
});

const badgeLabel = tv({
  base: 'font-sans-medium',
  variants: {
    variant: {
      verified: 'text-success',
      community: 'text-warning',
      unverified: 'text-text-tertiary',
      stale: 'text-danger',
    },
    size: {
      sm: 'text-2xs',
      md: 'text-xs',
    },
  },
  defaultVariants: {
    variant: 'verified',
    size: 'md',
  },
});

export type TrustBadgeVariant = 'verified' | 'community' | 'unverified' | 'stale';
export type BadgeSize = 'sm' | 'md';

export interface BadgeProps {
  variant: TrustBadgeVariant;
  size?: BadgeSize;
  className?: string;
}

const ICON_SIZE = { sm: 14 as const, md: 16 as const };

export function Badge({ variant, size = 'md', className }: BadgeProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const iconSize = ICON_SIZE[size];

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

  const icon =
    variant === 'verified' ? (
      <ShieldCheck color={iconColor} size={iconSize} weight="fill" />
    ) : variant === 'community' ? (
      <Users color={iconColor} size={iconSize} weight="regular" />
    ) : variant === 'unverified' ? (
      <ShieldSlash color={iconColor} size={iconSize} weight="regular" />
    ) : (
      <Warning color={iconColor} size={iconSize} weight="regular" />
    );

  return (
    <View
      accessibilityLabel={t(labelKey)}
      accessibilityRole="text"
      accessible
      className={badgeRoot({ variant, size, class: className })}
    >
      {icon}
      <Text className={badgeLabel({ variant, size })}>{t(labelKey)}</Text>
    </View>
  );
}
