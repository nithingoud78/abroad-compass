# Deployment Guide

This project can be deployed to any Node.js hosting platform (Vercel, Render, Heroku) or serverless provider like Cloudflare Workers.

## Prerequisites

- Node.js (v18+)
- npm (v9+)
- A Supabase Project
- Google AI Studio or OpenRouter API keys

## Local Development

1. Install dependencies:
   ```bash
   npm install
   ```
2. Configure `.env` (refer to `ENVIRONMENT.md`)
3. Run the development server:
   ```bash
   npm run dev
   ```

## Production Build

To build the application for production:

```bash
npm run build
```

This compiles the TanStack Start application into an optimized build in the output directory.

## Supabase Deployment

Ensure you have run the migrations located in `supabase/migrations/` in your Supabase project.
You can use the Supabase CLI:

```bash
supabase link --project-ref your-project-id
supabase db push
```
