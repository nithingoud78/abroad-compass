-- AI User Settings
CREATE TABLE public.ai_user_settings (
  user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  provider TEXT NOT NULL DEFAULT 'google',
  model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  fallback_model TEXT NOT NULL DEFAULT 'openrouter/google/gemini-flash-1.5',
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
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_user_settings TO authenticated;
GRANT ALL ON public.ai_user_settings TO service_role;
ALTER TABLE public.ai_user_settings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own settings" ON public.ai_user_settings FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_user_settings_set_updated_at BEFORE UPDATE ON public.ai_user_settings
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- Alter ai_prompt_templates
ALTER TABLE public.ai_prompt_templates 
  ADD COLUMN is_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN version INTEGER NOT NULL DEFAULT 1;

-- ai_threads already has folder

-- Create ai memory facts table (optional, for the 'Context Engine' dynamic extraction if needed)
CREATE TABLE public.ai_memory_facts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  fact TEXT NOT NULL,
  source TEXT NOT NULL, -- e.g., 'conversation', 'profile'
  confidence NUMERIC NOT NULL DEFAULT 1.0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_memory_facts TO authenticated;
GRANT ALL ON public.ai_memory_facts TO service_role;
ALTER TABLE public.ai_memory_facts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own memory facts" ON public.ai_memory_facts FOR ALL TO authenticated
  USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER ai_memory_facts_set_updated_at BEFORE UPDATE ON public.ai_memory_facts
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
