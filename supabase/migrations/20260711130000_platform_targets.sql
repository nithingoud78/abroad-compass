-- Create platform targets, IELTS settings, dMAT settings, admin schedule, and daily progress tables

CREATE TABLE IF NOT EXISTS targets (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  german_level TEXT,
  german_date DATE,
  budget_savings NUMERIC,
  budget_blocked_account NUMERIC,
  budget_monthly NUMERIC,
  uni_dream TEXT,
  uni_intake_season TEXT,
  uni_intake_year TEXT,
  uni_app_count INTEGER,
  uni_acc_count INTEGER,
  timeline_passport_date DATE,
  timeline_aps_date DATE,
  timeline_visa_date DATE,
  timeline_accommodation_date DATE,
  timeline_flight_date DATE,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

CREATE TABLE IF NOT EXISTS dmat_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE UNIQUE NOT NULL,
  target_score INTEGER,
  user_exam_date DATE,
  user_exam_session TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE TABLE IF NOT EXISTS admin_exam_schedule (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  registration_opens DATE,
  registration_closes DATE,
  exam_date DATE,
  result_date DATE,
  exam_fee NUMERIC,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

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

-- Enable RLS
ALTER TABLE targets ENABLE ROW LEVEL SECURITY;
ALTER TABLE ielts_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE dmat_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE admin_exam_schedule ENABLE ROW LEVEL SECURITY;
ALTER TABLE daily_progress ENABLE ROW LEVEL SECURITY;

-- targets policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'targets' AND policyname = 'Users can view own targets') THEN
    CREATE POLICY "Users can view own targets" ON targets FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'targets' AND policyname = 'Users can insert own targets') THEN
    CREATE POLICY "Users can insert own targets" ON targets FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'targets' AND policyname = 'Users can update own targets') THEN
    CREATE POLICY "Users can update own targets" ON targets FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- ielts_settings policies
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

-- dmat_settings policies
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dmat_settings' AND policyname = 'Users can view own dmat_settings') THEN
    CREATE POLICY "Users can view own dmat_settings" ON dmat_settings FOR SELECT USING (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dmat_settings' AND policyname = 'Users can insert own dmat_settings') THEN
    CREATE POLICY "Users can insert own dmat_settings" ON dmat_settings FOR INSERT WITH CHECK (auth.uid() = user_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'dmat_settings' AND policyname = 'Users can update own dmat_settings') THEN
    CREATE POLICY "Users can update own dmat_settings" ON dmat_settings FOR UPDATE USING (auth.uid() = user_id);
  END IF;
END $$;

-- admin_exam_schedule policies (open read, admin write via user_roles table)
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_exam_schedule' AND policyname = 'Anyone can view admin_exam_schedule') THEN
    CREATE POLICY "Anyone can view admin_exam_schedule" ON admin_exam_schedule FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_exam_schedule' AND policyname = 'Admins can insert admin_exam_schedule') THEN
    CREATE POLICY "Admins can insert admin_exam_schedule" ON admin_exam_schedule FOR INSERT
      WITH CHECK (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'admin_exam_schedule' AND policyname = 'Admins can update admin_exam_schedule') THEN
    CREATE POLICY "Admins can update admin_exam_schedule" ON admin_exam_schedule FOR UPDATE
      USING (EXISTS (SELECT 1 FROM user_roles WHERE user_id = auth.uid() AND role = 'admin'));
  END IF;
END $$;

-- daily_progress policies
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
