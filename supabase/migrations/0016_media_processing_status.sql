-- ─────────────────────────────────────────────────────────────────────────────
-- 0016  Media processing status
-- Adds processing_status to media_assets to support syndication readiness checks (F25)
-- ─────────────────────────────────────────────────────────────────────────────

create type public.media_processing_status as enum ('processing', 'ready', 'failed');

alter table public.media_assets
add column processing_status public.media_processing_status not null default 'ready';
