---
name: QMAX Realty
description: Multilingual Tbilisi property catalog with one-tap inquiry.
colors:
  brand-50: "#ecfdf5"
  brand-100: "#d1fae5"
  brand-200: "#a7f3d0"
  brand-300: "#6ee7b7"
  brand-400: "#34d399"
  brand-500: "#10b981"
  brand-600: "#059669"
  brand-700: "#047857"
  brand-800: "#065f46"
  brand-900: "#064e3b"
  brand-950: "#022c22"
  neutral-white: "#ffffff"
  neutral-50: "#f9fafb"
  neutral-100: "#f3f4f6"
  neutral-200: "#e5e7eb"
  neutral-600: "#4b5563"
  neutral-700: "#374151"
  neutral-800: "#1f2937"
  neutral-900: "#111827"
  danger: "#dc2626"
  success-bg: "#f0fdf4"
typography:
  display:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2.5rem, 5vw, 4rem)"
    fontWeight: 700
    lineHeight: 1.1
  headline:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(2rem, 4vw, 3rem)"
    fontWeight: 700
    lineHeight: 1.15
  title:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "clamp(1.5rem, 3vw, 2.25rem)"
    fontWeight: 700
    lineHeight: 1.25
  body:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "1rem"
    fontWeight: 400
    lineHeight: 1.6
  label:
    fontFamily: "Inter, system-ui, sans-serif"
    fontSize: "0.875rem"
    fontWeight: 600
    lineHeight: 1.5
    letterSpacing: "0.01em"
rounded:
  lg: "8px"
  xl: "12px"
  2xl: "16px"
  3xl: "24px"
  full: "9999px"
spacing:
  sm: "8px"
  md: "16px"
  lg: "24px"
  xl: "32px"
components:
  button-primary:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-primary-hover:
    backgroundColor: "{colors.brand-700}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  button-secondary:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.brand-700}"
    rounded: "{rounded.lg}"
    padding: "12px 20px"
  input-default:
    backgroundColor: "{colors.neutral-white}"
    textColor: "{colors.neutral-900}"
    rounded: "{rounded.lg}"
    padding: "12px 16px"
  chip-active:
    backgroundColor: "{colors.brand-600}"
    textColor: "{colors.neutral-white}"
    rounded: "{rounded.full}"
    padding: "8px 16px"
---

# Design System: QMAX Realty

## Overview

**Creative North Star: "Emerald Ledger"**

Ledger before boutique. Every screen reads like trusted record: photo, price, specs, map, contact action. Emerald marks proof and action only. Type stays quiet, surfaces stay flat, imagery carries warmth.

Calm confident density. Spacious marketing sections (`py-12 / py-20`, `max-w-6xl` centered), compact task UI in admin and filters. Single type family, single accent ramp, dark mode as tonal inversion rather than second theme. Anti-reference: flashy proptech gradients, multi-accent palettes, thin low-contrast luxury type.

**Key Characteristics:**
- Factual catalog cards over marketing heroics
- One emerald ramp for all action and proof
- Flat surfaces at rest, lift only on hover
- Pills for actions and filters, soft rectangles for containers
- 44px minimum touch targets everywhere

## Colors

Single emerald ramp on neutral gray, dark mode by tonal inversion.

### Primary
- **Tbilisi Emerald** (#059669 / #047857 / #065f46): all action. CTAs (`bg-brand-600 hover:bg-brand-700`), prices, active nav, selected filters, icon tiles. Dark mode steps down one rung lighter (`brand-300 / brand-400` text, `brand-500` fills).
- **Mint Wash** (#ecfdf5): selected-chip and icon-tile ground (`bg-brand-50`, dark `bg-brand-900/40`). Never page background.
- **Pine Depth** (#064e3b / #022c22): CTA banner ground (`bg-brand-800`, `border-brand-700`) with white/10 glow blobs.

### Neutral
- **Paper** (#ffffff): card and page ground in light mode.
- **Ledger Gray** (#f9fafb / #f3f4f6): section bands (`bg-gray-50`), borders (`border-gray-100 / border-gray-200`).
- **Ink** (#111827 / #1f2937 / #374151): body text and dark-mode surfaces inverted (`dark:bg-gray-900`, `dark:bg-gray-800`, `dark:text-gray-100`).
- **Muted Ledger** (#4b5563): secondary copy (`text-gray-600`, dark `text-gray-300` / `text-gray-400`).
- **Signal Red** (#dc2626): destructive actions and form errors only (`bg-red-600`, `border-red-500`, `bg-red-50`).
- **Signal Green Wash** (#f0fdf4): form success ground (`bg-green-50`, `border-green-200`).

### Named Rules (optional, powerful)
**The Ledger Rule.** Emerald means action or proof: CTA, price, active state, selected filter. Never pure decoration.
**The Inversion Rule.** Dark mode inverts tone, never hue: same emerald ramp, gray scale flipped. No separate dark palette.

## Typography

**Display Font:** Inter (with system-ui fallback)
**Body Font:** Inter (with system-ui fallback)

**Character:** Quietly confident grotesque. Weight and size carry hierarchy; family never changes. Tabular numerals for prices and stats.

### Hierarchy
- **Display** (700, clamp(2.5rem, 5vw, 4rem), 1.1): page heroes only (`--text-display`). Always bold, balanced wrap.
- **Headline** (700, clamp(2rem, 4vw, 3rem), 1.15): page titles and form titles (`text-h1`, `text-h2`).
- **Title** (700, clamp(1.5rem, 3vw, 2.25rem) down to 1.25rem, 1.25): section headers and card titles (`text-h2`, `text-h3`, `text-lg/xl` card names).
- **Body** (400/500, 1rem/1.6, relaxed): descriptions, card copy, map popups (13px in Leaflet popups). Max measure conversational, cards clamp to 1-2 lines.
- **Label** (600/700, 0.875rem down to 0.75rem, 0.01em): eyebrows, badges, chips, metadata (`tracking-[0.18em] uppercase text-xs` eyebrows; `text-caption` / `text-footnote` meta).

### Named Rules (optional)
**The Single Voice Rule.** Inter only. Hierarchy via weight and clamp, never new family.

## Layout

Centered ledger column: `max-w-6xl` marketing and listings, `max-w-7xl` nav and footer, `max-w-5xl` carousel stage. Section rhythm `.section` (`container mx-auto my-6 px-4 py-8`, `md:my-8 md:py-12`); hero sections break out full-bleed (`h-[62svh]`, `md:h-[72vh]`).

Grid: 1-col mobile, `sm:grid-cols-2`, `lg:grid-cols-3/4` cards with `gap-4 / sm:gap-6`. Carousel shows 1 / 2 / 3 cards at <640 / 640+ / 1024+ breakpoints. Spacing rhythm 8px base (`gap-2/3/4`, `p-4/6`, `px-4 sm:px-6`). Minimum touch target 44px (`min-h-[44px]`, `min-h-11 min-w-11`) on every button, link row, dot, icon control. Nav fixed bottom on mobile, fixed top on desktop (`md:top-0 md:bottom-auto`, `h-16`); main reserves `pb-20 md:pb-0 md:pt-16`.

## Elevation & Depth

Flat by default, tonal layering first, shadow as response. Cards rest at `shadow-sm` on bordered white; hover lifts (`motion-safe:hover:-translate-y-0.5`, `hover:shadow-lg/xl`). Dark mode conveys depth by lightening surface (`dark:bg-gray-800`, `dark:bg-gray-700/40`) rather than deeper shadow. Map popups and drawers use heavier shadow for overlay separation.

### Shadow Vocabulary (if applicable)
- **Rest** (`box-shadow: 0 1px 2px rgb(0 0 0 / 0.05)`): property and feature cards (`shadow-sm`).
- **Raised** (`box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1)`): carousel arrows, form shell (`shadow-md`, form `shadow-lg`).
- **Overlay** (`box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1)`): CTA banner (`shadow-xl`), mobile drawer (`shadow-2xl`), map popup.
- **Blur veil** (`backdrop-blur-lg/sm`, `bg-white/95`, `bg-black/40`): navbar, mobile logo chip, gallery controls.

### Named Rules (optional)
**The Flat-By-Default Rule.** Surfaces rest flat with border. Shadow appears only on hover, focus, or overlay.

## Shapes

Soft-rectangle system with pill actions. Default container radius gently curved (8px, `rounded-lg`); cards and fields large-soft (12-16px, `rounded-xl / rounded-2xl`); feature panels extra-soft (24px, `rounded-3xl`). All actions, filters, chips, badges, dots, carousel arrows fully pill (`rounded-full`). Icon tiles small-squircle (12px, `rounded-xl`, `h-12 w-12`). Borders hairline (`border gray-100/200`, `border-2` only on buttons and active pills). Signature geometry: map pin teardrop (`border-radius: 50% 50% 50% 4px`, rotated -45deg, 26px body with 8px white dot and ping halo); mobile drawer sheet (`rounded-t-2xl`, `border-t-4 brand-500`, grab handle `h-1.5 w-12 rounded-full`).

## Components

### Buttons
Tactile and confident: solid fills, bold labels, 44px minimum, icon + label pairs.
- **Shape:** gently curved by default (8px, `rounded-lg`); hero CTAs fully pill (`rounded-full shadow-lg`)
- **Primary:** emerald fill white text (`bg-brand-600 border-2 border-white text-white`, `px-5/6 py-3`, `min-h-11`); dark `bg-brand-500`
- **Hover / Focus:** darken one rung (`hover:bg-brand-700`, dark `hover:bg-brand-600`); global focus ring (2px `brand-500`, 2px offset); `transition-all duration-200`
- **Secondary / Ghost / Tertiary (if applicable):** Secondary white ground emerald text 2px emerald border (`hover:bg-brand-50`); Tertiary transparent white text (`hover:bg-brand-900/30`) for dark bands; Destructive (`bg-red-600 hover:bg-red-700`, dark `bg-red-500`)
- **Admin:** same language, deeper light-mode fill (`bg-brand-700 hover:bg-brand-800`) for 4.5:1 contrast; sizes `sm / md` only

### Chips
Pill ledger tags for filters and active state.
- **Style:** fully pill (`rounded-full border px-4 py-2 text-sm`); inactive gray border; active emerald fill white text (`bg-brand-600 border-brand-600`, dark `bg-brand-500`); applied-filter variant mint wash (`bg-brand-50 text-brand-700`, dark `bg-brand-900/40 text-brand-300`) with dismiss control
- **State:** selected = filled; unselected = outline with emerald hover wash (`hover:bg-brand-50`)

### Cards / Containers
Factual ledger rows: image top, price + title, meta, specs, link.
- **Corner Style:** large-soft (16px, `rounded-2xl`)
- **Background:** white light (`bg-white`), tonal gray dark (`dark:bg-gray-800`, feature `dark:bg-gray-700/40`)
- **Shadow Strategy:** rest `shadow-sm`, hover lift + `hover:shadow-lg/xl` (see Elevation)
- **Border:** hairline (`border-gray-100`, dark `border-gray-700`)
- **Internal Padding:** compact (`p-4 md:p-6`); form shell looser (`p-6 md:p-10`)

### Inputs / Fields
Quiet ledger fields, loud focus.
- **Style:** soft rectangle (8px, `rounded-lg`), hairline stroke (`border-gray-300`, dark `border-gray-700`), white / near-black ground (`dark:bg-gray-900`), `px-4 py-3`, `min-h-[44px]`
- **Focus:** emerald ring (`focus:ring-2 focus:ring-brand-500`, no outline offset collapse)
- **Error / Disabled:** error red stroke + wash (`border-red-500 bg-red-50`); disabled `opacity-50`, admin-disabled gray fills; inline error text (`text-sm text-red-600`, `role=alert`)

### Navigation
Bottom tab bar on mobile, top bar on desktop; active = emerald word + rule.
- **Style:** fixed blurred bar (`bg-white/95 backdrop-blur-lg`, dark `bg-gray-900/95`, `border-gray-200`); desktop `h-16`, underline rule (`h-0.5 bg-brand-600`) with spring `layoutId` pill (static rule under reduced motion); mobile drawer sheet (`rounded-t-2xl border-t-4 border-brand-500`, active row mint wash `bg-brand-50`)
- **Typography:** `text-sm font-medium`, active semibold emerald (`text-brand-600`, dark `text-brand-400`)
- **Mobile treatment:** bottom bar hides on scroll down, shows on scroll up; hamburger 44px with focus ring; drawer focus-trapped with Escape close and backdrop (`bg-black/40 backdrop-blur-sm`)

### Property Card (signature)
Image-led proof block: `h-52/md:h-56` cover image, title 1-line clamp + emerald price right, 1-line location, bed/bath/m² icon row (`Bed Bath Square`, `text-xs/md:text-sm gray-500`), emerald details link with arrow slide (`group-hover:translate-x-1`).

### Map Pin (signature)
Emerald teardrop with pulse: 36px stage, ping halo (`bg-brand-500`, 2s ping, disabled under reduced motion), 26px body (`bg-brand-600`, white 2px ring, `0 1px 4px rgb(0 0 0 / 0.4)`), 8px white dot. Dark map ground near-black (`#0b0f0e`).

## Do's and Don'ts

Concrete visual guardrails grounded in the incumbent implementation or the user's chosen world. Lead each with "Do" or "Don't" and include exact values only when established. Do not turn a task-specific concept or surface strategy into a system-wide prohibition.

### Do:
- **Do** keep every interactive target at least 44px (`min-h-[44px] / min-h-11 min-w-11`).
- **Do** use emerald only for action or proof: CTA, price, active nav, selected filter.
- **Do** rest cards flat (`shadow-sm` + hairline border) and lift on hover (`-translate-y-0.5` + `hover:shadow-lg`).
- **Do** invert tone for dark mode (gray-900 ground, brand-300 text), never introduce new hue.
- **Do** honor reduced motion: static active rule, no pulse, `motion-safe:` transitions.
- **Do** pair every icon with visible label in CTAs and nav drawer rows.

### Don't:
- **Don't** add second accent hue alongside emerald; red/green reserved for form error/success.
- **Don't** use thin or oversized display type for body; body stays Inter 1rem/1.6.
- **Don't** ship static-only states; every button, chip, card link needs hover and `focus-visible` treatment.
- **Don't** decorate with emerald glows outside CTA banner and map pin pulse.
- **Don't** invent new radius scale; use 8 / 12 / 16 / 24 / pill.
- **Don't** place imagery without text veil on heroes (`from-black/80 via-black/40` gradient + centered `max-w-2xl` lockup).
