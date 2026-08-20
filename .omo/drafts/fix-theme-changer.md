---
slug: fix-theme-changer
status: awaiting-approval
intent: clear
review_required: false
pending-action: write .omo/plans/fix-theme-changer.md
approach: Mount the existing ThemeToggle into the root layout, add Tailwind v4's class-based dark variant to globals.css, and correct the icon state to resolvedTheme; verify with build + lint + agent-executed browser QA.
---

# Draft: fix-theme-changer

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 | A theme toggle button is actually visible on the page | active | src/components/ThemeToggle.tsx (exists, orphaned); src/app/layout.tsx (no usage)
- C2 | `dark:*` Tailwind utilities respond to the `.dark` class next-themes toggles | active | src/app/globals.css:1-12 (missing @custom-variant dark)
- C3 | Toggle interaction is correct end-to-end (icon matches applied theme, no hydration mismatch, OS preference respected) | active | src/components/ThemeToggle.tsx:8-34; src/app/layout.tsx:12-14

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
- Placement | Fixed top-right floating button (fixed top-4 right-4 z-50) rendered in the root layout, inside ThemeProvider | The project has no header/nav component; fixed placement is the standard, non-intrusive pattern and appears on every page | Yes (moving it later is a one-line change)
- Toggle semantics | Keep the existing two-way light<->dark toggle; do NOT add a three-way system selector | The component already implements two-way; three-way is unrequested scope | Yes
- Icon state | Use `resolvedTheme` (applied theme) instead of `theme` (stored value) for the icon | Under defaultTheme="system", `theme` returns "system" and the icon would disagree with the applied theme | Yes
- Theme defaults | Keep `defaultTheme="system"` + `enableSystem` on the provider | Matches next-themes documented default; user did not ask to change | Yes
- Test strategy | Tests-after, agent-executed QA only: `npm run build`, `npm run lint`, and Playwright browser verification of the toggle; no new test framework | No test framework is installed (package.json); this is a CSS-class + mount fix where browser QA is the meaningful check | Yes

## Findings (cited - path:lines)
- F1 ThemeToggle is orphaned: no import/usage of ThemeToggle anywhere in src except its own file (grep ThemeToggle|useTheme|ThemeProvider over src/*.{ts,tsx}). src/app/layout.tsx:1-17 renders only ThemeProvider > main + Footer; src/app/page.tsx and src/components/Footer.tsx do not render it. -> No button exists on the page; this alone makes "the theme changer" non-functional.
- F2 Tailwind v4's `dark:` variant defaults to the `prefers-color-scheme` media query, NOT a class. Class-based dark mode requires `@custom-variant dark (&:where(.dark, .dark *));` (verified: tailwindlabs/tailwindcss.com dark-mode docs via Context7). src/app/globals.css:1-12 lacks it. dark:* utilities are used throughout src/app/page.tsx:5-6,16,18,23,27,33,43,49,58 and src/components/ThemeToggle.tsx:25 -> even with a button, most dark styles would not follow the toggle (only the CSS-variable-driven body would flip via the plain-CSS `.dark` block at globals.css:9-12).
- F3 Provider wiring is already correct per next-themes docs (Context7): client wrapper (src/components/ThemeProvider.tsx:1-8), attribute="class" + defaultTheme="system" + enableSystem (src/app/layout.tsx:14), suppressHydrationWarning on <html> (src/app/layout.tsx:12). Not the problem.
- F4 ThemeToggle.tsx:20 uses `theme === "dark"`; with defaultTheme="system" the stored `theme` is "system", so the icon (Sun/Moon) can disagree with the actually-applied theme. `resolvedTheme` is the applied-theme value.
- F5 next-themes with enableSystem applies the resolved class (dark/light) on <html> even in system mode, so a class-based dark variant works correctly with system preference.

## Decisions (with rationale)
- D1 Mount ThemeToggle in src/app/layout.tsx inside <ThemeProvider>, as a fixed top-right button (fixed top-4 right-4 z-50). Rationale: smallest change that makes the feature reachable; placement is a surfaced default the user can veto at the gate.
- D2 Add `@custom-variant dark (&:where(.dark, .dark *));` immediately after `@import "tailwindcss";` in src/app/globals.css. Rationale: restores class-driven dark styling under Tailwind v4; keeps the existing `.dark { --background/--foreground }` block (plain CSS) untouched.
- D3 Change ThemeToggle.tsx:20 to `const isDark = resolvedTheme === "dark"` (destructure resolvedTheme). Rationale: icon always matches applied theme; toggle behavior unchanged.
- D4 No changes to provider props, Footer, page content, or the CSS variable tokens.

## Scope IN
- Render the existing ThemeToggle in the root layout (fixed top-right).
- Add the Tailwind v4 class-based dark custom variant to globals.css.
- Switch the toggle icon state to resolvedTheme.
- Agent-executed verification: npm run build, npm run lint, Playwright browser QA (toggle flips html.dark, body bg, and a dark:* utility's computed style).

## Scope OUT (Must NOT have)
- No new header/nav component; no redesign of page.tsx or Footer.
- No three-way (system/light/dark) selector UI.
- No new test framework or dependency installs.
- No changes to next-themes provider props, next.config.ts, or theme token values.

## Open questions
- Q1 (brief question, skipped = default): Where should the toggle live? Recommended: fixed top-right of every page. Alternatives: inline in the page hero, or in the Footer.
- Q2 (brief confirm): OK to verify with agent-executed browser QA (no new test framework)?

## Approval gate
status: awaiting-approval
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->