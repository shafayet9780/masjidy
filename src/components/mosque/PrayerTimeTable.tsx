import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { PrayerTimeRow } from '@/components/mosque/PrayerTimeRow';
import { Card } from '@/components/ui/Card';
import { PRAYER_ORDER } from '@/constants/prayers';
import type { JamatTime, PrayerType } from '@/types/mosque';

export interface PrayerTimeTableProps {
  jamatTimes: JamatTime[];
  onAddTime: (prayer: PrayerType) => void;
}

export function PrayerTimeTable({ jamatTimes, onAddTime }: PrayerTimeTableProps) {
  const { t } = useTranslation();

  const byPrayer = useMemo(() => {
    const map = new Map<PrayerType, JamatTime>();
    for (const j of jamatTimes) {
      map.set(j.prayer, j);
    }
    return map;
  }, [jamatTimes]);

  return (
    <View className="gap-2">
      <Text
        className="font-sans-semibold text-[20px] leading-[24px] text-text-primary"
        accessibilityRole="header"
      >
        {t('mosque.profile.schedule')}
      </Text>
      <Card variant="elevated" className="p-4">
        {PRAYER_ORDER.map((prayer, index) => (
          <PrayerTimeRow
            key={prayer}
            prayer={prayer}
            jamatTime={byPrayer.get(prayer) ?? null}
            onAddTime={() => {
              onAddTime(prayer);
            }}
            isLast={index === PRAYER_ORDER.length - 1}
          />
        ))}
      </Card>
    </View>
  );
}
