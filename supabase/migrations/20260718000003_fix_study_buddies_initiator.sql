-- Add an initiator_id to explicitly track who sent the request
ALTER TABLE public.study_buddies ADD COLUMN initiator_id uuid REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Backfill existing data assuming user_id_1 was the initiator
UPDATE public.study_buddies SET initiator_id = user_id_1 WHERE initiator_id IS NULL;

-- Make it required
ALTER TABLE public.study_buddies ALTER COLUMN initiator_id SET NOT NULL;
