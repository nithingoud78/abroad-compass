-- Daily Check-in V2 Schema Updates
-- Extends daily_progress with per-skill columns for German, IELTS mock, and dMAT topics.
-- Extends learning_links with subject scoping and user summary.

-- German skill breakdown
ALTER TABLE public.daily_progress
  ADD COLUMN IF NOT EXISTS german_listening_min    INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS german_reading_min      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS german_writing_min      INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS german_speaking_min     INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS german_duolingo_lessons INTEGER NOT NULL DEFAULT 0;

-- IELTS mock and vocab
ALTER TABLE public.daily_progress
  ADD COLUMN IF NOT EXISTS ielts_mock_taken      BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS ielts_mock_listening  NUMERIC,
  ADD COLUMN IF NOT EXISTS ielts_mock_reading    NUMERIC,
  ADD COLUMN IF NOT EXISTS ielts_mock_writing    NUMERIC,
  ADD COLUMN IF NOT EXISTS ielts_mock_speaking   NUMERIC,
  ADD COLUMN IF NOT EXISTS ielts_mock_overall    NUMERIC,
  ADD COLUMN IF NOT EXISTS ielts_vocab_count     INTEGER NOT NULL DEFAULT 0;

-- dMAT topic breakdown
ALTER TABLE public.daily_progress
  ADD COLUMN IF NOT EXISTS dmat_figure_sequence_min INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dmat_math_equations_min  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dmat_latin_squares_min   INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dmat_subject_module_min  INTEGER NOT NULL DEFAULT 0,
  ADD COLUMN IF NOT EXISTS dmat_formula_count       INTEGER NOT NULL DEFAULT 0;

-- Learning links: subject scoping + user summary
ALTER TABLE public.learning_links
  ADD COLUMN IF NOT EXISTS subject      TEXT,
  ADD COLUMN IF NOT EXISTS user_summary TEXT;
