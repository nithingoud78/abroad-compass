-- Add optional social profiles to the profiles table
ALTER TABLE public.profiles
  ADD COLUMN instagram_username VARCHAR(100),
  ADD COLUMN github_username VARCHAR(100),
  ADD COLUMN linkedin_username VARCHAR(100);
