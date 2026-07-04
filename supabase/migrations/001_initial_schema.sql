-- ============================================================
-- Migration 001: Initial Schema
-- ============================================================

-- companies
create table if not exists public.companies (
  id           uuid primary key default gen_random_uuid(),
  name         text not null,
  slug         text not null unique,
  logo_url     text,
  brand_color  text not null default '#6366f1',
  support_email text,
  booking_url  text,
  created_at   timestamptz not null default now()
);

-- profiles (1:1 with auth.users)
create table if not exists public.profiles (
  id          uuid primary key references auth.users(id) on delete cascade,
  company_id  uuid not null references public.companies(id) on delete cascade,
  role        text not null check (role in ('admin', 'company_owner', 'company_user')),
  full_name   text,
  avatar_url  text,
  created_at  timestamptz not null default now()
);

-- vapi_assistants: maps Vapi assistant IDs to companies
create table if not exists public.vapi_assistants (
  id                  uuid primary key default gen_random_uuid(),
  company_id          uuid not null references public.companies(id) on delete cascade,
  vapi_assistant_id   text not null unique,
  display_name        text not null,
  is_active           boolean not null default true,
  allowed_edit_fields jsonb not null default '["name","firstMessage","voicemailMessage","endCallMessage","metadata"]'::jsonb,
  created_at          timestamptz not null default now()
);

-- vapi_phone_numbers: maps Vapi phone number IDs to companies
create table if not exists public.vapi_phone_numbers (
  id                   uuid primary key default gen_random_uuid(),
  company_id           uuid not null references public.companies(id) on delete cascade,
  vapi_phone_number_id text not null unique,
  display_name         text,
  is_active            boolean not null default true,
  created_at           timestamptz not null default now()
);

-- call_cache: cached Vapi call data per company
create table if not exists public.call_cache (
  id           uuid primary key default gen_random_uuid(),
  company_id   uuid not null references public.companies(id) on delete cascade,
  vapi_call_id text not null unique,
  data         jsonb not null,
  cached_at    timestamptz not null default now()
);

-- client_settings: per-company feature flags and limits
create table if not exists public.client_settings (
  company_id    uuid primary key references public.companies(id) on delete cascade,
  feature_flags jsonb not null default '{"showCost":true,"showTranscripts":true,"showAudioPlayer":true,"showStructuredData":true,"showAnalytics":true}'::jsonb,
  usage_limits  jsonb not null default '{}'::jsonb,
  advanced_mode boolean not null default false
);

-- invites: email invitations for new users
create table if not exists public.invites (
  id          uuid primary key default gen_random_uuid(),
  company_id  uuid not null references public.companies(id) on delete cascade,
  email       text not null,
  role        text not null check (role in ('company_owner', 'company_user')),
  token       text not null unique default encode(gen_random_bytes(32), 'hex'),
  expires_at  timestamptz not null default (now() + interval '7 days'),
  accepted_at timestamptz,
  created_at  timestamptz not null default now()
);

-- Indexes
create index if not exists idx_profiles_company_id on public.profiles(company_id);
create index if not exists idx_vapi_assistants_company_id on public.vapi_assistants(company_id);
create index if not exists idx_vapi_phone_numbers_company_id on public.vapi_phone_numbers(company_id);
create index if not exists idx_call_cache_company_id on public.call_cache(company_id);
create index if not exists idx_call_cache_vapi_call_id on public.call_cache(vapi_call_id);
create index if not exists idx_call_cache_cached_at on public.call_cache(cached_at);
create index if not exists idx_invites_token on public.invites(token);
