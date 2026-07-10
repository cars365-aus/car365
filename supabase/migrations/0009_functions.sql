-- ─────────────────────────────────────────────────────────────────────────────
-- 0009  Server-callable functions (RPCs)
-- ─────────────────────────────────────────────────────────────────────────────

-- ── Admin dashboard KPIs (SRS §15.1) ────────────────────────────────────────
-- SLA breach = a 'new' lead older than p_sla_minutes (default 15, SRS §2.8).
create or replace function public.get_admin_dashboard_metrics(p_sla_minutes integer default 15)
returns jsonb
language plpgsql
security definer
set search_path = public
stable
as $$
declare
  result jsonb;
begin
  if not app_private.is_staff() then
    raise exception 'not authorized';
  end if;

  select jsonb_build_object(
    'leads', (
      select jsonb_build_object(
        'total', count(*),
        'new', count(*) filter (where status = 'new'),
        'contacted', count(*) filter (where status = 'contacted'),
        'qualified', count(*) filter (where status = 'qualified'),
        'won', count(*) filter (where status = 'won'),
        'lost', count(*) filter (where status = 'lost'),
        'spam', count(*) filter (where status = 'spam'),
        'awaiting_first_contact', count(*) filter (where status = 'new'),
        'sla_breaches', count(*) filter (
          where status = 'new'
            and created_at < now() - make_interval(mins => p_sla_minutes)
        )
      )
      from public.leads
    ),
    'inventory', (
      select jsonb_build_object(
        'total', count(*),
        'draft', count(*) filter (where status = 'draft'),
        'available', count(*) filter (where status = 'available'),
        'reserved', count(*) filter (where status = 'reserved'),
        'sold', count(*) filter (where status = 'sold'),
        'archived', count(*) filter (where status = 'archived')
      )
      from public.vehicles
    )
  ) into result;

  return result;
end;
$$;

-- ── Atomic lead creation (zero-lead-loss, SRS NFR-4) ─────────────────────────
-- Inserts the lead and its 'created' timeline event in one transaction, so the
-- API route can persist durably before acknowledging. Called with the
-- service-role client after Zod validation + anti-spam checks.
create or replace function public.create_lead_with_event(p_lead jsonb)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  new_id uuid;
begin
  insert into public.leads (
    type, status, name, phone, email, message, vehicle_id, payload,
    source_url, utm, referrer, device, ip_hash, consent
  ) values (
    (p_lead->>'type')::public.lead_type,
    coalesce((p_lead->>'status')::public.lead_status, 'new'),
    p_lead->>'name',
    p_lead->>'phone',
    p_lead->>'email',
    p_lead->>'message',
    nullif(p_lead->>'vehicle_id', '')::uuid,
    coalesce(p_lead->'payload', '{}'::jsonb),
    p_lead->>'source_url',
    coalesce(p_lead->'utm', '{}'::jsonb),
    p_lead->>'referrer',
    nullif(p_lead->>'device', '')::public.device_type,
    p_lead->>'ip_hash',
    coalesce(p_lead->'consent', '{}'::jsonb)
  )
  returning id into new_id;

  insert into public.lead_events (lead_id, event, data)
  values (new_id, 'created', jsonb_build_object('type', p_lead->>'type'));

  return new_id;
end;
$$;

-- ── Per-vehicle analytics increments (called via service role) ───────────────
create or replace function public.increment_vehicle_view(p_vehicle_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  update public.vehicles set views_count = views_count + 1 where id = p_vehicle_id;
  insert into public.vehicle_daily_stats (vehicle_id, date, views)
  values (p_vehicle_id, current_date, 1)
  on conflict (vehicle_id, date)
  do update set views = public.vehicle_daily_stats.views + 1;
end;
$$;

create or replace function public.record_cta_click(p_vehicle_id uuid, p_channel text)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  insert into public.vehicle_daily_stats (vehicle_id, date, cta_clicks)
  values (p_vehicle_id, current_date, jsonb_build_object(p_channel, 1))
  on conflict (vehicle_id, date)
  do update set cta_clicks = jsonb_set(
    public.vehicle_daily_stats.cta_clicks,
    array[p_channel],
    to_jsonb(coalesce((public.vehicle_daily_stats.cta_clicks->>p_channel)::int, 0) + 1)
  );
end;
$$;

-- ── Scheduled maintenance jobs (invoked by cron / edge function) ─────────────

-- SRS §13.2: a VDP stays live 60 days after sale, then archives and 301s to its
-- model landing page. Inserts a redirect and flips status to 'archived'.
create or replace function public.expire_stale_vdps()
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer := 0;
  rec record;
begin
  for rec in
    select v.id,
           mk.slug as make_slug,
           md.slug as model_slug,
           v.slug  as vehicle_slug
    from public.vehicles v
    join public.makes mk on mk.id = v.make_id
    join public.models md on md.id = v.model_id
    where v.status = 'sold'
      and v.sold_at is not null
      and v.sold_at < now() - interval '60 days'
  loop
    insert into public.redirects (from_path, to_path, code)
    values (
      '/used-cars/' || rec.make_slug || '/' || rec.model_slug || '/' || rec.vehicle_slug,
      '/used-cars/' || rec.make_slug || '/' || rec.model_slug,
      301
    )
    on conflict (from_path) do nothing;

    update public.vehicles set status = 'archived' where id = rec.id;
    affected := affected + 1;
  end loop;
  return affected;
end;
$$;

-- SRS §20: anonymize lead PII after the configured retention window
-- (default 36 months); keep aggregate status data for reporting.
create or replace function public.anonymize_stale_leads(p_months integer default 36)
returns integer
language plpgsql
security definer
set search_path = public
as $$
declare
  affected integer;
begin
  update public.leads
  set name = 'Anonymized',
      phone = '',
      email = null,
      message = null,
      payload = '{}'::jsonb,
      ip_hash = null,
      referrer = null
  where created_at < now() - make_interval(months => p_months)
    and name <> 'Anonymized';
  get diagnostics affected = row_count;
  return affected;
end;
$$;

grant execute on function public.get_admin_dashboard_metrics(integer) to authenticated;
