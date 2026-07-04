-- ============================================================
-- Migration 003: Functions, Triggers, and Seed
-- ============================================================

-- Auto-create profile when a new auth user is created.
-- The invite flow sets raw_app_meta_data.company_id and .role
-- before creating the user, so this trigger picks them up.
create or replace function public.handle_new_user()
returns trigger language plpgsql security definer set search_path = public
as $$
declare
  v_company_id uuid;
  v_role       text;
  v_full_name  text;
begin
  v_company_id := (new.raw_app_meta_data->>'company_id')::uuid;
  v_role       := coalesce(new.raw_app_meta_data->>'role', 'company_user');
  v_full_name  := new.raw_user_meta_data->>'full_name';

  if v_company_id is null then
    return new; -- No company assigned; admin will assign later
  end if;

  insert into public.profiles (id, company_id, role, full_name)
  values (new.id, v_company_id, v_role, v_full_name)
  on conflict (id) do nothing;

  return new;
end;
$$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute procedure public.handle_new_user();

-- ─── Seed: Admin company ──────────────────────────────────────────────────────
-- Insert a placeholder admin company. Replace the admin user UUID after first sign-in.

insert into public.companies (id, name, slug, brand_color)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  'Admin',
  'admin',
  '#6366f1'
) on conflict (id) do nothing;

-- Default client settings for admin company
insert into public.client_settings (company_id, feature_flags, usage_limits, advanced_mode)
values (
  '00000000-0000-0000-0000-000000000001'::uuid,
  '{"showCost":true,"showTranscripts":true,"showAudioPlayer":true,"showStructuredData":true,"showAnalytics":true}'::jsonb,
  '{}'::jsonb,
  true
) on conflict (company_id) do nothing;

-- ─── Demo company for testing ─────────────────────────────────────────────────
insert into public.companies (id, name, slug, brand_color, support_email)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  'Acme Corp',
  'acme',
  '#0ea5e9',
  'support@acme.example.com'
) on conflict (id) do nothing;

insert into public.client_settings (company_id, feature_flags, usage_limits, advanced_mode)
values (
  '00000000-0000-0000-0000-000000000002'::uuid,
  '{"showCost":true,"showTranscripts":true,"showAudioPlayer":true,"showStructuredData":true,"showAnalytics":true}'::jsonb,
  '{"maxCallsPerMonth":500}'::jsonb,
  false
) on conflict (company_id) do nothing;

-- Demo assistants for Acme
insert into public.vapi_assistants (company_id, vapi_assistant_id, display_name)
values
  ('00000000-0000-0000-0000-000000000002'::uuid, 'asst_demo_001', 'Appointment Scheduler'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'asst_demo_002', 'Customer Support')
on conflict (vapi_assistant_id) do nothing;

-- Demo phone numbers for Acme
insert into public.vapi_phone_numbers (company_id, vapi_phone_number_id, display_name)
values
  ('00000000-0000-0000-0000-000000000002'::uuid, 'pn_demo_001', 'Main Inbound Line'),
  ('00000000-0000-0000-0000-000000000002'::uuid, 'pn_demo_002', 'Support Line')
on conflict (vapi_phone_number_id) do nothing;
