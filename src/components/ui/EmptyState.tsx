import React from 'react';
import { Text, View } from 'react-native';

import { Button } from '@/components/ui/Button';

export interface EmptyStateProps {
  icon: React.ReactNode;
  title: string;
  subtitle?: string;
  ctaLabel?: string;
  onCtaPress?: () => void;
}

export function EmptyState({ icon, title, subtitle, ctaLabel, onCtaPress }: EmptyStateProps) {
  return (
    <View className="flex-1 items-center justify-center gap-4 px-6 py-10" accessibilityRole="none">
      <View accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {icon}
      </View>
      <Text
        className="text-center font-sans-semibold text-lg text-text-primary"
        accessibilityRole="header"
      >
        {title}
      </Text>
      {subtitle ? (
        <Text className="text-center font-sans text-base text-text-secondary" accessibilityRole="text">
          {subtitle}
        </Text>
      ) : null}
      {ctaLabel && onCtaPress ? (
        <Button variant="primary" size="md" onPress={onCtaPress} accessibilityLabel={ctaLabel}>
          {ctaLabel}
        </Button>
      ) : null}
    </View>
  );
}
