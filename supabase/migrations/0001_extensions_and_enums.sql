-- ─────────────────────────────────────────────────────────────────────────────
-- 0001  Extensions, private schema, and controlled-vocabulary enums
-- Used-car sales lead-gen platform. Fresh schema (SRS §18).
-- ─────────────────────────────────────────────────────────────────────────────

create extension if not exists pgcrypto;   -- gen_random_uuid()
create extension if not exists pg_trgm;     -- trigram index for fuzzy title search

-- SECURITY DEFINER authorization helpers live here, out of PostgREST's reach.
create schema if not exists app_private;

-- ── Vehicle attribute vocabularies (SRS §13.1) ──────────────────────────────
create type public.fuel_type as enum (
  'petrol', 'diesel', 'hybrid', 'phev', 'electric', 'lpg'
);
create type public.transmission_type as enum (
  'automatic', 'manual', 'cvt', 'dct'
);
create type public.body_type as enum (
  'sedan', 'hatch', 'suv', 'ute', 'wagon', 'coupe',
  'convertible', 'van', 'people_mover'
);
create type public.drive_type as enum ('fwd', 'rwd', 'awd', 'four_wd');

-- Vehicle lifecycle (SRS §13.2): draft → available → reserved ⇄ available →
-- sold → archived.
create type public.vehicle_status as enum (
  'draft', 'available', 'reserved', 'sold', 'archived'
);

create type public.feature_category as enum (
  'comfort', 'safety', 'technology', 'exterior'
);

-- ── Lead vocabularies (SRS §14, §18) ────────────────────────────────────────
create type public.lead_type as enum (
  'vehicle_enquiry', 'inspection', 'finance', 'trade_in',
  'sell', 'callback', 'general', 'waitlist'
);
create type public.lead_status as enum (
  'new', 'contacted', 'qualified', 'inspection_scheduled',
  'negotiation', 'won', 'lost', 'spam'
);
create type public.lead_loss_reason as enum (
  'price', 'sold_elsewhere', 'finance_declined', 'unresponsive', 'other'
);
create type public.device_type as enum ('mobile', 'desktop', 'tablet', 'unknown');

-- ── Content & staff vocabularies ────────────────────────────────────────────
create type public.testimonial_source as enum ('google', 'facebook', 'direct');
create type public.blog_status as enum ('draft', 'scheduled', 'published');

-- Staff roles (SRS §15.9). Distinct from the retired rental member_role.
create type public.staff_role as enum (
  'owner', 'admin', 'manager', 'sales', 'content'
);
