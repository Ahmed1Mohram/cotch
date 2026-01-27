-- Supabase schema (paste into Supabase SQL Editor)

-- =========
-- Extensions
-- =========
create extension if not exists pgcrypto;

-- =========
-- Types
-- =========
do $$ begin
  create type public.user_role as enum ('user', 'admin');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.enrollment_status as enum ('active', 'disabled', 'banned');
exception when duplicate_object then null; end $$;

do $$ begin
  create type public.video_provider as enum ('youtube', 'gdrive');
exception when duplicate_object then null; end $$;

-- =========
-- Core tables
-- =========
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text not null default '',
  phone text not null default '',
  role public.user_role not null default 'user',
  is_active boolean not null default false,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create index if not exists profiles_role_idx on public.profiles(role);
create index if not exists profiles_active_idx on public.profiles(is_active);

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  description text not null default '',
  cover_image_url text not null default '',
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.courses add column if not exists featured boolean not null default false;
alter table public.courses add column if not exists featured_sort_order int;
alter table public.courses add column if not exists featured_package_id uuid;

create index if not exists courses_published_idx on public.courses(is_published);

create table if not exists public.age_groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  name text not null,
  min_age int not null,
  max_age int not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint age_groups_age_range_chk check (min_age >= 0 and max_age >= min_age)
);

create index if not exists age_groups_course_idx on public.age_groups(course_id);
create unique index if not exists age_groups_unique_sort on public.age_groups(course_id, sort_order);

create table if not exists public.player_cards (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  label text not null default '',
  age int not null,
  height_cm int not null,
  weight_kg int not null,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint player_cards_positive_chk check (age >= 0 and height_cm > 0 and weight_kg > 0)
);

create index if not exists player_cards_course_idx on public.player_cards(course_id);
create index if not exists player_cards_age_group_idx on public.player_cards(age_group_id);

-- =========
-- Months / Days
-- =========
create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  title text not null,
  month_index int not null default 1,
  days_count int not null default 30,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint months_days_count_chk check (days_count >= 1 and days_count <= 60)
);

do $$
begin
  if exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'months'
      and column_name = 'course_id'
  ) then
    execute 'create index if not exists months_course_idx on public.months(course_id)';
  end if;
end $$;
create index if not exists months_age_group_idx on public.months(age_group_id);
create unique index if not exists months_unique_month_index on public.months(age_group_id, month_index);

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  day_index int not null,
  title text not null default '',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint days_day_index_chk check (day_index >= 1 and day_index <= 60)
);

create unique index if not exists days_unique_day on public.days(month_id, day_index);

create or replace function public.ensure_month_days(p_month_id uuid)
returns void
language plpgsql
security definer
as $$
declare
  v_days_count int;
  i int;
begin
  select m.days_count into v_days_count
  from public.months m
  where m.id = p_month_id;

  if v_days_count is null then
    return;
  end if;

  for i in 1..v_days_count loop
    insert into public.days(month_id, day_index)
    values (p_month_id, i)
    on conflict (month_id, day_index) do nothing;
  end loop;

  delete from public.days d
  where d.month_id = p_month_id
    and d.day_index > v_days_count;
end;
$$;

create or replace function public.trg_months_ensure_days_fn()
returns trigger
language plpgsql
security definer
as $$
begin
  perform public.ensure_month_days(new.id);
  return new;
end;
$$;

drop trigger if exists trg_months_ensure_days on public.months;

create trigger trg_months_ensure_days
after insert or update of days_count
on public.months
for each row
execute function public.trg_months_ensure_days_fn();

-- =========
-- Videos
-- =========
create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  month_id uuid not null references public.months(id) on delete cascade,
  day_id uuid not null references public.days(id) on delete cascade,
  title text not null,
  description text not null default '',
  duration_seconds int not null default 0,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  constraint videos_duration_chk check (duration_seconds >= 0)
);

create index if not exists videos_day_idx on public.videos(day_id);
create unique index if not exists videos_unique_sort on public.videos(day_id, sort_order);

create table if not exists public.video_assets (
  video_id uuid primary key references public.videos(id) on delete cascade,
  provider public.video_provider not null,
  embed_url text not null,
  created_at timestamptz not null default now()
);

-- =========
-- Enrollments + Subscription Codes
-- =========
create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  player_card_id uuid not null references public.player_cards(id) on delete restrict,
  status public.enrollment_status not null default 'active',
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique (user_id, course_id)
);

create index if not exists enrollments_course_idx on public.enrollments(course_id);
create index if not exists enrollments_user_idx on public.enrollments(user_id);

create table if not exists public.subscription_codes (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  player_card_id uuid not null references public.player_cards(id) on delete restrict,
  code_hash bytea not null,
  code_hint text not null,
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now(),
  redeemed_by uuid references auth.users(id) on delete set null,
  redeemed_at timestamptz,
  revoked boolean not null default false,
  constraint subscription_codes_redeem_chk check (
    (redeemed_at is null and redeemed_by is null) or (redeemed_at is not null and redeemed_by is not null)
  )
);

create index if not exists subscription_codes_course_idx on public.subscription_codes(course_id);
create index if not exists subscription_codes_redeemed_idx on public.subscription_codes(redeemed_at);
create index if not exists subscription_codes_hint_idx on public.subscription_codes(code_hint);

create table if not exists public.banned_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========
-- Helpers (RBAC + access)
-- =========
create or replace function public.is_admin()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.role = 'admin'::public.user_role
  );
$$;

create or replace function public.is_active_user()
returns boolean
language sql
stable
as $$
  select exists (
    select 1
    from public.profiles p
    where p.id = auth.uid()
      and p.is_active = true
  )
  and not exists (
    select 1 from public.banned_users b where b.user_id = auth.uid()
  );
$$;

create or replace function public.can_access_course(p_course_id uuid)
returns boolean
language sql
stable
as $$
  select public.is_active_user()
  and exists (
    select 1
    from public.enrollments e
    where e.user_id = auth.uid()
      and e.course_id = p_course_id
      and e.status = 'active'::public.enrollment_status
  );
$$;

-- =========
-- Code generation / redemption
-- =========
create or replace function public.generate_subscription_codes(
  p_player_card_id uuid,
  p_count int
)
returns table(code text)
language plpgsql
security definer
as $$
declare
  v_course_id uuid;
  v_age_group_id uuid;
  v_code text;
  v_hash bytea;
  v_hint text;
  i int;
begin
  if not public.is_admin() then
    raise exception 'not authorized';
  end if;

  if p_count < 1 or p_count > 100 then
    raise exception 'count must be 1..100';
  end if;

  select pc.course_id, pc.age_group_id
    into v_course_id, v_age_group_id
  from public.player_cards pc
  where pc.id = p_player_card_id;

  if v_course_id is null then
    raise exception 'player_card not found';
  end if;

  for i in 1..p_count loop
    v_code := replace(replace(encode(gen_random_bytes(9), 'base64'), '/', ''), '+', '');
    v_code := replace(v_code, '=', '');
    v_code := upper(substr(v_code, 1, 12));

    v_hash := digest(v_code, 'sha256');
    v_hint := right(v_code, 4);

    insert into public.subscription_codes(course_id, age_group_id, player_card_id, code_hash, code_hint, created_by)
    values (v_course_id, v_age_group_id, p_player_card_id, v_hash, v_hint, auth.uid());

    code := v_code;
    return next;
  end loop;
end;
$$;

create or replace function public.redeem_subscription_code(p_code text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_hash bytea;
  v_row public.subscription_codes%rowtype;
  v_enrollment_id uuid;
begin
  if not public.is_active_user() then
    raise exception 'account not active or banned';
  end if;

  if p_code is null or length(trim(p_code)) < 6 then
    raise exception 'invalid code';
  end if;

  v_hash := digest(upper(trim(p_code)), 'sha256');

  select *
    into v_row
  from public.subscription_codes sc
  where sc.code_hash = v_hash
    and sc.revoked = false
    and sc.redeemed_at is null
  limit 1;

  if v_row.id is null then
    raise exception 'code not found or already used';
  end if;

  insert into public.enrollments(user_id, course_id, age_group_id, player_card_id, status)
  values (auth.uid(), v_row.course_id, v_row.age_group_id, v_row.player_card_id, 'active'::public.enrollment_status)
  on conflict (user_id, course_id) do update
    set age_group_id = excluded.age_group_id,
        player_card_id = excluded.player_card_id,
        status = 'active'::public.enrollment_status,
        updated_at = now()
  returning id into v_enrollment_id;

  update public.subscription_codes
    set redeemed_by = auth.uid(),
        redeemed_at = now()
  where id = v_row.id;

  return v_enrollment_id;
end;
$$;

-- =========
-- Audit + Bans
-- =========
create table if not exists public.audit_events (
  id bigserial primary key,
  actor_user_id uuid references auth.users(id) on delete set null,
  action text not null,
  entity text not null,
  entity_id uuid,
  payload jsonb not null default '{}'::jsonb,
  created_at timestamptz not null default now()
);

create index if not exists audit_events_actor_idx on public.audit_events(actor_user_id);
create index if not exists audit_events_entity_idx on public.audit_events(entity, entity_id);

create table if not exists public.banned_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.banned_devices (
  fingerprint_hash bytea primary key,
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table if not exists public.banned_ips (
  ip inet primary key,
  reason text not null default '',
  created_by uuid references auth.users(id) on delete set null,
  created_at timestamptz not null default now()
);

-- =========
-- RLS
-- =========
alter table public.profiles enable row level security;
alter table public.courses enable row level security;
alter table public.age_groups enable row level security;
alter table public.player_cards enable row level security;
alter table public.months enable row level security;
alter table public.days enable row level security;
alter table public.videos enable row level security;
alter table public.video_assets enable row level security;
alter table public.enrollments enable row level security;
alter table public.subscription_codes enable row level security;
alter table public.audit_events enable row level security;
alter table public.banned_users enable row level security;
alter table public.banned_devices enable row level security;
alter table public.banned_ips enable row level security;

-- Profiles
drop policy if exists profiles_select_own on public.profiles;
create policy profiles_select_own
on public.profiles for select
using (id = auth.uid() or public.is_admin());

drop policy if exists profiles_update_own on public.profiles;
create policy profiles_update_own
on public.profiles for update
using (id = auth.uid() or public.is_admin())
with check (id = auth.uid() or public.is_admin());

-- Courses
drop policy if exists courses_select_all on public.courses;
create policy courses_select_all
on public.courses for select
using (true);

drop policy if exists courses_admin_insert on public.courses;
create policy courses_admin_insert
on public.courses for insert
with check (public.is_admin());

drop policy if exists courses_admin_update on public.courses;
create policy courses_admin_update
on public.courses for update
using (public.is_admin())
with check (public.is_admin());

drop policy if exists courses_admin_delete on public.courses;
create policy courses_admin_delete
on public.courses for delete
using (public.is_admin());

-- Structure tables: visible to everyone (locked preview)
drop policy if exists age_groups_select_all on public.age_groups;
create policy age_groups_select_all
on public.age_groups for select
using (public.is_admin() or public.can_access_course(course_id));

drop policy if exists player_cards_select_all on public.player_cards;
create policy player_cards_select_all
on public.player_cards for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.age_groups ag
    where ag.id = player_cards.age_group_id
      and public.can_access_course(ag.course_id)
  )
);

drop policy if exists months_select_all on public.months;
create policy months_select_all
on public.months for select
using (public.is_admin() or public.can_access_course(course_id));

drop policy if exists days_select_all on public.days;
create policy days_select_all
on public.days for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.months m
    where m.id = days.month_id
      and public.can_access_course(m.course_id)
  )
);

-- Admin write structure
drop policy if exists age_groups_admin_all on public.age_groups;
create policy age_groups_admin_all
on public.age_groups for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists player_cards_admin_all on public.player_cards;
create policy player_cards_admin_all
on public.player_cards for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists months_admin_all on public.months;
create policy months_admin_all
on public.months for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists days_admin_all on public.days;
create policy days_admin_all
on public.days for all
using (public.is_admin())
with check (public.is_admin());

-- Videos metadata visible to all
drop policy if exists videos_select_all on public.videos;
create policy videos_select_all
on public.videos for select
using (public.is_admin() or public.can_access_course(course_id));

drop policy if exists videos_admin_all on public.videos;
create policy videos_admin_all
on public.videos for all
using (public.is_admin())
with check (public.is_admin());

-- Video assets guarded
drop policy if exists video_assets_select_guarded on public.video_assets;
create policy video_assets_select_guarded
on public.video_assets for select
using (
  public.is_admin()
  or exists (
    select 1
    from public.videos v
    where v.id = video_assets.video_id
      and public.can_access_course(v.course_id)
  )
);

drop policy if exists video_assets_admin_all on public.video_assets;
create policy video_assets_admin_all
on public.video_assets for all
using (public.is_admin())
with check (public.is_admin());

-- Enrollments
drop policy if exists enrollments_select_own on public.enrollments;
create policy enrollments_select_own
on public.enrollments for select
using (user_id = auth.uid() or public.is_admin());

drop policy if exists enrollments_admin_all on public.enrollments;
create policy enrollments_admin_all
on public.enrollments for all
using (public.is_admin())
with check (public.is_admin());

-- Subscription codes admin-only
drop policy if exists subscription_codes_admin_select on public.subscription_codes;
create policy subscription_codes_admin_select
on public.subscription_codes for select
using (public.is_admin());

drop policy if exists subscription_codes_admin_all on public.subscription_codes;
create policy subscription_codes_admin_all
on public.subscription_codes for all
using (public.is_admin())
with check (public.is_admin());

-- Audit + bans admin-only
drop policy if exists audit_admin_select on public.audit_events;
create policy audit_admin_select
on public.audit_events for select
using (public.is_admin());

drop policy if exists audit_admin_insert on public.audit_events;
create policy audit_admin_insert
on public.audit_events for insert
with check (public.is_admin());

drop policy if exists banned_users_admin_all on public.banned_users;
create policy banned_users_admin_all
on public.banned_users for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists banned_devices_admin_all on public.banned_devices;
create policy banned_devices_admin_all
on public.banned_devices for all
using (public.is_admin())
with check (public.is_admin());

drop policy if exists banned_ips_admin_all on public.banned_ips;
create policy banned_ips_admin_all
on public.banned_ips for all
using (public.is_admin())
with check (public.is_admin());
