-- Restore tables that were mistakenly dropped during schema drift cleanup because the frontend still queries them.

CREATE TABLE IF NOT EXISTS goethe_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  target_level TEXT DEFAULT 'B2',
  exam_date DATE,
  weekly_goal_hours NUMERIC DEFAULT 5,
  target_readiness INTEGER DEFAULT 80,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE goethe_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goethe_settings' AND policyname = 'Users can view own goethe_settings') THEN
    CREATE POLICY "Users can view own goethe_settings" ON goethe_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goethe_settings' AND policyname = 'Users can insert own goethe_settings') THEN
    CREATE POLICY "Users can insert own goethe_settings" ON goethe_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'goethe_settings' AND policyname = 'Users can update own goethe_settings') THEN
    CREATE POLICY "Users can update own goethe_settings" ON goethe_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS ielts_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  target_overall NUMERIC,
  target_listening NUMERIC,
  target_reading NUMERIC,
  target_writing NUMERIC,
  target_speaking NUMERIC,
  exam_date_lrw DATE,
  exam_date_speaking DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

ALTER TABLE ielts_settings ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ielts_settings' AND policyname = 'Users can view own ielts_settings') THEN
    CREATE POLICY "Users can view own ielts_settings" ON ielts_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ielts_settings' AND policyname = 'Users can insert own ielts_settings') THEN
    CREATE POLICY "Users can insert own ielts_settings" ON ielts_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'ielts_settings' AND policyname = 'Users can update own ielts_settings') THEN
    CREATE POLICY "Users can update own ielts_settings" ON ielts_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

CREATE TABLE IF NOT EXISTS daily_progress (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE NOT NULL,
  checkin_date DATE NOT NULL,
  german_minutes INTEGER DEFAULT 0,
  german_vocab INTEGER DEFAULT 0,
  german_lesson_completed BOOLEAN DEFAULT false,
  ielts_listening_hours NUMERIC DEFAULT 0,
  ielts_reading_hours NUMERIC DEFAULT 0,
  ielts_writing_hours NUMERIC DEFAULT 0,
  ielts_speaking_hours NUMERIC DEFAULT 0,
  testas_topic TEXT,
  testas_hours NUMERIC DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(user_id, checkin_date)
);

ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_progress' AND policyname = 'Users can view own daily_progress') THEN
    CREATE POLICY "Users can view own daily_progress" ON daily_progress FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_progress' AND policyname = 'Users can insert own daily_progress') THEN
    CREATE POLICY "Users can insert own daily_progress" ON daily_progress FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'daily_progress' AND policyname = 'Users can update own daily_progress') THEN
    CREATE POLICY "Users can update own daily_progress" ON daily_progress FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;
