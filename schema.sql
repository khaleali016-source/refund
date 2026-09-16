-- مخطط قاعدة البيانات (PostgreSQL / Supabase) لنسخة Next.js
create table if not exists public.admin_users (
  id uuid primary key default gen_random_uuid(),
  username text not null unique,
  password_salt text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists public.admin_settings (
  key text primary key,
  value_cipher text not null,
  updated_at timestamptz not null default now()
);

create table if not exists public.admin_audit_logs (
  id uuid primary key default gen_random_uuid(),
  action text not null,
  actor text not null default 'System',
  details jsonb,
  created_at timestamptz not null default now()
);

create table if not exists public.saved_profiles (
  id uuid primary key default gen_random_uuid(),
  short_code text not null unique,
  customer_name text not null,
  refund_amount numeric(14,3) not null,
  status text not null default 'pending',
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);

create table if not exists public.rate_limits (
  bucket_key text primary key,
  hits integer not null default 0,
  window_start timestamptz not null default now()
);

create index if not exists idx_audit_created on public.admin_audit_logs (created_at desc);
create index if not exists idx_profiles_created on public.saved_profiles (created_at desc);

-- كل الوصول من الخادم بمفتاح service_role فقط
alter table public.admin_users enable row level security;
alter table public.admin_settings enable row level security;
alter table public.admin_audit_logs enable row level security;
alter table public.saved_profiles enable row level security;
alter table public.rate_limits enable row level security;

grant all on public.admin_users to service_role;
grant all on public.admin_settings to service_role;
grant all on public.admin_audit_logs to service_role;
grant all on public.saved_profiles to service_role;
grant all on public.rate_limits to service_role;
