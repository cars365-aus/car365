-- Enable pg_cron extension if it's not already enabled
create extension if not exists pg_cron with schema extensions;

-- Create a cron job to archive leads older than 90 days.
-- This preserves auditability and chat history better than a blind delete.
-- This runs daily at midnight (0 0 * * *)
select cron.schedule(
  'archive-expired-leads',
  '0 0 * * *',
  $$ select * from app_private.archive_old_leads(90); $$
);
