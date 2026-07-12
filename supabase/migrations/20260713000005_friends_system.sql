CREATE TABLE IF NOT EXISTS followers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  follower_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  following_id UUID REFERENCES profiles(user_id) ON DELETE CASCADE NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(follower_id, following_id)
);

-- Enable RLS
ALTER TABLE followers ENABLE ROW LEVEL SECURITY;

DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'followers' AND policyname = 'Anyone can view followers') THEN
    CREATE POLICY "Anyone can view followers" ON followers FOR SELECT USING (true);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'followers' AND policyname = 'Users can follow others') THEN
    CREATE POLICY "Users can follow others" ON followers FOR INSERT WITH CHECK (auth.uid() = follower_id);
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_policies WHERE tablename = 'followers' AND policyname = 'Users can unfollow others') THEN
    CREATE POLICY "Users can unfollow others" ON followers FOR DELETE USING (auth.uid() = follower_id);
  END IF;
END $$;
