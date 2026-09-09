# QMAX Realty

Modern real estate platform for property sales and rentals in Tbilisi, Georgia. Built with Next.js 16, React 19, and localized for 5 languages.

Live: **https://qmax-realty.vercel.app**

---

## Features

- **Property Listings** — Filterable catalog (sale/rent), featured carousel on homepage, detailed property pages with gallery, floor plan, map and SEO metadata
- **Admin Dashboard** (`/[locale]/admin`) — CRUD for properties, media upload, map picker, specs/amenities/actions tabs, translation management, messages & newsletter subscribers
- **Contact & Newsletter** — Validated forms with honeypot, SQLite persistence, and Nodemailer forwarding
- **Internationalization** — `next-intl` with 5 locales (`en`, `de`, `tr`, `ru`, `pl`), locale-prefixed routing (`as-needed`), DeepL auto-translation for missing keys and per-property `property_translations` table
- **Maps** — Key-free vector basemaps via MapLibre GL + Leaflet + OpenFreeMap (light/dark styles), office location map and property map picker
- **UX** — Tailwind CSS v4 with brand theme (emerald), dark mode (`useDarkMode`), responsive design, Framer Motion animations, offline indicator, skeleton loaders
- **SEO & Performance** — Dynamic localized `generateMetadata`, Open Graph images, Next.js font optimization (Geist), React Compiler enabled

## Tech Stack

| Layer | Technology |
|-------|------------|
| Framework | Next.js 16 (App Router, Turbopack) + React 19 |
| Styling | Tailwind CSS v4, SCSS (`globals.scss`), Prettier + tailwind plugins |
| i18n | next-intl 4.x, DeepL (`deepl-node`) |
| Database | better-sqlite3 (`data/qmax.sqlite`), auto-migrated in `src/lib/db.ts` |
| Maps | maplibre-gl, leaflet, react-leaflet, @maplibre/maplibre-gl-leaflet |
| Email | nodemailer |
| Auth | Stateless HMAC-SHA256 tokens (Web Crypto, 7-day TTL) |
| Testing | Vitest (unit), Playwright (e2e) |
| Lint/Format | ESLint (next/core-web-vitals + typescript), Prettier |

## Project Structure

```
src/
  app/
    [locale]/            # Localized routes (page, listings, about, contact, socials, admin, properties/details/[id])
    api/                 # Route handlers (admin/properties, admin/messages, admin/newsletter, admin/credentials, contact, newsletter)
    actions/             # Server actions (translate)
    globals.scss         # Tailwind v4 theme & Leaflet overrides
  components/
    admin/               # AdminDashboard, PropertyFormModal, tabs, tables, pickers
    ui/                  # Buttons, Skeleton, HapticFeedback, etc.
    Navbar, Footer, OfficeMap, ContactForm, NewsletterForm, PropertiesCarousel, ...
  config/                # languages.ts, contact.ts, maps.ts
  i18n/                  # routing.ts, request.ts (next-intl)
  lib/                   # db.ts, admin-auth.ts, mailer.ts, deepl.ts, translations.ts
  hooks/                 # useDarkMode, useMounted
  types/                 # property.ts, admin.ts
messages/                # en.json, de.json, tr.json, ru.json, pl.json
data/                    # qmax.sqlite (gitignored, auto-created)
scripts/translate.mjs    # DeepL batch translation for missing message keys
```

## Getting Started

### Prerequisites

- Node.js >= 20
- npm (or yarn/pnpm/bun)

### Install & Run

```bash
npm install
npm run dev
```

Open http://localhost:3000 — English is served at `/`, other locales at `/de`, `/tr`, `/ru`, `/pl`.

### Build

```bash
npm run build
npm start
```

## Scripts

| Script | Description |
|--------|-------------|
| `npm run dev` | Start dev server (clears console, Turbopack) |
| `npm run build` | Production build |
| `npm start` | Start production server |
| `npm run lint` | Run ESLint |
| `npm run format` | Format with Prettier |
| `npm run check` | Check formatting |
| `npm run translate` | Translate missing `messages/*.json` keys via DeepL (`scripts/translate.mjs`) |
| `npm test` | Run Vitest unit tests |
| `npm run test:e2e` | Run Playwright e2e tests |

## Environment Variables

Create `.env.local` in the project root:

```env
# Required for auto-translation (messages + property translations)
DEEPL_API_KEY=your-deepl-api-key:fx

# Admin dashboard (defaults shown)
ADMIN_USERNAME=admin
ADMIN_PASSWORD=qmax-admin-2026
ADMIN_TOKEN_SECRET=change-me-in-production

# Email forwarding for contact/newsletter
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASS=secret
SMTP_TO=info@qmaxrealty.ge
SMTP_FROM=noreply@qmaxrealty.ge
```

> `DEEPL_API_KEY` is free-tier friendly. The translate script respects rate limits with batching and exponential backoff.

All `.env*` files are gitignored.

## Internationalization

- **Routing**: `src/i18n/routing.ts` — `locales: ["en","de","tr","ru","pl"]`, `defaultLocale: "en"`, `localePrefix: "as-needed"`, `localeDetection: false`
- **Messages**: `messages/*.json` scoped by namespace (e.g. `Pages.HomePage.Metadata`). Add keys to `en.json`, then run `npm run translate` to fill other locales via DeepL.
- **Property translations**: Dedicated `property_translations` table (`property_id, locale, title, description, ...`). Reads join `properties` + `property_translations` based on `locale` param (`src/lib/db.ts:60`, `src/lib/db.ts:120`, `src/lib/db.ts:569`).
- **Translation script**: `scripts/translate.mjs` — protects ICU placeholders `{var}`, batches 50 keys, max 2 concurrent requests, preserves formatting. Credit: https://github.com/mishamumladze/

```bash
npm run translate
```

## Database

SQLite file at `data/qmax.sqlite` (auto-created, not committed).

`src/lib/db.ts` handles:

- `initTables()` — creates `messages`, `newsletter_subscribers`, `properties`, `property_translations` and migrates missing columns/indexes
- `getActiveProperties(locale?)` / `getPropertyById(id, locale?)` — locale-aware reads with translation joins
- `getAllProperties()` / `getAllPropertiesWithLocale(locale)` — admin reads
- `insertProperty` / `updateProperty` / `deleteProperty` — with slug deduplication and JSON column handling
- `insertMessage` / `getAllMessages` / `setMessageRead` / `deleteMessage`
- `insertSubscriber` / `getAllNewsletterSubscribers` / `deleteSubscriber` / `insertAdminSubscriber`
- `upsertPropertyTranslations` / `clearPropertyTranslationFields`

JSON columns (`inclusions`, `gallery`, `coords`, `view`, `kitchen_appliances`) are serialized/deserialized automatically.

## Admin

- **Route**: `/admin` (localized, e.g. `/de/admin`) — `src/app/[locale]/admin/page.tsx:18`
- **Auth**: Stateless HMAC token (`src/lib/admin-auth.ts:11`) — `base64url(payload).base64url(HMAC-SHA256)`, 7-day TTL, verified via Web Crypto (Edge-compatible). Login at `/admin/login`.
- **Credentials API**: `src/app/api/admin/credentials/route.ts`
- **Properties API**: `src/app/api/admin/properties/route.ts` (CRUD + translations)
- Override defaults via `ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_TOKEN_SECRET`.

## Maps

Defined in `src/config/maps.ts:11`:

- Light: `https://tiles.openfreemap.org/styles/bright`
- Dark: `https://tiles.openfreemap.org/styles/dark`
- Attribution: OpenStreetMap + OpenFreeMap + OpenMapTiles

`getMapStyle(dark)` selects the style. Office pin uses custom `.map-pin` styles in `src/app/globals.scss:94`.

## Styling

- **Tailwind v4** via `@use "tailwindcss"` in `globals.scss`
- Brand colors alias emerald (`--color-brand-*`), fluid typography scale, touch targets, motion durations, focus ring tokens (`src/app/globals.scss:4`)
- Class-based dark mode (`@custom-variant dark`)
- Prettier with `prettier-plugin-tailwindcss`, `prettier-plugin-classnames`, `prettier-plugin-merge`

## Testing

```bash
npm test          # Vitest unit tests (src/lib/translations.test.ts, src/config/maps.test.ts, etc.)
npm run test:e2e  # Playwright (tests/property-form.spec.ts, chromium, baseURL http://localhost:3000)
```

Playwright auto-starts `npm start` if no server is running (`playwright.config.ts:20`).

## Deployment

Optimized for Vercel:

```bash
npm run build
```

See [Next.js deployment docs](https://nextjs.org/docs/app/building-your-application/deploying).

Set all env vars in the Vercel dashboard. The SQLite file is ephemeral on serverless — use a persistent volume or migrate to a hosted DB for production if needed.

## Credits

- Translation script by [mishamumladze](https://github.com/mishamumladze/) — please credit if reused.
- Map tiles by [OpenFreeMap](https://openfreemap.org) / [OpenMapTiles](https://openmaptiles.org).

## License

Private — all rights reserved.
