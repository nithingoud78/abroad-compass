
CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger LANGUAGE plpgsql SET search_path = public AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$;

CREATE TABLE public.universities (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  name text not null,
  country text default 'Germany',
  state text,
  city text,
  qs_ranking integer,
  course text,
  course_duration_months integer,
  ects_required integer,
  cgpa_required numeric(4,2),
  english_requirement text,
  german_requirement text,
  application_fee_eur numeric(10,2),
  tuition_fee_eur numeric(10,2),
  semester_fee_eur numeric(10,2),
  living_cost_eur numeric(10,2),
  public_private text check (public_private in ('Public','Private')),
  internship boolean default false,
  part_time boolean default false,
  estimated_earnings_eur numeric(10,2),
  scholarship boolean default false,
  aps_required boolean default true,
  uni_assist boolean default false,
  winter boolean default true,
  summer boolean default false,
  deadline date,
  website text,
  notes text,
  application_status text default 'planning' check (application_status in ('planning','preparing','applied','accepted','rejected','waitlisted','withdrawn')),
  acceptance_chance text check (acceptance_chance in ('very_high','high','medium','low','very_low')),
  admission_decision text,
  priority text default 'medium' check (priority in ('low','medium','high')),
  color_tag text,
  pinned boolean default false,
  favourite boolean default false,
  required_subjects text[],
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

GRANT SELECT, INSERT, UPDATE, DELETE ON public.universities TO authenticated;
GRANT ALL ON public.universities TO service_role;

ALTER TABLE public.universities ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users manage their own universities"
  ON public.universities FOR ALL
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

CREATE INDEX universities_user_idx ON public.universities(user_id);
CREATE INDEX universities_deadline_idx ON public.universities(user_id, deadline);

CREATE TRIGGER universities_set_updated_at
  BEFORE UPDATE ON public.universities
  FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
