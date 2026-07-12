CREATE TABLE IF NOT EXISTS public.ai_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  model TEXT NOT NULL DEFAULT 'google/gemini-2.5-flash',
  fallback_model TEXT NOT NULL DEFAULT 'openrouter/google/gemini-flash-1.5',
  custom_api_key TEXT,
  temperature NUMERIC NOT NULL DEFAULT 0.7,
  top_p NUMERIC NOT NULL DEFAULT 0.9,
  max_tokens INTEGER NOT NULL DEFAULT 2048,
  streaming BOOLEAN NOT NULL DEFAULT true,
  context_length INTEGER NOT NULL DEFAULT 10,
  memory_enabled BOOLEAN NOT NULL DEFAULT true,
  custom_memory_notes TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_schema = 'public' 
        AND table_name = 'ai_user_settings' 
        AND column_name = 'custom_api_key'
    ) THEN
        ALTER TABLE public.ai_user_settings ADD COLUMN custom_api_key TEXT;
    END IF;
END $$;

GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_user_settings TO authenticated;
GRANT ALL ON public.ai_user_settings TO service_role;
ALTER TABLE public.ai_user_settings ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "own settings" ON public.ai_user_settings;
CREATE POLICY "own settings" ON public.ai_user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
