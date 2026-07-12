# Production Checklist

Use this checklist before deploying "Abroad Compass" to a live production environment (e.g., Vercel, Render, or a VPS).

## Core Requirements

- [x] **Framework Independence**: Project relies solely on Open-Source tools (`vite`, `@tanstack/react-start`, `@supabase/ssr`).
- [x] **Dependency Sanitization**: `npm run build` succeeds without proprietary `@lovable.dev` packages.
- [x] **Type Safety**: Code passes strict TypeScript type checking (`npx tsc --noEmit`).
- [x] **Code Quality**: Code passes ESLint formatting and rules (`npm run lint`).

## Environment Configuration

Ensure the following environment variables are securely injected into your hosting provider:

- [ ] `SUPABASE_URL` (Must point to your project: `https://mrgyrlwkqptgupnkfsmb.supabase.co`)
- [ ] `SUPABASE_PUBLISHABLE_KEY`
- [ ] `VITE_SUPABASE_URL`
- [ ] `VITE_SUPABASE_PUBLISHABLE_KEY`
- [ ] `AI_PROVIDER` (Set to `google` or `openrouter`)
- [ ] `GOOGLE_AI_API_KEY` (Required if using Google)
- [ ] `OPENROUTER_API_KEY` (Required if using OpenRouter)

## Database (Manual Verification Required)

- [ ] All database migrations applied successfully.
- [ ] Row Level Security (RLS) is enabled and active on all public schema tables.
- [ ] Database triggers and Edge Functions (if applicable) are deployed.

## Authentication (Manual Verification Required)

- [ ] OAuth Providers (e.g., Google, GitHub) are configured with correct Client IDs and Secrets in Supabase.
- [ ] Site URL and Redirect URIs are correctly registered in the Supabase Auth Settings.

## Deployment

- [ ] Push local `main` branch to your GitHub repository.
- [ ] Connect hosting provider to the GitHub repository.
- [ ] Set Build Command to `npm run build`.
- [ ] Set Install Command to `npm install`.
- [ ] Deploy and verify the live URL.
