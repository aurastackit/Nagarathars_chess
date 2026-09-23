# Nagarathar's Chess Championship

Website for Nagarathar's Chess Championship — tournament listings and registration, chess
classes with a waitlist/enrollment flow, results and standings with player profiles and
certificates, and an admin dashboard for managing all of it.

## Tech stack

- **Framework:** Next.js 16 (App Router, Server Components)
- **Database:** Postgres (Supabase) via Prisma ORM
- **Auth:** NextAuth (Credentials provider, admin-only)
- **Forms:** react-hook-form + zod
- **File storage:** AWS S3 (pre-signed uploads for registration documents)
- **Payments:** Razorpay (checkout + server-side signature verification)
- **Email:** Resend
- **PDF certificates:** @react-pdf/renderer
- **Charts:** Recharts
- **Styling:** Tailwind CSS v4

## Getting started

```bash
npm install
cp .env.example .env   # fill in the values described below
npx prisma migrate deploy
npm run db:seed         # optional: seed sample data
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Environment variables

| Variable               | Description                                                           |
| ---------------------- | --------------------------------------------------------------------- |
| `DATABASE_URL`         | Postgres connection string (pooled, used at runtime)                  |
| `DIRECT_URL`           | Postgres direct connection string (used by Prisma Migrate)            |
| `AUTH_SECRET`          | Secret used by NextAuth to sign session tokens                        |
| `ADMIN_EMAIL`          | Email address allowed to sign in to `/admin`                          |
| `ADMIN_PASSWORD`       | Password for the admin account                                        |
| `S3_BUCKET_NAME`       | S3 bucket for registration document uploads                           |
| `S3_REGION`            | AWS region for the S3 bucket                                          |
| `S3_ACCESS_KEY_ID`     | AWS access key with S3 read/write permission                          |
| `S3_SECRET_ACCESS_KEY` | AWS secret key                                                        |
| `RAZORPAY_KEY_ID`      | Razorpay API key ID                                                   |
| `RAZORPAY_KEY_SECRET`  | Razorpay API key secret                                               |
| `RESEND_API_KEY`       | Resend API key (email sending falls back to console logging if unset) |
| `RESEND_FROM_EMAIL`    | "From" address used for outbound email                                |
| `NEXT_PUBLIC_SITE_URL` | Public site URL, used for metadata, sitemap, and absolute links       |

Never commit real values for these — in production (AWS Amplify) they're set as Amplify
environment variables and baked into the build by `amplify.yml`.

## Scripts

| Command                | Description                              |
| ---------------------- | ---------------------------------------- |
| `npm run dev`          | Start the dev server                     |
| `npm run build`        | Production build                         |
| `npm run start`        | Start the production server              |
| `npm run lint`         | Run ESLint                               |
| `npm run format`       | Format the codebase with Prettier        |
| `npm run format:check` | Check formatting without writing changes |
| `npm run db:seed`      | Seed the database with sample data       |

## Database migrations

Prisma Migrate is used for schema changes:

```bash
npx prisma migrate dev --name <change-description>   # local development
npx prisma migrate deploy                             # apply migrations (CI/production)
```

## Deployment

The site deploys to AWS Amplify. `amplify.yml` runs `prisma generate`, `prisma db push`, and
writes the required secrets into `src/lib/env-runtime.ts` at build time from Amplify's
environment variables, then runs `next build`. Pushing to `master` triggers a new deployment.

## Project structure

- `src/app` — routes (App Router), including `admin/` (protected by `src/proxy.ts`) and
  `api/` (route handlers for forms, payments, uploads, and admin actions)
- `src/components` — shared UI, the registration/enrollment wizards, and admin panels
- `src/lib` — Prisma client, validation schemas, email, S3, Razorpay, rate limiting, and
  other server-side utilities
- `prisma/` — schema and migrations
