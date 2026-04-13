import { Bell, BellSlash, CheckCircle, Clock } from 'phosphor-react-native';
import { useMemo, useState } from 'react';
import { Linking, Pressable, Text, View } from 'react-native';
import { useTranslation } from 'react-i18next';

import { ScreenContainer } from '@/components/layout/ScreenContainer';
import { Button } from '@/components/ui/Button';
import { Card } from '@/components/ui/Card';
import { Select, type SelectOption } from '@/components/ui/Select';
import { useNotifications } from '@/hooks/useNotifications';
import { useTheme } from '@/hooks/useTheme';
import {
  rescheduleLocalNotifications,
  updateJamatNotificationsEnabled,
  updateNotificationLeadMinutes,
} from '@/services/notifications';
import { useAppStore } from '@/store/appStore';
import { useAuthStore } from '@/store/authStore';
import { notificationLeadMinutes, type NotificationLeadMinutes } from '@/types/user';

export default function SettingsNotificationsScreen() {
  const { t } = useTranslation();
  const { colors } = useTheme();
  const session = useAuthStore((state) => state.session);
  const notificationLead = useAppStore((state) => state.notificationLeadMinutes);
  const jamatNotificationsEnabled = useAppStore((state) => state.jamatNotificationsEnabled);
  const { initialize, permissionStatus, requestPermission } = useNotifications();
  const [isUpdating, setIsUpdating] = useState(false);

  const isAuthenticated = Boolean(session);
  const permissionGranted = permissionStatus === 'granted';

  const leadOptions = useMemo<SelectOption[]>(
    () => [
      {
        label: t('settings.notifications.leadTime10'),
        value: String(notificationLeadMinutes.ten),
      },
      {
        label: t('settings.notifications.leadTime15'),
        value: String(notificationLeadMinutes.fifteen),
      },
      {
        label: t('settings.notifications.leadTime30'),
        value: String(notificationLeadMinutes.thirty),
      },
    ],
    [t],
  );

  async function handleEnableNotifications() {
    setIsUpdating(true);
    try {
      const granted = await requestPermission();
      if (!granted) {
        await Linking.openSettings();
        return;
      }
      await initialize();
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleToggle(enabled: boolean) {
    setIsUpdating(true);
    try {
      await updateJamatNotificationsEnabled(enabled);
      if (enabled) {
        await handleEnableNotifications();
        return;
      }
    } finally {
      setIsUpdating(false);
    }
  }

  async function handleLeadTimeChange(value: string) {
    const parsed = Number(value) as NotificationLeadMinutes;
    if (!Object.values(notificationLeadMinutes).includes(parsed)) {
      return;
    }

    setIsUpdating(true);
    try {
      await updateNotificationLeadMinutes(parsed);
      if (!isAuthenticated && jamatNotificationsEnabled && permissionGranted) {
        await rescheduleLocalNotifications();
      }
    } finally {
      setIsUpdating(false);
    }
  }

  return (
    <ScreenContainer contentClassName="gap-4">
      <Card className="gap-4 p-4" variant="outlined">
        <View className="flex-row items-start gap-3">
          <View className="mt-0.5">
            {permissionGranted ? (
              <Bell color={colors.primary} size={22} />
            ) : (
              <BellSlash color={colors.textTertiary} size={22} />
            )}
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-sans-semibold text-lg text-text-primary">
              {t('settings.notifications.title')}
            </Text>
            <Text className="font-sans text-sm text-text-secondary">
              {permissionGranted
                ? t('settings.notifications.permissionGranted')
                : t('settings.notifications.permissionDenied')}
            </Text>
            <Text className="font-sans text-sm text-text-secondary">
              {t('settings.notifications.description')}
            </Text>
          </View>
        </View>

        {!permissionGranted ? (
          <Button
            fullWidth
            loading={isUpdating}
            onPress={handleEnableNotifications}
            accessibilityLabel={t('settings.notifications.enableButton')}
          >
            {t('settings.notifications.enableButton')}
          </Button>
        ) : (
          <View className="flex-row items-center gap-2 rounded-md bg-primary-soft px-3 py-3">
            <CheckCircle color={colors.primary} size={18} weight="fill" />
            <Text className="flex-1 font-sans-medium text-sm text-text-primary">
              {t('settings.notifications.permissionGranted')}
            </Text>
          </View>
        )}
      </Card>

      <Card className="gap-4 p-4" variant="outlined">
        <Pressable
          accessibilityLabel={t('settings.notifications.jamatToggle')}
          accessibilityRole="switch"
          accessibilityState={{ checked: jamatNotificationsEnabled, busy: isUpdating }}
          className="flex-row items-start gap-3"
          disabled={isUpdating}
          onPress={() => void handleToggle(!jamatNotificationsEnabled)}
        >
          <View className="mt-0.5">
            <Clock
              color={jamatNotificationsEnabled ? colors.primary : colors.textTertiary}
              size={22}
            />
          </View>
          <View className="flex-1 gap-1">
            <Text className="font-sans-semibold text-base text-text-primary">
              {t('settings.notifications.jamatToggle')}
            </Text>
            <Text className="font-sans text-sm text-text-secondary">
              {t('settings.notifications.jamatToggleDescription')}
            </Text>
            <Text className="font-sans-medium text-sm text-text-primary">
              {jamatNotificationsEnabled ? t('settings.notifications.enabled') : t('settings.notifications.disabled')}
            </Text>
          </View>
        </Pressable>

        <Select
          label={t('settings.notifications.leadTimeLabel')}
          placeholder={t('settings.notifications.leadTimeLabel')}
          options={leadOptions}
          selectedValue={String(notificationLead)}
          onValueChange={(value) => {
            void handleLeadTimeChange(value);
          }}
          isDisabled={!jamatNotificationsEnabled || isUpdating}
          helperText={
            isAuthenticated
              ? t('settings.notifications.authenticatedLeadTimeHelper')
              : t('settings.notifications.localLeadTimeHelper')
          }
        />
      </Card>
    </ScreenContainer>
  );
}
