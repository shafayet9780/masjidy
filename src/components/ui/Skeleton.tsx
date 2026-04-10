import React, { useEffect, useState } from 'react';
import { AccessibilityInfo, type LayoutChangeEvent, View, type ViewStyle } from 'react-native';
import Animated, {
  cancelAnimation,
  Easing,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withTiming,
} from 'react-native-reanimated';

export interface SkeletonProps {
  width?: ViewStyle['width'];
  height?: ViewStyle['height'];
  /** Pixel radius; defaults to 12 (matches `rounded-md`). */
  borderRadius?: number;
  className?: string;
  circle?: boolean;
}

const DEFAULT_HEIGHT = 16;
const DEFAULT_RADIUS = 12;
const SHIMMER_DURATION_MS = 1500;

export function Skeleton({
  width: widthProp,
  height: heightProp = DEFAULT_HEIGHT,
  borderRadius: borderRadiusProp = DEFAULT_RADIUS,
  className,
  circle = false,
}: SkeletonProps) {
  const [reduceMotion, setReduceMotion] = useState(false);
  const translateX = useSharedValue(0);

  useEffect(() => {
    let cancelled = false;
    void AccessibilityInfo.isReduceMotionEnabled().then((v) => {
      if (!cancelled) setReduceMotion(v);
    });
    const sub = AccessibilityInfo.addEventListener('reduceMotionChanged', setReduceMotion);
    return () => {
      cancelled = true;
      sub.remove();
    };
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  const onLayout = (e: LayoutChangeEvent) => {
    const w = e.nativeEvent.layout.width;
    if (reduceMotion || w <= 0) return;
    const band = w * 0.45;
    translateX.value = -band;
    translateX.value = withRepeat(
      withTiming(w, { duration: SHIMMER_DURATION_MS, easing: Easing.linear }),
      -1,
      false,
    );
  };

  useEffect(() => {
    if (reduceMotion) {
      cancelAnimation(translateX);
      translateX.value = 0;
    }
  }, [reduceMotion, translateX]);

  const resolvedRadius = circle ? 9999 : borderRadiusProp;
  const layoutWidth = circle ? (widthProp ?? heightProp) : widthProp;
  const layoutHeight = heightProp;
  const dimensionClass = layoutWidth === undefined ? 'w-full' : '';

  if (reduceMotion) {
    return (
      <View
        accessibilityRole="none"
        accessibilityElementsHidden
        importantForAccessibility="no-hide-descendants"
        className={`bg-surface-muted ${dimensionClass} ${className ?? ''}`}
        style={{
          width: layoutWidth,
          height: layoutHeight,
          borderRadius: resolvedRadius,
        }}
      />
    );
  }

  return (
    <View
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      className={`overflow-hidden bg-surface-muted ${dimensionClass} ${className ?? ''}`}
      style={{
        width: layoutWidth,
        height: layoutHeight,
        borderRadius: resolvedRadius,
      }}
      onLayout={onLayout}
    >
      <Animated.View
        className="absolute inset-y-0 w-[45%] bg-surface-elevated/50"
        style={animatedStyle}
      />
    </View>
  );
}
