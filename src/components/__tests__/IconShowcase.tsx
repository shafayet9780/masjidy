import { Building, Clock, Heart, MapPin, ShieldCheck } from 'phosphor-react-native';
import { View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

/**
 * Dev-only showcase: verifies phosphor-react-native weights + theme color wiring.
 * Uses `Building` (regular) — this phosphor build has no `MosqueStraight` export.
 * Not used in production routes unless imported explicitly.
 */
export function IconShowcase() {
  const { colors } = useTheme();
  const iconColor = colors.primary;

  return (
    <View className="flex-row flex-wrap items-center gap-4 p-4">
      <Building color={iconColor} size={24} weight="regular" />
      <Heart color={iconColor} size={24} weight="fill" />
      <Clock color={iconColor} size={24} weight="bold" />
      <MapPin color={iconColor} size={24} weight="light" />
      <ShieldCheck color={iconColor} size={24} weight="duotone" />
    </View>
  );
}
