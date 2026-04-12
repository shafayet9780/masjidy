import * as Haptics from 'expo-haptics';
import React, { useCallback, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Pressable, Text, View } from 'react-native';

import { SUBMISSION_LIMITS } from '@/constants/prayers';
import { useSubmitTime } from '@/hooks/useSubmitTime';
import { prayerTranslationKey } from '@/lib/formatters';
import { to24HourFrom12Hour } from '@/lib/timeValidation';
import type { SubmitTimeResult } from '@/services/api';
import type { PrayerType } from '@/types/mosque';

import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Select, type SelectOption } from '@/components/ui/Select';

function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function lastNDates(n: number): { ymd: string }[] {
  const out: { ymd: string }[] = [];
  for (let i = 0; i < n; i += 1) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    out.push({ ymd: formatLocalYmd(d) });
  }
  return out;
}

const HOUR_OPTIONS: SelectOption[] = Array.from({ length: 12 }, (_, i) => ({
  value: String(i + 1),
  label: String(i + 1),
}));

const MINUTE_OPTIONS: SelectOption[] = Array.from({ length: 60 }, (_, i) => ({
  value: String(i).padStart(2, '0'),
  label: String(i).padStart(2, '0'),
}));

const AMPM_OPTIONS: SelectOption[] = [
  { value: 'am', label: 'AM' },
  { value: 'pm', label: 'PM' },
];

export interface SubmissionFormProps {
  mosqueId: string;
  mosqueName: string;
  initialPrayer?: PrayerType | null;
  onSuccess?: (result: SubmitTimeResult) => void;
}

export function SubmissionForm({ mosqueId, mosqueName, initialPrayer, onSuccess }: SubmissionFormProps) {
  const { t } = useTranslation();
  const { submitTime, isSubmitting, error, clearError, validateLocally } = useSubmitTime();

  const dateChoices = useMemo(() => lastNDates(7), []);

  const [prayer, setPrayer] = useState<PrayerType | undefined>(initialPrayer ?? undefined);
  const [hour12, setHour12] = useState('5');
  const [minute, setMinute] = useState('15');
  const [ampm, setAmpm] = useState('pm');
  const [effectiveDate, setEffectiveDate] = useState(() => formatLocalYmd(new Date()));
  const [note, setNote] = useState('');

  const [prayerError, setPrayerError] = useState<string | undefined>();
  const [timeError, setTimeError] = useState<string | undefined>();
  const [successVisible, setSuccessVisible] = useState(false);
  const [lastStatus, setLastStatus] = useState<string | null>(null);

  const prayerOptions: SelectOption[] = useMemo(
    () =>
      (['fajr', 'dhuhr', 'asr', 'maghrib', 'isha', 'jumuah'] as const).map((p) => ({
        value: p,
        label: t(prayerTranslationKey(p)),
      })),
    [t],
  );

  const time24 = useMemo(() => {
    const h = Number(hour12);
    const m = Number(minute);
    if (!Number.isFinite(h) || !Number.isFinite(m)) return '';
    return to24HourFrom12Hour({
      hour12: h,
      minute: m,
      isPm: ampm === 'pm',
    });
  }, [hour12, minute, ampm]);

  const resolveServerErrorMessage = useCallback(() => {
    if (!error) return null;
    const code = error.code;
    if (code === 'TIME_OUT_OF_RANGE' && prayer) {
      return t('error.TIME_OUT_OF_RANGE', { prayer: t(prayerTranslationKey(prayer)) });
    }
    const key = `error.${code}`;
    const translated = t(key);
    if (translated !== key) return translated;
    return t('error.SUBMISSION_FAILED');
  }, [error, prayer, t]);

  const onSubmit = useCallback(async () => {
    clearError();
    setPrayerError(undefined);
    setTimeError(undefined);

    const local = validateLocally(prayer, time24);
    if (!local.valid) {
      if (local.prayerErrorKey) setPrayerError(t(local.prayerErrorKey));
      if (local.timeErrorKey) setTimeError(t(local.timeErrorKey));
      return;
    }

    try {
      const result = await submitTime({
        mosque_id: mosqueId,
        prayer: prayer!,
        time: time24,
        effective_date: effectiveDate,
        note: note.trim() || undefined,
        tz_offset_min: -new Date().getTimezoneOffset(),
      });
      void Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
      setLastStatus(result.status);
      setSuccessVisible(true);
      setTimeout(() => setSuccessVisible(false), 2800);
      onSuccess?.(result);
    } catch {
      /* ApiError in hook */
    }
  }, [
    clearError,
    effectiveDate,
    mosqueId,
    note,
    onSuccess,
    prayer,
    submitTime,
    t,
    time24,
    validateLocally,
  ]);

  const serverErr = resolveServerErrorMessage();

  return (
    <View className="gap-5">
      <Text
        className="font-sans text-sm text-text-secondary"
        accessibilityRole="text"
        accessibilityLabel={mosqueName}
      >
        {mosqueName}
      </Text>

      {successVisible ? (
        <View
          className="rounded-md bg-primary-soft px-4 py-3"
          accessibilityRole="alert"
          accessibilityLiveRegion="polite"
        >
          <Text className="text-center font-sans-medium text-text-primary">
            {lastStatus === 'pending' ? t('submit.successPending') : t('submit.success')}
          </Text>
        </View>
      ) : null}

      <Select
        label={t('submit.prayerLabel')}
        placeholder={t('submit.prayerPlaceholder')}
        options={prayerOptions}
        selectedValue={prayer}
        onValueChange={(v) => setPrayer(v as PrayerType)}
        error={prayerError}
      />

      <Text className="font-sans-medium text-text-primary" accessibilityRole="text">
        {t('submit.timeLabel')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        <View className="min-w-[28%] flex-1">
          <Select
            placeholder={t('submit.hourPlaceholder')}
            options={HOUR_OPTIONS}
            selectedValue={hour12}
            onValueChange={setHour12}
          />
        </View>
        <View className="min-w-[28%] flex-1">
          <Select
            placeholder={t('submit.minutePlaceholder')}
            options={MINUTE_OPTIONS}
            selectedValue={minute}
            onValueChange={setMinute}
          />
        </View>
        <View className="min-w-[28%] flex-1">
          <Select
            placeholder={t('submit.ampmPlaceholder')}
            options={AMPM_OPTIONS}
            selectedValue={ampm}
            onValueChange={setAmpm}
          />
        </View>
      </View>
      {timeError ? (
        <Text className="font-sans text-sm text-danger" accessibilityRole="alert">
          {timeError}
        </Text>
      ) : null}

      <Text className="font-sans-medium text-text-primary" accessibilityRole="text">
        {t('submit.dateLabel')}
      </Text>
      <View className="flex-row flex-wrap gap-2">
        {dateChoices.map((d) => {
          const selected = d.ymd === effectiveDate;
          return (
            <Pressable
              key={d.ymd}
              onPress={() => setEffectiveDate(d.ymd)}
              className={`min-h-[44px] min-w-[44px] items-center justify-center rounded-md border px-3 py-2 ${
                selected ? 'border-primary bg-primary-soft' : 'border-border bg-surface-elevated'
              }`}
              accessibilityRole="button"
              accessibilityLabel={d.ymd}
              accessibilityState={{ selected }}
            >
              <Text
                className={`font-sans text-sm ${selected ? 'text-primary' : 'text-text-primary'}`}
              >
                {d.ymd.slice(5)}
              </Text>
            </Pressable>
          );
        })}
      </View>

      <Input
        label={t('submit.noteLabel')}
        placeholder={t('submit.notePlaceholder')}
        value={note}
        onChangeText={setNote}
        maxLength={SUBMISSION_LIMITS.maxNoteLength}
        multiline
        helperText={t('submit.noteCount', { count: note.length })}
      />

      {serverErr ? (
        <Text className="font-sans text-sm text-danger" accessibilityRole="alert">
          {serverErr}
        </Text>
      ) : null}

      <Button
        variant="primary"
        size="lg"
        fullWidth
        loading={isSubmitting}
        onPress={() => void onSubmit()}
        accessibilityLabel={t('submit.button')}
      >
        {t('submit.button')}
      </Button>
    </View>
  );
}
