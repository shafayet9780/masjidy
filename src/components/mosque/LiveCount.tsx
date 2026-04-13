import { Users } from 'phosphor-react-native';
import React, { useEffect, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { AccessibilityInfo, Text, View } from 'react-native';
import Animated, { Easing, useAnimatedStyle, useSharedValue, withSequence, withTiming } from 'react-native-reanimated';

import { useTheme } from '@/hooks/useTheme';
import { prayerTranslationKey } from '@/lib/formatters';
import type { PrayerType } from '@/types/mosque';

export interface LiveCountProps {
  count: number;
  prayer: PrayerType;
}

export function LiveCount({ count, prayer }: LiveCountProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const [reduceMotion, setReduceMotion] = useState(false);
  const scale = useSharedValue(1);
  const prevCountRef = React.useRef(count);

  useEffect(() => {
    void AccessibilityInfo.isReduceMotionEnabled().then(setReduceMotion);
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      sub.remove();
    };
  }, []);

  useEffect(() => {
    if (reduceMotion) {
      prevCountRef.current = count;
      return;
    }
    if (count > prevCountRef.current) {
      scale.value = withSequence(
        withTiming(1.12, { duration: 120, easing: Easing.out(Easing.quad) }),
        withTiming(1, { duration: 120, easing: Easing.in(Easing.quad) }),
      );
    }
    prevCountRef.current = count;
  }, [count, reduceMotion, scale]);

  const iconStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
  }));

  if (count <= 0) {
    return null;
  }

  return (
    <View className="mt-2 flex-row items-center gap-2 ps-1">
      <Animated.View style={reduceMotion ? undefined : iconStyle} importantForAccessibility="no-hide-descendants">
        <Users size={18} weight="regular" color={colors.success} />
      </Animated.View>
      <Text
        className="font-sans text-xs text-success"
        accessibilityRole="text"
        accessibilityLabel={t('checkIn.liveCount', {
          count,
          prayer: t(prayerTranslationKey(prayer)),
        })}
      >
        {t('checkIn.liveCount', {
          count,
          prayer: t(prayerTranslationKey(prayer)),
        })}
      </Text>
    </View>
  );
}
