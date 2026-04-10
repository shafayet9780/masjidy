import React from 'react';
import { I18nManager, Text, type TextInputProps, View } from 'react-native';

import {
  Input as GluestackInput,
  InputField,
  InputSlot,
} from '@/components/gluestack-ui/input';
import { useTheme } from '@/hooks/useTheme';

export interface InputProps extends Omit<TextInputProps, 'style'> {
  label?: string;
  error?: string;
  helperText?: string;
  leftIcon?: React.ReactNode;
  rightIcon?: React.ReactNode;
  className?: string;
  inputClassName?: string;
}

type InputFieldRef = React.ComponentRef<typeof InputField>;

export const Input = React.forwardRef<InputFieldRef, InputProps>(function Input(
  {
    label,
    error,
    helperText,
    leftIcon,
    rightIcon,
    className,
    inputClassName,
    editable,
    placeholderTextColor: placeholderTextColorProp,
    textAlign: textAlignProp,
    ...textInputProps
  },
  ref,
) {
  const { colors } = useTheme();

  const placeholderTextColor = placeholderTextColorProp ?? colors.textTertiary;
  const textAlign = textAlignProp ?? (I18nManager.isRTL ? 'right' : 'left');

  const fieldPadding = leftIcon
    ? 'flex-1 bg-transparent py-2 pe-3 ps-2 font-sans text-text-primary placeholder:text-text-tertiary'
    : 'flex-1 bg-transparent px-3 py-2 font-sans text-text-primary placeholder:text-text-tertiary';

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1 font-sans-medium text-text-primary" accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <GluestackInput
        isInvalid={Boolean(error)}
        isDisabled={editable === false}
        variant="outline"
        size="md"
        className={`rounded-md border border-border bg-surface-elevated data-[focus=true]:border-primary data-[invalid=true]:border-danger ${className ?? ''}`}
      >
        {leftIcon ? <InputSlot className="justify-center ps-3">{leftIcon}</InputSlot> : null}
        <InputField
          ref={ref}
          editable={editable}
          placeholderTextColor={placeholderTextColor}
          textAlign={textAlign}
          className={`${fieldPadding} ${inputClassName ?? ''}`}
          {...textInputProps}
        />
        {rightIcon ? <InputSlot className="justify-center pe-3">{rightIcon}</InputSlot> : null}
      </GluestackInput>
      {error ? (
        <Text className="mt-1 font-sans text-sm text-danger" accessibilityRole="alert" accessibilityLiveRegion="polite">
          {error}
        </Text>
      ) : null}
      {helperText && !error ? (
        <Text className="mt-1 font-sans text-sm text-text-secondary" accessibilityRole="text">
          {helperText}
        </Text>
      ) : null}
    </View>
  );
});

Input.displayName = 'Input';
