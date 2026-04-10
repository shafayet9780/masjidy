import React from 'react';
import { Pressable, View, type PressableProps, type ViewProps } from 'react-native';
import { tv } from 'tailwind-variants';

const cardRoot = tv({
  base: 'rounded-md bg-surface-elevated shadow-card',
  variants: {
    variant: {
      elevated: 'border-0',
      outlined: 'border border-border shadow-none',
    },
  },
  defaultVariants: {
    variant: 'elevated',
  },
});

export type CardVariant = 'elevated' | 'outlined';

export interface CardProps extends ViewProps {
  children: React.ReactNode;
  className?: string;
  variant?: CardVariant;
  /** When set with onPress, wraps content in a Pressable. */
  pressable?: boolean;
  onPress?: PressableProps['onPress'];
  accessibilityLabel?: string;
}

export function Card({
  children,
  className,
  variant = 'elevated',
  pressable = false,
  onPress,
  accessibilityLabel,
  ...rest
}: CardProps) {
  const rootClass = cardRoot({ variant, class: className });

  if (pressable && onPress) {
    return (
      <Pressable
        accessibilityRole="button"
        accessibilityLabel={accessibilityLabel}
        className={rootClass}
        onPress={onPress}
        {...rest}
      >
        {children}
      </Pressable>
    );
  }

  return (
    <View className={rootClass} {...rest}>
      {children}
    </View>
  );
}
