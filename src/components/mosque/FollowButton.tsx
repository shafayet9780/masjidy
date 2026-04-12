import * as Haptics from 'expo-haptics';
import { Heart } from 'phosphor-react-native';
import React, { useCallback, useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Pressable } from 'react-native';
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withSequence,
  withTiming,
} from 'react-native-reanimated';

import { MAX_FOLLOWS } from '@/constants/config';
import { useFollows } from '@/hooks/useFollows';
import { useTheme } from '@/hooks/useTheme';

export interface FollowButtonProps {
  mosqueId: string;
  size?: number;
}

const BOUNCE_MS = 100;

export function FollowButton({ mosqueId, size = 22 }: FollowButtonProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const { isFollowing, followMosque, unfollowMosque, followedIds } = useFollows();
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useSharedValue(1);

  const following = isFollowing(mosqueId);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) {
        setReduceMotion(v);
      }
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  const playBounce = useCallback(() => {
    if (reduceMotion) {
      return;
    }
    scale.value = withSequence(
      withTiming(1.3, { duration: BOUNCE_MS }),
      withTiming(1, { duration: BOUNCE_MS }),
    );
  }, [reduceMotion, scale]);

  const toggle = useCallback(async () => {
    if (following) {
      playBounce();
      await unfollowMosque(mosqueId);
      return;
    }

    if (followedIds.length >= MAX_FOLLOWS) {
      return;
    }

    void Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    playBounce();
    await followMosque(mosqueId);
  }, [followMosque, followedIds.length, following, mosqueId, playBounce, unfollowMosque]);

  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={following ? t('mosques.follow.remove') : t('mosques.follow.add')}
      accessibilityState={{ selected: following }}
      hitSlop={12}
      className="min-h-[44px] min-w-[44px] items-center justify-center"
      onPress={() => {
        void toggle();
      }}
    >
      <Animated.View style={animatedStyle}>
        <Heart
          size={size}
          weight={following ? 'fill' : 'regular'}
          color={following ? colors.primary : colors.textSecondary}
        />
      </Animated.View>
    </Pressable>
  );
}
