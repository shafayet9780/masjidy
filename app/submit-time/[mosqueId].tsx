import { useNavigation } from '@react-navigation/native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Warning } from 'phosphor-react-native';
import React, { useCallback, useEffect, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { SubmissionForm } from '@/components/mosque/SubmissionForm';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Skeleton } from '@/components/ui/Skeleton';
import { useAuth } from '@/hooks/useAuth';
import { useTheme } from '@/hooks/useTheme';
import { supabase } from '@/services/supabase';
import type { PrayerType } from '@/types/mosque';

export default function SubmitTimeScreen() {
  const { mosqueId, prayer: prayerParam } = useLocalSearchParams<{
    mosqueId: string;
    prayer?: string;
  }>();
  const id = typeof mosqueId === 'string' ? mosqueId.trim() : '';
  const initialPrayer =
    prayerParam === 'fajr' ||
    prayerParam === 'dhuhr' ||
    prayerParam === 'asr' ||
    prayerParam === 'maghrib' ||
    prayerParam === 'isha' ||
    prayerParam === 'jumuah'
      ? (prayerParam as PrayerType)
      : undefined;

  const { t } = useTranslation();
  const { colors } = useTheme();
  const router = useRouter();
  const navigation = useNavigation();
  const { isAuthenticated, isLoading: authLoading } = useAuth();

  const [mosqueName, setMosqueName] = useState<string | null>(null);
  const [loadError, setLoadError] = useState<string | null>(null);
  const [mosqueLoading, setMosqueLoading] = useState(true);

  useLayoutEffect(() => {
    navigation.setOptions({
      headerTitle: mosqueName ?? t('submit.title'),
    });
  }, [navigation, mosqueName, t]);

  useEffect(() => {
    if (authLoading) return;
    if (!isAuthenticated) {
      router.replace({
        pathname: '/auth/login',
        params: { returnTo: id ? `/submit-time/${id}` : '/(tabs)' },
      });
    }
  }, [authLoading, id, isAuthenticated, router]);

  const loadMosque = useCallback(async () => {
    if (!id) {
      setMosqueLoading(false);
      setLoadError('NOT_FOUND');
      return;
    }
    setMosqueLoading(true);
    setLoadError(null);
    const { data, error } = await supabase.from('mosques').select('name').eq('id', id).maybeSingle();
    if (error) {
      setLoadError(error.message);
      setMosqueName(null);
    } else if (!data) {
      setLoadError('NOT_FOUND');
      setMosqueName(null);
    } else {
      setMosqueName(data.name);
    }
    setMosqueLoading(false);
  }, [id]);

  useEffect(() => {
    void loadMosque();
  }, [loadMosque]);

  const onSuccess = useCallback(() => {
    setTimeout(() => {
      router.back();
    }, 1600);
  }, [router]);

  if (!id) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={<Warning size={48} weight="regular" color={colors.warning} />}
          title={t('mosque.profile.error.notFound')}
          subtitle={t('mosque.profile.error.subtitle')}
        />
      </ScreenContainer>
    );
  }

  if (authLoading || !isAuthenticated) {
    return (
      <ScreenContainer scroll={false}>
        <View className="gap-3 py-4">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </View>
      </ScreenContainer>
    );
  }

  if (mosqueLoading) {
    return (
      <ScreenContainer scroll={false}>
        <View className="gap-3 py-4">
          <Skeleton className="h-6 w-3/4 rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
          <Skeleton className="h-12 w-full rounded-md" />
        </View>
      </ScreenContainer>
    );
  }

  if (loadError === 'NOT_FOUND' || !mosqueName) {
    return (
      <ScreenContainer>
        <EmptyState
          icon={<Warning size={48} weight="regular" color={colors.warning} />}
          title={t('mosque.profile.error.notFound')}
          subtitle={t('mosque.profile.error.subtitle')}
        />
        <Button variant="secondary" onPress={() => router.back()} accessibilityLabel={t('mosques.list.error.retry')}>
          {t('mosques.list.error.retry')}
        </Button>
      </ScreenContainer>
    );
  }

  if (loadError) {
    return (
      <ScreenContainer>
        <Text className="mb-4 font-sans text-text-secondary">{loadError}</Text>
        <Button variant="primary" onPress={() => void loadMosque()} accessibilityLabel={t('mosques.list.error.retry')}>
          {t('mosques.list.error.retry')}
        </Button>
      </ScreenContainer>
    );
  }

  return (
    <ScreenContainer>
      <SubmissionForm
        mosqueId={id}
        mosqueName={mosqueName}
        initialPrayer={initialPrayer}
        onSuccess={onSuccess}
      />
    </ScreenContainer>
  );
}
