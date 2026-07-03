# BribeRates.in

A public-utility reference site: **what people actually pay** — over and above
official government fees — to get everyday paperwork done in India. Anonymous,
crowd-reported, no login. Think "Numbeo / Glassdoor for government offices."

MVP scope: **property registration in Bengaluru** (deep, not broad).

## Run locally

```bash
npm install
cp .env.example .env.local   # then set DATABASE_URL (Supabase connection string)
npm run dev
# http://localhost:3000
```

On first request the app creates its tables and seeds demo data automatically
into your Supabase Postgres database — no manual migration step.

## How it works

- **Structured, anonymous reports** — no login. Each report is
  `service × sub-item × office × amount`.
- **Corroboration** — one-tap "I paid same / more / less" hardens data without a form.
- **Rates earn visibility** — a headline number is the **median** of approved
  reports with statistical outliers auto-removed (1.5×IQR). Confidence grows with
  volume: *Unverified → Emerging → Well-established*. One report is a rumour; many
  reports are a price.
- **Moderation** — new reports land in `pending` and only go live once approved
  at `/admin`.

## Key routes (SEO-first, built around real search queries)

| Route | Targets searches like |
|---|---|
| `/property-registration/bengaluru` | "property registration charges bangalore" |
| `/office/banaswadi-sro` | "banaswadi sro charges", "MODT charges banaswadi" |
| `/submit` | anonymous report form (noindex) |
| `/admin` | moderation queue (password-gated) |

`sitemap.xml` and `robots.txt` are generated automatically from the data.

## Configuration (all optional — see `.env.example`)

Copy `.env.example` → `.env.local`:

- `ADMIN_PASSWORD` — moderation login (defaults to `admin` — **change for prod**)
- `IP_HASH_SALT` — random string; salts IP hashes + admin cookie
- `NEXT_PUBLIC_SITE_URL` — e.g. `https://briberates.in`
- `NEXT_PUBLIC_TURNSTILE_SITE_KEY` / `TURNSTILE_SECRET` — Cloudflare Turnstile
  anti-spam. If unset, the bot check is skipped (fine for dev).

## Before going live: remove demo data

The seed includes demo rows so the aggregation UI has something to show. Wipe
them (keeps the two real Banaswadi data-points):

```sql
DELETE FROM reports WHERE is_sample = 1;
```

## Deploying

Deploy to **Vercel**: push to GitHub, import the repo, and set the same env vars
(`DATABASE_URL`, `ADMIN_PASSWORD`, `IP_HASH_SALT`, Turnstile keys) in the Vercel
project. Use the Supabase **connection pooler** URI (port 6543) for the
serverless environment. Data lives in Supabase, so no persistent disk is needed.

You also get Supabase's **table editor** as a ready-made moderation dashboard for
the `reports` table, in addition to the in-app `/admin` queue.

## Stack

Next.js 16 (App Router) · React 19 · Tailwind v4 · Postgres (Supabase) via `pg`
· TypeScript.
