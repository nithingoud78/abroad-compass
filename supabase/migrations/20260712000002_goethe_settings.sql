-- Goethe / TELC exam preparation settings per user

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
