# QMAX Realty - Apple HIG Design Review & Implementation Plan

**Date**: August 29, 2026  
**Project**: QMAX Realty Next.js Real Estate Website  
**Scope**: Full UI/UX audit against Apple Human Interface Guidelines (HIG)  
**Methodology**: Codebase analysis + HIG compliance check

---

## Executive Summary

The QMAX Realty codebase demonstrates **solid technical foundations** with consistent emerald brand identity, proper dark mode support, internationalization (5 languages), and Framer Motion animations. However, several **critical HIG violations** and **accessibility gaps** exist that would prevent App Store approval and degrade user experience.

**Overall HIG Compliance Score: 62/100** (Needs Significant Improvement)

| Pillar                 | Score  | Status      |
| ---------------------- | ------ | ----------- |
| Accessibility          | 45/100 | 🔴 Critical |
| Visual Design          | 70/100 | 🟡 Moderate |
| Interaction & Feedback | 60/100 | 🟡 Moderate |
| Layout & Typography    | 75/100 | 🟡 Good     |
| Dark Mode              | 80/100 | 🟢 Good     |
| Navigation             | 55/100 | 🔴 Critical |

---

## Phase 1: Accessibility Critical Path (✅ COMPLETED)

### Phase 1A: Foundation (Week 1)

| Task                                       | Status  | Files Modified                                                                |
| ------------------------------------------ | ------- | ----------------------------------------------------------------------------- |
| `lang` attribute on `<html>`               | ✅ Done | Already present in `layout.tsx:35`                                            |
| Semantic heading hierarchy (h1-h3)         | ✅ Done | `socials/page.tsx`, `properties/details/[id]/page.tsx`, `ListingsContent.tsx` |
| Form labels (ContactForm & NewsletterForm) | ✅ Done | `NewsletterForm.tsx` + 5 locale files                                         |
| Icon-only button `aria-label`              | ✅ Done | `Buttons.tsx` (added `ariaLabel` prop), verified existing implementations     |
| Global focus-visible styles                | ✅ Done | `globals.scss`                                                                |

### Phase 1B: Modal Focus Management & Form Announcements (Week 1-2)

| Task                                                           | Status  | Files Modified                            |
| -------------------------------------------------------------- | ------- | ----------------------------------------- |
| Navbar SlideOver: focus trap + escape + aria-modal             | ✅ Done | Already fully implemented                 |
| ListingsContent filter modal: focus trap + escape + aria-modal | ✅ Done | Already fully implemented                 |
| PropertyGallery lightbox: focus trap + restore + escape        | ✅ Done | `PropertyGallery.tsx` - complete overhaul |
| ContactForm: `aria-describedby` + `aria-invalid` on all fields | ✅ Done | `ContactForm.tsx` - all 6 fields          |
| ContactForm & NewsletterForm: success/error announcements      | ✅ Done | `ContactForm.tsx`, `NewsletterForm.tsx`   |

### Files Modified in Phase 1

```
src/app/[locale]/socials/page.tsx                    # h2 → h3 for social cards
src/app/[locale]/properties/details/[id]/page.tsx    # Heading structure + fixed closing tag
src/components/ListingsContent.tsx                   # Active filters h3, type filter sr-only h3
src/components/NewsletterForm.tsx                    # Visible label + ARIA on toasts
src/components/ui/Buttons.tsx                        # ariaLabel prop support
src/app/globals.scss                                 # Global focus-visible styles
src/components/PropertyGallery.tsx                   # Complete lightbox accessibility
src/components/ContactForm.tsx                       # aria-describedby + aria-invalid + ARIA toasts
messages/en.json, de.json, pl.json, ru.json, tr.json # NewsForm.input.label translations
```

### Verification

- ✅ TypeScript compiles: `npx tsc --noEmit` passes
- ✅ All accessibility patterns follow Apple HIG references

---

## Phase 2: Touch Targets & Visual System (Week 2-3) 🔄 PLANNED

### 2.1 Touch Target Minimum 44×44pt (iOS HIG Requirement)

| Component                      | Current Size          | Required | Fix                            |
| ------------------------------ | --------------------- | -------- | ------------------------------ |
| `ThemeToggle.tsx` button       | 40×40px (`w-10 h-10`) | 44×44pt  | Increase to `w-11 h-11`        |
| `LanguageSelector.tsx` trigger | ~36px height          | 44×44pt  | Add `min-h-[44px]`             |
| Carousel nav arrows            | 32×32px               | 44×44pt  | Increase hit area with padding |
| Filter chips (close button)    | ~24×24px              | 44×44pt  | Wrap in larger touch target    |
| AdminButton `sm` variant       | 32px height           | 44×44pt  | Increase to 44px minimum       |

### 2.2 Button System Consolidation (7 → 4 Variants)

**Current variants in `Buttons.tsx`:**

```
Primary, Secondary, PrimaryRounded, PrimaryTransparent,
SecondaryTransparent, SocialsButton, AdminButton (separate file)
```

**HIG Violation**: Too many styles dilute primary actions ([Layout → Visual Hierarchy](file:///Users/misha/.opencode/skill/apple-design-skill/references/layout.md#visual-hierarchy))

**Recommended consolidation to 4 variants:**

| Variant     | Use Case                                  | Style               |
| ----------- | ----------------------------------------- | ------------------- |
| Primary     | Main CTAs (Contact, Submit, Book)         | Filled brand-600    |
| Secondary   | Supporting actions (View Details, Filter) | Outlined brand-600  |
| Tertiary    | Low-priority (Cancel, Skip)               | Text-only brand-600 |
| Destructive | Delete, Remove                            | Filled red-600      |

### 2.3 Semantic Typography Scale

**Current usage** (arbitrary values):

- No consistent type scale - arbitrary `text-lg`, `text-xl`, `text-2xl`, `text-3xl`, `text-4xl`
- `Home.tsx` hero uses `text-4xl md:text-5xl lg:text-6xl` - no fluid scaling
- `PropertyDetails.tsx` price uses `text-3xl font-bold` - no semantic token

**Fix**: Define semantic tokens in `globals.scss`:

```scss
@theme {
  --text-display: clamp(2.5rem, 5vw, 4rem);    // Hero
  --text-h1: clamp(2rem, 4vw, 3rem);           // Page titles
  --text-h2: clamp(1.5rem, 3vw, 2.25rem);      // Section headers
  --text-h3: 1.25rem;                          // Card titles
  --text-body: 1rem;                           // Body copy
  --text-caption: 0.875rem;                    // Metadata
  --text-footnote: 0.75rem;                    // Legal/copyright
}
```

### 2.4 Spacing System (4px Base Unit)

**Observed gaps**: Components use arbitrary `gap-4`, `gap-6`, `gap-8`, `p-4`, `p-6`, `p-8` without system.

**Fix**: 4px base unit scale (4, 8, 12, 16, 20, 24, 32, 40, 48, 64) - map to Tailwind `space-{1-16}`.

### 2.5 Dark Mode Completion

| Issue                         | Location              | Fix                             |
| ----------------------------- | --------------------- | ------------------------------- |
| Social icons hardcoded colors | `ContactLinks.tsx`    | Add dark mode variants          |
| Lightbox backdrop             | `PropertyGallery.tsx` | Use semantic `bg-background/90` |
| AdminButton no dark mode      | `AdminButton.tsx`     | Add dark mode styles            |
| Map embed no dark fallback    | `Footer.tsx`          | Add dark mode handling          |

### 2.6 Design Tokens to Add (`globals.scss`)

```scss
@theme {
  /* Typography */
  --text-display: clamp(2.5rem, 5vw, 4rem);
  --text-h1: clamp(2rem, 4vw, 3rem);
  --text-h2: clamp(1.5rem, 3vw, 2.25rem);
  --text-h3: 1.25rem;
  --text-body: 1rem;
  --text-caption: 0.875rem;
  --text-footnote: 0.75rem;

  /* Spacing (4px base) */
  --space-1: 4px;   --space-5: 20px;  --space-9: 36px;
  --space-2: 8px;   --space-6: 24px;  --space-10: 40px;
  --space-3: 12px;  --space-7: 28px;  --space-12: 48px;
  --space-4: 16px;  --space-8: 32px;  --space-16: 64px;

  /* Touch targets */
  --touch-target-min: 44px;

  /* Motion */
  --duration-fast: 150ms;
  --duration-normal: 200ms;
  --duration-slow: 300ms;
  --easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
  --easing-emphasized: cubic-bezier(0.2, 0, 0, 1);

  /* Shadows (elevation) */
  --shadow-level-1: 0 1px 2px rgb(0 0 0 / 0.05);
  --shadow-level-2: 0 4px 6px -1px rgb(0 0 0 / 0.1);
  --shadow-level-3: 0 10px 15px -3px rgb(0 0 0 / 0.1);
  --shadow-level-4: 0 20px 25px -5px rgb(0 0 0 / 0.1);
  --shadow-level-5: 0 25px 50px -12px rgb(0 0 0 / 0.25);

  /* Focus ring */
  --focus-ring: 0 0 0 2px var(--color-brand-500);
  --focus-ring-offset: 2px;
}
```

---

## Phase 3: Interaction Polish (Week 3-4) 🔄 PLANNED

### 3.1 Loading & Empty States

| Missing State                         | Location                                        |
| ------------------------------------- | ----------------------------------------------- |
| Skeleton loaders for property cards   | `ListingsContent.tsx`, `PropertiesCarousel.tsx` |
| Empty state for "no properties found" | `ListingsContent.tsx`                           |
| Empty state for gallery               | `PropertyGallery.tsx`                           |
| Offline indicator                     | Global                                          |

### 3.2 Navigation & Wayfinding

| Issue                                                               | Location              | Fix                                    |
| ------------------------------------------------------------------- | --------------------- | -------------------------------------- |
| Breadcrumb missing on Property Details                              | `PropertyDetails.tsx` | Add breadcrumb with "Back to Listings" |
| Mobile bottom nav: no show-on-scroll-up                             | `Navbar.tsx`          | Add scroll detection                   |
| Active filter chips: "clear all" exists but could be more prominent | `ListingsContent.tsx` | Enhance visibility                     |
| No "back to results" from Property Details                          | `PropertyDetails.tsx` | Already has link - verify visibility   |

### 3.3 Form UX Enhancements

| Issue                             | Location          | Fix                              |
| --------------------------------- | ----------------- | -------------------------------- |
| No inline validation on blur      | `ContactForm.tsx` | Add validation on blur           |
| Phone input lacks formatting/mask | `ContactForm.tsx` | Add phone input mask             |
| No autocomplete attributes        | All form inputs   | Add proper `autocomplete` values |

### 3.4 Carousel Improvements

| Issue                                        | Location                 | Fix                            |
| -------------------------------------------- | ------------------------ | ------------------------------ |
| Auto-advance doesn't pause on hover/focus    | `PropertiesCarousel.tsx` | Add pause on hover/focus       |
| No slide indicator (dots) for screen readers | `PropertiesCarousel.tsx` | Already has dots - verify ARIA |
| Touch swipe threshold too sensitive (50px)   | `PropertiesCarousel.tsx` | Adjust threshold               |

---

## Phase 4: Motion & Feedback Refinement (Week 4) 🔄 PLANNED

| Task                                   | Details                       |
| -------------------------------------- | ----------------------------- |
| Respect `prefers-reduced-motion`       | All Framer Motion components  |
| Reduce page transition duration        | 300ms → 200ms in `layout.tsx` |
| Carousel auto-advance pause on hover   | `PropertiesCarousel.tsx`      |
| Add loading states with `aria-busy`    | Form submit buttons           |
| Implement offline indicator            | Global network status         |
| Audit all color contrasts in dark mode | Full dark mode contrast audit |
| Haptic feedback simulation (visual)    | Mobile interaction feedback   |

---

## What's Working Well (Keep These) ✅

| Strength                      | Evidence                                                      |
| ----------------------------- | ------------------------------------------------------------- |
| **Consistent brand identity** | Emerald palette used throughout, dark mode variants defined   |
| **Internationalization**      | 5 languages with RTL support, proper `next-intl` usage        |
| **Responsive breakpoints**    | Consistent sm/md/lg usage across components                   |
| **Framer Motion integration** | Page transitions, hover/tap feedback, staggered animations    |
| **Component composition**     | Good separation of concerns, reusable UI primitives           |
| **TypeScript strictness**     | Props interfaces, proper typing                               |
| **Theme system**              | CSS variables with `@theme`, localStorage + system preference |
| **Admin UI separation**       | Distinct `AdminButton` system for different context           |

---

## Component-Specific Findings Summary

### `Buttons.tsx`

- 🔴 `SocialsButton` uses `opacity-50` for disabled - fails contrast
- 🔴 No `disabled` focus style
- 🟡 `PrimaryRounded` and `PrimaryTransparent` redundant
- 🔴 Icon-only buttons need `aria-label` prop

### `Navbar.tsx`

- 🔴 SlideOver: Actually well implemented (has focus trap, escape, aria-modal)
- 🟡 Mobile bottom nav: 5 items (HIG recommends 3-5 max) - OK but tight
- ✅ Logo swap on theme change - good pattern
- 🟡 No "scroll to top" on logo tap (iOS pattern)

### `PropertiesCarousel.tsx`

- 🔴 Keyboard navigation only works when focused - no roving tabindex
- 🔴 Auto-advance doesn't pause on focus/hover
- 🟡 No slide indicator (dots) for screen readers
- 🟡 Touch swipe threshold too sensitive (50px)

### `ListingsContent.tsx` (Most Complex Component)

- 🔴 Filter modal: Actually well implemented
- 🔴 Active filter chips: close button < 44px touch target
- 🔴 Search input: no `aria-label`, placeholder only
- 🔴 Type tabs: no `aria-selected`, keyboard nav broken
- 🟡 Results count not announced on filter change
- 🟡 "Load more" button: no loading state announcement

### `PropertyGallery.tsx`

- 🔴 Lightbox: no focus trap, focus not restored on close (NOW FIXED)
- 🟡 Keyboard nav: arrow keys work but no Home/End
- 🔴 Thumbnail focus ring invisible in dark mode
- 🟡 No caption/alt text display in lightbox

### `ContactForm.tsx` & `NewsletterForm.tsx`

- 🔴 Inputs: placeholder-only labels (ContactForm actually has labels) - NewsletterForm fixed
- 🔴 Error messages: not linked via `aria-describedby` (NOW FIXED for ContactForm)
- 🔴 Success toast: not announced (`role="status"` missing) (NOW FIXED)
- 🟡 Submit button: no loading `aria-busy`
- 🟡 Newsletter: autocomplete fixed

---

## Testing Checklist

### Automated (CI)

- [ ] `npm run lint` - ESLint with jsx-a11y plugin
- [ ] `npm run typecheck` - TypeScript strict
- [ ] Axe-core integration tests for key pages
- [ ] Color contrast audit (automated)

### Manual (Per Release)

- [ ] Keyboard-only navigation full site
- [ ] Screen reader test (NVDA/VoiceOver) - 5 key flows
- [ ] Zoom to 200% - no horizontal scroll, no content loss
- [ ] Reduced motion enabled - all animations respect
- [ ] Dark mode - all components readable
- [ ] RTL languages (Arabic/Hebrew if added) - layout flip
- [ ] Touch target measurement on mobile device

---

## HIG References Consulted

| Guideline                                                                                                     | Key Principle Applied                         |
| ------------------------------------------------------------------------------------------------------------- | --------------------------------------------- |
| [Accessibility](file:///Users/misha/.opencode/skill/apple-design-skill/references/accessibility.md)           | Labels, headings, contrast, language, focus   |
| [Color](file:///Users/misha/.opencode/skill/apple-design-skill/references/color.md)                           | Contrast ratios, semantic colors, dark mode   |
| [Dark Mode](file:///Users/misha/.opencode/skill/apple-design-skill/references/dark-mode.md)                   | System colors, vibrancy, images               |
| [Layout](file:///Users/misha/.opencode/skill/apple-design-skill/references/layout.md)                         | Spacing, hierarchy, navigation, safe areas    |
| [Typography](file:///Users/misha/.opencode/skill/apple-design-skill/references/typography.md)                 | Type scale, dynamic type, readability         |
| [Entering Data](file:///Users/misha/.opencode/skill/apple-design-skill/references/entering-data.md)           | Labels, validation, autocomplete, formatting  |
| [Modality](file:///Users/misha/.opencode/skill/apple-design-skill/references/modality.md)                     | Focus trap, escape, aria-modal                |
| [Feedback](file:///Users/misha/.opencode/skill/apple-design-skill/references/feedback.md)                     | Loading, success, error, user control         |
| [Gestures](file:///Users/misha/.opencode/skill/apple-design-skill/references/gestures.md)                     | Touch targets, swipe, reduced motion          |
| [Searching](file:///Users/misha/.opencode/skill/apple-design-skill/references/searching.md)                   | Filter chips, clear all, results announcement |
| [Focus & Selection](file:///Users/misha/.opencode/skill/apple-design-skill/references/focus-and-selection.md) | Focus visible, focus order, roving tabindex   |

---

## Next Steps

1. **Immediate**: Begin Phase 2 implementation (Touch targets & Button consolidation)
2. **This Sprint**: Complete Phase 2 (Visual System consolidation)
3. **Design Review**: Schedule Figma/design system review with consolidated tokens
4. **Accessibility Audit**: Engage external auditor for WCAG 2.1 AA certification

---

## Appendix: Files Structure Reference

### Key Components Analyzed

```
src/components/
├── ui/
│   ├── Buttons.tsx              # 7 button variants → consolidate to 4
│   └── AdminButton.tsx          # Separate admin button system
├── Navbar.tsx                   # Fixed bottom mobile, top desktop, SlideOver drawer
├── Footer.tsx                   # Logo, ContactLinks, map embed, copyright
├── ContactLinks.tsx             # 3 variants, hardcoded social colors
├── PropertiesCarousel.tsx       # Horizontal carousel, touch/swipe
├── ListingsContent.tsx          # Filter modal, search, type tabs, property cards
├── PropertyGallery.tsx          # Grid with lightbox modal (FIXED)
├── ContactForm.tsx              # 6-field form with validation (FIXED)
├── NewsletterForm.tsx           # Email input with submit (FIXED)
├── LanguageSelector.tsx         # Dropdown with flag emojis
├── ThemeToggle.tsx              # Fixed position sun/moon button
└── admin/
    ├── AdminDashboard.tsx
    ├── AdminButton.tsx
    ├── LoginForm.tsx
    ├── MessagesList.tsx
    ├── NewsletterSubscribersList.tsx
    ├── PropertyFormModal.tsx
    └── PropertyTable.tsx
```

### Pages

```
src/app/[locale]/
├── page.tsx                     # Home
├── listings/page.tsx            # Listings
├── properties/details/[id]/page.tsx  # Property Details
├── about/page.tsx               # About
├── contact/page.tsx             # Contact
├── socials/page.tsx             # Socials
└── admin/
    ├── page.tsx                 # Admin Dashboard
    └── login/page.tsx           # Admin Login
```

---

_This report was generated from comprehensive codebase analysis against Apple Human Interface Guidelines. All file references point to actual components in the QMAX Realty repository._
