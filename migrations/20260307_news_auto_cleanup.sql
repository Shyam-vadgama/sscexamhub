-- =============================================================================
-- Migration: News Auto-Cleanup System
-- Description: Adds a Supabase-native pg_cron job that automatically deletes
--              news records older than 24 hours every hour. Removes reliance
--              on GitHub Actions for cleanup logic.
-- Apply via: Supabase Dashboard → SQL Editor → Run
-- =============================================================================

-- Step 1: Add an index on created_at for fast time-based deletes
-- (pub_date index already exists; this targets the actual insertion time)
CREATE INDEX IF NOT EXISTS news_created_at_idx ON public.news(created_at DESC);

-- =============================================================================
-- Step 2: Create the cleanup function
-- Deletes any news row inserted more than 24 hours ago.
-- Uses created_at (DB insertion time) — NOT pub_date (article publish time).
-- =============================================================================
CREATE OR REPLACE FUNCTION delete_old_news()
RETURNS void
LANGUAGE sql
SECURITY DEFINER
AS $$
  DELETE FROM public.news
  WHERE created_at < NOW() - INTERVAL '24 hours';
$$;

-- Grant execute permission to postgres role (used by pg_cron)
GRANT EXECUTE ON FUNCTION delete_old_news() TO postgres;

-- =============================================================================
-- Step 3: Schedule the cleanup job with pg_cron
-- Runs at the top of every hour: '0 * * * *'
-- Requires pg_cron extension to be enabled in Supabase:
--   Dashboard → Database → Extensions → pg_cron → Enable
--
-- If the job already exists (re-running this migration), unschedule it first
-- to avoid duplicate cron entries.
-- =============================================================================

-- Remove existing job with this name if it exists (idempotent re-run safety)
SELECT cron.unschedule('delete-old-news')
WHERE EXISTS (
  SELECT 1 FROM cron.job WHERE jobname = 'delete-old-news'
);

-- Schedule the new job: every hour on the hour
SELECT cron.schedule(
  'delete-old-news',        -- job name (unique identifier)
  '0 * * * *',              -- cron expression: every hour at :00
  $$ SELECT delete_old_news(); $$
);

-- =============================================================================
-- Verification queries (run these after applying to confirm setup)
-- =============================================================================
-- Check the job was created:
--   SELECT * FROM cron.job WHERE jobname = 'delete-old-news';
--
-- Check job run history (after first execution):
--   SELECT * FROM cron.job_run_details WHERE jobid = (
--     SELECT jobid FROM cron.job WHERE jobname = 'delete-old-news'
--   ) ORDER BY start_time DESC LIMIT 10;
--
-- Manually test the function:
--   SELECT delete_old_news();
--   SELECT COUNT(*) FROM public.news WHERE created_at < NOW() - INTERVAL '24 hours';
-- =============================================================================
