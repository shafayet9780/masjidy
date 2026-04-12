import { useNavigation } from '@react-navigation/native';
import type { Href } from 'expo-router';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Building, MapPin, Phone, Plus, Warning } from 'phosphor-react-native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Image, Linking, Pressable, RefreshControl, Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { CheckInButton } from '@/components/mosque/CheckInButton';
import { ConfirmMosqueButton } from '@/components/mosque/ConfirmMosqueButton';
import { FacilityChip } from '@/components/mosque/FacilityChip';
import { FollowButton } from '@/components/mosque/FollowButton';
import { PrayerTimeTable } from '@/components/mosque/PrayerTimeTable';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { FACILITY_KEYS } from '@/constants/facilities';
import { useMosqueProfile } from '@/hooks/useMosqueProfile';
import { useTheme } from '@/hooks/useTheme';
import type { Mosque, PrayerType } from '@/types/mosque';

function orderedFacilityKeys(facilities: Mosque['facilities']): string[] {
  const active = Object.entries(facilities)
    .filter(([, v]) => v === true)
    .map(([k]) => k);
  const preset = FACILITY_KEYS.filter((k) => active.includes(k));
  const rest = active.filter((k) => !(FACILITY_KEYS as readonly string[]).includes(k));
  return [...preset, ...rest];
}

function resolveParamId(id: string | string[] | undefined): string {
  if (typeof id === 'string') {
    return id.trim();
  }
  if (Array.isArray(id) && id[0] != null) {
    return String(id[0]).trim();
  }
  return '';
}

export default function MosqueProfileScreen() {
  const { id } = useLocalSearchParams<{ id: string | string[] }>();
  const rawId = resolveParamId(id);
  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { mosque, jamatTimes, isLoading, error, refetch } = useMosqueProfile(rawId);
  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: mosque?.name ?? (isLoading ? t('mosque.profile.loading') : ''),
      headerRight: () => (rawId ? <FollowButton mosqueId={rawId} /> : null),
    });
  }, [navigation, mosque?.name, isLoading, rawId, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [refetch]);

  const goSubmitTime = useCallback(
    (prayer?: PrayerType) => {
      if (!rawId) {
        return;
      }
      router.push({
        pathname: '/submit-time/[mosqueId]',
        params: prayer != null ? { mosqueId: rawId, prayer } : { mosqueId: rawId },
      } as Href);
    },
    [rawId, router],
  );

  if (!rawId) {
    return (
      <ScreenContainer scroll={false} className="bg-surface">
        <EmptyState
          icon={<Warning size={48} weight="regular" color={colors.warning} />}
          title={t('mosque.profile.error.notFound')}
          subtitle={t('mosque.profile.error.subtitle')}
        />
      </ScreenContainer>
    );
  }

  if (isLoading && mosque == null) {
    return (
      <ScreenContainer
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <Skeleton height={192} className="w-full rounded-md" borderRadius={12} />
        <Skeleton height={28} className="mt-6 w-3/4" />
        <Skeleton height={18} className="mt-3 w-full" />
        <Skeleton height={18} className="mt-2 w-5/6" />
        <View className="mt-8 gap-3">
          <Skeleton height={24} className="w-1/2" />
          <Skeleton height={220} className="w-full rounded-md" borderRadius={12} />
        </View>
        <Skeleton height={48} className="mt-8 w-full rounded-md" borderRadius={12} />
        <Skeleton height={48} className="mt-3 w-full rounded-md" borderRadius={12} />
      </ScreenContainer>
    );
  }

  if (error != null || mosque == null) {
    const isNotFound = error === 'NOT_FOUND';
    return (
      <ScreenContainer
        contentClassName="min-h-[520px] flex-grow justify-center"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <EmptyState
          icon={<Warning size={48} weight="regular" color={colors.warning} />}
          title={isNotFound ? t('mosque.profile.error.notFound') : t('mosque.profile.error.title')}
          subtitle={isNotFound ? undefined : t('mosque.profile.error.subtitle')}
          ctaLabel={t('mosque.profile.error.retry')}
          onCtaPress={() => {
            void refetch();
          }}
        />
      </ScreenContainer>
    );
  }

  const facilityKeys = orderedFacilityKeys(mosque.facilities);

  return (
    <ScreenContainer
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      {mosque.photo_url ? (
        <View className="aspect-video w-full overflow-hidden rounded-md bg-surface-muted">
          <Image
            accessibilityRole="image"
            accessibilityLabel={mosque.name}
            className="h-full w-full"
            resizeMode="cover"
            source={{ uri: mosque.photo_url }}
          />
        </View>
      ) : (
        <View
          className="aspect-video w-full items-center justify-center rounded-md bg-surface-muted"
          accessibilityRole="image"
          accessibilityLabel={t('mosque.profile.noPhoto')}
        >
          <Building size={64} weight="light" color={colors.textTertiary} />
        </View>
      )}

      <Text
        className="mt-6 font-sans-bold text-2xl text-text-primary"
        accessibilityRole="header"
      >
        {mosque.name}
      </Text>

      <View className="mt-3 flex-row items-start gap-2">
        <MapPin size={18} weight="regular" color={colors.textSecondary} style={{ marginTop: 2 }} />
        <Text className="min-w-0 flex-1 font-sans text-base text-text-secondary" accessibilityRole="text">
          {mosque.address}
        </Text>
      </View>

      {mosque.contact_phone ? (
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={t('mosque.profile.callPhone')}
          className="mt-3 min-h-[44px] flex-row items-center gap-2 py-2"
          onPress={() => {
            void Linking.openURL(`tel:${mosque.contact_phone}`);
          }}
        >
          <Phone size={18} weight="regular" color={colors.primary} />
          <Text className="font-sans-medium text-base text-primary">{t('mosque.profile.callPhone')}</Text>
        </Pressable>
      ) : null}

      {(mosque.madhab != null && mosque.madhab.trim() !== '') ||
      (mosque.khutbah_language != null && mosque.khutbah_language.trim() !== '') ? (
        <View className="mt-2 flex-row flex-wrap gap-2">
          {mosque.madhab != null && mosque.madhab.trim() !== '' ? (
            <View className="rounded-sm bg-primary-soft px-3 py-1">
              <Text className="font-sans text-sm text-text-primary" accessibilityRole="text">
                {t('mosque.profile.madhab', { value: mosque.madhab })}
              </Text>
            </View>
          ) : null}
          {mosque.khutbah_language != null && mosque.khutbah_language.trim() !== '' ? (
            <View className="rounded-sm bg-accent-soft px-3 py-1">
              <Text className="font-sans text-sm text-text-secondary" accessibilityRole="text">
                {t('mosque.profile.khutbah', { language: mosque.khutbah_language })}
              </Text>
            </View>
          ) : null}
        </View>
      ) : null}

      {mosque.confirmation_count > 0 ? (
        <Text className="mt-3 font-sans text-sm text-text-tertiary" accessibilityRole="text">
          {t('mosque.profile.confirmed', { count: mosque.confirmation_count })}
        </Text>
      ) : null}

      <View className="mt-8">
        <PrayerTimeTable jamatTimes={jamatTimes} onAddTime={goSubmitTime} />
      </View>

      {facilityKeys.length > 0 ? (
        <View className="mt-8 gap-3">
          <Text className="font-sans-semibold text-xl text-text-primary" accessibilityRole="header">
            {t('mosque.profile.facilities')}
          </Text>
          <View className="-mx-1 flex-row flex-wrap gap-2 px-1">
            {facilityKeys.map((key) => (
              <FacilityChip key={key} facility={key} />
            ))}
          </View>
        </View>
      ) : null}

      <View className="mt-10 gap-3">
        <CheckInButton mosqueId={mosque.id} />
        <ConfirmMosqueButton mosqueId={mosque.id} />
      </View>

      <View className="mt-6 pb-4">
        <Button
          variant="ghost"
          size="md"
          fullWidth
          leftIcon={<Plus size={20} weight="regular" color={colors.primary} />}
          onPress={() => {
            goSubmitTime();
          }}
          accessibilityLabel={t('mosque.profile.submitTime')}
        >
          {t('mosque.profile.submitTime')}
        </Button>
      </View>
    </ScreenContainer>
  );
}
