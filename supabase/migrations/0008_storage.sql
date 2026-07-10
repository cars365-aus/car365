-- ─────────────────────────────────────────────────────────────────────────────
-- 0008  Storage buckets
--   media            — public read (vehicle photos, blog covers, testimonial
--                      photos, make logos), folder-prefixed; staff write.
--   lead-attachments — private (sell-your-car / trade-in photo uploads);
--                      written via signed URLs, read staff-only.
-- ─────────────────────────────────────────────────────────────────────────────

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values
  ('media', 'media', true, 10485760,
   array['image/jpeg', 'image/png', 'image/webp', 'image/avif']),
  ('lead-attachments', 'lead-attachments', false, 8388608,
   array['image/jpeg', 'image/png', 'image/webp', 'image/heic'])
on conflict (id) do nothing;

-- Public bucket: anyone reads; only staff mutate.
create policy "media public read" on storage.objects
for select using (bucket_id = 'media');

create policy "media staff write" on storage.objects
for insert to authenticated
with check (bucket_id = 'media' and app_private.is_staff());

create policy "media staff update" on storage.objects
for update to authenticated
using (bucket_id = 'media' and app_private.is_staff())
with check (bucket_id = 'media' and app_private.is_staff());

create policy "media staff delete" on storage.objects
for delete to authenticated
using (bucket_id = 'media' and app_private.is_staff());

-- Private lead attachments: staff-only read/manage. Buyer uploads use short-lived
-- signed upload URLs minted server-side, so no anon policy is needed here.
create policy "lead attachments staff read" on storage.objects
for select to authenticated
using (bucket_id = 'lead-attachments' and app_private.is_staff());

create policy "lead attachments staff manage" on storage.objects
for all to authenticated
using (bucket_id = 'lead-attachments' and app_private.is_staff())
with check (bucket_id = 'lead-attachments' and app_private.is_staff());
