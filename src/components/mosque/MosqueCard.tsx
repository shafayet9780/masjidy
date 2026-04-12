import { MapPin, Mosque } from 'phosphor-react-native';
import React, { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { FacilityChip } from '@/components/mosque/FacilityChip';
import { FollowButton } from '@/components/mosque/FollowButton';
import { TrustBadge } from '@/components/mosque/TrustBadge';
import { Card } from '@/components/ui/Card';
import { FACILITY_KEYS } from '@/constants/facilities';
import { useTheme } from '@/hooks/useTheme';
import { formatDistanceParts, formatJamatTime, prayerTranslationKey } from '@/lib/formatters';
import type { NearbyMosque } from '@/types/mosque';

export interface MosqueCardProps {
  mosque: NearbyMosque;
  onPress: (id: string) => void;
}

function orderedFacilityKeys(facilities: NearbyMosque['facilities']): string[] {
  const active = Object.entries(facilities)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  const preset = FACILITY_KEYS.filter((k) => active.includes(k));
  const rest = active.filter((k) => !(FACILITY_KEYS as readonly string[]).includes(k));
  return [...preset, ...rest];
}

export function MosqueCard({ mosque, onPress }: MosqueCardProps) {
  const { t, i18n } = useTranslation();
  const { colors } = useTheme();

  const facilityKeys = useMemo(() => orderedFacilityKeys(mosque.facilities), [mosque.facilities]);
  const visibleFacilities = facilityKeys.slice(0, 3);
  const overflow = facilityKeys.length > 3 ? facilityKeys.length - 3 : 0;

  const distanceParts = formatDistanceParts(mosque.distance_km);
  const distanceLabel =
    distanceParts.unit === 'm'
      ? t('format.distanceMeters', { meters: distanceParts.value })
      : t('format.distanceKm', { km: distanceParts.value });

  const timeStr =
    mosque.next_jamat_time != null ? formatJamatTime(mosque.next_jamat_time, i18n.language) : '';

  const prayerLabel =
    mosque.next_prayer != null ? t(prayerTranslationKey(mosque.next_prayer)) : '';

  const a11yParts = [
    mosque.name,
    t('mosques.card.a11yDistance', { distance: distanceLabel }),
    mosque.next_prayer && mosque.next_jamat_time
      ? t('mosques.card.a11yNext', { prayer: prayerLabel, time: timeStr })
      : '',
  ].filter(Boolean);

  return (
    <Card
      pressable
      variant="elevated"
      className="mb-0 p-4"
      onPress={() => onPress(mosque.id)}
      accessibilityRole="button"
      accessibilityLabel={a11yParts.join(', ')}
    >
      <View className="flex-row items-start gap-3">
        <Mosque size={24} weight="duotone" color={colors.primary} />
        <View className="min-w-0 flex-1">
          <View className="flex-row items-start justify-between gap-2">
            <Text
              className="flex-1 font-sans-semibold text-base text-text-primary"
              numberOfLines={2}
              accessibilityRole="text"
            >
              {mosque.name}
            </Text>
            <FollowButton mosqueId={mosque.id} />
          </View>
          <View className="mt-1 flex-row items-center gap-1">
            <MapPin size={18} weight="regular" color={colors.textSecondary} />
            <Text className="font-sans text-sm text-text-secondary" accessibilityRole="text">
              {t('mosques.card.distance', { distance: distanceLabel })}
            </Text>
          </View>
          {mosque.next_prayer != null && mosque.next_jamat_time != null ? (
            <View className="mt-3 rounded-sm bg-primary-soft px-3 py-2">
              <View className="flex-row flex-wrap items-center gap-x-2 gap-y-1">
                <Text className="font-sans text-sm text-text-primary">{prayerLabel}</Text>
                <Text className="font-sans text-sm text-text-tertiary">·</Text>
                <Text className="font-mono text-sm text-text-primary">{timeStr}</Text>
                {mosque.next_trust_score != null ? (
                  <>
                    <Text className="font-sans text-sm text-text-tertiary">·</Text>
                    <TrustBadge score={mosque.next_trust_score} />
                  </>
                ) : null}
                {mosque.is_tomorrow ? (
                  <View className="ms-1 rounded-sm bg-accent-soft px-2 py-0.5">
                    <Text className="font-sans text-xs text-text-secondary">
                      {t('mosques.list.tomorrow')}
                    </Text>
                  </View>
                ) : null}
              </View>
            </View>
          ) : null}
          {visibleFacilities.length > 0 ? (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              className="mt-3 -mx-1"
              contentContainerClassName="flex-row items-center gap-2 px-1"
            >
              {visibleFacilities.map((key) => (
                <FacilityChip key={key} facility={key} />
              ))}
              {overflow > 0 ? (
                <Pressable
                  accessibilityRole="text"
                  accessibilityLabel={t('mosques.card.moreFacilities', { count: overflow })}
                  className="rounded-sm bg-surface-muted px-2 py-1"
                >
                  <Text className="font-sans text-xs text-text-secondary">+{overflow}</Text>
                </Pressable>
              ) : null}
            </ScrollView>
          ) : null}
        </View>
      </View>
    </Card>
  );
}
