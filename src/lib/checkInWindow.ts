import type { JamatTime, PrayerType } from '@/types/mosque';

export function formatLocalYmd(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Normalize TIMETZ fragment (e.g. `16:30:00+06`) for `Date` parsing. */
export function timetzToIsoTimeWithOffset(timetz: string): string | null {
  const raw = timetz.trim();
  if (!raw) return null;
  const part = raw.includes('T') ? (raw.split('T')[1] ?? raw) : raw;
  const m = part.match(/^(\d{1,2}):(\d{2}):(\d{2})([+-]\d{2})(?::(\d{2}))?$/);
  if (!m) return null;
  const h = String(Number(m[1])).padStart(2, '0');
  const min = String(Number(m[2])).padStart(2, '0');
  const s = String(Number(m[3])).padStart(2, '0');
  const off = m[5] != null ? `${m[4]}:${m[5]}` : `${m[4]}:00`;
  return `${h}:${min}:${s}${off}`;
}

export function jamatInstantOnLocalDate(localDate: string, timetz: string): Date | null {
  const wall = timetzToIsoTimeWithOffset(timetz);
  if (!wall) return null;
  const d = new Date(`${localDate}T${wall}`);
  return Number.isNaN(d.getTime()) ? null : d;
}

const WINDOW_BEFORE_MS = 30 * 60 * 1000;
const WINDOW_AFTER_MS = 15 * 60 * 1000;

/** Prayer whose check-in window is active now (FR-008), or null. */
export function getActiveCheckInPrayer(
  jamatTimes: readonly JamatTime[],
  localDate: string,
  nowMs: number,
): { prayer: PrayerType; jamatTime: string; jamatInstant: Date } | null {
  let best: { prayer: PrayerType; jamatTime: string; jamatInstant: Date; delta: number } | null = null;

  for (const j of jamatTimes) {
    const instant = jamatInstantOnLocalDate(localDate, j.time);
    if (!instant) continue;
    if (nowMs < instant.getTime() - WINDOW_BEFORE_MS || nowMs > instant.getTime() + WINDOW_AFTER_MS) {
      continue;
    }
    const delta = Math.abs(nowMs - instant.getTime());
    if (!best || delta < best.delta) {
      best = { prayer: j.prayer, jamatTime: j.time, jamatInstant: instant, delta };
    }
  }

  if (!best) return null;
  return { prayer: best.prayer, jamatTime: best.jamatTime, jamatInstant: best.jamatInstant };
}
