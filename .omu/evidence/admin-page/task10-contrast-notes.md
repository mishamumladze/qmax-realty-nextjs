# AdminButton — Contrast & Accessibility Notes (task10)

Component: `src/components/ui/AdminButton.tsx` (presentational, no hooks, no state, server-component compatible)

## Palette source

No `tailwind.config.*` exists — this is Tailwind v4. The brand palette is defined in
`src/app/globals.scss` via `@theme`, aliasing the emerald scale:

| Token     | Hex       |
| --------- | --------- |
| brand-50  | `#ecfdf5` |
| brand-400 | `#34d399` |
| brand-500 | `#10b981` |
| brand-600 | `#059669` |
| brand-700 | `#047857` |
| brand-800 | `#065f46` |
| gray-300  | `#d1d5db` |
| gray-400  | `#9ca3af` |
| gray-500  | `#6b7280` |
| gray-600  | `#4b5563` |
| gray-700  | `#374151` |
| gray-800  | `#1f2937` |
| gray-900  | `#111827` |
| red-500   | `#ef4444` |
| red-600   | `#dc2626` |
| red-700   | `#b91c1c` |
| red-800   | `#991b1b` |

Dark mode: `.dark` class on an ancestor (`@custom-variant dark (&:where(.dark, .dark *))` in globals.scss), so all dark styling uses `dark:` utilities.

Contrast ratios below were computed with the WCAG 2.x relative-luminance formula.
Threshold: >= 4.5:1 for normal text labels (14–16px semibold).

## Variant x Mode matrix

### primary

| Mode     | Classes                                                                                             | bg / text hex                            | Ratio                                | Pass              |
| -------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------- | ------------------------------------ | ----------------- |
| Light    | `bg-brand-700 text-white hover:bg-brand-800`                                                        | `#047857` / `#ffffff`                    | ~5.5:1                               | Yes               |
| Dark     | `dark:bg-brand-500 dark:text-gray-900 dark:hover:bg-brand-400`                                      | `#10b981` / `#111827`                    | ~7.0:1                               | Yes               |
| Disabled | `disabled:bg-gray-300 disabled:text-gray-500 dark:disabled:bg-gray-700 dark:disabled:text-gray-500` | `#d1d5db`/`#6b7280`, `#374151`/`#6b7280` | n/a (WCAG exempts disabled controls) | visually distinct |

Note: the site's marketing buttons use `bg-brand-600` + white (`#059669`/white = ~3.8:1),
which fails AA for normal text. AdminButton deliberately steps to `brand-700` in light mode
to satisfy the non-negotiable >= 4.5:1 requirement while staying on-palette. Dark mode follows
the existing ContactForm precedent (`dark:bg-brand-500 ... dark:text-gray-900`).

### secondary (outline)

| Mode        | Classes                                                                                                         | bg / text hex                                   | Ratio  | Pass     |
| ----------- | --------------------------------------------------------------------------------------------------------------- | ----------------------------------------------- | ------ | -------- |
| Light       | `border-2 border-brand-700 bg-white text-brand-700 hover:bg-brand-50`                                           | `#ffffff` / `#047857`                           | ~5.5:1 | Yes      |
| Light hover | same text on `bg-brand-50`                                                                                      | `#ecfdf5` / `#047857`                           | ~5.2:1 | Yes      |
| Dark        | `dark:border-brand-400 dark:bg-transparent dark:text-brand-400 dark:hover:bg-white/5`                           | parent surface (`gray-800 #1f2937`) / `#34d399` | ~7.6:1 | Yes      |
| Disabled    | `disabled:border-gray-300 disabled:text-gray-400 ... dark:disabled:border-gray-600 dark:disabled:text-gray-500` | n/a                                             | n/a    | distinct |

Note: `text-brand-600` outline style (used by SecondaryButtonTransparent) is ~3.8:1 on white;
stepped to `brand-700` for AA. `dark:bg-transparent` keeps the button usable over tables,
modals, and cards regardless of their exact dark surface color; brand-400 passes on both
gray-800 (~7.6:1) and gray-900 (~9.2:1).

### destructive (reserved for irreversible actions, e.g. delete)

| Mode     | Classes                                                 | bg / text hex         | Ratio  | Pass     |
| -------- | ------------------------------------------------------- | --------------------- | ------ | -------- |
| Light    | `bg-red-700 text-white hover:bg-red-800`                | `#b91c1c` / `#ffffff` | ~6.5:1 | Yes      |
| Dark     | `dark:bg-red-600 dark:text-white dark:hover:bg-red-500` | `#dc2626` / `#ffffff` | ~4.8:1 | Yes      |
| Disabled | shared `disabled:` pair as primary                      | n/a                   | n/a    | distinct |

Note: `red-500` + white in dark mode would be ~3.8:1 (fail), so resting dark state uses
`red-600`. The hover step to `red-500` is transient feedback only; the resting label ratio
meets 4.5:1. `red-600` also keeps a >= 3:1 boundary against gray-900 page surfaces
(~3.7:1), satisfying WCAG 1.4.11 non-text contrast for the control edge.

## Sizes (touch targets)

| Size | Classes                       | Min height                            |
| ---- | ----------------------------- | ------------------------------------- |
| sm   | `min-h-[36px] px-3 text-sm`   | 36px (>= 36px req)                    |
| md   | `min-h-[44px] px-5 text-base` | 44px (Apple HIG minimum touch target) |

## Focus visibility

Both modes: `focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-brand-600`
(2px ring, 2px offset — matches Buttons.tsx convention). Added
`dark:focus-visible:outline-brand-400` because brand-600 on near-black surfaces is dimmer;
brand-400 (`#34d399`) gives a clearly visible ring against gray-800/gray-900.

## Other a11y notes

- Native `disabled` attribute passthrough via standard button props (screen readers announce it; WCAG exempts inactive controls from contrast).
- No color-only meaning: destructive is additionally reserved by convention for irreversible actions only.
- Icons (lucide-react) render as children; `gap-2` provides spacing without extra wrappers.
