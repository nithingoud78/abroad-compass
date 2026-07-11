-- Prompt templates for AI assistant
CREATE TABLE public.ai_prompt_templates (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general',
  body TEXT NOT NULL,
  variables JSONB NOT NULL DEFAULT '[]'::jsonb,
  is_favorite BOOLEAN NOT NULL DEFAULT false,
  usage_count INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_prompt_templates TO authenticated;
GRANT ALL ON public.ai_prompt_templates TO service_role;
ALTER TABLE public.ai_prompt_templates ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own prompt templates" ON public.ai_prompt_templates
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_prompt_templates_updated_at
  BEFORE UPDATE ON public.ai_prompt_templates
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_prompt_templates_user ON public.ai_prompt_templates(user_id, category);

-- University AI recommendations cache
CREATE TABLE public.university_recommendations (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  university_id UUID REFERENCES public.universities(id) ON DELETE SET NULL,
  bucket TEXT NOT NULL CHECK (bucket IN ('safe','moderate','dream','ambitious')),
  match_score NUMERIC(5,2) NOT NULL DEFAULT 0,
  acceptance_probability NUMERIC(5,2),
  reasoning TEXT,
  gaps JSONB NOT NULL DEFAULT '[]'::jsonb,
  scholarships JSONB NOT NULL DEFAULT '[]'::jsonb,
  model TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.university_recommendations TO authenticated;
GRANT ALL ON public.university_recommendations TO service_role;
ALTER TABLE public.university_recommendations ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own recommendations" ON public.university_recommendations
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER trg_uni_recs_updated_at
  BEFORE UPDATE ON public.university_recommendations
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX idx_uni_recs_user ON public.university_recommendations(user_id, bucket, match_score DESC);

-- Extend user_preferences with AI settings (add columns if missing)
ALTER TABLE public.user_preferences
  ADD COLUMN IF NOT EXISTS ai_default_model TEXT NOT NULL DEFAULT 'google/gemini-3-flash-preview',
  ADD COLUMN IF NOT EXISTS ai_temperature NUMERIC(3,2) NOT NULL DEFAULT 0.7,
  ADD COLUMN IF NOT EXISTS ai_top_p NUMERIC(3,2) NOT NULL DEFAULT 1.0,
  ADD COLUMN IF NOT EXISTS ai_streaming BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_memory_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_cache_enabled BOOLEAN NOT NULL DEFAULT true,
  ADD COLUMN IF NOT EXISTS ai_context_profile BOOLEAN NOT NULL DEFAULT true;

-- Extend ai_threads with pinning/folder (safe if already exists)
ALTER TABLE public.ai_threads
  ADD COLUMN IF NOT EXISTS folder TEXT,
  ADD COLUMN IF NOT EXISTS pinned BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS archived_at TIMESTAMPTZ;