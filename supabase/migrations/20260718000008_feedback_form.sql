-- Migration: Add name and email to feedback_items, and make feedback private

ALTER TABLE public.feedback_items
  ADD COLUMN IF NOT EXISTS name TEXT,
  ADD COLUMN IF NOT EXISTS email TEXT;

-- Drop the public read access policy
DROP POLICY IF EXISTS "read all feedback" ON public.feedback_items;

-- Create a policy so users can only read their own feedback
CREATE POLICY "read own feedback" ON public.feedback_items 
  FOR SELECT TO authenticated 
  USING (auth.uid() = user_id);

-- (Admins retain access through the existing "Admins manage feedback" policy)
