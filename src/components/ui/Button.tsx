import React from 'react';
import { tv } from 'tailwind-variants';

import {
  Button as GluestackButton,
  ButtonSpinner,
  ButtonText,
} from '@/components/gluestack-ui/button';
import { useTheme } from '@/hooks/useTheme';

const buttonRoot = tv({
  base: 'flex-row items-center justify-center gap-2 rounded-md active:opacity-90 data-[disabled=true]:opacity-40',
  variants: {
    variant: {
      primary: 'border-0 bg-primary',
      secondary: 'border border-primary bg-transparent',
      ghost: 'border-0 bg-transparent',
      danger: 'border border-danger bg-transparent',
      accent: 'border-0 bg-accent',
    },
    size: {
      sm: 'min-h-[40px] px-3',
      md: 'min-h-[44px] px-4',
      lg: 'min-h-[48px] px-5',
    },
    fullWidth: {
      true: 'w-full self-stretch',
      false: '',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
    fullWidth: false,
  },
});

const buttonLabel = tv({
  base: 'text-center font-sans-medium',
  variants: {
    variant: {
      primary: 'text-white',
      secondary: 'text-text-primary',
      ghost: 'text-text-primary',
      danger: 'text-danger',
      accent: 'text-white',
    },
    size: {
      sm: 'text-sm',
      md: 'text-base',
      lg: 'text-lg',
    },
  },
  defaultVariants: {
    variant: 'primary',
    size: 'md',
  },
});

export type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger' | 'accent';
export type ButtonSize = 'sm' | 'md' | 'lg';

export interface ButtonProps
  extends Omit<
    React.ComponentPropsWithoutRef<typeof GluestackButton>,
    'variant' | 'action' | 'className' | 'children'
  > {
  variant?: ButtonVariant;
  size?: ButtonSize;
  loading?: boolean;
  fullWidth?: boolean;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  children: React.ReactNode;
  accessibilityLabel?: string;
}

export const Button = React.forwardRef<React.ElementRef<typeof GluestackButton>, ButtonProps>(
  function Button(
    {
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      leftIcon,
      rightIcon,
      children,
      className,
      disabled,
      accessibilityLabel,
      ...rest
    },
    ref,
  ) {
    const { colors } = useTheme();
    const isDisabled = Boolean(disabled || loading);

    const spinnerColor =
      variant === 'primary' || variant === 'accent'
        ? colors.surface
        : variant === 'danger'
          ? colors.danger
          : colors.textPrimary;

    const resolvedA11yLabel =
      accessibilityLabel ??
      (typeof children === 'string' || typeof children === 'number' ? String(children) : undefined);

    return (
      <GluestackButton
        ref={ref}
        action="default"
        variant="solid"
        size={size}
        disabled={isDisabled}
        className={buttonRoot({ variant, size, fullWidth, class: className })}
        accessibilityRole="button"
        accessibilityLabel={resolvedA11yLabel}
        accessibilityState={{ disabled: isDisabled, busy: loading }}
        {...rest}
      >
        {loading ? <ButtonSpinner color={spinnerColor} /> : leftIcon}
        {typeof children === 'string' || typeof children === 'number' ? (
          <ButtonText className={buttonLabel({ variant, size })}>{children}</ButtonText>
        ) : (
          children
        )}
        {!loading ? rightIcon : null}
      </GluestackButton>
    );
  },
);

Button.displayName = 'Button';
