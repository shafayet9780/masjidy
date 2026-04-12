import { Baby, Car, Drop, GenderFemale, Wheelchair } from 'phosphor-react-native';
import React from 'react';
import { useTranslation } from 'react-i18next';
import { Text, View } from 'react-native';

import { useTheme } from '@/hooks/useTheme';

export interface FacilityChipProps {
  facility: string;
}

export function FacilityChip({ facility }: FacilityChipProps) {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const labelKey = `mosques.facility.${facility}`;
  const label = t(labelKey, { defaultValue: facility });

  const icon =
    facility === 'parking' ? (
      <Car size={18} weight="regular" color={colors.textSecondary} />
    ) : facility === 'wudu' ? (
      <Drop size={18} weight="regular" color={colors.textSecondary} />
    ) : facility === 'wheelchair' ? (
      <Wheelchair size={18} weight="regular" color={colors.textSecondary} />
    ) : facility === 'children_friendly' ? (
      <Baby size={18} weight="regular" color={colors.textSecondary} />
    ) : facility === 'womens_section' ? (
      <GenderFemale size={18} weight="regular" color={colors.textSecondary} />
    ) : null;

  return (
    <View
      className="flex-row items-center gap-1 rounded-sm bg-surface-muted px-2 py-1"
      accessibilityRole="text"
      accessibilityLabel={label}
    >
      {icon}
      <Text className="font-sans text-xs text-text-secondary" numberOfLines={1}>
        {label}
      </Text>
    </View>
  );
}
