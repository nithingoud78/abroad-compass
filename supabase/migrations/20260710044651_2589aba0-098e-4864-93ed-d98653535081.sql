
-- 1. Roles ---------------------------------------------------------------
DO $$ BEGIN
  CREATE TYPE public.app_role AS ENUM ('admin','moderator','user');
EXCEPTION WHEN duplicate_object THEN NULL; END $$;

CREATE TABLE IF NOT EXISTS public.user_roles (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  role public.app_role NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, role)
);

GRANT SELECT ON public.user_roles TO authenticated;
GRANT ALL ON public.user_roles TO service_role;

ALTER TABLE public.user_roles ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users read own roles" ON public.user_roles;
CREATE POLICY "Users read own roles" ON public.user_roles
  FOR SELECT TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.has_role(_user_id uuid, _role public.app_role)
RETURNS boolean LANGUAGE sql STABLE SECURITY DEFINER SET search_path = public AS $$
  SELECT EXISTS (SELECT 1 FROM public.user_roles WHERE user_id = _user_id AND role = _role);
$$;

DROP POLICY IF EXISTS "Admins read all roles" ON public.user_roles;
CREATE POLICY "Admins read all roles" ON public.user_roles
  FOR SELECT TO authenticated USING (public.has_role(auth.uid(), 'admin'));

DROP POLICY IF EXISTS "Admins manage roles" ON public.user_roles;
CREATE POLICY "Admins manage roles" ON public.user_roles
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(), 'admin'))
  WITH CHECK (public.has_role(auth.uid(), 'admin'));

-- 2. System settings ----------------------------------------------------
CREATE TABLE IF NOT EXISTS public.system_settings (
  key text PRIMARY KEY,
  value jsonb NOT NULL DEFAULT '{}'::jsonb,
  description text,
  updated_by uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.system_settings TO authenticated;
GRANT ALL ON public.system_settings TO service_role;
ALTER TABLE public.system_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Everyone reads settings" ON public.system_settings;
CREATE POLICY "Everyone reads settings" ON public.system_settings
  FOR SELECT TO authenticated USING (true);
DROP POLICY IF EXISTS "Admins write settings" ON public.system_settings;
CREATE POLICY "Admins write settings" ON public.system_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.system_settings (key, value, description) VALUES
  ('maintenance_mode', '{"enabled":false,"message":""}'::jsonb, 'Site-wide maintenance mode'),
  ('announcement', '{"enabled":false,"title":"","body":"","level":"info"}'::jsonb, 'Global announcement banner'),
  ('feature_flags', '{}'::jsonb, 'Boolean feature flags'),
  ('dmat_dates', '{"registration_deadline":"2026-09-15","exam_date":"2026-09-26","result_date":"2026-10-12"}'::jsonb, 'Default dMAT dates')
ON CONFLICT (key) DO NOTHING;

-- 3. AI provider settings ----------------------------------------------
CREATE TABLE IF NOT EXISTS public.ai_provider_settings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  provider text NOT NULL,
  model text NOT NULL,
  temperature numeric(3,2) NOT NULL DEFAULT 0.7,
  top_p numeric(3,2) NOT NULL DEFAULT 1.0,
  top_k integer,
  max_tokens integer NOT NULL DEFAULT 2048,
  memory_size integer NOT NULL DEFAULT 10,
  system_prompt text,
  safety_settings jsonb NOT NULL DEFAULT '{}'::jsonb,
  streaming boolean NOT NULL DEFAULT true,
  is_active boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_provider_settings TO authenticated;
GRANT ALL ON public.ai_provider_settings TO service_role;
ALTER TABLE public.ai_provider_settings ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Admins manage ai provider" ON public.ai_provider_settings;
CREATE POLICY "Admins manage ai provider" ON public.ai_provider_settings
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

INSERT INTO public.ai_provider_settings (provider, model, is_active, system_prompt)
SELECT 'google', 'google/gemini-2.5-flash', true, 'You are the Abroad Compass assistant helping students studying in Germany.'
WHERE NOT EXISTS (SELECT 1 FROM public.ai_provider_settings);

-- 4. Blog extensions ---------------------------------------------------
ALTER TABLE public.blog_posts
  ADD COLUMN IF NOT EXISTS scheduled_for timestamptz,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS seo_title text,
  ADD COLUMN IF NOT EXISTS seo_description text,
  ADD COLUMN IF NOT EXISTS featured_image text,
  ADD COLUMN IF NOT EXISTS tags text[] NOT NULL DEFAULT '{}',
  ADD COLUMN IF NOT EXISTS category text;

DROP POLICY IF EXISTS "Admins manage blog" ON public.blog_posts;
CREATE POLICY "Admins manage blog" ON public.blog_posts
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 5. Feedback extensions ------------------------------------------------
ALTER TABLE public.feedback_items
  ADD COLUMN IF NOT EXISTS roadmap_stage text,
  ADD COLUMN IF NOT EXISTS internal_notes text,
  ADD COLUMN IF NOT EXISTS developer_notes text,
  ADD COLUMN IF NOT EXISTS pinned boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS featured boolean NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS assignee uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS duplicate_of uuid REFERENCES public.feedback_items(id) ON DELETE SET NULL;

DROP POLICY IF EXISTS "Admins manage feedback" ON public.feedback_items;
CREATE POLICY "Admins manage feedback" ON public.feedback_items
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 6. Admin-side university / resource / prompt management ----------------
DROP POLICY IF EXISTS "Admins manage universities" ON public.universities;
CREATE POLICY "Admins manage universities" ON public.universities
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage resources" ON public.resources;
CREATE POLICY "Admins manage resources" ON public.resources
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

DROP POLICY IF EXISTS "Admins manage prompts" ON public.ai_prompt_templates;
CREATE POLICY "Admins manage prompts" ON public.ai_prompt_templates
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

-- 7. IELTS learning tables ---------------------------------------------
CREATE TABLE IF NOT EXISTS public.ielts_practice (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  skill text NOT NULL CHECK (skill IN ('listening','reading','writing','speaking','vocabulary','mock')),
  title text NOT NULL,
  band numeric(3,1),
  duration_min integer,
  notes text,
  mistakes jsonb NOT NULL DEFAULT '[]'::jsonb,
  bookmarked boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ielts_practice TO authenticated;
GRANT ALL ON public.ielts_practice TO service_role;
ALTER TABLE public.ielts_practice ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own ielts practice" ON public.ielts_practice;
CREATE POLICY "Users own ielts practice" ON public.ielts_practice
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.ielts_goals (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  target_band numeric(3,1) NOT NULL DEFAULT 7.0,
  daily_min integer NOT NULL DEFAULT 30,
  weekly_min integer NOT NULL DEFAULT 300,
  test_date date,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ielts_goals TO authenticated;
GRANT ALL ON public.ielts_goals TO service_role;
ALTER TABLE public.ielts_goals ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own ielts goals" ON public.ielts_goals;
CREATE POLICY "Users own ielts goals" ON public.ielts_goals
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- 8. dMAT tables --------------------------------------------------------
CREATE TABLE IF NOT EXISTS public.dmat_progress (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text NOT NULL,
  topic text,
  progress_pct integer NOT NULL DEFAULT 0 CHECK (progress_pct BETWEEN 0 AND 100),
  difficulty text CHECK (difficulty IN ('easy','medium','hard')),
  confidence integer CHECK (confidence BETWEEN 1 AND 5),
  notes text,
  study_min integer NOT NULL DEFAULT 0,
  updated_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, subject, topic)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dmat_progress TO authenticated;
GRANT ALL ON public.dmat_progress TO service_role;
ALTER TABLE public.dmat_progress ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own dmat progress" ON public.dmat_progress;
CREATE POLICY "Users own dmat progress" ON public.dmat_progress
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.dmat_mock_tests (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('mini','topic','subject','full','previous','adaptive')),
  subject text,
  score numeric(5,2),
  max_score numeric(5,2) NOT NULL DEFAULT 100,
  duration_min integer,
  taken_at timestamptz NOT NULL DEFAULT now(),
  details jsonb NOT NULL DEFAULT '{}'::jsonb
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dmat_mock_tests TO authenticated;
GRANT ALL ON public.dmat_mock_tests TO service_role;
ALTER TABLE public.dmat_mock_tests ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own dmat mocks" ON public.dmat_mock_tests;
CREATE POLICY "Users own dmat mocks" ON public.dmat_mock_tests
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.dmat_registration (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  registered boolean NOT NULL DEFAULT false,
  application_submitted boolean NOT NULL DEFAULT false,
  fee_paid boolean NOT NULL DEFAULT false,
  hall_ticket boolean NOT NULL DEFAULT false,
  exam_center text,
  registration_number text,
  application_date date,
  status text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.dmat_registration TO authenticated;
GRANT ALL ON public.dmat_registration TO service_role;
ALTER TABLE public.dmat_registration ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own dmat reg" ON public.dmat_registration;
CREATE POLICY "Users own dmat reg" ON public.dmat_registration
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- 9. Scholarships / APS / Visa trackers ---------------------------------
CREATE TABLE IF NOT EXISTS public.scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  provider text,
  country text DEFAULT 'Germany',
  amount_eur numeric(10,2),
  deadline date,
  eligibility text,
  requirements text,
  link text,
  tags text[] NOT NULL DEFAULT '{}',
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT ON public.scholarships TO authenticated, anon;
GRANT ALL ON public.scholarships TO service_role;
ALTER TABLE public.scholarships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Anyone reads scholarships" ON public.scholarships;
CREATE POLICY "Anyone reads scholarships" ON public.scholarships
  FOR SELECT USING (true);
DROP POLICY IF EXISTS "Admins manage scholarships" ON public.scholarships;
CREATE POLICY "Admins manage scholarships" ON public.scholarships
  FOR ALL TO authenticated
  USING (public.has_role(auth.uid(),'admin'))
  WITH CHECK (public.has_role(auth.uid(),'admin'));

CREATE TABLE IF NOT EXISTS public.saved_scholarships (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  scholarship_id uuid NOT NULL REFERENCES public.scholarships(id) ON DELETE CASCADE,
  notes text,
  created_at timestamptz NOT NULL DEFAULT now(),
  UNIQUE (user_id, scholarship_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.saved_scholarships TO authenticated;
GRANT ALL ON public.saved_scholarships TO service_role;
ALTER TABLE public.saved_scholarships ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own saved scholarships" ON public.saved_scholarships;
CREATE POLICY "Users own saved scholarships" ON public.saved_scholarships
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.aps_tracker (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'not_started',
  application_date date,
  interview_date date,
  certificate_received date,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.aps_tracker TO authenticated;
GRANT ALL ON public.aps_tracker TO service_role;
ALTER TABLE public.aps_tracker ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own aps" ON public.aps_tracker;
CREATE POLICY "Users own aps" ON public.aps_tracker
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

CREATE TABLE IF NOT EXISTS public.visa_tracker (
  user_id uuid PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  stage text NOT NULL DEFAULT 'not_started',
  appointment_date date,
  appointment_location text,
  interview_date date,
  approval_date date,
  visa_type text,
  documents jsonb NOT NULL DEFAULT '[]'::jsonb,
  checklist jsonb NOT NULL DEFAULT '[]'::jsonb,
  notes text,
  updated_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.visa_tracker TO authenticated;
GRANT ALL ON public.visa_tracker TO service_role;
ALTER TABLE public.visa_tracker ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own visa" ON public.visa_tracker;
CREATE POLICY "Users own visa" ON public.visa_tracker
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);

-- 10. AI documents (SOP / LOR / etc.) ----------------------------------
CREATE TABLE IF NOT EXISTS public.ai_documents (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind text NOT NULL CHECK (kind IN ('sop','lor','motivation','resume_review','project_review','study_plan')),
  title text NOT NULL,
  input jsonb NOT NULL DEFAULT '{}'::jsonb,
  output text NOT NULL,
  created_at timestamptz NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.ai_documents TO authenticated;
GRANT ALL ON public.ai_documents TO service_role;
ALTER TABLE public.ai_documents ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "Users own ai docs" ON public.ai_documents;
CREATE POLICY "Users own ai docs" ON public.ai_documents
  FOR ALL TO authenticated USING (auth.uid()=user_id) WITH CHECK (auth.uid()=user_id);
