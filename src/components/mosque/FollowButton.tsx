import AsyncStorage from '@react-native-async-storage/async-storage';
import * as Haptics from 'expo-haptics';
import { Heart } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable } from 'react-native';

import { LOCAL_FOLLOW_IDS_KEY } from '@/constants/config';
import { useTheme } from '@/hooks/useTheme';

export interface FollowButtonProps {
  mosqueId: string;
  size?: number;
}

async function readFollowIds(): Promise<Set<string>> {
  try {
    const raw = await AsyncStorage.getItem(LOCAL_FOLLOW_IDS_KEY);
    if (!raw) return new Set();
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return new Set();
    return new Set(parsed.filter((x): x is string => typeof x === 'string'));
  } catch {
    return new Set();
  }
}

async function writeFollowIds(ids: Set<string>): Promise<void> {
  try {
    await AsyncStorage.setItem(LOCAL_FOLLOW_IDS_KEY, JSON.stringify([...ids]));
  } catch {
    // ignore
  }
}

export function FollowButton({ mosqueId, size = 22 }: FollowButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [following, setFollowing] = useState(false);

  useEffect(() => {
    let cancelled = false;
    void (async () => {
      const ids = await readFollowIds();
      if (!cancelled) {
        setFollowing(ids.has(mosqueId));
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [mosqueId]);

  const toggle = useCallback(async () => {
    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    const ids = await readFollowIds();
    if (ids.has(mosqueId)) {
      ids.delete(mosqueId);
      setFollowing(false);
    } else {
      ids.add(mosqueId);
      setFollowing(true);
    }
    await writeFollowIds(ids);
  }, [mosqueId]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={following ? t('mosques.follow.remove') : t('mosques.follow.add')}
      accessibilityState={{ selected: following }}
      hitSlop={12}
      className="min-h-[44px] min-w-[44px] items-center justify-center"
      onPress={toggle}
    >
      <Heart
        size={size}
        weight={following ? 'fill' : 'regular'}
        color={following ? colors.primary : colors.textSecondary}
      />
    </Pressable>
  );
}
