import { useNavigation } from '@react-navigation/native';
import { router } from 'expo-router';
import { Heart, Warning } from 'phosphor-react-native';
import React, { useCallback, useLayoutEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { FlatList, RefreshControl, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MosqueCard } from '@/components/mosque/MosqueCard';
import { MosqueCardSkeleton } from '@/components/mosque/MosqueCardSkeleton';
import { EmptyState } from '@/components/ui/EmptyState';
import { useFollows } from '@/hooks/useFollows';
import { useLocation } from '@/hooks/useLocation';
import { useTheme } from '@/hooks/useTheme';
import { useFollowStore } from '@/store/followStore';

const SKELETON_PLACEHOLDERS = ['s1', 's2', 's3'] as const;

export default function MyMosquesTabScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const navigation = useNavigation();
  const location = useLocation();
  const followHydrated = useFollowStore((s) => s.hydrated);

  const {
    followedIds,
    followedMosques,
    followedMosquesLoading,
    followedMosquesError,
    refreshFollowedMosques,
  } = useFollows({
    coordinates: location.coords,
    loadFollowedMosqueRows: true,
  });

  const [refreshing, setRefreshing] = useState(false);

  useLayoutEffect(() => {
    navigation.setOptions({
      title: t('myMosques.title'),
    });
  }, [navigation, t]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await location.refresh();
      await refreshFollowedMosques();
    } finally {
      setRefreshing(false);
    }
  }, [location, refreshFollowedMosques]);

  const goBrowse = useCallback(() => {
    router.push('/');
  }, []);

  const goMosque = useCallback((id: string) => {
    router.push(`/mosque/${id}`);
  }, []);

  if (!followHydrated) {
    return (
      <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
        <View className="flex-1 gap-3 px-5 pt-4">
          {SKELETON_PLACEHOLDERS.map((key) => (
            <MosqueCardSkeleton key={key} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (followedIds.length === 0) {
    return (
      <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
        <EmptyState
          icon={<Heart size={48} weight="light" color={colors.textSecondary} />}
          title={t('myMosques.empty.title')}
          subtitle={t('myMosques.empty.subtitle')}
          ctaLabel={t('myMosques.empty.cta')}
          onCtaPress={goBrowse}
        />
      </SafeAreaView>
    );
  }

  const waitingForCoords =
    location.permissionStatus === 'granted' && location.loading && location.coords == null;
  const needsLocation =
    !location.loading && location.coords == null && followedIds.length > 0;

  if (needsLocation) {
    return (
      <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
        <EmptyState
          icon={<Warning size={48} weight="regular" color={colors.warning} />}
          title={t('mosques.list.locationDenied.title')}
          subtitle={t('mosques.list.locationDenied.subtitle')}
          ctaLabel={t('mosques.list.locationUndetermined.cta')}
          onCtaPress={() => {
            void location.requestPermission();
          }}
        />
      </SafeAreaView>
    );
  }

  if (waitingForCoords || (followedMosquesLoading && followedMosques.length === 0)) {
    return (
      <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
        <View className="flex-1 gap-3 px-5 pt-4">
          {SKELETON_PLACEHOLDERS.map((key) => (
            <MosqueCardSkeleton key={key} />
          ))}
        </View>
      </SafeAreaView>
    );
  }

  if (followedMosquesError != null) {
    return (
      <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
        <EmptyState
          icon={<Warning size={48} weight="regular" color={colors.warning} />}
          title={t('myMosques.error.title')}
          subtitle={t('myMosques.error.subtitle')}
          ctaLabel={t('myMosques.error.retry')}
          onCtaPress={() => {
            void refreshFollowedMosques();
          }}
        />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView edges={['bottom']} className="flex-1 bg-surface">
      <FlatList
        data={followedMosques}
        keyExtractor={(item) => item.id}
        contentContainerClassName="gap-3 px-5 pb-6 pt-4"
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        renderItem={({ item }) => (
          <MosqueCard mosque={item} onPress={goMosque} />
        )}
      />
    </SafeAreaView>
  );
}
