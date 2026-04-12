import React from 'react';
import Svg, { Circle, Path, Rect } from 'react-native-svg';

import { useTheme } from '@/hooks/useTheme';

/**
 * Theme-aware silhouette matching assets/images/mosque-placeholder.svg geometry.
 * Uses semantic colors from ThemeProvider (no hardcoded hex in components).
 */
export function MosqueProfileHeroPlaceholder() {
  const { colors } = useTheme();

  return (
    <Svg width={120} height={120} viewBox="0 0 120 120">
      <Rect width={120} height={120} rx={12} fill={colors.primarySoft} />
      <Path
        d="M60 28L44 40v48h32V40L60 28z"
        stroke={colors.primary}
        strokeWidth={3}
        fill="none"
      />
      <Circle cx={60} cy={52} r={6} fill={colors.primary} />
    </Svg>
  );
}
