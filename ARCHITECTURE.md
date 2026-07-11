# Architecture

## Overview

Abroad Compass is built using a modern full-stack JavaScript architecture, leveraging React and TanStack technologies on the frontend and Supabase for backend services.

## Core Technologies

1. **Frontend Framework**: [TanStack Start](https://tanstack.com/start)
   - Uses Vite as the underlying bundler.
   - Provides full-stack routing and server-side rendering (SSR) capabilities.
2. **UI & Styling**:
   - [Tailwind CSS v4](https://tailwindcss.com/) for utility-first styling.
   - [Radix UI](https://www.radix-ui.com/) for accessible, unstyled UI primitives.
3. **State Management**: [TanStack Query](https://tanstack.com/query) for data fetching, caching, and state synchronization.
4. **Backend**: [Supabase](https://supabase.com/)
   - PostgreSQL Database with Row Level Security (RLS).
   - Supabase Auth for user identity and session management.
5. **AI Integration**: [Vercel AI SDK](https://sdk.vercel.ai/)
   - Connects to Google Gemini or OpenRouter via a generic OpenAI-compatible provider.

## Directory Structure

- `/src/components`: Reusable UI components (buttons, dialogs, layout wrappers).
- `/src/hooks`: Custom React hooks.
- `/src/integrations`: Setup and clients for external services like Supabase.
- `/src/lib`: Core utilities, AI functions, types, and generic helpers.
- `/src/routes`: TanStack Router file-based routing components and pages.
- `/supabase`: Supabase configuration, schema definitions, and migrations.

## AI Architecture

The application abstracts AI provider specifics by using the `@ai-sdk/openai-compatible` package.
It routes requests either to Google AI Studio or OpenRouter depending on the `AI_PROVIDER` environment variable, preventing vendor lock-in.
