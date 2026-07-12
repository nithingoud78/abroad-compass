CREATE OR REPLACE FUNCTION get_admin_analytics()
RETURNS json
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  result json;
BEGIN
  SELECT json_build_object(
    'totalUsers', (SELECT count(*) FROM auth.users),
    'dau', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= current_date),
    'wau', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= (current_date - interval '7 days')),
    'mau', (SELECT count(*) FROM auth.users WHERE last_sign_in_at >= (current_date - interval '30 days')),
    'aiRequests', (SELECT count(*) FROM public.ai_usage),
    'ocrRequests', (SELECT count(*) FROM public.document_reviews),
    'germanChecks', (SELECT count(*) FROM public.daily_checkins),
    'ieltsSessions', (SELECT count(*) FROM public.ielts_practice),
    'dmatSessions', (SELECT count(*) FROM public.dmat_mock_tests),
    'uniSearches', (SELECT count(*) FROM public.search_history),
    'feedbackCount', (SELECT count(*) FROM public.feedback_items),
    'blogPublished', (SELECT count(*) FROM public.blog_posts WHERE is_published = true),
    'notificationsSent', (SELECT count(*) FROM public.notifications)
  ) INTO result;
  
  RETURN result;
END;
$$;
