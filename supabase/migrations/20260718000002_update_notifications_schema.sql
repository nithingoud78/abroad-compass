-- Rename user_id to receiver_id
ALTER TABLE public.notifications RENAME COLUMN user_id TO receiver_id;

-- Add sender_id and profile_id
ALTER TABLE public.notifications ADD COLUMN sender_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;
ALTER TABLE public.notifications ADD COLUMN profile_id UUID REFERENCES public.profiles(user_id) ON DELETE CASCADE;

-- Drop old columns
ALTER TABLE public.notifications DROP COLUMN IF EXISTS title;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS message;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS action_link;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS body;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS link;
ALTER TABLE public.notifications DROP COLUMN IF EXISTS read_at;

-- Re-create policies for correctness
DROP POLICY IF EXISTS "Users can view their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can insert their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can update their own notifications" ON public.notifications;
DROP POLICY IF EXISTS "Users can delete their own notifications" ON public.notifications;

CREATE POLICY "Users can view their own notifications" 
    ON public.notifications FOR SELECT 
    USING (auth.uid() = receiver_id);

CREATE POLICY "Users can insert notifications" 
    ON public.notifications FOR INSERT 
    WITH CHECK (auth.uid() = sender_id);

CREATE POLICY "Users can update their own notifications" 
    ON public.notifications FOR UPDATE 
    USING (auth.uid() = receiver_id);

CREATE POLICY "Users can delete their own notifications" 
    ON public.notifications FOR DELETE 
    USING (auth.uid() = receiver_id);
