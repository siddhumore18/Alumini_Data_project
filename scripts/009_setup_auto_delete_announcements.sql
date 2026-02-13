-- ============================================
-- AUTO-DELETE EXPIRED ANNOUNCEMENTS
-- This sets up automatic cleanup of expired announcements
-- ============================================

-- Function already created in 008_create_admin_system.sql
-- This script adds a scheduled job (if using pg_cron extension)

-- Option 1: Manual cleanup (run this periodically)
-- SELECT public.delete_expired_announcements();

-- Option 2: Set up pg_cron (if available in your Supabase plan)
-- Uncomment the following if pg_cron is enabled:

/*
-- Schedule to run every hour
SELECT cron.schedule(
  'delete-expired-announcements',
  '0 * * * *', -- Every hour
  $$SELECT public.delete_expired_announcements()$$
);
*/

-- Option 3: Create a trigger that marks announcements as inactive when expired
-- This is more efficient than deleting
CREATE OR REPLACE FUNCTION public.mark_expired_announcements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  UPDATE public.announcements
  SET is_active = false
  WHERE expires_at IS NOT NULL 
    AND expires_at < now()
    AND is_active = true;
END;
$$;

-- You can call this function manually or set up a cron job
-- SELECT public.mark_expired_announcements();

-- ============================================
-- RECOMMENDED: Use the mark_expired_announcements function
-- It's better to mark as inactive rather than delete
-- This preserves history for admin review
-- ============================================

