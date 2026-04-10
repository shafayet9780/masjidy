# Masjidy — Phosphor icon inventory

This document lists **which Phosphor icons to use** in Masjidy, aligned with [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) and [`PROJECT_SPEC.md`](./PROJECT_SPEC.md). Icons must come from **`phosphor-react-native`** only (no emoji in UI).

**Source of truth for names:** `node_modules/phosphor-react-native/src/index.tsx` (generated exports).

**Usage:** import by component name, set `size` per [DESIGN_SYSTEM §6.2](./DESIGN_SYSTEM.md#62-icon-sizes), pass `color` from theme (`useTheme().colors` or NativeWind token-based props). Weights: `thin` | `light` | `regular` | `bold` | `fill` | `duotone` per Phosphor.

---

## Naming correction vs design doc

| DESIGN_SYSTEM / wireframes | Actual export in `phosphor-react-native` (this repo) |
|---|---|
| `MosqueStraight` | Use **`Mosque`** — `MosqueStraight` is not exported in this package version. |

Update screen copy and [`DESIGN_SYSTEM.md`](./DESIGN_SYSTEM.md) over time to say `Mosque` for consistency with code.

---

## 1. Navigation

| UI location | Phosphor component | Weight notes |
|---|---|---|
| Tab: Mosques (home) | `Mosque` | Regular inactive / Bold active |
| Tab: My mosques | `Heart` | Regular / **Fill** when conceptually “saved” |
| Tab: Prayer times | `Clock` | Regular / Bold active |
| Tab: Qibla | `Compass` | Regular / Bold active |
| Tab: Profile | `User` | Regular / Bold active |
| Stack back | `CaretLeft` or `ArrowLeft` | Regular |
| Header: search | `MagnifyingGlass` | Regular |
| Header: settings / more | `Gear` or `DotsThreeVertical` | Regular |

---

## 2. Mosques — list, profile, follow

| UI location | Phosphor component | Notes |
|---|---|---|
| Mosque list row / map pin context | `MapPin` | Distance, “near you” |
| List empty / generic building | `Building` or `Buildings` | When no photo; avoid sect-specific imagery |
| Profile: phone | `Phone` | Tap-to-call |
| Profile: directions / external maps | `NavigationArrow` or `MapTrifold` | Phase 1.5 map |
| Follow toggle | `Heart` | **Fill** when following |
| Share mosque / link | `ShareNetwork` or `Link` | |
| External link (web) | `ArrowSquareOut` | |

---

## 3. Prayer times, submission, schedule

| UI location | Phosphor component | Notes |
|---|---|---|
| Countdown / next prayer | `Clock` or `Timer` | |
| Calendar / date picker | `Calendar` or `CalendarBlank` | |
| Submit time CTA | `PencilSimple` or `Plus` | |
| Success | `Check` or `CheckCircle` | Toast / inline |
| Note field | `Note` or `NotePencil` | Optional submission note |

---

## 4. Check-in & presence

| UI location | Phosphor component | Notes |
|---|---|---|
| Check-in (until custom mat SVG exists) | `HandPalm` or `CheckCircle` | DESIGN_SYSTEM plans custom “prayer mat” asset |
| “I’ve been here” / confirm | `UserCheck` or `Check` | Secondary action |
| Live count (“X here”) | `Users` or `UsersThree` | |

---

## 5. Trust, status, errors

| UI location | Phosphor component | Notes |
|---|---|---|
| Verified | `ShieldCheck` | **Fill** or Duotone for emphasis |
| Community / pending | `Users` | Pairs with warning palette |
| Unverified | `ShieldSlash` | |
| Stale / critical | `Warning` or `WarningCircle` | |
| Generic info | `Info` | |
| Blocked / not allowed | `Prohibit` | |

---

## 6. Facilities (MosqueCard chips)

Pick one icon per facility; keep stroke style consistent at **18–20px** inline.

| Facility | Suggested Phosphor |
|---|---|
| Parking | `Car` |
| Wudu / ablution | `Drop` |
| Wheelchair accessible | `Wheelchair` |
| Kids / family | `Baby` |
| Women’s section | `Dress` or `GenderFemale` (choose one product-wide; stay neutral) |
| Generic amenity | `Sparkle` or `House` | Fallback |

---

## 7. Notifications & settings

| UI location | Phosphor component | Notes |
|---|---|---|
| Notifications | `Bell` | `BellSlash` when muted |
| Notification prefs | `SlidersHorizontal` or `Gear` | |
| Language | `Translate` | |
| Theme / appearance | `Palette` or `Sun` / `Moon` | Light–dark affordance |
| Legal / doc link | `FileText` or `Article` | |

---

## 8. Auth & account

| UI location | Phosphor component | Notes |
|---|---|---|
| Sign in | `SignIn` | |
| Sign out | `SignOut` | |
| Email | `Envelope` | |
| Password / secure field | `Lock` or `Key` | |
| Biometric | `Fingerprint` | |

---

## 9. Offline, connectivity, loading

| UI location | Phosphor component | Notes |
|---|---|---|
| Offline banner | `CloudSlash` or `WifiSlash` | |
| Online / synced | `CloudCheck` or `WifiHigh` | |
| Pull to refresh / busy | `Spinner` or `CircleNotch` | DESIGN_SYSTEM: custom minaret later |
| Full-screen loading | `Spinner` | |

---

## 10. Empty & onboarding (often `Light` or `Duotone`)

| Context | Suggested Phosphor |
|---|---|
| No mosques / no results | `MapPin` + `MagnifyingGlass` or `Buildings` |
| No followed mosques | `Heart` (Light) |
| No times | `Clock` (Light) |
| Error / retry | `Warning` + CTA with `ArrowClockwise` |

---

## 11. Custom SVG (not Phosphor)

Per [DESIGN_SYSTEM §6.3](./DESIGN_SYSTEM.md#63-custom-icons-not-in-phosphor), keep these as **assets** (`assets/icons/`), 24px grid, Phosphor-like stroke:

| Asset | Use |
|---|---|
| Qibla compass | Qibla screen (needle + Kaaba cue) |
| Prayer mat | Primary check-in |
| Minaret | Logo, splash, refresh mascot |
| Crescent (subtle) | Ramadan / seasonal (Phase 2+) |
| Trust shield variants | Optional marketing; in-app trust uses Phosphor + color + label |

---

## Quick reference — MVP set (copy-paste imports)

Use this as the default barrel for new screens; extend per section above.

```ts
import {
  ArrowLeft,
  Bell,
  Building,
  Calendar,
  Car,
  CaretLeft,
  Check,
  CheckCircle,
  Clock,
  Compass,
  DotsThreeVertical,
  Drop,
  Envelope,
  Gear,
  HandPalm,
  Heart,
  Info,
  Key,
  Lock,
  MagnifyingGlass,
  MapPin,
  MapTrifold,
  Mosque,
  NavigationArrow,
  PencilSimple,
  Phone,
  Plus,
  ShieldCheck,
  ShieldSlash,
  SignIn,
  SignOut,
  Spinner,
  Translate,
  Trash,
  User,
  UserCheck,
  Users,
  Warning,
  WifiSlash,
  Wheelchair,
} from 'phosphor-react-native';
```

*Trim unused imports per file; add `ShareNetwork`, `Palette`, `Moon`, `Sun`, `Fingerprint`, etc. as features land.*

---

## Maintenance

When upgrading `phosphor-react-native`, re-check exports:

```bash
rg "export \* from './icons/YourIcon'" node_modules/phosphor-react-native/src/index.tsx
```

If an icon was renamed or removed, update this doc and imports in one pass.
