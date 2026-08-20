---
slug: button-component
status: approved
intent: unclear
review_required: true
plan_path: .omo/plans/button-component.md
plan_sha256: null
review_round_id: null
pending-action: write and review .omo/plans/button-component.md
review:
  momus:
    status: pending
    workspace_root: null
    runtime_home: null
    target: .omo/plans/button-component.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
  independent:
    status: pending
    workspace_root: null
    runtime_home: null
    target: .omo/plans/button-component.md
    round_id: null
    plan_sha256: null
    launch_id: null
    session: null
    result: null
approach: Create a polymorphic Button component (button/a/next-link, 4 variants) in src/components/Button.tsx and refactor the 8 duplicated CTA-style usages across src/app/page.tsx, src/app/not-found.tsx, and src/components/NewsletterForm.tsx, preserving current visuals exactly; verify with build + lint + Playwright browser QA.
---

# Draft: button-component

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- C1 Button component (src/components/Button.tsx) - polymorphic button/a/Link with primary|outline|pill|light variants, className passthrough | active | no existing Button in src/components/; package.json deps (lucide-react, simple-icons, next, react, sass)
- C2 Refactor src/app/page.tsx - 5 usages (3 hero pills -> pill, WhatsApp -> light, View All -> outline) | active | src/app/page.tsx:74-96, 173-195
- C3 Refactor src/app/not-found.tsx - 2 usages (Go Home -> primary, Browse Properties -> outline) | active | src/app/not-found.tsx:27-40
- C4 Refactor src/components/NewsletterForm.tsx - 1 usage (Subscribe submit -> primary with disabled state) | active | src/components/NewsletterForm.tsx:61-67
- C5 Final verification (npm run build + lint + Playwright browser QA + visual diff vs current) | active | package.json scripts: dev/build/start/lint only (no test runner)

## Open assumptions (announced defaults)
<!-- Intent is UNCLEAR: research resolves ambiguity, defaults are adopted (not asked), and each is surfaced in the plan's human TL;DR for veto. -->
<!-- assumption | adopted default | rationale | reversible? -->
- Routing: "should we create a button component?" is open-ended -> UNCLEAR: research + announced defaults, no interview; user vetoes at gate | user asked a consultation question, not a declared goal | yes - one-line correction at gate
- Recommendation: YES, create the component | 8+ CTA-style button/link strings duplicated across 4 files (hero pills byte-identical x3 at page.tsx:77/84/91; emerald primary x3 at NewsletterForm.tsx:64, not-found.tsx:30, page.tsx hero; outline x2) | yes - abort at gate
- API: ONE polymorphic Button - no href -> <button>, internal href -> next/link, external/mailto/tel -> <a>; NO "use client" directive; NO asChild prop | 7 of 8 migrated usages are Links/as, 1 is a real <button>; module-boundary semantics make it work in both server (page.tsx) and client (NewsletterForm) trees | yes
- Variants: primary | outline | pill | light, each carrying its EXACT current class string (zero visual drift); no size prop (padding baked into variants - migrated set has no size spread) | fidelity over speculation; migrated set needs only these 4 | yes
- className merge = plain template-string concat, NO clsx/tailwind-merge dependency | package.json is minimal by design; conflicts contained to 2 documented outline call sites (border-current trick) | yes
- Refactor scope = the 8 duplicated CTA usages in 3 files; bespoke widgets STAY inline (carousel prev/next + dots PropertiesCarousel.tsx:94-100/175-192, navbar toggle Navbar.tsx:84-96, ContactLinks brand-colored buttons/list/icons ContactLinks.tsx:90-146, socials card CTAs socials/page.tsx:62-69) | don't force-fit one-offs into a generic component; over-abstraction is the anti-slop failure mode | yes
- QA: no test framework installed; verification = npm run build + npm run lint + Playwright browser QA (visual + functional) against npm run dev | repo has no test runner and adding one is out of scope | yes
- review_required: true (UNCLEAR + non-Trivial) -> dual momus + oracle review runs automatically AFTER approval | skill mandate for non-Trivial UNCLEAR | n/a

## Findings (cited - path:lines)
- No shared Button exists and no UI library is installed: src/components/ has exactly ContactLinks.tsx, Footer.tsx, Navbar.tsx, NewsletterForm.tsx, PropertiesCarousel.tsx; package.json deps are better-sqlite3, lucide-react, next 16.3.1, react 19.2.8, sass, simple-icons.
- Hero CTA pills are byte-identical 3x: src/app/page.tsx:77, 84, 91 - `inline-flex items-center gap-2 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold text-xs md:text-lg px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-emerald-500/40 hover:shadow-xl hover:-translate-y-0.5 m-2 bg-emerald-600/80` (rendered as next/link).
- Emerald primary style repeated: src/components/NewsletterForm.tsx:64 (`bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200`) and src/app/not-found.tsx:30 (same minus disabled).
- Outline style x2: src/app/not-found.tsx:36 (`border-2 border-emerald-600 text-emerald-600 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold`); src/app/page.tsx:192 (`border-2 border-white text-white hover:bg-white/10 px-6 py-3 rounded-lg font-semibold`).
- White-on-color (light) style: src/app/page.tsx:178 (`bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold`, external wa.me <a>).
- Most CTA elements are <Link>/<a>, not <button>: src/app/page.tsx:75/82/89 (Links), 174 (<a>), 190 (Link); src/app/not-found.tsx:28/34 (Links). Only NewsletterForm.tsx:61 is a real <button type="submit">.
- Bespoke interactive elements (NOT CTA-like, keep inline): PropertiesCarousel.tsx:94-100 + 175-181 (absolute-positioned round icon arrows), 185-192 (dot indicators); Navbar.tsx:84-96 (hamburger toggle); ContactLinks.tsx:90-146 (per-brand colored links, list, icons-only variants); socials/page.tsx:62-69 (bg-white/20 translucent CTA on gradient cards).
- No test runner in package.json (scripts: dev, build, start, lint). Styling is Tailwind v4 (globals.scss:2 `@use "tailwindcss"`) with SCSS. Path alias @/* -> ./src/* (tsconfig.json:22).
- Existing plan convention for agent-executed QA + evidence dir: .omo/plans/fix-theme-changer.md (browser QA via playwright skill against npm run dev, evidence in .omo/evidence/).

## Decisions (with rationale)
- D1 Create src/components/Button.tsx (flat PascalCase convention matches Navbar/ContactLinks/etc.). NO "use client" directive: module-boundary semantics keep it server-compatible in page.tsx (Links) and client-bundled in NewsletterForm (onClick/disabled props flow fine).
- D2 Polymorphism by href: undefined -> <button type={type ?? "button"}>, startsWith("/") -> next/link, else (https:/mailto:/tel:/#) -> <a target rel>. Props: variant, href, target, rel, type, onClick, disabled, aria-label, className, children.
- D3 Variants carry EXACT current class strings (no visual drift):
  - primary: `inline-flex items-center justify-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-3 rounded-lg font-semibold transition-colors duration-200 disabled:opacity-50 disabled:cursor-not-allowed`
  - outline: `inline-flex items-center justify-center gap-2 border-2 border-current px-6 py-3 rounded-lg font-semibold transition-colors duration-200` + per-site color via className: not-found adds `text-emerald-600 hover:bg-emerald-50`, CTA banner adds `text-white hover:bg-white/10` (border-current derives border color from text color - preserves both current looks with ONE variant)
  - pill: `inline-flex items-center justify-center gap-2 bg-emerald-600/80 hover:bg-emerald-500 active:bg-emerald-700 text-white font-bold px-4 py-3 rounded-full shadow-lg transition-all duration-200 hover:shadow-emerald-500/40 hover:shadow-xl hover:-translate-y-0.5` + className adds `m-2 text-xs md:text-lg`
  - light: `inline-flex items-center justify-center gap-2 bg-white text-emerald-700 hover:bg-emerald-50 px-6 py-3 rounded-lg font-semibold transition-colors duration-200`
- D4 className = `${variantClasses} ${className}` plain concat; className reserved for layout utilities (m-2, text-xs md:text-lg) and the 2 documented color-only outline overrides. No new dependency.
- D5 Refactor exactly: page.tsx hero 3 -> pill (keep icons Home/Key/BadgeDollarSign as children), page.tsx WhatsApp -> light external a, page.tsx View All -> outline, not-found Go Home -> primary, not-found Browse -> outline, NewsletterForm submit -> primary (type="submit" + disabled={loading} + children swap on loading). Everything else stays inline.
- D6 QA without new frameworks: npm run build, npm run lint, Playwright: visual screenshot comparison of affected views + functional checks (hero links navigate with correct offer query, subscribe button disables on submit). Evidence -> .omo/evidence/task-<N>-button-component.<ext>.
- D7 Review: UNCLEAR non-Trivial -> dual high-accuracy review (momus + oracle) runs AUTOMATICALLY after approval and plan generation.

## Scope IN
- New file src/components/Button.tsx (polymorphic, 4 variants, className passthrough).
- Refactor 8 usages: src/app/page.tsx (3 hero pills, WhatsApp, View All), src/app/not-found.tsx (Go Home, Browse Properties), src/components/NewsletterForm.tsx (Subscribe submit).
- Agent-executed verification: build, lint, Playwright browser QA (visual + functional), evidence in .omo/evidence/.

## Scope OUT (Must NOT have)
- NO migration of bespoke widgets: carousel prev/next arrows + dot indicators (PropertiesCarousel.tsx), navbar hamburger toggle (Navbar.tsx), ContactLinks brand-colored/list/icons-only variants (ContactLinks.tsx), socials card translucent CTAs (socials/page.tsx:62-69).
- NO redesign / restyle of any button (exact class strings preserved; visual output identical).
- NO new dependencies (no clsx, no tailwind-merge, no radix/shadcn, no test framework); package.json untouched.
- NO size/asChild/loading/icon-only props or dark-mode theming of buttons.
- NO changes to Footer.tsx, listings/, globals.scss, or layout.

## Open questions
- None - open-ended request resolved by research; adopted defaults listed above for veto at the gate.

## Approval gate
status: approved
<!-- User approved the brief on 2026-08-19 ("yes"). Approval authorizes plan creation only. -->
Next action: plan file created, Metis gap analysis, auto dual high-accuracy review (momus + oracle) before handoff. Execution starts separately via $start-work.
