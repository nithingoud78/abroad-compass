-- Drop tables that have been superseded by 'targets', 'daily_checkins', and 'study_buddies'
-- This cleans up schema drift and removes conflicting logic from the database.

drop table if exists public.followers cascade;
drop table if exists public.daily_progress cascade;
drop table if exists public.goethe_settings cascade;
drop table if exists public.ielts_settings cascade;
drop table if exists public.ai_user_settings cascade;
