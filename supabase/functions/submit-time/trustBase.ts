/** Tier base scores — keep in sync with src/lib/trustScore.ts */

export type ContributorTier = 'new_user' | 'regular' | 'trusted' | 'mosque_admin';

export const BASE_SCORE: Record<ContributorTier, number> = {
  mosque_admin: 100,
  trusted: 70,
  regular: 55,
  new_user: 40,
};

export function isContributorTier(value: string): value is ContributorTier {
  return value === 'new_user' ||
    value === 'regular' ||
    value === 'trusted' ||
    value === 'mosque_admin';
}
