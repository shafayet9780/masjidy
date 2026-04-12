---
name: FR-003 Mosque Profile
overview: "Implement the mosque profile screen (FR-003) by building the data hook, screen layout, and five sub-components: PrayerTimeTable, PrayerTimeRow, TrustBadge (already done), FacilityChip (already done), CheckInButton, and ConfirmMosqueButton."
todos:
  - id: hook
    content: Implement useMosqueProfile hook -- two parallel Supabase queries (mosque + jamat_times), loading/error state, PRAYER_ORDER sort, dedup per prayer
    status: completed
  - id: i18n
    content: Add mosque.profile.* i18n keys to en.json (~15 new keys)
    status: completed
  - id: prayer-row
    content: Implement PrayerTimeRow component -- prayer name, time (mono font), TrustBadge, empty/stale states with CTAs
    status: completed
  - id: prayer-table
    content: Implement PrayerTimeTable component -- iterates PRAYER_ORDER, renders PrayerTimeRow per prayer, Card wrapper
    status: completed
  - id: checkin-btn
    content: Implement CheckInButton -- primary variant, auth-gated, icon + label, haptic (no API call yet)
    status: completed
  - id: confirm-btn
    content: Implement ConfirmMosqueButton -- secondary variant, auth-gated, icon + label (no API call yet)
    status: completed
  - id: screen
    content: Build mosque/[id].tsx screen -- photo/placeholder, mosque info, PrayerTimeTable, facilities, buttons, submit CTA, loading/error states, pull-to-refresh
    status: completed
isProject: false
---

# FR-003: Mosque Profile Screen

## Current State

**Already implemented (reuse as-is):**
- [TrustBadge.tsx](src/components/mosque/TrustBadge.tsx) -- score-to-variant mapping, 4 variants, sm/md sizes, accessible
- [FacilityChip.tsx](src/components/mosque/FacilityChip.tsx) -- icon mapping for all 5 facility types, i18n labels
- [FollowButton.tsx](src/components/mosque/FollowButton.tsx) -- AsyncStorage local follow toggle with haptics
- [Button.tsx](src/components/ui/Button.tsx) -- Gluestack wrapper with primary/secondary/ghost/danger/accent variants
- [ScreenContainer.tsx](src/components/layout/ScreenContainer.tsx) -- SafeArea + ScrollView + keyboard avoidance
- Types: [Mosque, JamatTime, PrayerType](src/types/mosque.ts), [PRAYER_ORDER](src/constants/prayers.ts), [FACILITY_KEYS](src/constants/facilities.ts)
- Formatters: [formatJamatTime, prayerTranslationKey](src/lib/formatters.ts)
- Auth gating: [useRequireAuth](src/hooks/useRequireAuth.ts) -- redirects to login with return path

**Stubs to replace (currently return `{}` or placeholder text):**
- `src/hooks/useMosqueProfile.ts`
- `src/components/mosque/PrayerTimeTable.tsx`
- `src/components/mosque/PrayerTimeRow.tsx`
- `src/components/mosque/CheckInButton.tsx`
- `src/components/mosque/ConfirmMosqueButton.tsx`
- `app/mosque/[id].tsx`

---

## 1. Data Hook -- `useMosqueProfile.ts`

**File:** [src/hooks/useMosqueProfile.ts](src/hooks/useMosqueProfile.ts)

Replace the stub with a hook that performs two Supabase queries in parallel (not via Edge Function per FR-003 spec):

```typescript
interface UseMosqueProfileResult {
  mosque: Mosque | null;
  jamatTimes: JamatTime[];
  isLoading: boolean;
  error: string | null;
  refetch: () => Promise<void>;
}

export function useMosqueProfile(mosqueId: string): UseMosqueProfileResult
```

**Supabase queries:**

1. **Mosque row:** `supabase.from('mosques').select('*').eq('id', mosqueId).single()`
   - Map the raw DB row to the `Mosque` interface (parse `facilities` via the same `parseFacilities` helper pattern used in `api.ts`)

2. **Jamat times:** `supabase.from('jamat_times').select('*').eq('mosque_id', mosqueId).eq('status', 'live')`
   - RLS policy `jamat_select_live` already filters to `status = 'live'`, but explicit `.eq('status', 'live')` is safer
   - Client-side sort by `PRAYER_ORDER` index so the table renders in canonical order (fajr -> jumuah)
   - If multiple live entries exist per prayer, pick the one with the highest `trust_score` (latest submission wins ties)

**Patterns to follow:**
- Same loading/error/fetchId race-condition guard as [useMosques.ts](src/hooks/useMosques.ts)
- Fetch on mount + when `mosqueId` changes
- Expose `refetch` for pull-to-refresh

---

## 2. i18n Keys

**File:** [src/i18n/en.json](src/i18n/en.json)

Add the following keys (block: `mosque.profile.*`):

```json
{
  "mosque.profile.schedule": "Jamat Schedule",
  "mosque.profile.facilities": "Facilities",
  "mosque.profile.madhab": "{{value}}",
  "mosque.profile.khutbah": "Khutbah in {{language}}",
  "mosque.profile.callPhone": "Tap to call",
  "mosque.profile.noPhoto": "No photo available",
  "mosque.profile.checkIn": "Check In",
  "mosque.profile.checkInCount": "{{count}} people here",
  "mosque.profile.confirmMosque": "I've Been Here",
  "mosque.profile.submitTime": "Submit a Time",
  "mosque.profile.emptyTime": "-- : --",
  "mosque.profile.addTimeCta": "Be the first to add this time",
  "mosque.profile.verifyNow": "Verify Now",
  "mosque.profile.loading": "Loading mosque...",
  "mosque.profile.error.title": "Could not load mosque",
  "mosque.profile.error.subtitle": "Check your connection and try again.",
  "mosque.profile.error.retry": "Try again",
  "mosque.profile.confirmed": "{{count}} confirmations"
}
```

---

## 3. PrayerTimeRow Component

**File:** [src/components/mosque/PrayerTimeRow.tsx](src/components/mosque/PrayerTimeRow.tsx)

```typescript
interface PrayerTimeRowProps {
  prayer: PrayerType;
  jamatTime: JamatTime | null;  // null means no time submitted yet
  onAddTime?: () => void;       // CTA for empty/stale rows
}
```

**Rendering logic:**
- **Row layout:** 3 columns -- Prayer Name (flex-1) | Time (fixed width, mono font) | TrustBadge (flex end)
- **Has time:** Show `formatJamatTime(jamatTime.time, locale)` + `TrustBadge score={jamatTime.trust_score}`
- **No time (null):** Show `"-- : --"` in grey + `TrustBadge` equivalent grey placeholder + "Be the first to add this time" link via `onAddTime`
- **Stale (trust_score < 10):** Show time in `text-danger` + `TrustBadge` in red + "Verify Now" pressable that calls `onAddTime`
- Divider between rows (except last)
- Min tap target 44px height per row
- `accessibilityLabel` combining prayer name + time + trust status

---

## 4. PrayerTimeTable Component

**File:** [src/components/mosque/PrayerTimeTable.tsx](src/components/mosque/PrayerTimeTable.tsx)

```typescript
interface PrayerTimeTableProps {
  jamatTimes: JamatTime[];
  onAddTime: (prayer: PrayerType) => void;
}
```

**Logic:**
- Section header: `t('mosque.profile.schedule')` styled as `title-md`
- Iterate `PRAYER_ORDER` (6 prayers). For each, find the matching `JamatTime` from the array (or `null`)
- Render `PrayerTimeRow` for each prayer
- Wrap in a `Card` (`variant="elevated"`) for visual grouping with `rounded-md` border

---

## 5. CheckInButton Component

**File:** [src/components/mosque/CheckInButton.tsx](src/components/mosque/CheckInButton.tsx)

```typescript
interface CheckInButtonProps {
  mosqueId: string;
}
```

**Behavior:**
- Uses the existing `Button` component with `variant="primary"`, `size="lg"`, `fullWidth`
- Icon: `CheckCircle` from Phosphor (per ICONS.md -- `HandPalm` or `CheckCircle` for check-in until custom asset)
- Label: `t('mosque.profile.checkIn')`
- On press: calls `useRequireAuth().requireAuth(() => { /* invoke check-in */ })`
- For MVP scope: the actual check-in API call is NOT implemented here (that is FR-008, separate work). The button will gate on auth and show a placeholder toast or TODO comment for the actual `useCheckIn` integration
- Haptic feedback on success via `expo-haptics`
- Consider showing live count text below button: `t('mosque.profile.checkInCount', { count })` -- for now render statically or skip until FR-008

**Decision:** Since `useCheckIn` is a separate feature (FR-008), the button will call `requireAuth` and then log/no-op. The wiring to the actual check-in hook will come in a follow-up task.

---

## 6. ConfirmMosqueButton Component

**File:** [src/components/mosque/ConfirmMosqueButton.tsx](src/components/mosque/ConfirmMosqueButton.tsx)

```typescript
interface ConfirmMosqueButtonProps {
  mosqueId: string;
}
```

**Behavior:**
- Uses `Button` with `variant="secondary"`, `size="md"`, `fullWidth`
- Icon: `UserCheck` from Phosphor (per ICONS.md)
- Label: `t('mosque.profile.confirmMosque')`
- On press: `requireAuth(() => { /* invoke confirm */ })`
- Same as CheckInButton: actual API call deferred to FR-008B implementation. Auth gate + placeholder.

---

## 7. Screen -- `app/mosque/[id].tsx`

**File:** [app/mosque/[id].tsx](app/mosque/[id].tsx)

Replace the placeholder with the full profile layout per DESIGN_SYSTEM Section 11.2.

**Stack header config (Expo Router):**
- `Stack.Screen options`: title = mosque name (dynamic), `headerRight` = `FollowButton`
- Back button handled by Expo Router default

**Screen structure (top to bottom, inside ScreenContainer with scroll):**

1. **Photo area:** If `mosque.photo_url` exists, render `Image` with `aspect-ratio 16:9`, `rounded-md`. Otherwise render a placeholder view with `Building` icon (Phosphor, Light weight, 64px) on `bg-surface-muted`
2. **Name:** `title-lg` text
3. **Address:** `body-md`, `text-text-secondary`, with `MapPin` inline icon
4. **Phone:** If `contact_phone` exists, `Pressable` row with `Phone` icon + `t('mosque.profile.callPhone')` that calls `Linking.openURL('tel:...')`
5. **Madhab + Khutbah:** If present, row of text chips: `"Hanafi"` and `"Khutbah in Bengali"`
6. **Confirmation count:** If `confirmation_count > 0`, small text: `t('mosque.profile.confirmed', { count })`
7. **PrayerTimeTable** -- full schedule
8. **Facility chips row:** Horizontal `ScrollView` of `FacilityChip` (same pattern as `MosqueCard`, but show ALL facilities, no overflow cap)
9. **CheckInButton** -- primary, large, prominent
10. **ConfirmMosqueButton** -- secondary, below check-in
11. **"Submit a Time" CTA:** `Button variant="ghost"` with `Plus` icon, navigates to `submit-time/[mosqueId]`

**States:**
- **Loading:** Show skeleton layout (mosque name skeleton, time table skeletons, button skeletons). Use the existing `Skeleton` component.
- **Error:** `EmptyState` with error icon + retry button that calls `refetch()`
- **Pull-to-refresh:** `RefreshControl` on the `ScrollView` calling `refetch()`

**Navigation:**
- "Submit a Time" navigates to `/submit-time/${mosqueId}` (screen exists as a route per project structure)
- `onAddTime` callback on PrayerTimeTable also navigates to submit-time, possibly with prayer pre-selected via query param

---

## 8. File Change Summary

| File | Action | Scope |
|---|---|---|
| `src/hooks/useMosqueProfile.ts` | Rewrite | Full hook implementation |
| `src/components/mosque/PrayerTimeRow.tsx` | Rewrite | Full component |
| `src/components/mosque/PrayerTimeTable.tsx` | Rewrite | Full component |
| `src/components/mosque/CheckInButton.tsx` | Rewrite | Auth-gated button (no API call) |
| `src/components/mosque/ConfirmMosqueButton.tsx` | Rewrite | Auth-gated button (no API call) |
| `app/mosque/[id].tsx` | Rewrite | Full screen layout |
| `src/i18n/en.json` | Edit | Add ~15 new keys |

**No new files created.** All target files exist as stubs. No changes to existing working components (TrustBadge, FacilityChip, FollowButton, Button).

---

## 9. Architectural Notes

- **No Edge Function for profile:** FR-003 spec says "direct Supabase query" -- this is correct because profile data is public (RLS `mosques_select` allows all reads, `jamat_select_live` allows reading live times). No auth required for viewing.
- **PRAYER_ORDER for display sort:** The DB query returns rows in unspecified order. Client sorts using `PRAYER_ORDER` index to guarantee Fajr-to-Jumuah display.
- **Dedup per prayer:** If multiple `live` jamat_times exist for the same prayer at one mosque, pick highest `trust_score`. This is defensive -- normally only one live entry should exist per prayer.
- **CheckIn / Confirm wiring deferred:** These buttons will auth-gate and no-op until FR-008 / FR-008B are built. This avoids scope creep while still completing the visual layout.
- **RTL safe:** All layout uses `start`/`end` (not `left`/`right`), flex-based spacing, and NativeWind utilities.
