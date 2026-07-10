-- ─────────────────────────────────────────────────────────────────────────────
-- 0006  Content: testimonials, FAQs, blog, and CMS pages (SRS §9.16–9.19)
-- Testimonials are admin-entered (no customer-submitted reviews in this product).
-- ─────────────────────────────────────────────────────────────────────────────

create table public.testimonials (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  photo_media_id uuid references public.media_assets(id),
  vehicle_id uuid references public.vehicles(id) on delete set null,
  rating integer not null check (rating between 1 and 5),
  quote text not null,
  source public.testimonial_source not null default 'direct',
  review_date date,
  is_approved boolean not null default false,
  sort_order integer not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_testimonials_approved on public.testimonials(is_approved, sort_order);

create table public.faqs (
  id uuid primary key default gen_random_uuid(),
  category text not null,
  question text not null,
  answer text not null,
  sort_order integer not null default 0,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_faqs_published on public.faqs(is_published, category, sort_order);

create table public.blog_categories (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  slug text not null unique,
  created_at timestamptz not null default now()
);

create table public.blog_posts (
  id uuid primary key default gen_random_uuid(),
  title text not null,
  slug text not null unique,
  category_id uuid references public.blog_categories(id),
  author_id uuid references public.profiles(id),
  cover_media_id uuid references public.media_assets(id),
  excerpt text,
  -- Sanitized HTML string (matches the existing AI blog pipeline, which emits
  -- HTML rather than block JSON — see src/lib/blog/sanitize-html.ts).
  body text not null default '',
  status public.blog_status not null default 'draft',
  published_at timestamptz,
  seo_title text,
  seo_description text,
  reading_minutes integer,
  -- Dedup key for the daily-generation cron (one post per topic).
  topic_key text unique,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create index idx_blog_posts_published on public.blog_posts(status, published_at desc);

-- CMS static pages. Used for legally-editable long-form docs (privacy/terms);
-- other static page layouts are hardcoded React.
create table public.pages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  blocks jsonb not null default '[]'::jsonb,
  seo_title text,
  seo_description text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- ── RLS ─────────────────────────────────────────────────────────────────────
alter table public.testimonials enable row level security;
alter table public.faqs enable row level security;
alter table public.blog_categories enable row level security;
alter table public.blog_posts enable row level security;
alter table public.pages enable row level security;

create policy "testimonials public read approved" on public.testimonials
for select using (is_approved or app_private.is_staff());
create policy "testimonials staff manage" on public.testimonials
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "faqs public read published" on public.faqs
for select using (is_published or app_private.is_staff());
create policy "faqs staff manage" on public.faqs
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "blog_categories public read" on public.blog_categories
for select using (true);
create policy "blog_categories staff manage" on public.blog_categories
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "blog_posts public read published" on public.blog_posts
for select using (status = 'published' or app_private.is_staff());
create policy "blog_posts staff manage" on public.blog_posts
for all using (app_private.is_staff()) with check (app_private.is_staff());

create policy "pages public read published" on public.pages
for select using (is_published or app_private.is_staff());
create policy "pages staff manage" on public.pages
for all using (app_private.is_staff()) with check (app_private.is_staff());
