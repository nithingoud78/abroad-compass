# Environment Variables

To run Abroad Compass, you must define the following variables in a `.env` file at the root of the project. A `.env.example` file is provided for reference.

## Supabase Configuration

- `SUPABASE_URL`: The URL to your Supabase project instance.
- `SUPABASE_PUBLISHABLE_KEY`: The anon public key for your Supabase project.
- `VITE_SUPABASE_URL`: Same as `SUPABASE_URL`, exposed to the Vite frontend.
- `VITE_SUPABASE_PUBLISHABLE_KEY`: Same as `SUPABASE_PUBLISHABLE_KEY`, exposed to the Vite frontend.

## AI Configuration

- `AI_PROVIDER`: The AI provider to use. Valid options are `"google"` or `"openrouter"`.
- `GOOGLE_AI_API_KEY`: Your Google AI Studio API key (required if `AI_PROVIDER=google`).
- `OPENROUTER_API_KEY`: Your OpenRouter API key (required if `AI_PROVIDER=openrouter`).
