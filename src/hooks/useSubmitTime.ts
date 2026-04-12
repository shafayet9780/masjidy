import { useCallback, useState } from 'react';

import { validateSubmissionTime } from '@/lib/timeValidation';
import { ApiError, submitTime as submitTimeApi, type SubmitTimeInput, type SubmitTimeResult } from '@/services/api';
import type { PrayerType } from '@/types/mosque';

export interface LocalValidationResult {
  valid: boolean;
  timeErrorKey?: string;
  prayerErrorKey?: string;
}

export function useSubmitTime() {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<ApiError | null>(null);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const validateLocally = useCallback(
    (prayer: PrayerType | null | undefined, time24: string): LocalValidationResult => {
      if (!prayer) {
        return { valid: false, prayerErrorKey: 'submit.error.prayerRequired' };
      }
      const timeResult = validateSubmissionTime(prayer, time24);
      if (!timeResult.valid) {
        return { valid: false, timeErrorKey: timeResult.errorKey };
      }
      return { valid: true };
    },
    [],
  );

  const submitTime = useCallback(async (input: SubmitTimeInput): Promise<SubmitTimeResult> => {
    setIsSubmitting(true);
    setError(null);
    try {
      const result = await submitTimeApi(input);
      return result;
    } catch (e) {
      if (e instanceof ApiError) {
        setError(e);
      }
      throw e;
    } finally {
      setIsSubmitting(false);
    }
  }, []);

  return {
    submitTime,
    isSubmitting,
    error,
    clearError,
    validateLocally,
  };
}
