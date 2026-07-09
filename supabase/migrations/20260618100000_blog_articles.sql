-- Blog articles and categories for the daily SEO blog bot.

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.blog_articles (
  id uuid primary key default gen_random_uuid(),
  title text not null check (char_length(title) <= 150),
  slug text not null unique check (char_length(slug) <= 180),
  body text not null,
  excerpt text not null check (char_length(excerpt) <= 300),
  featured_image_url text,
  featured_image_alt text,
  category_id uuid references public.blog_categories(id) on delete set null,
  status text not null default 'draft' check (status in ('draft', 'published', 'archived')),
  meta_title text check (meta_title is null or char_length(meta_title) <= 70),
  meta_description text check (meta_description is null or char_length(meta_description) <= 160),
  reading_time_minutes integer not null default 1 check (reading_time_minutes >= 1),
  published_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  source text not null default 'manual' check (source in ('auto_bot', 'manual')),
  topic_key text,
  primary_keyword text,
  tags text[] not null default '{}'
);

create index idx_blog_articles_status_published on public.blog_articles (status, published_at desc);
create index idx_blog_articles_topic_key on public.blog_articles (topic_key);
create index idx_blog_articles_source_published on public.blog_articles (source, published_at desc);

alter table public.blog_categories enable row level security;
alter table public.blog_articles enable row level security;

create policy "public read blog categories"
  on public.blog_categories for select
  using (true);

create policy "public read published blog articles"
  on public.blog_articles for select
  using (status = 'published');

create policy "admins read all blog articles"
  on public.blog_articles for select
  using (app_private.is_platform_admin());

insert into public.blog_categories (name, slug) values
  ('Road Trip Guides', 'road-trip-guides'),
  ('Car Rental Tips', 'car-rental-tips'),
  ('City Guides', 'city-guides'),
  ('Driving Advice', 'driving-advice'),
  ('Travel Planning', 'travel-planning'),
  ('Vehicle Guides', 'vehicle-guides')
on conflict (slug) do nothing;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('blog-images', 'blog-images', true, 5242880, array['image/jpeg', 'image/png', 'image/webp'])
on conflict (id) do nothing;

create policy "public read blog images"
  on storage.objects for select
  using (bucket_id = 'blog-images');
