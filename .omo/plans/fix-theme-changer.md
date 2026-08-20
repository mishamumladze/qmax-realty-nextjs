# fix-theme-changer - Work Plan

## TL;DR (For humans)
**What you'll get:** A working light/dark theme toggle pinned to the top-right corner of every page. Clicking it switches the whole site between light and dark instantly, and it follows the device's setting by default.

**Why this approach:** The toggle component and the theme provider were already built correctly — the component was simply never put on any page, and Tailwind v4 needs a one-line configuration so the `dark:` styles respond to the toggle's `.dark` class instead of only the operating system preference.

**What it will NOT do:** No new header or navigation bar, no redesign of the landing page or footer, no three-way (system/light/dark) selector, no new dependencies, no changes to the brand colors.

**Effort:** Quick
**Risk:** Low - two one-line changes and one small component fix; everything fully reversible

**Decisions to sanity-check:** Toggle lives fixed at the top-right of every page (no header exists yet); toggle stays a simple light/dark two-way switch; verification is agent-executed browser QA with no new test framework.

Your next move: the plan is approved and running via `$start-work`. Full execution detail follows below.

---

> TL;DR (machine): Quick, Low risk, 3-file fix: mount ThemeToggle in layout, add Tailwind v4 class-based dark variant, use resolvedTheme for the icon.

## Scope
### Must have
- `ThemeToggle` rendered and visible on the page (fixed top-right, z-50), inside the `ThemeProvider`.
- `dark:*` utility classes respond to the `.dark` class that next-themes toggles on `<html>`.
- Toggle icon reflects the actually-applied theme (`resolvedTheme`) under system mode.
- Agent-executed verification: `npm run build`, `npm run lint`, and browser QA proving a click flips the page theme.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- No new header/nav component; no redesign of `src/app/page.tsx` or `src/components/Footer.tsx`.
- No three-way (system/light/dark) selector UI.
- No new dependencies or test-framework installs; `package.json` stays untouched.
- No changes to the next-themes provider props in `layout.tsx` (`attribute`, `defaultTheme`, `enableSystem` stay as-is).
- No changes to `next.config.ts`, `tsconfig.json`, or the theme token values in `globals.css`.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after, no new framework; agent-executed browser QA via the `playwright` skill against `npm run dev` (http://localhost:3000). `package.json` has no test runner and adding one is out of scope.
- Evidence: `.omo/evidence/task-<N>-fix-theme-changer.<ext>` (this session does not run under ulw-loop; use `.omo/evidence/`).

## Execution strategy
### Parallel execution waves
> Wave 1: todos 1-3 in parallel (distinct files, no shared writes). Wave 2: final verification F1-F4 in parallel.

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 (custom-variant) | none | F-wave | 2, 3 |
| 2 (mount toggle) | none | F-wave | 1, 3 |
| 3 (resolvedTheme) | none | F-wave | 1, 2 |
| F1-F4 | 1, 2, 3 | - | each other |

## Todos
- [ ] 1. Add the Tailwind v4 class-based dark variant to src/app/globals.css
  What to do / Must NOT do: insert exactly `@custom-variant dark (&:where(.dark, .dark *));` immediately after `@import "tailwindcss";` (line 1). Do not modify the existing `:root` block, the `.dark` variable block (lines 9-12), the `@theme inline` block, or the `body` rule.
  Parallelization: Wave 1 | Blocked by: none | Blocks: final verification wave
  References (executor has NO interview context - be exhaustive): src/app/globals.css:1-12; Tailwind v4 class-based dark mode directive (https://tailwindcss.com/docs/dark-mode): `@custom-variant dark (&:where(.dark, .dark *));`
  Acceptance criteria (agent-executable): `grep -F "@custom-variant dark" src/app/globals.css` matches at top level; `npm run build` exits 0; `npm run lint` exits 0.
  QA scenarios (name the exact tool + invocation): happy — `npm run build` (exit 0), then Playwright: run `npm run dev`, open http://localhost:3000, `page.evaluate(() => document.documentElement.classList.add('dark'))`, assert the computed `background-color` of `main` changes from the light value; failure — with the directive removed, repeat the same Playwright step and assert the main background does NOT change with the class (proves the directive is the fix). Evidence .omo/evidence/task-1-fix-theme-changer.txt
  Commit: N (single final commit note in Commit strategy; workspace is not a git repo)

- [ ] 2. Render ThemeToggle in the root layout at the top-right
  What to do / Must NOT do: in src/app/layout.tsx, `import ThemeToggle from "@/components/ThemeToggle";` and render `<div className="fixed top-4 right-4 z-50"><ThemeToggle /></div>` inside `<ThemeProvider>` between `<main>` and `<Footer />`. It MUST be inside the provider (useTheme requires it). Do not change provider props, the html/body attributes, or page content.
  Parallelization: Wave 1 | Blocked by: none | Blocks: final verification wave
  References: src/app/layout.tsx:1-17; src/components/ThemeToggle.tsx:1-34; path alias `@/*` -> `./src/*` in tsconfig.json:22
  Acceptance criteria (agent-executable): `npm run build` exits 0; Playwright `page.getByRole('button', { name: 'Toggle theme' })` resolves to a visible element.
  QA scenarios: happy — Playwright click the button -> `document.documentElement` toggles class `dark` and `localStorage.theme` flips between 'light'/'dark'; failure — before this change the button does not exist on the page (component was unmounted). Evidence .omo/evidence/task-2-fix-theme-changer.txt
  Commit: N

- [ ] 3. Switch the toggle icon state to resolvedTheme in src/components/ThemeToggle.tsx
  What to do / Must NOT do: change line 8 to also destructure `resolvedTheme` from `useTheme()`; change line 20 to `const isDark = resolvedTheme === "dark";`. Keep the mounted guard (lines 11-14), the placeholder div (lines 16-18), the onClick toggle direction `setTheme(isDark ? "light" : "dark")` (line 24), and all classNames unchanged.
  Parallelization: Wave 1 | Blocked by: none | Blocks: final verification wave
  References: src/components/ThemeToggle.tsx:8-34; next-themes `useTheme` API: `theme` is the stored value, `resolvedTheme` is the applied value (https://github.com/pacocoursey/next-themes#usetheme)
  Acceptance criteria (agent-executable): `npm run build` exits 0; no `theme === "dark"` comparison remains in the file.
  QA scenarios: happy — Playwright with OS preference light and empty localStorage (theme="system"): page loads, button shows the Moon icon (resolvedTheme="light"); click -> html gains `dark`, button shows the Sun icon; failure — before this fix, after one manual toggle to 'dark', a fresh reload with OS light shows the Moon while the applied theme is dark (theme vs resolvedTheme disagreement). Evidence .omo/evidence/task-3-fix-theme-changer.txt
  Commit: N

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
The workspace is not a git repository (no `.git` directory): no commits are made by execution. If the user initializes git later, a single conventional commit `fix(theme): enable class-based dark mode and mount the theme toggle` covers todos 1-3.

## Success criteria
- A toggle button is visible at the top-right of the page and flips the whole site light/dark on click.
- The dark theme follows the toggle (class-based), not only the OS setting.
- The toggle icon always shows the state the user would switch TO (moon when light, sun when dark), including under system mode.
- `npm run build` and `npm run lint` pass with zero errors.