-- ============================================================
-- Migration 002: Row Level Security Policies
-- ============================================================

-- Helper functions in public schema (auth schema is restricted in Supabase)
create or replace function public.get_company_id()
returns uuid language sql stable security definer
as $$ select company_id from public.profiles where id = (select auth.uid()) $$;

create or replace function public.get_user_role()
returns text language sql stable security definer
as $$ select role from public.profiles where id = (select auth.uid()) $$;

-- Enable RLS on all tables
alter table public.companies          enable row level security;
alter table public.profiles           enable row level security;
alter table public.vapi_assistants    enable row level security;
alter table public.vapi_phone_numbers enable row level security;
alter table public.call_cache         enable row level security;
alter table public.client_settings    enable row level security;
alter table public.invites            enable row level security;

-- ─── companies ─────────────────────────────────────────────────
create policy "companies: read own or admin" on public.companies
  for select to authenticated
  using (id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "companies: admin full access" on public.companies
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ─── profiles ───────────────────────────────────────────────────
create policy "profiles: read same company or admin" on public.profiles
  for select to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "profiles: update own" on public.profiles
  for update to authenticated
  using (id = (select auth.uid()));

create policy "profiles: admin full access" on public.profiles
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ─── vapi_assistants ────────────────────────────────────────────
create policy "vapi_assistants: read own company or admin" on public.vapi_assistants
  for select to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "vapi_assistants: admin full access" on public.vapi_assistants
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ─── vapi_phone_numbers ─────────────────────────────────────────
create policy "vapi_phone_numbers: read own company or admin" on public.vapi_phone_numbers
  for select to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "vapi_phone_numbers: admin full access" on public.vapi_phone_numbers
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ─── call_cache ─────────────────────────────────────────────────
create policy "call_cache: read own company or admin" on public.call_cache
  for select to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "call_cache: insert own company or admin" on public.call_cache
  for insert to authenticated
  with check (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "call_cache: update own company or admin" on public.call_cache
  for update to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

-- ─── client_settings ────────────────────────────────────────────
create policy "client_settings: read own company or admin" on public.client_settings
  for select to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "client_settings: owner can update own" on public.client_settings
  for update to authenticated
  using (company_id = public.get_company_id() and public.get_user_role() in ('company_owner', 'admin'));

create policy "client_settings: admin full access" on public.client_settings
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');

-- ─── invites ────────────────────────────────────────────────────
create policy "invites: read own company or admin" on public.invites
  for select to authenticated
  using (company_id = public.get_company_id() or public.get_user_role() = 'admin');

create policy "invites: owner/admin can insert" on public.invites
  for insert to authenticated
  with check (
    (company_id = public.get_company_id() and public.get_user_role() in ('company_owner', 'admin'))
    or public.get_user_role() = 'admin'
  );

create policy "invites: admin full access" on public.invites
  for all to authenticated
  using (public.get_user_role() = 'admin')
  with check (public.get_user_role() = 'admin');
