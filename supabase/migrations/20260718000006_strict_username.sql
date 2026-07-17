-- 1. Ensure new users inherit their username from metadata during signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  INSERT INTO public.profiles (user_id, display_name, username)
  VALUES (
    NEW.id, 
    COALESCE(NEW.raw_user_meta_data->>'display_name', split_part(NEW.email, '@', 1)),
    NEW.raw_user_meta_data->>'username'
  )
  ON CONFLICT (user_id) DO NOTHING;
  
  INSERT INTO public.streaks (user_id) VALUES (NEW.id)
  ON CONFLICT (user_id) DO NOTHING;
  
  RETURN NEW;
END;
$$;

-- 2. Enforce strict non-empty usernames at the database level for all future inserts and updates
-- Using NOT VALID means existing legacy accounts with NULL usernames won't block the migration.
-- However, any UPDATE to those accounts (or new INSERTS) MUST satisfy this constraint.
ALTER TABLE public.profiles 
  ADD CONSTRAINT username_not_empty 
  CHECK (username IS NOT NULL AND length(trim(username)) >= 3) NOT VALID;
