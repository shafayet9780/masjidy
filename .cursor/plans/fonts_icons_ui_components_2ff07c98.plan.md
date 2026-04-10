---
name: Fonts Icons UI Components
overview: Fix NativeWind font-family mapping for cross-platform reliability, create a Phosphor icon test component, and implement 5 production-ready UI components (Button, Card, Badge, Input, Skeleton) built on Gluestack UI v3 primitives with tailwind-variants and Masjidy theme tokens.
todos:
  - id: fix-font-mapping
    content: "Fix NativeWind font mapping: alias font names in useFonts + update tailwind.config.js fontFamily + add shadow-card"
    status: completed
  - id: icon-test
    content: Create IconShowcase.tsx test component with 5 Phosphor icons in different weights
    status: completed
  - id: gluestack-cli
    content: Run npx gluestack-ui add button input to scaffold headless primitives
    status: completed
  - id: button-component
    content: Implement Button.tsx with 5 variants (primary/secondary/ghost/danger/accent), sizes, loading state
    status: completed
  - id: card-component
    content: Implement Card.tsx with elevated/outlined variants, shadow-card, optional pressable
    status: completed
  - id: badge-component
    content: Implement Badge.tsx for trust badges (verified/community/unverified/stale) with icon + color + text
    status: completed
  - id: input-component
    content: Implement Input.tsx with label, error state, focus state, RTL-aware padding
    status: completed
  - id: skeleton-component
    content: Implement Skeleton.tsx with reanimated shimmer animation, reduced-motion support
    status: completed
isProject: false
---

# Fonts, Icons, and UI Base Components

## 1. Fix NativeWind Font-Family Mapping

**Problem**: `useFonts` in [`app/_layout.tsx`](app/_layout.tsx) registers fonts under keys like `Inter_400Regular`, but [`tailwind.config.js`](tailwind.config.js) maps `font-sans` to `['Inter']`. These don't match on React Native — `fontFamily: 'Inter'` won't resolve to the loaded font.

**Fix** (two files):

### `app/_layout.tsx` — alias font names in `useFonts`

```typescript
const [fontsLoaded] = useFonts({
  Inter: Inter_400Regular,
  InterMedium: Inter_500Medium,
  InterSemiBold: Inter_600SemiBold,
  InterBold: Inter_700Bold,
  NotoSansArabic: NotoSansArabic_400Regular,
  JetBrainsMono: JetBrainsMono_400Regular,
  JetBrainsMonoMedium: JetBrainsMono_500Medium,
});
```

### `tailwind.config.js` — map each weight to its registered name

```javascript
fontFamily: {
  sans: ['Inter'],
  'sans-medium': ['InterMedium'],
  'sans-semibold': ['InterSemiBold'],
  'sans-bold': ['InterBold'],
  arabic: ['NotoSansArabic'],
  mono: ['JetBrainsMono'],
  'mono-medium': ['JetBrainsMonoMedium'],
},
```

**Usage pattern**: `font-sans` for body, `font-sans-bold` for bold text, `font-mono` for prayer times. The `font-normal`/`font-bold` weight classes are not reliable cross-platform for custom fonts on RN — explicit family names are the safe approach.

---

## 2. Phosphor Icon Test Component

Create `src/components/__tests__/IconShowcase.tsx` — a throwaway test component rendering 5 Phosphor icons in different weights:

- `MosqueStraight` (Regular) — tab bar default
- `Heart` (Fill) — followed state
- `Clock` (Bold) — active tab
- `MapPin` (Light) — decorative
- `ShieldCheck` (Duotone) — trust badge

Each icon uses `useTheme().colors.primary` for the color prop to verify theme integration.

---

## 3. Add Gluestack UI v3 Primitives via CLI

Run `npx gluestack-ui add` for components that have official headless primitives:

- `button` — accessible Pressable with loading/disabled states
- `input` — accessible TextInput with slots for icons/labels

These get generated into `src/components/gluestack-ui/button/` and `src/components/gluestack-ui/input/` (or wherever the CLI places them). Card, Badge, and Skeleton are simpler — build from scratch with `tailwind-variants` + NativeWind using the same pattern.

---

## 4. Implement UI Components

All components follow the same structure:

- Props interface defined at top
- `tailwind-variants` `tv()` for variant styling
- NativeWind `className` prop for consumer overrides (merged via `tv`)
- All colors resolve to CSS variables (no hardcoded hex)
- `accessibilityRole` and `accessibilityLabel` on interactive elements
- RTL: `ps-`/`pe-` instead of `pl-`/`pr-`

### 4.1 `src/components/ui/Button.tsx`

Wraps the Gluestack `Button` primitive. Variants defined with `tv()`:

| Variant | bg | text | border |
|---|---|---|---|
| `primary` | `bg-primary` | white | none |
| `secondary` | transparent | `text-primary` | `border-primary` |
| `ghost` | transparent | `text-primary` | none |
| `danger` | transparent | `text-danger` | `border-danger` |
| `accent` | `bg-accent` | white | none |

Additional props: `size` (`sm` / `md` / `lg`), `loading` (shows spinner), `disabled`, `fullWidth`, `leftIcon` / `rightIcon` (Phosphor icon element).

### 4.2 `src/components/ui/Card.tsx`

Built from scratch — a styled `View`:

- `bg-surface-elevated` background
- `rounded-md` (12px) border radius
- `shadow-card` elevation (define this in tailwind config if not yet present — `shadow-card` for the shadow spec from DESIGN_SYSTEM.md section 5.3)
- Optional `border border-border` when variant is `outlined`
- Props: `children`, `className`, `variant` (`elevated` | `outlined`), `pressable` (wraps in Pressable + onPress)

### 4.3 `src/components/ui/Badge.tsx`

Trust badge with icon + color + text (color-blind safe per DESIGN_SYSTEM.md section 10):

| Variant | Icon | Color | Text |
|---|---|---|---|
| `verified` | `ShieldCheck` (Fill) | `success` | "Verified" |
| `community` | `Users` | `warning` | "Community" |
| `unverified` | `ShieldSlash` | `text-tertiary` | "Unverified" |
| `stale` | `Warning` | `danger` | "Stale" |

Props: `variant`, `size` (`sm` | `md`), `className`. Badge is a `View` with `flexDirection: 'row'`, icon + text label, `rounded-sm` (6px), appropriate bg/text colors from theme tokens.

### 4.4 `src/components/ui/Input.tsx`

Wraps the Gluestack `Input` primitive:

- `bg-surface-elevated` background, `border-border` border, `rounded-md`
- Focus state: `border-primary`
- Error state: `border-danger` + red error message below
- Props: `label` (rendered above with `font-sans-medium`), `error` (string), `helperText`, `leftIcon`, `rightIcon`, `className`, and all `TextInput` props
- RTL-aware: uses `ps-`/`pe-` for icon padding, `textAlign` from `I18nManager.isRTL`

### 4.5 `src/components/ui/Skeleton.tsx`

Shimmer animation using `react-native-reanimated`:

- `bg-surface-muted` base color
- Animated linear gradient overlay sweeping left-to-right (1.5s loop per DESIGN_SYSTEM.md section 9)
- Respects `useReducedMotion()` — static grey when reduced motion enabled
- Props: `width`, `height`, `borderRadius` (defaults to `radius-md`), `className`, `circle` (boolean shorthand for avatar skeletons)

---

## 5. Add `shadow-card` to Tailwind Config

The DESIGN_SYSTEM.md defines a `shadow-card` token. Add it to [`tailwind.config.js`](tailwind.config.js) under `boxShadow`:

```javascript
boxShadow: {
  // ... existing shadows
  card: '0px 2px 8px rgba(0, 0, 0, 0.06)',
},
```

---

## File Change Summary

| File | Action |
|---|---|
| [`app/_layout.tsx`](app/_layout.tsx) | Update `useFonts` aliases |
| [`tailwind.config.js`](tailwind.config.js) | Update `fontFamily` mapping + add `shadow-card` |
| `src/components/__tests__/IconShowcase.tsx` | New — Phosphor icon test |
| `src/components/gluestack-ui/button/` | Generated by CLI |
| `src/components/gluestack-ui/input/` | Generated by CLI |
| [`src/components/ui/Button.tsx`](src/components/ui/Button.tsx) | Replace stub |
| [`src/components/ui/Card.tsx`](src/components/ui/Card.tsx) | Replace stub |
| [`src/components/ui/Badge.tsx`](src/components/ui/Badge.tsx) | Replace stub |
| [`src/components/ui/Input.tsx`](src/components/ui/Input.tsx) | Replace stub |
| [`src/components/ui/Skeleton.tsx`](src/components/ui/Skeleton.tsx) | Replace stub |
