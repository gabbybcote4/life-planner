# Life Planner

A digital life planner, simple by default and customizable as it grows.
See [the product blueprint](docs/PRODUCT_BLUEPRINT.md) for the agreed direction
and [AGENTS.md](AGENTS.md) for development conventions.

## Current increment

Supabase email/password account creation, sign-in, sign-out, and a protected
account welcome page. Tasks, planner data tables, and social sign-in are not
implemented yet. No application data tables or live Supabase settings are changed
by installing this increment.

## Local setup (Windows PowerShell)

Requirements: a supported Node.js release for the installed Next.js version,
npm, and a Supabase project.

```powershell
npm ci
Copy-Item .env.example .env.local
```

Fill in `.env.local` using the project's Supabase **Connect > Framework > Next.js >
App Router** instructions:

- `NEXT_PUBLIC_SUPABASE_URL`: your project's HTTPS API URL.
- `NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY`: its publishable key (never a secret or
  service-role key).
- `NEXT_PUBLIC_SITE_URL`: `http://localhost:3000` for local development; your
  canonical HTTPS app URL for deployment.

Keep `.env.local` out of Git. `.env.example` contains placeholders only.

Before testing account creation, check Supabase **Authentication > URL
Configuration**. The redirect allowlist must include
`http://localhost:3000/auth/callback` (and the exact HTTPS callback for deployment).
Keep email confirmation enabled; use the same browser when opening its link,
because the confirmation exchange uses PKCE. Changing these dashboard settings
is a separate owner action; the code does not change them.

```powershell
npm run dev
```

Open [localhost:3000](http://localhost:3000). Signed-out visitors are directed to
`/login`. Use **Create account**, confirm the email, and sign in. If the link opens
in another browser, return to the original browser or sign in after the email has
been confirmed.

Supabase's default email sender can restrict recipients and sending frequency.
Configure a production email sender before opening registration broadly. Do not
disable confirmation as a workaround. Forgot-password and social sign-in are
future increments.

## Verification

```powershell
npm run lint
npm run build
```

Manual acceptance checks:

1. Signed-out visitors to `/` are sent to `/login`.
2. Invalid email/empty password are rejected; new passwords require 8+ characters.
3. Create an account, confirm email, sign in, and reload. The same account remains
   signed in. Do not share passwords, confirmation codes, or session cookies in logs.
4. Sign out and revisit `/`; the account page is no longer accessible.
5. Check wrong-password and expired/missing confirmation-link feedback.
6. Use two separate browser profiles/accounts to verify account identity stays
   separate, and test keyboard navigation and a narrow viewport.
7. Before adding planner tables, introduce migrations with per-user RLS and verify
   direct cross-user read/write attempts. There are no planner tables in this increment.

No test framework is currently configured. The authenticated UI reads verified
claims behind Suspense boundaries for the existing Cache Components setup.
Session responses are private/no-store. Never cache authenticated responses at a
CDN or trust an unverified session cookie for data access.

## Structure

- `src/app/`: App Router pages, account actions, and confirmation callback.
- `src/lib/supabase/`: browser/server clients and environment configuration.
- `src/proxy.ts`: cookie-based session refresh using Next.js 16's proxy convention.
- `public/`: static assets.

Implementation follows the official [Supabase SSR guide](https://supabase.com/docs/guides/auth/server-side/creating-a-client)
and the installed Next.js documentation under `node_modules/next/dist/docs/`.
