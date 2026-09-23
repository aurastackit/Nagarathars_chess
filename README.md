# Nagarathar's Chess — Tournament & Coaching Platform

> Built and maintained by **Aura Stack** · Next.js 16 · React 19 · TypeScript · Prisma · PostgreSQL · AWS

---

## Abstract

Nagarathar's Chess is a full-stack web platform that digitises how a community chess organisation runs its in-person tournaments and online coaching classes. What began on 30 Aug 2026 as an MVP (tournament listing, a basic registration form and a simple admin view on SQLite) has been developed into a production application deployed on **AWS Amplify (SSR)** with a **Supabase-hosted PostgreSQL** database.

The platform now covers the complete tournament lifecycle: publishing an event, a **6-step registration wizard** with age-category eligibility rules and community (Kovil/Pirivu) details, **private document uploads to Amazon S3** through pre-signed URLs, **online entry-fee payments through Razorpay** with server-side signature verification, confirmation emails with calendar invites, an **authenticated admin dashboard** (CRUD, filters, charts, CSV/Excel exports and a full audit log), and a **results module** that computes standings with Buchholz and Sonneborn-Berger tiebreaks, generates PDF certificates, maintains player profiles and a Hall of Champions. A classes module with filters, a 2-step enrolment wizard and a waitlist completes the offering.

Along the way the project solved real deployment problems (serverless-incompatible SQLite, environment variables not reaching Amplify's SSR runtime, an oversized image breaking Next.js image optimisation) and introduced a consistent premium design system across the site.

---

## Table of Contents

1. [Tech Stack](#1-tech-stack)
2. [Architecture Overview](#2-architecture-overview)
3. [Modules](#3-modules)
4. [API Reference](#4-api-reference)
5. [Data Model](#5-data-model)
6. [Third-Party Services](#6-third-party-services)
7. [Environment Variables](#7-environment-variables)
8. [Local Setup](#8-local-setup)
9. [Deployment (AWS Amplify)](#9-deployment-aws-amplify)
10. [Change Log](#10-change-log)
11. [Current Limitations & Roadmap](#11-current-limitations--roadmap)

---

## 1. Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 16 (App Router, Server Components, Server Actions, Route Handlers) |
| UI | React 19, Tailwind CSS 4, custom SVG chess-piece icon set, `next/font` (Playfair Display + Inter) |
| Forms & validation | react-hook-form, Zod 4 (schemas shared by client and server) |
| Database / ORM | PostgreSQL (Supabase, pooled + direct connections), Prisma 6 |
| Auth | NextAuth v5 (Credentials provider, JWT sessions) + edge proxy gate |
| File storage | Amazon S3 (private bucket, pre-signed PUT/GET URLs) via AWS SDK v3 |
| Payments | Razorpay (Orders API + HMAC-SHA256 signature verification) |
| Email | Resend (with a safe console stub fallback) |
| Documents & exports | @react-pdf/renderer (certificates), SheetJS `xlsx` (Excel), CSV, iCalendar (`.ics`) |
| Charts | Recharts |
| Client utilities | browser-image-compression, debounced localStorage draft autosave |
| Hosting / CI | AWS Amplify Hosting (SSR compute), auto-deploy from GitHub |

---

## 2. Architecture Overview

```
Browser
  │
  ├─ Public pages (Server Components) ──► Prisma ──► PostgreSQL (Supabase)
  ├─ Wizards (Client Components, react-hook-form + Zod)
  │     ├─ POST /api/uploads/presign ──► S3 pre-signed PUT ──► direct upload to private S3 bucket
  │     ├─ POST /api/tournaments/[slug]/register
  │     └─ POST /api/tournaments/[slug]/pay/create-order ──► Razorpay Checkout ──► /pay/verify
  │
  └─ /admin/** ──► src/proxy.ts (edge auth gate) ──► requireAdminPage()/requireAdminApi()
                     ├─ CRUD via Server Actions ──► AdminActivityLog (audit trail)
                     ├─ CSV / XLSX export routes
                     └─ /api/admin/uploads ──► short-lived S3 signed GET URL
```

Key design principles applied throughout:

- **Defense in depth for admin:** an edge-level proxy blocks `/admin/**` and `/api/admin/**`, and every admin page, server action and route re-checks the session.
- **One validation source of truth:** Zod schemas are shared between the client wizard and the API routes, so rules (age category, deadlines, phone format) cannot drift.
- **No public PII files:** uploaded documents live only in a private bucket and are reachable only through short-lived signed URLs.
- **Graceful degradation:** Razorpay, S3 and Resend each have an `isConfigured()` check, so the site keeps working (with clear messages or a console stub) when a key is absent.

---

## 3. Modules

### 3.1 Platform & Infrastructure

- Migrated from **SQLite to PostgreSQL (Supabase)** because SQLite does not persist on Amplify's serverless compute; migrations regenerated for the new provider.
- Prisma configured with a **pooled connection** (PgBouncer) for runtime and a **direct connection** for migrations.
- NextAuth set to `trustHost` so authentication works behind Amplify's proxy.
- Solved Amplify not passing Console environment variables to the SSR runtime: `amplify.yml` generates `src/lib/env-runtime.ts` at build time so required variables are available at server start-up (the committed file is an empty placeholder).
- Fixed the site logo failing to load in production: the source PNG exceeded Next.js Image Optimization's 9000 px limit and was resized.

### 3.2 Design System & Public Site

- **Premium design system:** charcoal / ivory / gold Tailwind tokens, Playfair Display headings with Inter body text, reusable primitives (`Container`, `SectionHeading`, `EmptyState`, `Button`, `Card`, `Badge`).
- Unicode chess glyphs replaced with a **custom SVG chess-piece icon set**.
- **Homepage:** two-column hero with glass cards (mini board, countdown, community badge), animated chess-piece slideshow, stats strip with scroll-triggered count-up, Hall of Champions section.
- **Navigation:** active-page highlighting, glass/blur header on scroll, a gold "Register Now" CTA pointing to the next open tournament, and an accessible full-screen mobile menu (focus trap, Esc to close, body scroll lock).
- **Announcement bar:** live countdown to the nearest registration deadline, hidden when nothing is open (shared `getNextTournament()` helper using React `cache()`).
- Pages: About, Gallery (grid + tiles), Contact (form), Register hub.

### 3.3 Tournaments

- **Listing:** single client-side filterable list (format, city, month, fee, status), sorted by nearest date.
- **Status engine:** Open / Closing soon (< 72 h) / Closed / Completed, derived from dates by `getTournamentStatus()` and independent of the admin publish state.
- **Shared `TournamentCard`:** format badge, dates, venue, fee, seats-left progress bar.
- **Detail page:** hero banner, key-facts grid (time control, rounds), schedule timeline, prize structure, rules accordion, embedded map with "Get directions", **Add to Calendar (.ics)**, WhatsApp share, closed/completed callouts.
- **SEO:** per-tournament `generateMetadata` and a **dynamic Open Graph image** via `next/og`.
- **Validation:** registration deadline must be before the start date and the end date cannot precede the start date (shared Zod schema in the admin forms); late registrations are rejected server-side.

### 3.4 Registration Wizard

- **6 steps:** Player → Category → Family → Community → Documents → Review & Pay, with a progress bar, per-step validation and Back/Next navigation.
- **Draft autosave:** debounced localStorage save that survives a page refresh.
- **Age-category rules:** age computed live from date of birth against the tournament start date; the lowest eligible category is pre-selected and players may **play up but never down** — enforced on both client and server.
- **Community details:** dependent Kovil → Pirivu dropdowns covering the 9 Nagarathar Kovils, plus family and native-place fields.
- **Consent:** privacy notice with a required checkbox; players under 18 must also provide a parent/guardian name and consent.
- **Duplicate prevention:** database-level unique constraint on tournament + email + date of birth.
- **Outcome:** registration ID, confirmation email with `.ics` attachment, and a `/registration/[id]` status page (Pending review / Confirmed / Rejected + payment status).

### 3.5 Payments (Razorpay)

- Free tournaments submit directly; paid tournaments create a **Razorpay order** (amount in paise, INR).
- Checkout runs client-side; the server **verifies the HMAC-SHA256 signature** and checks the order ID matches the registration before marking it paid.
- Stores order ID, payment ID, payment status and amount paid; blocks double payment.

### 3.6 Secure Document Uploads (Amazon S3)

- Age proof (masked Aadhaar / birth certificate / school ID) and passport photo.
- Images are **compressed in the browser** (≤ 1 MB, ≤ 1920 px) before upload; PDFs pass through.
- Files go **directly from the browser to a private S3 bucket** using pre-signed PUT URLs; only the object key is stored in the database.
- Allowed types: JPEG, PNG, WebP, PDF.
- Admins view documents through a session-gated route that issues a **short-lived signed GET URL**.

### 3.7 Notifications (Resend)

- Registration confirmation email with a calendar invite attached.
- Confirm / Reject decision emails to registrants (rejection includes the reason).
- Falls back to a logged stub when no Resend key is configured, so every environment is safe to run.

### 3.8 Admin Dashboard

- **Authentication:** NextAuth credentials login, edge proxy for pages (redirect) and APIs (401), plus explicit per-page/per-action checks.
- **Tournaments:** create, edit, publish/unpublish, draft/closed/completed states, delete (only when there are no registrations).
- **Registrations:** search (name / email / phone), filters (category, status, Kovil), confirm / reject with mandatory reason, secure document viewing.
- **Exports:** CSV and Excel for tournament registrations and class enrolments, including payment amount and rejection reason.
- **Analytics:** payments collected (fee-bearing tournaments only), 30-day registrations trend, category breakdown chart, registrations per tournament.
- **Audit log:** every create / update / publish / unpublish / delete / confirm / reject is recorded in `AdminActivityLog` and viewable at `/admin/activity`.

### 3.9 Results Module

- **Data entry:** manual round/pairing entry or **CSV import** (`round, board, white_email, black_email, result`), live standings preview, publish/unpublish toggle.
- **Standings engine** (`src/lib/standings.ts`): scores with byes and draws, **Buchholz** and **Sonneborn-Berger** tiebreaks, overall and category winners — verified against a hand-calculated example.
- **Public results page:** round-by-round pairings, standings table, champion and category-winner callouts.
- **Player profiles** (`/players/[id]`): tournaments played, score-history chart, win counts — name and results only, no registration PII.
- **Certificates:** auto-generated PDF that upgrades from Participation to "Tournament Champion" / "Category Champion" once results are published.
- **Hall of Champions:** homepage section for the most recent tournaments with published results.
- Player identity unified across tournaments by email, with lazy backfill for older registrations.

### 3.10 Classes & Waitlist

- Class programmes with level, session type (group / 1-on-1), price, batch size, duration, schedule and instructor.
- Instant client-side filters for **Level** and **Mode**.
- **2-step enrolment wizard** (Your details → Confirm) reusing the tournament wizard's field components and a now-parameterised progress bar; FIDE ID required for intermediate/advanced levels; duplicate enrolment blocked per class + email.
- **"Get notified" waitlist** (email + optional phone) replaces the empty state when no classes are published.

### 3.11 Contact

- Validated contact form stored in `ContactMessage`.

---

## 4. API Reference

### Public endpoints

| Method | Endpoint | Purpose |
|---|---|---|
| POST | `/api/tournaments/[slug]/register` | Validate (Zod) and create a registration; checks deadline, capacity, duplicates; sends confirmation |
| POST | `/api/tournaments/[slug]/pay/create-order` | Create a Razorpay order for a pending paid registration |
| POST | `/api/tournaments/[slug]/pay/verify` | Verify Razorpay signature and mark the registration paid |
| GET | `/api/tournaments/[slug]/ics` | Download the tournament as an iCalendar event |
| POST | `/api/uploads/presign` | Issue a pre-signed S3 PUT URL for an age-proof or passport-photo upload |
| GET | `/api/registration/[id]/certificate` | Generate the PDF certificate (confirmed registrations, after the event) |
| POST | `/api/classes/[slug]/enroll` | Enrol in a class programme |
| POST | `/api/classes/waitlist` | Join the classes waitlist |
| POST | `/api/contact` | Submit a contact message |
| GET/POST | `/api/auth/[...nextauth]` | NextAuth authentication handlers |

### Admin endpoints (session required)

| Method | Endpoint | Purpose |
|---|---|---|
| GET | `/api/admin/uploads?key=…` | Redirect to a short-lived signed S3 URL for a registrant document |
| GET | `/admin/tournaments/[id]/registrations.csv` | Export registrations as CSV |
| GET | `/admin/tournaments/[id]/registrations.xlsx` | Export registrations as Excel |
| GET | `/admin/classes/[id]/enrollments.csv` | Export class enrolments as CSV |
| GET | `/admin/classes/[id]/enrollments.xlsx` | Export class enrolments as Excel |

Admin create/update/publish/delete/confirm/reject operations run as **Next.js Server Actions** inside the `/admin` pages.

### Page routes

| Area | Routes |
|---|---|
| Public | `/`, `/tournaments`, `/tournaments/[slug]`, `/tournaments/[slug]/results`, `/register`, `/registration/[id]`, `/players/[id]`, `/classes`, `/gallery`, `/about`, `/contact` |
| Admin | `/admin/login`, `/admin`, `/admin/tournaments`, `/admin/tournaments/new`, `/admin/tournaments/[id]`, `/admin/tournaments/[id]/results`, `/admin/classes`, `/admin/classes/new`, `/admin/classes/[id]`, `/admin/activity` |

---

## 5. Data Model

| Model | Purpose |
|---|---|
| `Tournament` | Event details, fee, capacity, deadline, time control, rounds, prizes, rules, publish status, results flag |
| `Registration` | Player, family and community details, age category, consent, S3 document keys, review status, payment fields, link to `Player` |
| `Player` | Cross-tournament player identity (unique by email) |
| `Round` / `Pairing` | Round-by-round results (white, black, board, result; null black = bye) |
| `ClassProgram` / `ClassEnrollment` | Coaching programmes and enrolments |
| `ClassWaitlist` | Interest capture when no classes are live |
| `ContactMessage` | Contact form submissions |
| `AdminActivityLog` | Audit trail of admin actions |

Migrations (all additive after the Postgres switch): `init` → `add_tournament_detail_fields` → `registration_wizard_fields` → `admin_dashboard` → `results_module` → `class_waitlist`.

---

## 6. Third-Party Services

| Service | Used for | Integration point |
|---|---|---|
| Supabase (PostgreSQL) | Primary database | `DATABASE_URL`, `DIRECT_URL`, `src/lib/prisma.ts` |
| Amazon S3 (ap-south-1) | Private document storage | `src/lib/s3.ts`, `src/lib/use-s3-upload.ts` |
| Razorpay | Entry-fee payments | `src/lib/razorpay.ts`, `src/lib/razorpay-checkout.ts` |
| Resend | Transactional email | `src/lib/notify.ts` |
| Google Maps (keyless embed) | Venue map and directions | `src/components/venue-map.tsx` |
| AWS Amplify Hosting | Build, SSR hosting, CI/CD from GitHub | `amplify.yml` |

---

## 7. Environment Variables

All values below are **masked**. Real values are stored only in the Amplify Console and local `.env` files, which are git-ignored.

| Variable | Description | Example (masked) |
|---|---|---|
| `DATABASE_URL` | Pooled Postgres connection | `postgresql://postgres:****@<project-ref>.pooler.supabase.com:6543/postgres?pgbouncer=true` |
| `DIRECT_URL` | Direct Postgres connection (migrations) | `postgresql://postgres:****@<project-ref>.pooler.supabase.com:5432/postgres` |
| `AUTH_SECRET` | NextAuth signing secret | `****` |
| `ADMIN_EMAIL` | Admin login email | `admin@<your-domain>` |
| `ADMIN_PASSWORD` | Admin login password | `****` |
| `S3_BUCKET_NAME` | Private upload bucket | `<private-bucket-name>` |
| `S3_REGION` | Bucket region | `ap-south-1` |
| `S3_ACCESS_KEY_ID` | IAM access key | `AKIA****` |
| `S3_SECRET_ACCESS_KEY` | IAM secret key | `****` |
| `RAZORPAY_KEY_ID` | Razorpay key ID | `rzp_****` |
| `RAZORPAY_KEY_SECRET` | Razorpay secret | `****` |
| `RESEND_API_KEY` | Resend API key | `re_****` |
| `RESEND_FROM_EMAIL` | Sender address | `Nagarathar's Chess <registrations@<your-domain>>` |
| `NEXT_PUBLIC_SITE_URL` | Public site URL | `https://<your-domain>` |

See `.env.example` for the template.

---

## 8. Local Setup

```bash
git clone https://github.com/aurastackit/Nagarathars_chess.git
cd Nagarathars_chess
npm install                 # also runs `prisma generate`
cp .env.example .env        # fill in your own values
npx prisma migrate deploy   # or `npx prisma db push` for a fresh local DB
npm run db:seed             # optional sample data
npm run dev                 # http://localhost:3000
```

For local development without Supabase, point `DATABASE_URL` and `DIRECT_URL` at a local PostgreSQL instance.

---

## 9. Deployment (AWS Amplify)

Pushing to the connected GitHub branch triggers an Amplify build:

1. **preBuild:** `npm ci` → `prisma generate` → `prisma db push` → generate `src/lib/env-runtime.ts` from the Console environment variables.
2. **build:** `npm run build`.
3. **artifacts:** `.next`, with `node_modules` and `.next/cache` cached between builds.

Set every variable from section 7 in **Amplify Console → Hosting → Environment variables**, and attach a compute role with the required IAM permissions. The custom domain is connected through the domain registrar's DNS records.

---

## 10. Change Log

| Date | Milestone |
|---|---|
| 30 Aug 2026 | MVP: tournament listing and registration, online classes, admin view, email notification stub (SQLite) |
| 30 Aug 2026 | Rating / FIDE ID, Kovil–Pirivu dependent dropdowns, age categories with opt-up rule, class details, Excel export, animated hero |
| 08 Sep 2026 | About, Gallery and Register pages; first registration wizard and profile modal; count-up, countdown and reveal animations |
| 19 Sep 2026 | Switched to Supabase PostgreSQL; Amplify SSR deployment with environment-variable workaround; logo asset fix; mobile hamburger menu |
| 23 Sep 2026 | Premium design system and rebuilt homepage/navbar with announcement bar |
| 23 Sep 2026 | Rebuilt tournaments listing and detail pages (filters, status engine, map, .ics, OG images) |
| 23 Sep 2026 | 6-step registration wizard with S3 uploads, Razorpay payments, consent and status page |
| 23 Sep 2026 | Admin dashboard: hardened auth, CRUD, filters, charts, decision emails, audit log |
| 23 Sep 2026 | Results module: standings with tiebreaks, player profiles, PDF certificates, Hall of Champions |
| 23 Sep 2026 | Classes: filters, 2-step enrolment wizard, waitlist |

---

## 11. Current Limitations & Roadmap

- **Payments:** Razorpay keys must be added for paid tournaments; free-entry registration is fully live.
- **Email:** some notifications still use the logging stub until a Resend key and verified sender domain are configured.
- **Admin access:** single admin account from environment variables; multi-user roles are a natural next step.
- **Coaches section:** archived in `src/_archive/` for later restore.

---

© Aura Stack. All rights reserved.
