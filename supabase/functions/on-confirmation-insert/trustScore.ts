/** Mirror of supabase/functions/on-submission-insert/trustScore.ts */

export type ContributorTier = 'new_user' | 'regular' | 'trusted' | 'mosque_admin';

export const BASE_SCORE: Record<ContributorTier, number> = {
  mosque_admin: 100,
  trusted: 70,
  regular: 55,
  new_user: 40,
};

const CHECKIN_BOOST_PER = 5;
const CHECKIN_BOOST_CAP = 25;
const CONFIRMATION_BOOST_PER = 2;
const CONFIRMATION_BOOST_CAP = 10;
const CONFLICT_PENALTY = 10;

function clampScore(n: number): number {
  return Math.min(100, Math.max(0, Math.round(n)));
}

export function calculateTrustScore(input: {
  tier: ContributorTier;
  checkinCount: number;
  confirmationCount: number;
  hasConflict: boolean;
}): number {
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

export function isContributorTier(value: string): value is ContributorTier {
  return value === 'new_user' ||
    value === 'regular' ||
    value === 'trusted' ||
    value === 'mosque_admin';
}
