/** Trust score mirror of server logic — FR-005 */

import type { ContributorTier } from '@/types/user';

export const BASE_SCORE: Record<ContributorTier, number> = {
  mosque_admin: 100,
  trusted: 70,
  regular: 55,
  new_user: 40,
} as const;

export const BADGE_THRESHOLDS = {
  verified: 80,
  community: 50,
  unverified: 10,
} as const;

export type TrustBadgeVariant = 'verified' | 'community' | 'unverified' | 'stale';

export interface CalculateTrustScoreInput {
  tier: ContributorTier;
  checkinCount: number;
  confirmationCount: number;
  hasConflict: boolean;
}

const CHECKIN_BOOST_PER = 5;
const CHECKIN_BOOST_CAP = 25;
const CONFIRMATION_BOOST_PER = 2;
const CONFIRMATION_BOOST_CAP = 10;
const CONFLICT_PENALTY = 10;

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

/**
 * Computes trust score from tier base + capped boosts − conflict penalty.
 */
export function calculateTrustScore(input: CalculateTrustScoreInput): number {
  const base = BASE_SCORE[input.tier] ?? BASE_SCORE.new_user;
  const checkinBoost = Math.min(
    Math.max(0, input.checkinCount) * CHECKIN_BOOST_PER,
    CHECKIN_BOOST_CAP,
  );
  const confirmationBoost = Math.min(
    Math.max(0, input.confirmationCount) * CONFIRMATION_BOOST_PER,
    CONFIRMATION_BOOST_CAP,
  );
  const penalty = input.hasConflict ? CONFLICT_PENALTY : 0;
  return clampScore(base + checkinBoost + confirmationBoost - penalty);
}

export interface BadgeForScoreResult {
  variant: TrustBadgeVariant;
  /** i18n key under trustBadge.* */
  labelKey:
    | 'trustBadge.verified'
    | 'trustBadge.community'
    | 'trustBadge.unverified'
    | 'trustBadge.stale';
  /** Semantic token name for theme (DESIGN_SYSTEM §3.6) */
  colorToken: 'success' | 'warning' | 'text-tertiary' | 'danger';
  /** Phosphor icon name for consumers that map to components */
  iconName: 'ShieldCheck' | 'Users' | 'ShieldSlash' | 'Warning';
}

export function getBadgeForScore(score: number): BadgeForScoreResult {
  if (score >= BADGE_THRESHOLDS.verified) {
    return {
      variant: 'verified',
      labelKey: 'trustBadge.verified',
      colorToken: 'success',
      iconName: 'ShieldCheck',
    };
  }
  if (score >= BADGE_THRESHOLDS.community) {
    return {
      variant: 'community',
      labelKey: 'trustBadge.community',
      colorToken: 'warning',
      iconName: 'Users',
    };
  }
  if (score >= BADGE_THRESHOLDS.unverified) {
    return {
      variant: 'unverified',
      labelKey: 'trustBadge.unverified',
      colorToken: 'text-tertiary',
      iconName: 'ShieldSlash',
    };
  }
  return {
    variant: 'stale',
    labelKey: 'trustBadge.stale',
    colorToken: 'danger',
    iconName: 'Warning',
  };
}
