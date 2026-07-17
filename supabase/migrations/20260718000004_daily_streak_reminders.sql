CREATE EXTENSION IF NOT EXISTS pg_cron WITH SCHEMA pg_catalog;

CREATE OR REPLACE FUNCTION process_streak_reminders(reminder_type text) 
RETURNS void AS $$
DECLARE
    u_id uuid;
BEGIN
    FOR u_id IN SELECT user_id FROM public.profiles
    LOOP
        -- Check if today's check-in exists for this user
        IF NOT EXISTS (
            SELECT 1 FROM public.daily_progress 
            WHERE user_id = u_id 
            AND checkin_date = CURRENT_DATE
        ) THEN
            -- Check if this specific reminder was already sent today to avoid duplicates
            IF NOT EXISTS (
                SELECT 1 FROM public.notifications
                WHERE receiver_id = u_id
                AND type = reminder_type
                AND DATE(created_at) = CURRENT_DATE
            ) THEN
                INSERT INTO public.notifications (receiver_id, type)
                VALUES (u_id, reminder_type);
            END IF;
        END IF;
    END LOOP;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- Schedule the reminders (using UTC, times map to 18:00, 21:00, 23:00)
SELECT cron.schedule('streak_reminder_18', '0 18 * * *', $$ SELECT process_streak_reminders('streak_reminder_18'); $$);
SELECT cron.schedule('streak_reminder_21', '0 21 * * *', $$ SELECT process_streak_reminders('streak_reminder_21'); $$);
SELECT cron.schedule('streak_reminder_23', '0 23 * * *', $$ SELECT process_streak_reminders('streak_reminder_23'); $$);
