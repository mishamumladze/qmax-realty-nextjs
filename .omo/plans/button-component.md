# button-component - Work Plan

## TL;DR (For humans)
**What you'll get:** A reusable Button component that the whole site shares, with the four looks already in use (green solid, outlined, round "pill", and white-on-green). The 8 places that currently repeat the same copy-pasted button styles switch to using it — the site looks exactly the same, but future buttons are one-line changes.

**Why this approach:** The same button styling was copy-pasted in 3-4 places (the three hero buttons were byte-for-byte identical). One component with four style variants removes that duplication while preserving every pixel of the current design. It also renders as a link or a real button automatically, which matches how the site actually uses buttons (7 of 8 are links).

**What it will NOT do:** It won't restyle or redesign any button — every current color, padding, and hover effect is preserved exactly. It won't touch the carousel arrows, the mobile menu button, or the social-media brand buttons (those are one-of-a-kind and stay as-is). No new software packages are installed.

**Effort:** Short
**Risk:** Low - pure extraction of existing styles; every change reversible; visuals verified by browser QA before handoff

**Decisions I made for you:** (1) I treated "should we create a button component?" as an open question and researched the answer instead of asking — the duplication made the answer clearly "yes"; if you had a specific outcome in mind, tell me and I will switch to asking. (2) One component with 4 variants (primary/outline/pill/light), no extra sizing prop, no new dependencies, exact current class strings preserved. (3) Refactor only the 8 duplicated spots; one-of-a-kind controls (carousel, navbar, brand buttons) stay untouched. (4) Verification is build + lint + automated browser checks — no new test framework. Veto any of these and I will adjust.

Your next move: the plan is complete and has passed high-accuracy review; run it via `$start-work`. Full execution detail follows below.

---

> TL;DR (machine): Short, Low risk. New src/components/Button.tsx (polymorphic button/a/Link, 4 variants, exact current classes, no "use client", no new deps) + refactor 8 usages in 3 files (page.tsx x5, not-found.tsx x2, NewsletterForm.tsx x1); verify via build + lint + Playwright visual/functional QA. Bespoke widgets excluded.

## Scope
### Must have
- `src/components/Button.tsx`: polymorphic component rendering `<button>` (no `href`), `next/link` (`href` starts with `/`), or `<a>` (external/mailto/tel) with variants `primary | outline | pill | light`, `className` passthrough, and props `variant`, `href`, `target`, `rel`, `type`, `onClick`, `disabled`, `ariaLabel`, `className`, `children`. NO `"use client"` directive. NO new dependencies.
- Refactor exactly 8 usages, preserving the exact current visual output:
  - `src/app/page.tsx`: 3 hero pills (lines 74-96) -> `variant="pill"`; WhatsApp CTA `<a>` (174-189) -> `variant="light"`; "View All Properties" Link (190-195) -> `variant="outline"` with `className="text-white hover:bg-white/10"`.
  - `src/app/not-found.tsx`: "Go Home" Link (28-33) -> `variant="primary"`; "Browse Properties" Link (34-39) -> `variant="outline"` with `className="text-emerald-600 hover:bg-emerald-50"`.
  - `src/components/NewsletterForm.tsx`: submit `<button>` (61-67) -> `variant="primary"`, `type="submit"`, `disabled={status === "loading"}`, children swap `Subscribing...`/`Subscribe`.
- Agent-executed verification: `npm run build`, `npm run lint`, and Playwright browser QA (visual + functional) against `npm run dev`; evidence in `.omo/evidence/`.

### Must NOT have (guardrails, anti-slop, scope boundaries)
- NO migration of bespoke widgets: carousel prev/next arrows + dot indicators (`src/components/PropertiesCarousel.tsx:94-100, 175-192`), navbar hamburger toggle (`src/components/Navbar.tsx:84-96`), ContactLinks brand-colored buttons / list / icons-only (`src/components/ContactLinks.tsx:90-146`), socials card translucent CTAs (`src/app/socials/page.tsx:62-69`).
- NO restyle / redesign of any button: the 4 variant class strings must be EXACTLY the strings in Decision D3; hover/padding/shadow/color behavior identical to today.
- NO new dependencies (no clsx, no tailwind-merge, no radix/shadcn, no test framework); `package.json` and `package-lock.json` untouched.
- NO `asChild`, NO `size`/`loading`/`iconOnly` props, NO dark-mode variants, NO `"use client"` directive in Button.tsx.
- NO changes to `Footer.tsx`, `listings/`, `globals.scss`, `layout.tsx`, `next.config.ts`, `tsconfig.json`.

## Verification strategy
> Zero human intervention - all verification is agent-executed.
- Test decision: tests-after, no new framework (repo has no test runner; adding one is out of scope); agent-executed browser QA via the `playwright` skill against `npm run dev` (http://localhost:3000).
- Evidence: `.omo/evidence/task-<N>-button-component.<ext>` (this session does not run under ulw-loop; use `.omo/evidence/`, matching the fix-theme-changer plan convention).

## Execution strategy
### Parallel execution waves
> Wave 1: todos 1-4 in parallel (4 distinct files, no shared writes; the import of `@/components/Button` in todos 2-4 is satisfied by the build gate in the F-wave — edits never read each other's output). Wave 2: final verification F1-F4 in parallel.
> `npm run lint` after each todo is cheap and local; `npm run build` runs once in the F-wave (it compiles all 4 files together and is the integration proof).

### Dependency matrix
| Todo | Depends on | Blocks | Can parallelize with |
| --- | --- | --- | --- |
| 1 (Button.tsx) | none | F-wave | 2, 3, 4 |
| 2 (not-found.tsx) | 1 (import only) | F-wave | 1, 3, 4 |
| 3 (NewsletterForm.tsx) | 1 (import only) | F-wave | 1, 2, 4 |
| 4 (page.tsx) | 1 (import only) | F-wave | 1, 2, 3 |
| F1-F4 | 1, 2, 3, 4 | - | each other |

## Todos
> Implementation + Test = ONE todo. Never separate.
<!-- APPEND TASK BATCHES BELOW THIS LINE WITH edit/apply_patch - never rewrite the headers above. -->
- [ ] 1. Create src/components/Button.tsx - polymorphic Button, 4 variants, no "use client", no new deps
  What to do / Must NOT do: create `src/components/Button.tsx` (flat PascalCase file convention, matching Navbar.tsx/ContactLinks.tsx). NO `"use client"` directive. `import Link from "next/link";` at top. Exports ONE default component `Button` with props: `variant?: "primary" | "outline" | "pill" | "light"` (default `"primary"`), `href?: string`, `target?: string`, `rel?: string`, `type?: "button" | "submit" | "reset"` (default `"button"`), `onClick?: React.MouseEventHandler<HTMLElement>`, `disabled?: boolean`, `ariaLabel?: string`, `className?: string` (default `""`), `children: React.ReactNode`. Component body MUST contain the EXACT variant class map (verbatim strings):
  - primary: `inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`
  - outline: `inline-flex items-center justify-center gap-2 border-2 border-current px-6 py-3 rounded-lg font-semibold transition-colors duration-200`
  - pill: `inline-flex items-center justify-center gap-2 bg-emerald-600/80 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-emerald-500/40 hover:shadow-xl hover:-translate-y-0.5`
  - light: `inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200`
  Render rule (MUST be exactly this): `const classes = `${variantClasses[variant]} ${className}`.trim();` then (a) `href` undefined -> `<button type={type} onClick={onClick} disabled={disabled} aria-label={ariaLabel} className={classes}>{children}</button>`; (b) `href` startsWith `"/"` -> `<Link href={href} onClick={onClick} aria-label={ariaLabel} className={classes}>{children}</Link>` (ignore type/disabled/target); (c) otherwise -> `<a href={href} target={target} rel={rel ?? (target ? "noopener noreferrer" : undefined)} onClick={onClick} aria-label={ariaLabel} className={classes}>{children}</a>`. Must NOT: add clsx/tailwind-merge/asChild/size prop/dark: styles/"use client"; must NOT alter any class string above (byte-identical).
  Parallelization: Wave 1 | Blocked by: none | Blocks: final verification wave
  References (executor has NO interview context - be exhaustive): src/components/Navbar.tsx (file-level conventions); src/components/NewsletterForm.tsx:61-67 (button with disabled + loading children swap); src/app/page.tsx:75-95, 174-195 (Link + external <a> + exact classes to preserve); src/app/not-found.tsx:28-39 (exact classes to preserve); tsconfig.json:22 (path alias @/* -> ./src/*); Next.js Link import pattern src/app/page.tsx:2.
  Acceptance criteria (agent-executable): `grep -c 'variant?: "primary" | "outline" | "pill" | "light"' src/components/Button.tsx` returns 1; `grep -c '"use client"' src/components/Button.tsx` returns 0; each of the 4 variant strings above appears verbatim (grep the `bg-emerald-600 hover:bg-emerald-700` fragment and `border-2 border-current` and `rounded-full shadow-lg` and `bg-white text-emerald-700` each returns 1); `npx eslint src/components/Button.tsx` exits 0.
  QA scenarios (name the exact tool + invocation): happy — `npx eslint src/components/Button.tsx` exit 0, then Playwright (after all todos, F3 covers rendered output); unit-level: `npx tsc --noEmit` exit 0. failure — delete the `Link` import -> `npx tsc --noEmit` reports `Cannot find name 'Link'` (proves the import is load-bearing). Evidence .omo/evidence/task-1-button-component.txt
  Commit: N (single final commit note in Commit strategy; workspace is not a git repo)

- [ ] 2. Refactor src/app/not-found.tsx - Go Home -> primary, Browse Properties -> outline
  What to do / Must NOT do: add `import Button from "@/components/Button";` (keep the existing import block sorted, `Link` import first). Replace the "Go Home" Link (lines 28-33) with `<Button href="/" variant="primary">Go Home</Button>`. Replace the "Browse Properties" Link (lines 34-39) with `<Button href="/listings" variant="outline" className="text-emerald-600 hover:bg-emerald-50">Browse Properties</Button>`. After both replacements no `<Link>` usage remains -> remove `import Link from "next/link";` (eslint no-unused-vars would fail otherwise). Keep the wrapper `<div className="flex flex-col sm:flex-row gap-4 justify-center">` and all other markup/metadata unchanged. Must NOT: change text/hrefs, add icons, restyle, or touch page.tsx/NewsletterForm.tsx.
  Parallelization: Wave 1 | Blocked by: 1 (import) | Blocks: final verification wave
  References: src/app/not-found.tsx:27-40 (current markup); variant strings in todo 1 (outline base + `text-emerald-600 hover:bg-emerald-50` className reproduces the current `border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50` exactly via border-current).
  Acceptance criteria (agent-executable): `grep -c 'from "@/components/Button"' src/app/not-found.tsx` returns 1; `grep -c 'bg-emerald-600 hover:bg-emerald-700' src/app/not-found.tsx` returns 0; `grep -c 'border-2 border-emerald-600' src/app/not-found.tsx` returns 0; `grep -c 'import Link from "next/link"' src/app/not-found.tsx` returns 0; `npx eslint src/app/not-found.tsx` exits 0.
  QA scenarios (name the exact tool + invocation): happy — Playwright: `npm run dev`, open a non-existent URL (e.g. /nope), assert `page.getByRole('link', { name: 'Go Home' })` and `page.getByRole('link', { name: 'Browse Properties' })` are visible, click Browse Properties -> URL becomes /listings. failure — if Button.tsx export name mismatched, `npm run build` (F-wave) fails with "Module ... has no exported member"; before this todo the two old class strings were present (grep positive). Evidence .omo/evidence/task-2-button-component.txt
  Commit: N

- [ ] 3. Refactor src/components/NewsletterForm.tsx - submit -> primary with disabled + loading children
  What to do / Must NOT do: add `import Button from "@/components/Button";`. Replace the `<button ...>` element (lines 61-67) with exactly: `<Button type="submit" disabled={status === "loading"} variant="primary">{status === "loading" ? "Subscribing..." : "Subscribe"}</Button>`. Keep the form, sr-only label, input (with its exact classes), and the two status banners unchanged. Must NOT: change the submit API call, the status state machine, or the input; must NOT touch the id `newsletter-email`.
  Parallelization: Wave 1 | Blocked by: 1 (import) | Blocks: final verification wave
  References: src/components/NewsletterForm.tsx:1-71 (full file; state machine lines 5-32, submit button 61-67); primary variant string in todo 1 (reproduces current `bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200` plus harmless `disabled:cursor-not-allowed`).
  Acceptance criteria (agent-executable): `grep -c 'from "@/components/Button"' src/components/NewsletterForm.tsx` returns 1; `grep -c 'bg-emerald-600 hover:bg-emerald-700' src/components/NewsletterForm.tsx` returns 0; `grep -c 'type="submit"' src/components/NewsletterForm.tsx` returns 1; `grep -c 'Subscribing...' src/components/NewsletterForm.tsx` returns 1; `npx eslint src/components/NewsletterForm.tsx` exits 0.
  QA scenarios (name the exact tool + invocation): happy — Playwright on /socials: assert `page.getByRole('button', { name: 'Subscribe' })` exists and is enabled; `page.locator('#newsletter-email').fill('a@b.com')` then `page.getByRole('button', { name: 'Subscribe' }).click()`; assert the button is disabled during the request (status=loading) via `toHaveAttribute('disabled')` or text flip to `Subscribing...`. failure — before this todo the button had inline classes (grep positive) and no disabled attribute state binding beyond `status === "loading"`; if `type` were dropped, the form would submit via GET navigation instead of the fetch POST — assert `page.waitForResponse` on `/api/newsletter` after click. Evidence .omo/evidence/task-3-button-component.txt
  Commit: N

- [ ] 4. Refactor src/app/page.tsx - 3 hero pills -> pill, WhatsApp -> light, View All -> outline
  What to do / Must NOT do: add `import Button from "@/components/Button";`. Hero (lines 74-96): replace each of the 3 `<Link>` hero CTAs with `<Button variant="pill" href="/listings?offer=sale" className="m-2 text-xs md:text-lg"><Home className="w-3 h-3 md:w-5 md:h-5" aria-hidden="true" /> Buy Properties</Button>`, same shape for `offer=rent` with `<Key .../> Rent Properties`, and `href="/contact?subject=selling"` with `<BadgeDollarSign .../> Sell Your Home` (icons stay as children; `gap-2` in the pill base replaces the old `gap-2`; `m-2` and `text-xs md:text-lg` come from className). Keep the wrapping `<div className="flex flex-wrap items-center justify-center">`. CTA banner WhatsApp `<a>` (lines 174-189): replace with `<Button href="https://wa.me/+905550000000?text=Hello!%20I'd%20like%20to%20inquire%20about%20properties." target="_blank" variant="light"><Image src="/img/Logos/si-whatsapp.svg" alt="" width={20} height={20} className="w-5 h-5" aria-hidden="true" /> WhatsApp English</Button>` — DROP the icon's `mr-2` (the `gap-2` on the light variant provides the identical 0.5rem spacing; keeping both would double it). CTA banner "View All Properties" Link (lines 190-195): replace with `<Button href="/listings" variant="outline" className="text-white hover:bg-white/10">View All Properties</Button>`. After replacements no `<Link>` remains in page.tsx -> remove `import Link from "next/link";`. Keep `Image`, `lucide-react` imports (Home/Key/BadgeDollarSign now used as Button children; Building2/Star/Handshake/ShieldCheck still used in whyUsItems). Must NOT: change any href/label/icon, the hero image, the gradient overlay, the why-us section, or the `CONTACT_PHONE` constant; must NOT add rel to the WhatsApp Button (target="_blank" auto-adds rel via the component).
  Parallelization: Wave 1 | Blocked by: 1 (import) | Blocks: final verification wave
  References: src/app/page.tsx:1-14 (imports), 16-17 (CONTACT_PHONE), 74-96 (hero CTAs), 173-195 (CTA banner); pill/light/outline variant strings in todo 1; original hero class string page.tsx:77 (must be fully covered by pill base + className).
  Acceptance criteria (agent-executable): `grep -c 'from "@/components/Button"' src/app/page.tsx` returns 1; `grep -c 'rounded-full' src/app/page.tsx` returns 0; `grep -c 'hover:bg-emerald-500' src/app/page.tsx` returns 0; `grep -c 'border-2 border-white' src/app/page.tsx` returns 0; `grep -c 'bg-white text-emerald-700' src/app/page.tsx` returns 0; `grep -c 'import Link from "next/link"' src/app/page.tsx` returns 0; `grep -c 'mr-2' src/app/page.tsx` returns 0; `npx eslint src/app/page.tsx` exits 0.
  QA scenarios (name the exact tool + invocation): happy — Playwright on `/`: assert 3 `page.getByRole('link', { name: /Buy Properties|Rent Properties|Sell Your Home/ })` visible; click Buy Properties -> URL `/listings?offer=sale`; scroll to CTA banner, assert `page.getByRole('link', { name: 'WhatsApp English' })` has `target="_blank"` and `rel="noopener noreferrer"`; click View All Properties -> URL `/listings`. failure — hero pill double-spacing: computed `gap` of the Buy Properties link is `8px` (0.5rem) NOT `16px` (proves mr-2 was dropped and gap-2 alone applies); before this todo the three pill class strings were byte-identical (grep -c of the full string == 3). Evidence .omo/evidence/task-4-button-component.txt
  Commit: N

## Final verification wave
> Runs in parallel after ALL todos. ALL must APPROVE. Surface results and wait for the user's explicit okay before declaring complete.
- [ ] F1. Plan compliance audit
- [ ] F2. Code quality review
- [ ] F3. Real manual QA
- [ ] F4. Scope fidelity

## Commit strategy
- Workspace is NOT a git repo (no .git at the root). No commits are possible during execution; the "Commit: N" lines mean "nothing to commit".
- When the user later initializes git, record everything as ONE commit: `feat(components): add polymorphic Button component and migrate CTA usages` covering src/components/Button.tsx, src/app/page.tsx, src/app/not-found.tsx, src/components/NewsletterForm.tsx.

## Success criteria
- All 4 implementation todos and all 4 final-verification tasks pass with evidence in `.omo/evidence/`.
- `npm run build` and `npm run lint` exit 0 on the final tree.
- Zero occurrences of the 8 migrated class strings remain anywhere under `src/` (grep proof in F4), while the bespoke widgets (carousel arrows/dots, navbar toggle, ContactLinks, socials card CTAs) are byte-untouched.
- Playwright screenshots of `/`, an unknown-URL 404, and `/socials` (newsletter section) show pixel-identical button rendering vs. the pre-change baseline classes (F3).
- Button.tsx contains no "use client", no new dependencies, and exactly the 4 documented variant strings.
