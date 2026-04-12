import { Gear, MagnifyingGlass } from 'phosphor-react-native';
import { router } from 'expo-router';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import {
  FlatList,
  Modal,
  Pressable,
  RefreshControl,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { MosqueCard } from '@/components/mosque/MosqueCard';
import { MosqueCardSkeleton } from '@/components/mosque/MosqueCardSkeleton';
import { Button } from '@/components/ui/Button';
import { EmptyState } from '@/components/ui/EmptyState';
import { Input } from '@/components/ui/Input';
import { CITY_PRESETS } from '@/constants/config';
import type { Coordinates } from '@/hooks/useLocation';
import { useLocation } from '@/hooks/useLocation';
import { useMosques } from '@/hooks/useMosques';
import { useTheme } from '@/hooks/useTheme';

export default function MosquesTabScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const location = useLocation();
  const [cityOverride, setCityOverride] = useState<Coordinates | null>(null);
  const [cityModalVisible, setCityModalVisible] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);

  const effectiveCoords = useMemo(
    () => cityOverride ?? location.coords,
    [cityOverride, location.coords],
  );

  const {
    mosques,
    filteredMosques,
    loading: listLoading,
    error,
    searchQuery,
    setSearchQuery,
    refetch,
  } = useMosques({ coordinates: effectiveCoords });

  const [refreshing, setRefreshing] = useState(false);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await location.refresh();
      await refetch();
    } finally {
      setRefreshing(false);
    }
  }, [location, refetch]);

  const openCityPicker = useCallback(() => {
    setCityModalVisible(true);
  }, []);

  const selectCity = useCallback((c: Coordinates) => {
    setCityOverride(c);
    setCityModalVisible(false);
  }, []);

  const clearCityOverride = useCallback(() => {
    setCityOverride(null);
  }, []);

  const showListChrome = Boolean(effectiveCoords);
  /** GPS fix in flight after permission granted. */
  const waitingForGpsFix =
    !effectiveCoords && location.permissionStatus === 'granted' && location.loading;
  const showSkeletons =
    showListChrome && listLoading && filteredMosques.length === 0 && !error;

  const listHeader = (
    <View className="gap-3 pb-3">
      <View className="flex-row items-center justify-between">
        <Text
          className="font-sans-semibold text-xl text-text-primary"
          accessibilityRole="header"
        >
          {t('mosques.list.appTitle')}
        </Text>
        <View className="flex-row items-center gap-1">
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mosques.list.toggleSearch')}
            hitSlop={8}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            onPress={() => setSearchOpen((v) => !v)}
          >
            <MagnifyingGlass size={22} color={colors.textPrimary} weight="regular" />
          </Pressable>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('mosques.list.openSettings')}
            hitSlop={8}
            className="min-h-[44px] min-w-[44px] items-center justify-center"
            onPress={() => router.push('/settings')}
          >
            <Gear size={22} color={colors.textPrimary} weight="regular" />
          </Pressable>
        </View>
      </View>
      {searchOpen ? (
        <Input
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder={t('mosques.list.searchPlaceholder')}
          accessibilityLabel={t('mosques.list.searchPlaceholder')}
          leftIcon={<MagnifyingGlass size={18} color={colors.textSecondary} weight="regular" />}
          autoCorrect={false}
          autoCapitalize="none"
        />
      ) : null}
      {showListChrome ? (
        <Text className="font-sans text-sm text-text-secondary" accessibilityRole="text">
          {t('mosques.list.nearYou')} ·{' '}
          {t('mosques.list.count', {
            count: searchQuery.trim() ? filteredMosques.length : mosques.length,
          })}
        </Text>
      ) : null}
      {cityOverride ? (
        <View className="flex-row items-center justify-between rounded-md bg-primary-soft px-3 py-2">
          <Text className="flex-1 font-sans text-sm text-text-primary">
            {t('mosques.list.usingCityFallback')}
          </Text>
          <Button variant="ghost" size="sm" onPress={clearCityOverride}>
            {t('mosques.list.useGpsInstead')}
          </Button>
        </View>
      ) : null}
    </View>
  );

  const renderItem = useCallback(
    ({ item }: { item: (typeof filteredMosques)[number] }) => (
      <MosqueCard mosque={item} onPress={(id) => router.push(`/mosque/${id}`)} />
    ),
    [],
  );

  const locationGate =
    !effectiveCoords && !waitingForGpsFix && location.permissionStatus !== 'granted';

  const gpsFailed =
    !effectiveCoords &&
    location.permissionStatus === 'granted' &&
    !location.loading &&
    !cityOverride;

  return (
    <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
      {locationGate ? (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="flex-grow"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {listHeader}
          {location.permissionStatus === 'undetermined' ? (
            <EmptyState
              icon={<MagnifyingGlass size={48} color={colors.textTertiary} weight="light" />}
              title={t('mosques.list.locationUndetermined.title')}
              subtitle={t('mosques.list.locationUndetermined.subtitle')}
              ctaLabel={t('mosques.list.locationUndetermined.cta')}
              onCtaPress={() => void location.requestPermission()}
            />
          ) : (
            <EmptyState
              icon={<MagnifyingGlass size={48} color={colors.textTertiary} weight="light" />}
              title={t('mosques.list.locationDenied.title')}
              subtitle={t('mosques.list.locationDenied.subtitle')}
              ctaLabel={t('mosques.list.cityPicker.open')}
              onCtaPress={openCityPicker}
            />
          )}
        </ScrollView>
      ) : waitingForGpsFix ? (
        <View className="flex-1 px-5 pt-2">
          {listHeader}
          <View className="gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <MosqueCardSkeleton key={i} />
            ))}
          </View>
        </View>
      ) : gpsFailed ? (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="flex-grow"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {listHeader}
          <EmptyState
            icon={<MagnifyingGlass size={48} color={colors.textTertiary} weight="light" />}
            title={t('mosques.list.gpsFailed.title')}
            subtitle={t('mosques.list.gpsFailed.subtitle')}
            ctaLabel={t('mosques.list.gpsFailed.retry')}
            onCtaPress={() => void location.refresh()}
          />
        </ScrollView>
      ) : showSkeletons ? (
        <View className="flex-1 px-5 pt-2">
          {listHeader}
          <View className="gap-3">
            {Array.from({ length: 5 }).map((_, i) => (
              <MosqueCardSkeleton key={i} />
            ))}
          </View>
        </View>
      ) : error ? (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="flex-grow"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {listHeader}
          <EmptyState
            icon={<MagnifyingGlass size={48} color={colors.textTertiary} weight="light" />}
            title={t('mosques.list.error.title')}
            subtitle={t('mosques.list.error.subtitle')}
            ctaLabel={t('mosques.list.error.retry')}
            onCtaPress={() => void refetch()}
          />
        </ScrollView>
      ) : filteredMosques.length === 0 && mosques.length > 0 ? (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="flex-grow"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {listHeader}
          <EmptyState
            icon={<MagnifyingGlass size={48} color={colors.textTertiary} weight="light" />}
            title={t('mosques.list.searchEmpty.title')}
            subtitle={t('mosques.list.searchEmpty.subtitle')}
          />
        </ScrollView>
      ) : filteredMosques.length === 0 ? (
        <ScrollView
          className="flex-1 px-5"
          contentContainerClassName="flex-grow"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
        >
          {listHeader}
          <EmptyState
            icon={<MagnifyingGlass size={48} color={colors.textTertiary} weight="light" />}
            title={t('mosques.list.empty.title')}
            subtitle={t('mosques.list.empty.subtitle')}
            ctaLabel={t('mosques.list.cityPicker.open')}
            onCtaPress={openCityPicker}
          />
        </ScrollView>
      ) : (
        <FlatList
          className="flex-1 px-5"
          data={filteredMosques}
          keyExtractor={(item) => item.id}
          renderItem={renderItem}
          ListHeaderComponent={listHeader}
          ItemSeparatorComponent={() => <View className="h-3" />}
          contentContainerClassName="pb-8 pt-2"
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={colors.primary} />
          }
          ListFooterComponent={
            listLoading && filteredMosques.length > 0 ? (
              <Text className="py-4 text-center font-sans text-sm text-text-tertiary">
                {t('mosques.list.updating')}
              </Text>
            ) : null
          }
        />
      )}

      <Modal
        visible={cityModalVisible}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setCityModalVisible(false)}
      >
        <SafeAreaView className="flex-1 bg-surface" edges={['top', 'left', 'right']}>
          <View className="border-b border-border px-5 py-4">
            <Text className="font-sans-semibold text-lg text-text-primary">
              {t('mosques.list.cityPicker.title')}
            </Text>
          </View>
          <FlatList
            data={[...CITY_PRESETS]}
            keyExtractor={(item) => item.labelKey}
            contentContainerClassName="px-5 py-4 gap-2"
            renderItem={({ item }) => (
              <Pressable
                accessibilityRole="button"
                accessibilityLabel={t(item.labelKey)}
                className="rounded-md border border-border bg-surface-elevated px-4 py-4 active:opacity-90"
                onPress={() => selectCity({ latitude: item.lat, longitude: item.lng })}
              >
                <Text className="font-sans text-base text-text-primary">{t(item.labelKey)}</Text>
              </Pressable>
            )}
          />
          <View className="border-t border-border px-5 py-4">
            <Button variant="secondary" fullWidth onPress={() => setCityModalVisible(false)}>
              {t('mosques.list.cityPicker.cancel')}
            </Button>
          </View>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}
