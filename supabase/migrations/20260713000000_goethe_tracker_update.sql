-- Add Goethe specific tracking columns to daily_progress
ALTER TABLE daily_progress 
  ADD COLUMN IF NOT EXISTS goethe_reading_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goethe_listening_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goethe_writing_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goethe_speaking_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goethe_grammar_hours NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS goethe_vocab_hours NUMERIC DEFAULT 0;
