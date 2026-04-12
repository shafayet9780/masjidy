import React from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  View,
  type ScrollViewProps,
  type ViewProps,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

export interface ScreenContainerProps extends ViewProps {
  children: React.ReactNode;
  scroll?: boolean;
  contentClassName?: string;
  keyboardShouldPersistTaps?: ScrollViewProps['keyboardShouldPersistTaps'];
  showsVerticalScrollIndicator?: boolean;
  refreshControl?: ScrollViewProps['refreshControl'];
}

export function ScreenContainer({
  children,
  scroll = true,
  className,
  contentClassName,
  keyboardShouldPersistTaps = 'handled',
  showsVerticalScrollIndicator = false,
  refreshControl,
  ...rest
}: ScreenContainerProps) {
  const content = scroll ? (
    <ScrollView
      className={`flex-1 bg-surface ${className ?? ''}`}
      contentContainerClassName={`flex-grow px-5 py-6 ${contentClassName ?? ''}`}
      keyboardShouldPersistTaps={keyboardShouldPersistTaps}
      showsVerticalScrollIndicator={showsVerticalScrollIndicator}
      refreshControl={refreshControl}
      {...rest}
    >
      {children}
    </ScrollView>
  ) : (
    <View className={`flex-1 bg-surface px-5 py-6 ${className ?? ''}`} {...rest}>
      {children}
    </View>
  );

  return (
    <SafeAreaView className="flex-1 bg-surface">
      <KeyboardAvoidingView
        className="flex-1"
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
