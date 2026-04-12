import { ShieldSlash } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { TrustBadge } from '@/components/mosque/TrustBadge';
import { useTheme } from '@/hooks/useTheme';
import { formatJamatTime, prayerTranslationKey } from '@/lib/formatters';
import type { JamatTime, PrayerType } from '@/types/mosque';

export interface PrayerTimeRowProps {
  prayer: PrayerType;
  jamatTime: JamatTime | null;
  onAddTime?: () => void;
  isLast?: boolean;
}

export function PrayerTimeRow({ prayer, jamatTime, onAddTime, isLast = false }: PrayerTimeRowProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const prayerLabel = t(prayerTranslationKey(prayer));
  const isEmpty = jamatTime == null;
  const isStale = jamatTime != null && jamatTime.trust_score < 10;
  const timeDisplay = jamatTime != null ? formatJamatTime(jamatTime.time, i18n.language) : t('mosque.profile.emptyTime');

  let a11yLabel: string;
  if (isEmpty) {
    a11yLabel = `${prayerLabel}, ${t('mosque.profile.emptyTime')}, ${t('mosque.profile.noTimeBadge')}`;
  } else {
    const trustKey =
      jamatTime.trust_score >= 80
        ? 'trustBadge.verified'
        : jamatTime.trust_score >= 50
          ? 'trustBadge.community'
          : jamatTime.trust_score >= 10
            ? 'trustBadge.unverified'
            : 'trustBadge.stale';
    a11yLabel = `${prayerLabel}, ${timeDisplay}, ${t(trustKey)}`;
  }

  const showAddCta = isEmpty && onAddTime != null;
  const showVerifyCta = isStale && onAddTime != null;

  return (
    <View
      className={`min-h-[44px] py-2 ${isLast ? '' : 'border-b border-border'}`}
      accessibilityRole="none"
      accessibilityLabel={a11yLabel}
    >
      <View className="flex-row items-center gap-2">
        <Text
          className="min-w-0 flex-1 font-sans-medium text-base text-text-primary"
          numberOfLines={1}
          accessibilityRole="text"
        >
          {prayerLabel}
        </Text>
        <Text
          className={`w-[88px] text-end font-mono text-lg tabular-nums ${
            isStale ? 'text-danger' : isEmpty ? 'text-text-tertiary' : 'text-text-primary'
          }`}
          style={{ writingDirection: 'ltr' }}
          accessibilityRole="text"
        >
          {timeDisplay}
        </Text>
        <View className="max-w-[120px] shrink-0 items-end">
          {isEmpty ? (
            <View className="flex-row items-center gap-1" accessibilityRole="text">
              <ShieldSlash size={16} weight="regular" color={colors.textTertiary} />
              <Text className="font-sans text-xs text-text-tertiary">{t('mosque.profile.noTimeBadge')}</Text>
            </View>
          ) : (
            <TrustBadge score={jamatTime.trust_score} size="sm" />
          )}
        </View>
      </View>
      {showAddCta ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mosque.profile.addTimeCta')}
          className="mt-2 min-h-[44px] justify-center self-start py-1"
          onPress={onAddTime}
        >
          <Text className="font-sans-medium text-sm text-primary">{t('mosque.profile.addTimeCta')}</Text>
        </Pressable>
      ) : null}
      {showVerifyCta ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mosque.profile.verifyNow')}
          className="mt-2 min-h-[44px] justify-center self-start py-1"
          onPress={onAddTime}
        >
          <Text className="font-sans-medium text-sm text-danger">{t('mosque.profile.verifyNow')}</Text>
        </Pressable>
      ) : null}
    </View>
  );
}
