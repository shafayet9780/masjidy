import React from 'react';
import { View } from 'react-native';

import { Skeleton } from '@/components/ui/Skeleton';

export function MosqueCardSkeleton() {
  return (
    <View
      className="gap-3 rounded-md bg-surface-elevated p-4 shadow-card"
      accessibilityRole="none"
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
    >
      <View className="flex-row items-center gap-3">
        <Skeleton circle height={40} width={40} borderRadius={9999} />
        <Skeleton className="flex-1" height={20} borderRadius={6} />
        <Skeleton height={36} width={36} circle borderRadius={9999} />
      </View>
      <Skeleton className="w-1/3" height={14} borderRadius={6} />
      <Skeleton className="w-full" height={40} borderRadius={6} />
      <View className="flex-row gap-2">
        <Skeleton height={28} width={72} borderRadius={6} />
        <Skeleton height={28} width={88} borderRadius={6} />
        <Skeleton height={28} width={64} borderRadius={6} />
      </View>
    </View>
  );
}
