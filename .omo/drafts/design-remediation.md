---
slug: design-remediation
status: awaiting-approval
intent: clear
review_required: false
pending-action: write .omo/plans/design-remediation.md
approach: Remediate the full apple-design (HIG) review of qmax-realty - Critical + High + Medium issues, including a new property details page, SQLite+email form backend, and full dark mode
---

# Draft: design-remediation

## Components (topology ledger)
<!-- Lock the SHAPE before depth. One row per top-level component that can succeed or fail independently. -->
<!-- id | outcome (one line) | status: active|deferred | evidence path -->
- c1-layout-shell | Skip link, mobile bottom padding, Inter font loading, reduced-motion template | active | src/app/layout.tsx, globals.scss, template.tsx
- c2-navigation-a11y | Navbar drawer + filter modal: dialog semantics, focus trap, Escape, aria-controls, 44px targets | active | Navbar.tsx, ListingsContent.tsx
- c3-listings-a11y | Tab keyboard semantics, labeled chip X buttons, carousel arrow targets, contrast token fixes | active | ListingsContent.tsx, PropertiesCarousel.tsx
- c4-contact-data | One source of truth for phone/address/socials; fix footer map, about CTA, param wiring | active | config/contact.ts, contact/page.tsx, page.tsx, Footer.tsx, about/page.tsx
- c5-properties-details | New /properties/details/[slug] route rendering SQLite property data | active | src/app/properties (new), lib/db.ts, types/property.ts
- c6-forms-backend | /api/newsletter + /api/contact: persist to SQLite + email forward; honor offer/subject params | active | src/app/api (new), NewsletterForm.tsx, contact/page.tsx, listings/page.tsx
- c7-dark-mode | prefers-color-scheme + dark: variants across all surfaces | active | globals.scss + all pages/components
- c8-polish | Dead code removal, dual-green unification, address color, typo, text-justify, redundant grids, logo size, aria-hidden on stats icons | active | ui/Buttons.tsx, ui/Checkbox.tsx, ContactLinks.tsx, about/page.tsx

## Open assumptions (announced defaults)
<!-- Record any default you adopt instead of asking, so the user can veto it at the gate. -->
<!-- assumption | adopted default | rationale | reversible? -->
- Email transport | nodemailer + SMTP creds from env (SMTP_HOST/PORT/USER/PASS/TO); if unconfigured, persist to SQLite only and log warning - never crash | User asked to forward to misha.mumladze2007@gmail.com; no mail lib installed | yes (veto at gate)
- Model constraint | ALL execution subagents must use deepseek v4 flash free (user: "do NOT use claude model for sub agents") | User constraint m0006/m0008 | no
- Details page images | card_image from DB, fallback placeholder_1/2.webp | Only placeholder assets exist in public/img | yes
- No git repo | Repo is not git-initialized; Commit strategy section marked N/A, no git init in scope | env fact | n/a

## Findings (cited - path:lines)
- C1 Broken route: PropertiesCarousel.tsx + ListingsContent.tsx link `/properties/details/{slug}`; no src/app/properties dir (glob m0024). 404 on every card.
- C2 Contrast: text-gray-400 on white ~2.8:1 (ListingsContent "Active:" label, modal labels, empty-state); text-emerald-600 on white ~3.2:1 (View Details, nav active, prices); text-white/90 on emerald-600 ~2.9:1 (CTA banner, social gradients).
- C3 Fixed bottom navbar h-16 overlaps mobile content: layout.tsx main has only md:pt-16, no mobile pb.
- C4 No focus trap/Escape/role=dialog on Navbar drawer + ListingsContent filter modal; modal close button 24px.
- C5 template.tsx full-page scale+opacity transition, no useReducedMotion anywhere (grep-verified zero).
- C6 No dark mode: zero prefers-color-scheme / dark: in src (grep-verified).
- C7 No skip-to-content link in layout.tsx.
- C8 ListingsContent role=tab/tablist without keyboard semantics or tabpanel.
- C9 Unlabeled X buttons on active filter chips (icon not aria-hidden, no aria-label).
- C10 Data: page.tsx CONTACT_PHONE +905550000000 (TR) vs config/contact.ts +995 (GE) vs contact page +995 591 000 000; addresses 12 vs 123; Footer map = Antalya/Türkiye vs Tbilisi copy; about href='#'.
- C11 No src/app/api dir (glob m0024: zero route.ts) -> /api/newsletter + /api/contact missing; listings offer param ignored; contact subject param ignored.
- High: Inter never loaded (globals.scss declares, no next/font); dual-green (emerald vs green-500/#25D366); address button bg-red-600; Checkbox.tsx unused w/ Google-blue; SecondaryButtonRounded invalid Tailwind classes; carousel arrows 40px; "5 Service" typo.
- Medium: text-justify (about); grid-cols-2 lg:grid-cols-2 redundant; text-[0.7rem] logo; template opacity 0.5 flash; about stats icons no aria-hidden; icons-only w-10 h-10 oversized.
- package.json: no test framework; better-sqlite3 ^13 present; no mail lib.

## Decisions (with rationale)
- Scope = EVERYTHING (Critical + High + Medium) per user answer m0027.
- Build the properties details page (user chose Recommended option) - completes the buyer journey, card CTAs become functional.
- Form backend = SQLite persist + email forward to misha.mumladze2007@gmail.com (user answer). Transport default: nodemailer via SMTP env; graceful degradation to SQLite-only when unconfigured.
- Full dark mode included (user answer).
- Test strategy = agent-executed QA, no new framework (user answer). Every todo verified via next build/lint + dev-server behavioral checks.
- All subagents/execution agents use deepseek v4 flash free.

## Scope IN
- C1-C11 critical items; High items (font, dead code, dual-green, address color, targets, typo); Medium items (text-justify, grids, logo size, aria-hidden, template flash).
- New /properties/details/[slug] route.
- New /api/newsletter + /api/contact with SQLite tables + email forward.
- Full dark mode across all pages/components.
- Unify contact data on config/contact.ts CONTACT_INFO.

## Scope OUT (Must NOT have)
- NO new test framework (user answer).
- NO git init / version control work (repo not git).
- NO auth/rate-limiting on the new API routes beyond basic validation + honeypot.
- NO i18n/localization, NO CMS, NO payment, NO property admin/CRUD.
- NO changes to SQLite schema of existing properties/listings tables (only new tables for newsletter/contact).
- NO model other than deepseek v4 flash free for any subagent.

## Open questions
- None - all forks answered in m0027. Email transport default (nodemailer/SMTP) is a veto point at the gate.

## Approval gate
status: awaiting-approval
<!-- When exploration is exhausted and unknowns are answered, set status: awaiting-approval. -->
<!-- That durable record is the loop guard: on a later turn read it and resume at the gate instead of re-running exploration. -->
<!-- APPROVAL BRIEF PRESENTED m0028. Next action on approval: write .omo/plans/design-remediation.md (scaffold-equivalent), run Metis, append todos, fill TL;DR last. -->