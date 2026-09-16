# Bahrain Refund — Next.js Edition

Next.js 15 + React 19 + Tailwind CSS v4 rewrite of the Bahrain Refund app, ready for direct deployment on Vercel with Supabase / Postgres as the backend. This edition keeps parity with the React (TanStack Start) and PHP versions:

- Public refund flow: `/` (BenefitPay + IBAN) and `/verify` (OTP with loader + resend timer).
- Customer short links: `/v/[5-digit-id]` with optional refund amount hidden by default.
- Admin dashboard at `/admin`, sessions signed with HMAC and stored in an HTTP-only cookie for 8 hours.
- Telegram bot token + chat ID stored AES-256-GCM encrypted; refund, OTP, visit, and profile events push to Telegram.
- Rate limiting via Postgres RPC `consume_rate_limit`, admin audit log, and bulk delete.

## 1. Environment

Copy `.env.example` to `.env.local` and fill:

| Variable | Purpose |
| --- | --- |
| `SUPABASE_URL` / `SUPABASE_SERVICE_ROLE_KEY` | Server access to Postgres. |
| `ADMIN_USERNAME` / `ADMIN_PASSWORD` | Seeds the first admin on the initial login. |
| `ADMIN_SETTINGS_ENC_KEY` | 32-byte base64/hex key that encrypts Telegram secrets. |
| `ADMIN_SESSION_SECRET` | Random string signing the admin cookie. |

## 2. Database

Run `schema.sql` against your Supabase project (SQL editor). It creates the five tables (`admin_users`, `admin_settings`, `admin_audit_logs`, `saved_profiles`, `rate_limits`), grants `service_role`, enables RLS, and registers the `consume_rate_limit` RPC.

## 3. Install & run

```bash
npm install
npm run dev
```

Open http://localhost:3000. Configure Telegram at `/admin/settings` after signing in.

## 4. Deploy to Vercel

```bash
vercel deploy
```

Set the same environment variables in Vercel Project Settings > Environment Variables. All API routes run on the Node.js runtime (`export const runtime = "nodejs"`).
