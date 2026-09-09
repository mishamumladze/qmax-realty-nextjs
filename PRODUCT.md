# Product

<!-- impeccable:product-schema 1 -->

## Platform

web

## Users

- Primary: international buyers and renters evaluating properties in Tbilisi, browsing sale/rent catalog in own language, comparing details, inquiring for viewing or purchase.
- Secondary: investors and relocators operating remotely, needing translated listings, maps, and direct contact channel.
- Operator: agency admin staff publishing listings, managing translations, media, inquiries and newsletter subscribers via `/admin`.

## Product Purpose

Multilingual real estate catalog and inquiry channel for QMAX Realty properties centered on Tbilisi with international reach. Exists to let visitors find, evaluate, and inquire about sale/rent properties without language friction. Success means qualified inquiries via contact form, WhatsApp/Telegram, and viewing requests.

## Positioning

Investor-ready multilingual catalog: 5-locale listings with per-property translations, key-free vector maps, and fast Next.js UX. Neighboring Tbilisi agencies cannot truthfully copy the combined DeepL-backed translation pipeline plus locale-aware property reads.

## Operating Context

- Browse featured carousel on homepage, filterable listings catalog, detail pages with gallery, floor plan, map.
- Inquiry via validated contact form, WhatsApp, Telegram, email, phone; newsletter subscription.
- Admin workflow: CRUD properties, media upload, map picker, specs/amenities, translation management, messages and subscribers.
- Environments: responsive web with dark mode, offline indicator, EN at `/` plus `/de`, `/tr`, `/ru`, `/pl`.

## Capabilities and Constraints

- Confirmed: sale/rent filtering, property details with gallery and map, contact and newsletter persistence in SQLite with Nodemailer forwarding, HMAC admin auth with 7-day TTL, locale-aware DB reads via `property_translations`.
- Technical: Next.js 16 App Router + React 19, Tailwind v4, better-sqlite3 file at `data/qmax.sqlite` ephemeral on serverless, OpenFreeMap tiles, next-intl `as-needed` routing with detection off.
- Undecided: production DB migration path off SQLite, real office phone validation, listing inventory breadth outside Tbilisi.

## Brand Commitments

QMAX Realty name, emerald brand theme, office Rustaveli Ave 12 Tbilisi Georgia, info@qmaxrealty.ge, socials @qmax_realestate / QMAXRealty / @qmax_realty / @QMAX_Realty. Voice confirmed in message catalog under `messages/*.json`.

## Evidence on Hand

- Live property data in SQLite, office coordinates 41.6969,44.8009, contact and social links in `src/config/contact.ts`.
- No committed testimonials, case studies, pricing benchmarks, or press assets found; future work must not fabricate them.

## Product Principles

- Language never blocks a deal: every listing decision preserves 5-locale parity.
- Listings earn trust with facts: photos, specs, map, and clear inquiry path over marketing claims.
- Inquiry in one step: contact action always one tap from any property.
- Admin speed equals catalog freshness: publishing and translation stay low-friction.
- Lean ephemeral stack: keep deploy simple until persistent DB is required.
