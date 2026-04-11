import React from 'react';
import { I18nManager, Text, View } from 'react-native';
import { CaretDown } from 'phosphor-react-native';

import {
  Select as GluestackSelect,
  SelectBackdrop,
  SelectContent,
  SelectDragIndicator,
  SelectDragIndicatorWrapper,
  SelectIcon,
  SelectInput,
  SelectItem,
  SelectPortal,
  SelectScrollView,
  SelectTrigger,
} from '@/components/gluestack-ui/select';
import { useTheme } from '@/hooks/useTheme';

export interface SelectOption {
  label: string;
  value: string;
}

export interface SelectProps {
  label?: string;
  error?: string;
  helperText?: string;
  placeholder: string;
  options: SelectOption[];
  selectedValue?: string;
  onValueChange: (value: string) => void;
  isDisabled?: boolean;
  className?: string;
}

export function Select({
  label,
  error,
  helperText,
  placeholder,
  options,
  selectedValue,
  onValueChange,
  isDisabled = false,
  className,
}: SelectProps) {
  const { colors } = useTheme();
  const selectedOption = options.find((option) => option.value === selectedValue);

  return (
    <View className="w-full">
      {label ? (
        <Text className="mb-1 font-sans-medium text-text-primary" accessibilityRole="text">
          {label}
        </Text>
      ) : null}
      <GluestackSelect
        isDisabled={isDisabled}
        onValueChange={onValueChange}
        selectedValue={selectedValue}
      >
        <SelectTrigger
          className={`rounded-md border border-border bg-surface-elevated data-[focus=true]:border-primary data-[invalid=true]:border-danger ${className ?? ''}`}
          size="md"
          variant="outline"
        >
          <SelectInput
            className="flex-1 px-3 py-2 font-sans text-text-primary"
            placeholder={selectedOption?.label ?? placeholder}
            placeholderTextColor={colors.textTertiary}
            textAlign={I18nManager.isRTL ? 'right' : 'left'}
          />
          <SelectIcon as={CaretDown} className="me-3 text-text-tertiary" />
        </SelectTrigger>
        <SelectPortal>
          <SelectBackdrop />
          <SelectContent className="bg-surface-elevated">
            <SelectDragIndicatorWrapper>
              <SelectDragIndicator className="bg-border" />
            </SelectDragIndicatorWrapper>
            <SelectScrollView className="w-full">
              {options.map((option) => (
                <SelectItem
                  key={option.value}
                  className="rounded-sm data-[checked=true]:bg-primary-soft"
                  label={option.label}
                  value={option.value}
                />
              ))}
            </SelectScrollView>
          </SelectContent>
        </SelectPortal>
      </GluestackSelect>
      {error ? (
        <Text
          accessibilityLiveRegion="polite"
          accessibilityRole="alert"
          className="mt-1 font-sans text-sm text-danger"
        >
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
}
