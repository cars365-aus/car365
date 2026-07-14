create table public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  body text not null,
  excerpt text,
  featured_image_url text,
  featured_image_alt text,
  category_id uuid references public.blog_categories(id) on delete set null,
  status text not null default 'draft',
  meta_title text,
  meta_description text,
  reading_time_minutes integer default 0,
  published_at timestamptz,
  updated_at timestamptz not null default now(),
  created_at timestamptz not null default now(),
  source text not null default 'manual',
  topic_key text unique,
  primary_keyword text,
  tags text[] default array[]::text[]
);

create index idx_blog_articles_published on public.blog_articles(status, published_at desc);

alter table public.blog_articles enable row level security;

create policy "blog_articles public read published" on public.blog_articles
for select using (status = 'published' or app_private.is_staff());

create policy "blog_articles staff manage" on public.blog_articles
for all using (app_private.is_staff()) with check (app_private.is_staff());

-- Drop the old table and its policies
drop policy if exists "blog_posts public read published" on public.blog_posts;
drop policy if exists "blog_posts staff manage" on public.blog_posts;
drop table if exists public.blog_posts;
