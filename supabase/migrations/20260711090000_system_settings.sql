-- system_settings: key-value store for admin-managed app configuration
create table if not exists system_settings (
  key        text        primary key,
  value      jsonb       not null default '{}',
  updated_at timestamptz not null default now()
);

alter table system_settings enable row level security;

-- Only admins (via service_role) can touch this table.
-- The service_role key used by supabaseAdmin bypasses RLS.
-- We add a restrictive policy so anon/authenticated cannot read it directly.
create policy "deny_public" on system_settings
  as restrictive
  for all
  to anon, authenticated
  using (false);

-- Seed defaults
insert into system_settings (key, value) values
  ('app_name',             '"Abroad Compass"'),
  ('registration_open',   'true'),
  ('maintenance_mode',    'false'),
  ('ai_provider_default', '"google"'),
  ('features',            '{"blog":true,"feedback":true,"assistant":true,"german":true,"ielts":true,"dmat":true}')
on conflict (key) do nothing;
