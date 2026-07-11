
-- ============ HABITS ============
CREATE TABLE public.habits (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  icon TEXT,
  color TEXT DEFAULT '#6366f1',
  cadence TEXT NOT NULL DEFAULT 'daily', -- daily | weekly | custom
  target_per_period INTEGER NOT NULL DEFAULT 1,
  category TEXT, -- language | study | wellness | admin
  current_streak INTEGER NOT NULL DEFAULT 0,
  longest_streak INTEGER NOT NULL DEFAULT 0,
  last_completed_on DATE,
  archived_at TIMESTAMPTZ,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habits TO authenticated;
GRANT ALL ON public.habits TO service_role;
ALTER TABLE public.habits ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habits" ON public.habits FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER habits_updated BEFORE UPDATE ON public.habits FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

CREATE TABLE public.habit_completions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  habit_id UUID NOT NULL REFERENCES public.habits(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  completed_on DATE NOT NULL DEFAULT CURRENT_DATE,
  count INTEGER NOT NULL DEFAULT 1,
  note TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (habit_id, completed_on)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.habit_completions TO authenticated;
GRANT ALL ON public.habit_completions TO service_role;
ALTER TABLE public.habit_completions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own habit completions" ON public.habit_completions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX habit_completions_habit_idx ON public.habit_completions(habit_id, completed_on DESC);

-- ============ FOCUS SESSIONS (Pomodoro/Focus Mode logs) ============
CREATE TABLE public.focus_sessions (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mode TEXT NOT NULL DEFAULT 'pomodoro', -- pomodoro | deep | german | custom
  task_id UUID REFERENCES public.tasks(id) ON DELETE SET NULL,
  label TEXT,
  planned_minutes INTEGER NOT NULL,
  actual_minutes INTEGER NOT NULL DEFAULT 0,
  started_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  ended_at TIMESTAMPTZ,
  interrupted BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.focus_sessions TO authenticated;
GRANT ALL ON public.focus_sessions TO service_role;
ALTER TABLE public.focus_sessions ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own focus sessions" ON public.focus_sessions FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE INDEX focus_sessions_user_idx ON public.focus_sessions(user_id, started_at DESC);

-- ============ BLOG ============
CREATE TABLE public.blog_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  slug TEXT NOT NULL UNIQUE,
  title TEXT NOT NULL,
  excerpt TEXT NOT NULL,
  body_md TEXT NOT NULL,
  category TEXT NOT NULL DEFAULT 'general', -- germany | university | visa | aps | german | sop | lor | budget | general
  tags TEXT[] NOT NULL DEFAULT '{}',
  cover_url TEXT,
  reading_minutes INTEGER NOT NULL DEFAULT 5,
  author_name TEXT NOT NULL DEFAULT 'Abroad Compass',
  published_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  is_published BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT ON public.blog_posts TO anon, authenticated;
GRANT ALL ON public.blog_posts TO service_role;
ALTER TABLE public.blog_posts ENABLE ROW LEVEL SECURITY;
CREATE POLICY "published blog readable by anyone" ON public.blog_posts FOR SELECT USING (is_published = true);
CREATE TRIGGER blog_posts_updated BEFORE UPDATE ON public.blog_posts FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX blog_posts_published_idx ON public.blog_posts(published_at DESC) WHERE is_published;
CREATE INDEX blog_posts_category_idx ON public.blog_posts(category);

CREATE TABLE public.blog_bookmarks (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, post_id)
);
GRANT SELECT, INSERT, DELETE ON public.blog_bookmarks TO authenticated;
GRANT ALL ON public.blog_bookmarks TO service_role;
ALTER TABLE public.blog_bookmarks ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own bookmarks" ON public.blog_bookmarks FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

CREATE TABLE public.blog_reading_progress (
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  post_id UUID NOT NULL REFERENCES public.blog_posts(id) ON DELETE CASCADE,
  progress NUMERIC NOT NULL DEFAULT 0, -- 0..1
  completed BOOLEAN NOT NULL DEFAULT false,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  PRIMARY KEY (user_id, post_id)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.blog_reading_progress TO authenticated;
GRANT ALL ON public.blog_reading_progress TO service_role;
ALTER TABLE public.blog_reading_progress ENABLE ROW LEVEL SECURITY;
CREATE POLICY "own reading progress" ON public.blog_reading_progress FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE TRIGGER blog_reading_progress_updated BEFORE UPDATE ON public.blog_reading_progress FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

-- ============ FEEDBACK ============
CREATE TABLE public.feedback_items (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'feature', -- feature | bug | suggestion | rating
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'open', -- open | planned | in_progress | shipped | wont_do
  priority TEXT NOT NULL DEFAULT 'normal', -- low | normal | high
  rating INTEGER,
  vote_count INTEGER NOT NULL DEFAULT 0,
  attachments JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.feedback_items TO authenticated;
GRANT ALL ON public.feedback_items TO service_role;
ALTER TABLE public.feedback_items ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read all feedback" ON public.feedback_items FOR SELECT TO authenticated USING (true);
CREATE POLICY "create own feedback" ON public.feedback_items FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "edit own feedback" ON public.feedback_items FOR UPDATE TO authenticated USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);
CREATE POLICY "delete own feedback" ON public.feedback_items FOR DELETE TO authenticated USING (auth.uid() = user_id);
CREATE TRIGGER feedback_items_updated BEFORE UPDATE ON public.feedback_items FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();
CREATE INDEX feedback_items_status_idx ON public.feedback_items(status, vote_count DESC);

CREATE TABLE public.feedback_votes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  item_id UUID NOT NULL REFERENCES public.feedback_items(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE (user_id, item_id)
);
GRANT SELECT, INSERT, DELETE ON public.feedback_votes TO authenticated;
GRANT ALL ON public.feedback_votes TO service_role;
ALTER TABLE public.feedback_votes ENABLE ROW LEVEL SECURITY;
CREATE POLICY "read votes" ON public.feedback_votes FOR SELECT TO authenticated USING (true);
CREATE POLICY "own vote insert" ON public.feedback_votes FOR INSERT TO authenticated WITH CHECK (auth.uid() = user_id);
CREATE POLICY "own vote delete" ON public.feedback_votes FOR DELETE TO authenticated USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.sync_feedback_vote_count() RETURNS TRIGGER
LANGUAGE plpgsql SECURITY DEFINER SET search_path = public AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.feedback_items SET vote_count = vote_count + 1 WHERE id = NEW.item_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.feedback_items SET vote_count = GREATEST(vote_count - 1, 0) WHERE id = OLD.item_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END; $$;
CREATE TRIGGER feedback_votes_count_ins AFTER INSERT ON public.feedback_votes FOR EACH ROW EXECUTE FUNCTION public.sync_feedback_vote_count();
CREATE TRIGGER feedback_votes_count_del AFTER DELETE ON public.feedback_votes FOR EACH ROW EXECUTE FUNCTION public.sync_feedback_vote_count();

-- ============ BLOG SEED ============
INSERT INTO public.blog_posts (slug, title, excerpt, body_md, category, tags, reading_minutes) VALUES
('germany-study-abroad-101',
 'Study in Germany: The 2026 Beginner''s Roadmap',
 'From choosing a program to landing at Frankfurt airport — a complete 12-month roadmap for international master''s applicants.',
 E'# Study in Germany: The 2026 Beginner''s Roadmap\n\nGermany remains one of the most affordable, high-quality study destinations in the world. Public universities charge little to no tuition, and a master''s degree opens up an 18-month post-study work visa.\n\n## The 12-month timeline\n\n1. **Month 1–2** — Shortlist programs on DAAD and uni-assist.\n2. **Month 3–4** — Take IELTS/TOEFL and start APS if required.\n3. **Month 5–6** — Draft SOP, request LORs, prepare transcripts.\n4. **Month 7–8** — Submit applications via uni-assist.\n5. **Month 9–10** — Open blocked account, apply for visa.\n6. **Month 11–12** — Book flight, find housing, register at Bürgeramt.\n\n## Cost breakdown\n\n- Blocked account: €11,904 / year\n- Health insurance: ~€125 / month\n- Rent (WG room): €350–€600\n- Groceries: €200 / month\n\nUse Abroad Compass **Budget** to plan monthly expenses down to the euro.',
 'germany', ARRAY['roadmap','master','planning'], 9),

('uni-assist-explained',
 'uni-assist Explained: When You Need It and How to Apply',
 'A step-by-step guide to Germany''s centralised university application clearinghouse.',
 E'# uni-assist Explained\n\n**uni-assist** is a centralised service that pre-checks international applications for ~180 German universities.\n\n## Do I need uni-assist?\nCheck the target program page. If it says "apply via uni-assist" — you do.\n\n## Documents to prepare\n- Certified transcripts (German or English)\n- Degree certificate\n- Language proof (IELTS/TOEFL/DSH/TestDaF)\n- Passport copy\n- CV in Europass format\n\n## Fees\n€75 for the first program, €30 for each additional in the same semester.',
 'university', ARRAY['uni-assist','application'], 6),

('aps-certificate-guide',
 'APS Certificate: Everything Indian, Chinese and Vietnamese Applicants Need',
 'APS is mandatory for many nationalities. Here''s how to get it without missing the intake.',
 E'# APS Certificate Guide\n\nAPS (Akademische Prüfstelle) verifies your academic documents. It is **mandatory** for applicants from India, China, Vietnam, Mongolia and a growing list of countries.\n\n## Timeline\nExpect **6–8 weeks** end-to-end. Start early.\n\n## Documents\n- Passport\n- 10th/12th marksheets\n- Bachelor''s transcripts (all semesters)\n- Degree certificate\n- Provisional certificate if degree not yet issued\n- Migration certificate\n\n## Fees\n₹18,000 (India, individual APS). Interview may be required.',
 'aps', ARRAY['aps','india','china','vietnam'], 7),

('german-visa-checklist',
 'German Student Visa Checklist (Post-2025)',
 'The exact document set the German embassy expects — checked against 2025 rejection reasons.',
 E'# German Student Visa Checklist\n\n## Mandatory documents\n- Valid passport (>= 12 months validity)\n- 2 biometric photos\n- Admission letter (Zulassungsbescheid)\n- Blocked account confirmation (€11,904)\n- Health insurance (travel + student)\n- APS certificate (if required for your country)\n- Motivation letter\n- CV\n- All academic certificates\n- IELTS / TOEFL / German language proof\n- Visa fee: €75\n\n## Common rejection reasons\n1. Weak SOP — sounds copy-pasted\n2. Insufficient funds\n3. Language proof mismatch with program\n4. No clear return intention (mention career plan)\n5. Gap-year justifications missing',
 'visa', ARRAY['visa','embassy'], 8),

('blocked-account-comparison',
 'Blocked Account 2026: Expatrio vs Fintiba vs Coracle',
 'Compare fees, opening speed and refund policy for the three largest blocked-account providers.',
 E'# Blocked Account Comparison\n\n| Provider | Opening fee | Monthly fee | Speed |\n|----------|-------------|-------------|-------|\n| Expatrio | €49 | €5 | 1–3 days |\n| Fintiba  | €89 | €4.90 | 1–2 days |\n| Coracle  | €99 | €0 | 3–5 days |\n\nAll three are accepted by German embassies. Choose based on your bundling needs (some include health insurance).',
 'visa', ARRAY['blocked-account','fintiba','expatrio'], 5),

('german-a1-to-b2',
 'German A1 to B2 in 9 Months: A Realistic Study Plan',
 'A daily plan combining Goethe curriculum, YouTube, apps and 30-minute conversation practice.',
 E'# German A1 → B2 in 9 Months\n\n## Weekly structure\n- 5 hrs Goethe workbook\n- 3 hrs listening (Easy German)\n- 2 hrs vocab (Anki + Abroad Compass **Vocabulary**)\n- 1 hr conversation (Tandem / italki)\n\n## Milestones\n- Month 3: A1 exam\n- Month 6: A2 exam\n- Month 9: B1 exam\n- Month 12+: B2\n\nUse Abroad Compass **German Journey** to track modules and streaks.',
 'german', ARRAY['a1','b1','b2','goethe'], 10),

('sop-that-gets-you-in',
 'The SOP Structure That Gets You Into TU Munich',
 'A proven 5-part SOP structure with word counts and examples.',
 E'# The SOP That Gets You Into TU Munich\n\n**Structure (900 words):**\n1. Hook (100) — a specific technical problem you care about\n2. Academic journey (250) — projects, grades, research\n3. Professional experience (200) — impact with metrics\n4. Why this program, why Germany (250) — cite courses & profs\n5. Career vision (100) — 5-year plan\n\nAvoid: childhood stories, generic motivation, adjectives like "passionate".',
 'sop', ARRAY['sop','tu-munich','writing'], 9),

('lor-that-works',
 'Letters of Recommendation That Actually Help',
 'How to brief your professor or manager so the LOR sounds specific and credible.',
 E'# LORs That Actually Help\n\n## Give your recommender\n- Your CV\n- Draft SOP\n- Program page\n- Bullet list of the 3–4 stories you''d like referenced\n- Word count: 350–500\n\n## Good LOR openings\n> "I supervised X during her final-year project on distributed systems, where she designed…"\n\n## Bad openings\n> "X is a hardworking student with a positive attitude." (says nothing)',
 'lor', ARRAY['lor','professor'], 6);
