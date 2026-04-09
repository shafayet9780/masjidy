# Masjidy Design System v1.0

> A modern, soothing, premium Islamic aesthetic — built on Gluestack UI + NativeWind, with multi-theme support and full RTL readiness.

---

## 1. Design Principles

| Principle | What It Means in Practice |
|---|---|
| **Soulful Minimalism** | Every element serves a purpose. No decorative clutter. The beauty comes from spacing, typography, and color — not ornament. |
| **Quiet Confidence** | The app should feel like a well-maintained mosque: clean, orderly, welcoming. Never loud. Never flashy. |
| **Inclusive Neutrality** | No sectarian visual markers. No calligraphy that implies a specific tradition. Geometric patterns only. |
| **Offline-First Feel** | UI should never feel broken without internet. Skeleton screens, cached data indicators, graceful degradation. |
| **Accessibility as Worship** | Serving all users — including those with disabilities — is a core value, not an afterthought. |

---

## 2. Technology Stack (Design Layer)

| Layer | Tool | Version | Why |
|---|---|---|---|
| Component Library | `@gluestack-ui/themed` | Latest | Tailwind-based, Expo-compatible, accessible by default, tree-shakable |
| Styling Engine | `nativewind` | v4+ | Tailwind CSS for React Native; utility-first, theme-aware |
| Tailwind Config | `tailwindcss` | v3.4+ | Powers NativeWind; custom theme tokens defined here |
| Icon Library | `phosphor-react-native` | Latest | 9,000+ icons, 6 weights (Thin→Fill), MIT license, consistent 24px grid |
| Font — Latin | `Inter` | Variable | Clean, highly legible, excellent for UI. Load via `expo-font` |
| Font — Arabic/Urdu | `Noto Sans Arabic` | Variable | Google font, covers Arabic/Urdu/Bengali scripts. Excellent RTL metrics |
| Font — Monospace | `JetBrains Mono` | Regular | Prayer time digits, countdowns — tabular figures for alignment |
| Animations | `react-native-reanimated` | v3+ | Layout animations, shared transitions, gesture-driven motion |
| Haptics | `expo-haptics` | Latest | Subtle feedback on check-in, follow, submission success |

---

## 3. Color Themes

Masjidy ships with **4 user-selectable themes**, each with a **light** and **dark** variant. Theme selection is stored in AsyncStorage and applied via NativeWind's `dark:` variant + a custom theme provider.

### 3.1 Theme Architecture

```
ThemeProvider (React Context)
  ├── activeTheme: 'emerald' | 'desert' | 'midnight' | 'ocean'
  ├── colorMode: 'light' | 'dark' | 'system'
  └── Exposes: colors, semantic tokens
```

NativeWind classes use CSS variables mapped to the active theme. Example: `bg-primary` resolves to the active theme's primary color.

### 3.2 Theme: Emerald Oasis (Default)

*Classic mosque aesthetic — deep green with gold accents*

| Token | Light | Dark | Usage |
|---|---|---|---|
| `--color-primary` | `#1B6B4A` | `#2ECC71` | Buttons, active states, nav highlights |
| `--color-primary-soft` | `#E8F5EE` | `#1A3A2A` | Card backgrounds, selected states |
| `--color-accent` | `#C9963B` | `#F0C060` | Badges, premium indicators, gold accents |
| `--color-accent-soft` | `#FFF8EC` | `#2A2418` | Accent card backgrounds |
| `--color-surface` | `#FFFFFF` | `#121A14` | Main background |
| `--color-surface-elevated` | `#F7FAF8` | `#1A2A1E` | Cards, modals, sheets |
| `--color-surface-muted` | `#EFF3F0` | `#0E1510` | Dividers, disabled areas |
| `--color-text-primary` | `#1A2E23` | `#E8F5EE` | Headings, body text |
| `--color-text-secondary` | `#5A7A66` | `#8FAFA0` | Subtitles, captions, timestamps |
| `--color-text-tertiary` | `#8DA69A` | `#5A7A66` | Placeholders, hints |
| `--color-border` | `#D4E2DA` | `#2A3E30` | Card borders, dividers |
| `--color-success` | `#16A34A` | `#4ADE80` | Verified badge, check-in success |
| `--color-warning` | `#D97706` | `#FBBF24` | Community badge, pending status |
| `--color-danger` | `#DC2626` | `#F87171` | Stale badge, errors, destructive actions |
| `--color-info` | `#2563EB` | `#60A5FA` | Links, informational badges |

### 3.3 Theme: Desert Sand

*Warm, calming — teal with sand/cream tones*

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#0F766E` | `#2DD4BF` |
| `--color-primary-soft` | `#E6F7F5` | `#152E2B` |
| `--color-accent` | `#B8860B` | `#DAA520` |
| `--color-accent-soft` | `#FDF6E3` | `#2A2210` |
| `--color-surface` | `#FEFCF8` | `#141210` |
| `--color-surface-elevated` | `#F9F5EE` | `#1E1A15` |
| `--color-surface-muted` | `#F0EBE1` | `#0F0D0A` |
| `--color-text-primary` | `#2C2418` | `#F0EBE1` |
| `--color-text-secondary` | `#6B5D4F` | `#A89888` |
| `--color-text-tertiary` | `#9A8D7F` | `#6B5D4F` |
| `--color-border` | `#DDD5C8` | `#2E2820` |

### 3.4 Theme: Midnight Minaret

*Premium, night-mode forward — deep navy with gold*

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#1E3A5F` | `#5B9BD5` |
| `--color-primary-soft` | `#E8EFF7` | `#14202E` |
| `--color-accent` | `#C9963B` | `#F0C060` |
| `--color-accent-soft` | `#FFF8EC` | `#1E1A10` |
| `--color-surface` | `#FFFFFF` | `#0A0E14` |
| `--color-surface-elevated` | `#F0F4F8` | `#141C28` |
| `--color-surface-muted` | `#E0E8F0` | `#080C10` |
| `--color-text-primary` | `#0F1C2E` | `#E0E8F0` |
| `--color-text-secondary` | `#4A6180` | `#8AA0B8` |
| `--color-text-tertiary` | `#7A90A8` | `#4A6180` |
| `--color-border` | `#C8D4E0` | `#1E2E40` |

### 3.5 Theme: Ocean Breeze

*Clean, modern — soft blue with white tones*

| Token | Light | Dark |
|---|---|---|
| `--color-primary` | `#2563EB` | `#60A5FA` |
| `--color-primary-soft` | `#EBF2FF` | `#141E30` |
| `--color-accent` | `#7C3AED` | `#A78BFA` |
| `--color-accent-soft` | `#F3EEFF` | `#1A1428` |
| `--color-surface` | `#FFFFFF` | `#0F1117` |
| `--color-surface-elevated` | `#F5F7FA` | `#181B22` |
| `--color-surface-muted` | `#E8ECF0` | `#0A0C10` |
| `--color-text-primary` | `#111827` | `#F0F2F5` |
| `--color-text-secondary` | `#4B5563` | `#9CA3AF` |
| `--color-text-tertiary` | `#9CA3AF` | `#4B5563` |
| `--color-border` | `#D1D5DB` | `#2A2E38` |

### 3.6 Semantic Color Tokens (Shared Across All Themes)

These map to the trust score badges and status indicators:

| Semantic Token | Resolves To | Usage |
|---|---|---|
| `badge-verified` | `success` | Trust score 80–100 |
| `badge-community` | `warning` | Trust score 50–79 |
| `badge-unverified` | `text-tertiary` | Trust score 10–49 |
| `badge-stale` | `danger` | Trust score below 10 |
| `prayer-active` | `primary` | Current/next prayer highlight |
| `prayer-passed` | `text-tertiary` | Past prayer time |
| `checkin-live` | `success` | Active check-in count |

---

## 4. Typography

### 4.1 Type Scale

All sizes in `sp` (scale-independent pixels). Line heights are 1.4× for body, 1.2× for headings.

| Token | Size | Weight | Font | Usage |
|---|---|---|---|---|
| `display` | 32sp | Bold (700) | Inter | Splash screen, onboarding hero |
| `title-lg` | 24sp | SemiBold (600) | Inter | Screen titles |
| `title-md` | 20sp | SemiBold (600) | Inter | Section headers |
| `title-sm` | 17sp | SemiBold (600) | Inter | Card titles, mosque name |
| `body-lg` | 16sp | Regular (400) | Inter | Primary body text |
| `body-md` | 14sp | Regular (400) | Inter | Secondary text, descriptions |
| `body-sm` | 12sp | Regular (400) | Inter | Captions, timestamps, badges |
| `label` | 14sp | Medium (500) | Inter | Button labels, form labels |
| `prayer-time` | 28sp | Medium (500) | JetBrains Mono | Jamat times, countdown digits |
| `prayer-time-sm` | 18sp | Regular (400) | JetBrains Mono | Schedule table times |
| `arabic` | 18sp | Regular (400) | Noto Sans Arabic | Arabic text, prayer names in Arabic |

### 4.2 Font Loading

```javascript
// In app entry point
import { useFonts, Inter_400Regular, Inter_500Medium, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';
import { NotoSansArabic_400Regular } from '@expo-google-fonts/noto-sans-arabic';
import { JetBrainsMono_400Regular, JetBrainsMono_500Medium } from '@expo-google-fonts/jetbrains-mono';
```

### 4.3 RTL Typography Rules

- Arabic/Urdu text always uses `Noto Sans Arabic`
- `writingDirection: 'rtl'` applied at the `I18nManager` level when Arabic/Urdu is active
- Prayer names can be shown in both Arabic and transliterated English simultaneously
- Numbers in prayer times always remain LTR even in RTL layouts (standard for Arabic numeral display)

---

## 5. Spacing and Layout

### 5.1 Spacing Scale (Base: 4px)

| Token | Value | Usage |
|---|---|---|
| `space-0` | 0px | — |
| `space-1` | 4px | Tight inner padding, icon-to-text gap |
| `space-2` | 8px | Default inner padding, chip padding |
| `space-3` | 12px | Card inner padding (compact) |
| `space-4` | 16px | Card inner padding (standard), section gaps |
| `space-5` | 20px | Screen horizontal padding |
| `space-6` | 24px | Section vertical spacing |
| `space-8` | 32px | Large section breaks |
| `space-10` | 40px | Screen top/bottom safe padding |
| `space-12` | 48px | Hero spacing, onboarding |

### 5.2 Border Radius

| Token | Value | Usage |
|---|---|---|
| `radius-sm` | 6px | Chips, small badges |
| `radius-md` | 12px | Cards, inputs, buttons |
| `radius-lg` | 16px | Modals, bottom sheets |
| `radius-xl` | 24px | Floating action buttons |
| `radius-full` | 9999px | Avatar circles, pill buttons |

### 5.3 Elevation / Shadows

Minimal shadow usage — rely on surface color differences for depth. One shadow level only:

```
shadow-card:
  iOS:     shadowColor: #000, shadowOffset: {0, 2}, shadowOpacity: 0.06, shadowRadius: 8
  Android: elevation: 2
```

### 5.4 Layout Grid

- Screen horizontal padding: `20px` (space-5)
- Card gap (in lists): `12px` (space-3)
- Minimum tap target: `44×44px` (Apple HIG)
- Bottom tab bar height: `56px` + safe area inset
- Maximum content width: `480px` (centered on tablets)

---

## 6. Iconography

### 6.1 Phosphor Icons — Usage Guide

```javascript
import { MosqueStraight, MapPin, Bell, Clock, Compass, Heart, CheckCircle, Warning, User, Gear } from 'phosphor-react-native';
```

| Weight | Usage | Example |
|---|---|---|
| `Regular` | Default UI icons — nav, actions | Tab bar icons (inactive) |
| `Bold` | Emphasis, active states | Tab bar icons (active) |
| `Fill` | Selected / confirmed states | Followed mosque heart, completed check-in |
| `Light` | Decorative, secondary contexts | Empty states, onboarding illustrations |
| `Duotone` | Feature highlights, cards | Mosque profile header icon |

### 6.2 Icon Sizes

| Context | Size | Phosphor `size` prop |
|---|---|---|
| Tab bar | 24px | `size={24}` |
| Inline with body text | 18px | `size={18}` |
| Card action buttons | 20px | `size={20}` |
| Feature headers | 28px | `size={28}` |
| Empty states | 48px | `size={48}` |
| Onboarding hero | 64px | `size={64}` |

### 6.3 Custom Icons (Not in Phosphor)

These will need custom SVG icons, built to match Phosphor's 24px grid and stroke style:

| Icon | Usage | Design Notes |
|---|---|---|
| Qibla Compass | Qibla finder screen | Compass with Kaaba indicator needle |
| Prayer Mat | Check-in button | Simple mat silhouette |
| Minaret | App logo / splash | Geometric, no specific architectural style |
| Crescent (subtle) | Ramadan mode indicator | Thin crescent, not a sectarian symbol |
| Trust Shield | Trust score badge | Shield with checkmark / amber / grey variants |

---

## 7. Core Components

### 7.1 Component Library Map

Built on Gluestack UI primitives, extended with Masjidy-specific components.

#### From Gluestack UI (use directly with theme tokens)

| Component | Masjidy Usage |
|---|---|
| `Button` | Primary (filled), Secondary (outlined), Ghost (text-only) |
| `Input` | Time entry, search bar, display name |
| `Select` | Prayer picker, calculation method, lead time |
| `Switch` | Notification toggles |
| `Toast` | Success/error feedback on submission, check-in |
| `Modal` / `Actionsheet` | Confirmation dialogs, prayer time submission form |
| `Badge` | Trust score badges, prayer status |
| `Avatar` | User profile, mosque admin |
| `Spinner` | Loading states |
| `Skeleton` | Content loading placeholders |
| `Divider` | Section separators |

#### Custom Masjidy Components (build from scratch)

| Component | Description |
|---|---|
| `MosqueCard` | List item: name, distance, next prayer, trust badge. Swipeable for follow. |
| `PrayerTimeRow` | Single row in jamat schedule: prayer name, time, badge, verified timestamp |
| `PrayerTimeTable` | Full 5-prayer + Jumu'ah schedule grid |
| `TrustBadge` | Colored badge (green/amber/grey/red) with label |
| `CheckInButton` | Large tap target, animated success state, haptic feedback |
| `ConfirmMosqueButton` | "I've been here" secondary action button |
| `QiblaCompass` | Animated compass needle pointing to Qibla |
| `PrayerCountdown` | Countdown timer to next prayer with circular progress |
| `FollowButton` | Heart icon toggle with optimistic UI update |
| `OfflineBanner` | Sticky top banner: "Offline — showing cached data from [time]" |
| `EmptyState` | Illustration + message + CTA for no-data screens |
| `ThemePicker` | Grid of theme previews with active indicator |
| `SkeletonMosqueCard` | Shimmer placeholder matching MosqueCard layout |
| `LiveCount` | Animated counter: "X people checked in" with pulse animation |
| `FacilityChip` | Small chip with icon: Wudu, Parking, Women's Section, etc. |
| `SubmissionForm` | Bottom sheet with prayer picker, time input, date, note field |
| `NotificationPrefsPanel` | Per-mosque per-prayer toggle grid (Phase 1.5) |

### 7.2 Button Hierarchy

| Variant | Usage | Style |
|---|---|---|
| **Primary** | Main CTA per screen (1 max) | Filled `primary`, white text, `radius-md` |
| **Secondary** | Supporting actions | Outlined `primary`, transparent bg |
| **Ghost** | Tertiary, inline actions | Text only `primary`, no border |
| **Danger** | Destructive actions (unfollow, delete) | Outlined `danger` |
| **Accent** | Special highlights (gold badge CTA) | Filled `accent` |

### 7.3 Card Anatomy (MosqueCard)

```
┌──────────────────────────────────────────────┐
│  [Mosque Icon]  Masjid Al-Falah        ♡     │ ← name + follow
│                 1.2 km away                   │ ← distance
│  ┌─────────────────────────────────────────┐  │
│  │  Asr  ·  4:30 PM  ·  🟢 Verified      │  │ ← next prayer + badge
│  └─────────────────────────────────────────┘  │
│  🅿️ Parking  ·  🚿 Wudu  ·  ♿ Accessible    │ ← facility chips
└──────────────────────────────────────────────┘
```

---

## 8. Navigation Structure

### 8.1 Bottom Tab Bar (MVP)

| Tab | Icon (Phosphor) | Label | Screen |
|---|---|---|---|
| 1 | `MosqueStraight` | Mosques | Mosque list (home) |
| 2 | `Heart` | My Mosques | Followed mosques |
| 3 | `Clock` | Prayer Times | Prayer time calculator + countdown |
| 4 | `Compass` | Qibla | Qibla compass |
| 5 | `User` | Profile | User profile, settings, theme picker |

### 8.2 Navigation Patterns

- **Stack navigation** within each tab (e.g., Mosques → Mosque Profile → Submit Time)
- **Bottom sheet** for quick actions (time submission, check-in confirmation)
- **Modal** for authentication flows
- **No drawer navigation** — bottom tabs + stack covers all MVP needs

---

## 9. Animation Guidelines

| Context | Animation | Duration | Library |
|---|---|---|---|
| Screen transitions | Shared element (mosque card → profile) | 300ms | `reanimated` |
| Check-in success | Scale bounce + haptic | 400ms | `reanimated` + `expo-haptics` |
| Follow toggle | Heart fill with scale | 200ms | `reanimated` |
| Trust badge appear | Fade in + slight upward slide | 250ms | `reanimated` |
| Pull to refresh | Custom spinner with minaret icon | — | `reanimated` |
| Qibla compass | Smooth rotation following device heading | Continuous | `reanimated` |
| Skeleton shimmer | Linear gradient sweep | 1.5s loop | `reanimated` |
| Live count update | Number slide up/down | 200ms | `reanimated` |
| Offline banner | Slide down from top | 300ms | `reanimated` layout |

### 9.1 Motion Principles

- **Purposeful**: Every animation communicates state change. No decoration-only motion.
- **Quick**: Nothing over 400ms. Prayer apps are used in a hurry — before prayer starts.
- **Interruptible**: User can tap through any animation. Never block interaction.
- **Reduced motion**: Respect `AccessibilityInfo.isReduceMotionEnabled`. Replace all spring/timing animations with instant state changes.

---

## 10. Accessibility Requirements

| Requirement | Implementation |
|---|---|
| Screen reader support | All interactive elements have `accessibilityLabel` and `accessibilityRole` |
| Minimum contrast | 4.5:1 for body text, 3:1 for large text (WCAG AA) — verified per theme |
| Tap targets | Minimum 44×44px with 8px spacing between targets |
| Focus order | Logical tab order matching visual layout |
| Reduced motion | `useReducedMotion()` hook disables all animations |
| Dynamic type | Text scales with system font size preference (up to 200%) |
| RTL | Full mirroring via `I18nManager.forceRTL()` when Arabic/Urdu active |
| Color-blind safe | Trust badges use icon + color + text label (never color alone) |

---

## 11. Pattern Library: Key Screens

### 11.1 Mosque List (Home)

```
┌─ Status Bar ─────────────────────────────────┐
│ Masjidy                         [🔍] [⚙️]    │ ← App title + search + settings
├──────────────────────────────────────────────┤
│ Near You · 12 mosques found                   │ ← Context line
├──────────────────────────────────────────────┤
│ ┌──── MosqueCard ────────────────────────┐   │
│ │  Masjid Al-Falah         ♡    0.4 km   │   │
│ │  Asr · 4:30 PM · 🟢 Verified          │   │
│ │  🅿️ Wudu 🚿 Parking                   │   │
│ └────────────────────────────────────────┘   │
│ ┌──── MosqueCard ────────────────────────┐   │
│ │  Baitul Mukarram          ♡   1.1 km   │   │
│ │  Asr · 4:45 PM · 🟡 Community         │   │
│ └────────────────────────────────────────┘   │
│                  ...                          │
├──────────────────────────────────────────────┤
│ [🕌 Mosques] [♡ My] [🕐 Prayer] [🧭 Qibla] [👤]│
└──────────────────────────────────────────────┘
```

### 11.2 Mosque Profile

```
┌─ Status Bar ─────────────────────────────────┐
│ ← Back                              [♡ Follow]│
├──────────────────────────────────────────────┤
│            [Mosque Photo / Placeholder]       │
│                                               │
│  Masjid Al-Falah                              │
│  123 Main Street, Dhaka · 📞 Tap to call     │
│  Hanafi · Khutbah in Bengali                  │
│                                               │
│  ┌─── Jamat Schedule ───────────────────┐    │
│  │ Fajr     5:15 AM   🟢 Verified       │    │
│  │ Dhuhr    1:15 PM   🟡 Community       │    │
│  │ Asr      4:30 PM   🟢 Verified       │    │
│  │ Maghrib  6:45 PM   ⚪ Unverified      │    │
│  │ Isha     8:30 PM   🟢 Verified       │    │
│  │ Jumu'ah  1:30 PM   🟢 Verified       │    │
│  └──────────────────────────────────────┘    │
│                                               │
│  🅿️ Parking  🚿 Wudu  ♿ Accessible  👶 Kids  │
│                                               │
│  ┌────────────────────────────────────┐      │
│  │   ✅ Check In (14 people here)     │      │
│  └────────────────────────────────────┘      │
│  ┌────────────────────────────────────┐      │
│  │   📍 I've Been Here               │      │
│  └────────────────────────────────────┘      │
│                                               │
│  [ ＋ Submit a Time ]                         │
└──────────────────────────────────────────────┘
```

---

## 12. Asset Checklist

| Asset | Format | Sizes | Notes |
|---|---|---|---|
| App icon | PNG | 1024×1024 (App Store), 512×512 (Play Store), adaptive icon layers | Geometric minaret, no text |
| Splash screen | PNG | Per device resolution | Minaret icon + "Masjidy" wordmark, theme-aware bg |
| Onboarding illustrations | SVG | Flexible | 3–4 screens: discover, follow, check-in, pray |
| Mosque placeholder | SVG | 1× / 2× / 3× | Generic mosque silhouette for profiles without photos |
| Empty state illustrations | SVG | 48–120px | Per screen: no mosques, no follows, no times, offline |
| Trust badge icons | SVG | 16px / 20px | Shield variants for each trust level |
| Facility icons | SVG | 18px | Wudu, parking, women's section, wheelchair, children |
| Custom Qibla compass | SVG | 200px | Animated needle + compass ring |
| Store screenshots | PNG | Per store requirements | 5 screens minimum, both themes shown |

---

## 13. Implementation Notes

### 13.1 Theme Provider Setup

```typescript
// src/theme/ThemeContext.tsx
type ThemeName = 'emerald' | 'desert' | 'midnight' | 'ocean';
type ColorMode = 'light' | 'dark' | 'system';

interface ThemeContextValue {
  theme: ThemeName;
  colorMode: ColorMode;
  resolvedColorMode: 'light' | 'dark';
  setTheme: (theme: ThemeName) => void;
  setColorMode: (mode: ColorMode) => void;
  colors: ThemeColors; // Resolved color values for current theme + mode
}
```

### 13.2 NativeWind Tailwind Config

```javascript
// tailwind.config.js
module.exports = {
  content: ['./src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      colors: {
        primary: 'var(--color-primary)',
        'primary-soft': 'var(--color-primary-soft)',
        accent: 'var(--color-accent)',
        'accent-soft': 'var(--color-accent-soft)',
        surface: 'var(--color-surface)',
        'surface-elevated': 'var(--color-surface-elevated)',
        'surface-muted': 'var(--color-surface-muted)',
        // ... all tokens
      },
      fontFamily: {
        sans: ['Inter'],
        arabic: ['NotoSansArabic'],
        mono: ['JetBrainsMono'],
      },
      borderRadius: {
        sm: '6px',
        md: '12px',
        lg: '16px',
        xl: '24px',
      },
    },
  },
  plugins: [],
};
```

### 13.3 Gluestack UI Config Override

```typescript
// src/theme/gluestack.config.ts
import { createConfig } from '@gluestack-ui/themed';

export const config = createConfig({
  tokens: {
    // Map Gluestack tokens to our CSS variable system
    // This ensures Gluestack components respect theme switching
  },
  components: {
    Button: {
      theme: {
        // Override default button styles with our radius, font, colors
      }
    }
    // ... per-component overrides
  }
});
```

---

*This design system is a living document. Update it as the product evolves. Every component added should follow these tokens — no hardcoded colors, no magic numbers.*
