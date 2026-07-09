-- Prevent duplicate auto-bot publishes on the same UTC day (race-condition guard).

create unique index if not exists idx_blog_auto_bot_one_per_utc_day
  on public.blog_articles (
    source,
    ((published_at at time zone 'UTC')::date)
  )
  where source = 'auto_bot' and status = 'published' and published_at is not null;
