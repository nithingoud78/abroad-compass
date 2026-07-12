# Removed Components Report

## Summary

During Phase 3 of the architectural refactor, all traces of the legacy, conversational AI chatbot were permanently excised from the Abroad Compass application. This report catalogues the components, files, and architectural elements that were removed to streamline the platform and transition to Embedded AI.

## Deleted Files & Modules

### 1. UI Components & Routes

- `src/routes/_authenticated/assistant.tsx` (Main Chatbot Interface)
- `src/routes/_authenticated/assistant.review.tsx` (Chatbot review logs)
- `src/routes/_authenticated/admin.ai.tsx` (Admin dashboard for managing AI)
- `src/routes/_authenticated/admin.prompts.tsx` (Admin prompt template management)
- `src/routes/_authenticated/settings.ai.tsx` (User-level AI preferences)
- `src/components/app/tools.tsx` (AI specific floating action tools)

### 2. API Endpoints

- `src/api/ai/chat.ts` (Vercel AI SDK streaming endpoint)

### 3. Server Functions (RPCs)

Removed legacy chatbot RPCs from `src/lib/ai/ai.functions.ts`:

- `submitAiMessage`
- `getAiThreads`
- `getAiMessages`

### 4. Database Schema (Supabase)

The following tables were dropped from the Supabase database via the `20240711_remove_chatbot.sql` migration:

- `ai_messages`
- `ai_threads`
- `ai_user_settings`
- `ai_prompt_templates`
- `ai_memory_facts`

### 5. Global Navigation

- Removed the "AI Assistant" sidebar links from `AppSidebar.tsx`.
- Removed global floating AI icons from `AppShell.tsx`.

## Architecture Simplification

By removing these components, the application:

1. Eliminated a massive dependency surface area (Vercel AI SDK, Markdown renderers, streaming utilities).
2. Simplified the navigation hierarchy.
3. Cleaned up the database schema, removing highly active but ultimately non-core tables.
4. Shifted user focus away from conversing with a bot and back towards completing their core application workflows.
