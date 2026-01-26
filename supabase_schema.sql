-- Fit Coach Supabase schema (tables + RLS + helper functions)

-- Extensions
create extension if not exists pgcrypto;

-- =========================================================
-- Core tables
-- =========================================================

create table if not exists public.courses (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title_ar text,
  title_en text,
  description text,
  cover_image_url text,
  theme text,
  is_published boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.packages (
  id uuid primary key default gen_random_uuid(),
  slug text not null unique,
  title text not null,
  subtitle text,
  description text,
  badge text,
  price_egp numeric,
  offer_active boolean not null default false,
  offer_badge text,
  offer_price_egp numeric,
  offer_percent int,
  offer_start_at timestamptz,
  offer_end_at timestamptz,
  features jsonb not null default '[]'::jsonb,
  theme text not null default 'orange',
  sort_order int not null default 0,
  active boolean not null default true,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

alter table public.packages add column if not exists offer_active boolean not null default false;
alter table public.packages add column if not exists offer_badge text;
alter table public.packages add column if not exists offer_price_egp numeric;
alter table public.packages add column if not exists offer_percent int;
alter table public.packages add column if not exists offer_start_at timestamptz;
alter table public.packages add column if not exists offer_end_at timestamptz;

insert into public.packages (
  slug,
  title,
  subtitle,
  description,
  badge,
  price_egp,
  offer_active,
  offer_badge,
  offer_price_egp,
  offer_percent,
  offer_start_at,
  offer_end_at,
  features,
  theme,
  sort_order,
  active
)
values
  (
    'small',
    'Small',
    'بداية قوية',
    'باقة مناسبة للبداية وفتح كورسات محددة.',
    'SMALL',
    299,
    false,
    null,
    null,
    null,
    null,
    null,
    '["محتوى أساسي","دعم داخل البرنامج","تحديثات مستمرة"]'::jsonb,
    'orange',
    1,
    true
  ),
  (
    'medium',
    'Medium',
    'الأكثر اختياراً',
    'باقة متوسطة لفتح عدد أكبر من الكورسات.',
    'MEDIUM',
    499,
    false,
    null,
    null,
    null,
    null,
    null,
    '["محتوى موسّع","متابعة أفضل","مناسب لمعظم اللاعبين"]'::jsonb,
    'blue',
    2,
    true
  ),
  (
    'vip',
    'VIP',
    'ملوك الأداء',
    'دي مش باقة… دي ترقية كاملة لمستواك. فتح كل الكورسات + خطة أقوى + تجربة VIP تخليك تحس إنك بتشتري أقوى كورس في حياتك.',
    'VIP',
    799,
    false,
    null,
    null,
    null,
    null,
    null,
    '["فتح كل الكورسات بدون قيود","أولوية VIP في الدعم والمتابعة","تجربة Premium كاملة + تحديثات مستمرة","محتوى أقوى ومكثف لنتائج أسرع","أفضل قيمة لو داخل تكسر أرقامك"]'::jsonb,
    'vip',
    3,
    true
  )
on conflict (slug)
do update set
  title = excluded.title,
  subtitle = excluded.subtitle,
  description = excluded.description,
  badge = excluded.badge,
  price_egp = excluded.price_egp,
  offer_active = excluded.offer_active,
  offer_badge = excluded.offer_badge,
  offer_price_egp = excluded.offer_price_egp,
  offer_percent = excluded.offer_percent,
  offer_start_at = excluded.offer_start_at,
  offer_end_at = excluded.offer_end_at,
  features = excluded.features,
  theme = excluded.theme,
  sort_order = excluded.sort_order,
  active = excluded.active,
  updated_at = now();

create table if not exists public.package_courses (
  package_id uuid not null references public.packages(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  primary key (package_id, course_id)
);

create table if not exists public.age_groups (
  id uuid primary key default gen_random_uuid(),
  course_id uuid not null references public.courses(id) on delete cascade,
  title text,
  min_age int,
  max_age int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.package_course_age_groups (
  package_id uuid not null references public.packages(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  created_at timestamptz not null default now(),
  primary key (package_id, course_id, age_group_id)
);

create table if not exists public.player_cards (
  id uuid primary key default gen_random_uuid(),
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  age int,
  height_cm int,
  weight_kg int,
  note text,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.months (
  id uuid primary key default gen_random_uuid(),
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  title text,
  month_number int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.days (
  id uuid primary key default gen_random_uuid(),
  month_id uuid not null references public.months(id) on delete cascade,
  title text,
  day_number int,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.videos (
  id uuid primary key default gen_random_uuid(),
  day_id uuid not null references public.days(id) on delete cascade,
  title text,
  video_url text,
  thumbnail_url text,
  details text,
  duration_sec int,
  is_free_preview boolean not null default false,
  sort_order int not null default 0,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

 do $$
 begin
   if not exists (
     select 1
     from information_schema.columns
     where table_schema = 'public'
       and table_name = 'videos'
       and column_name = 'details'
   ) then
     alter table public.videos add column details text;
   end if;
 end $$;

-- =========================================================
-- Admin / enrollment / subscription codes
-- =========================================================

create table if not exists public.admin_users (
  user_id uuid primary key references auth.users(id) on delete cascade,
  created_at timestamptz not null default now()
);

-- =========================================================
-- Device tracking + device bans
-- =========================================================

create table if not exists public.user_devices (
  device_id text primary key,
  user_id uuid references auth.users(id) on delete set null,
  user_agent text,
  first_seen timestamptz not null default now(),
  last_seen timestamptz not null default now(),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.device_bans (
  id uuid primary key default gen_random_uuid(),
  device_id text not null,
  active boolean not null default true,
  banned_until timestamptz,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.user_bans (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  active boolean not null default true,
  banned_until timestamptz,
  reason text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.enrollments (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  status text not null default 'active',
  start_at timestamptz not null default now(),
  end_at timestamptz,
  source text not null default 'manual',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id)
);

do $$
begin
  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'enrollments'
      and column_name = 'end_at'
  ) then
    alter table public.enrollments add column end_at timestamptz;
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'enrollments'
      and column_name = 'source'
  ) then
    alter table public.enrollments add column source text not null default 'manual';
  end if;

  if not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'enrollments'
      and column_name = 'created_by'
  ) then
    alter table public.enrollments add column created_by uuid references auth.users(id);
  end if;

  if not exists (
    select 1
    from information_schema.table_constraints tc
    join information_schema.key_column_usage kcu
      on kcu.constraint_name = tc.constraint_name
     and kcu.table_schema = tc.table_schema
    where tc.table_schema = 'public'
      and tc.table_name = 'enrollments'
      and tc.constraint_type = 'UNIQUE'
    group by tc.constraint_name
    having array_agg(kcu.column_name::text order by kcu.ordinal_position) = array['user_id','course_id']::text[]
  ) then
    create unique index if not exists ux_enrollments_user_course on public.enrollments(user_id, course_id);
  end if;
end $$;

create table if not exists public.user_profiles (
  user_id uuid primary key references auth.users(id) on delete cascade,
  full_name text,
  phone text,
  age_years int,
  height_cm int,
  weight_kg numeric,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.contact_requests (
  id uuid primary key default gen_random_uuid(),
  user_id uuid references auth.users(id) on delete set null,
  device_id text,
  package_id uuid references public.packages(id) on delete set null,
  package_title text,
  course_id uuid references public.courses(id) on delete set null,
  course_title text,
  full_name text,
  phone text,
  age_years int,
  height_cm int,
  weight_kg numeric,
  club text,
  message text,
  created_at timestamptz not null default now()
);

alter table public.contact_requests add column if not exists package_id uuid references public.packages(id) on delete set null;
alter table public.contact_requests add column if not exists package_title text;
alter table public.contact_requests add column if not exists course_id uuid references public.courses(id) on delete set null;

create table if not exists public.subscription_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id uuid not null references public.courses(id) on delete cascade,
  duration_days int not null default 30,
  max_redemptions int not null default 1,
  active boolean not null default true,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.subscription_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique(code_id, user_id)
);

create table if not exists public.course_month_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  month_number int not null,
  status text not null default 'active',
  start_at timestamptz not null default now(),
  end_at timestamptz,
  source text not null default 'code',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id, month_number)
);

create table if not exists public.month_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id uuid not null references public.courses(id) on delete cascade,
  month_number int not null,
  duration_days int not null default 40,
  max_redemptions int not null default 1,
  active boolean not null default true,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.month_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.month_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique(code_id, user_id)
);

create table if not exists public.course_age_group_access (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  player_card_id uuid references public.player_cards(id) on delete cascade,
  status text not null default 'active',
  start_at timestamptz not null default now(),
  end_at timestamptz,
  source text not null default 'age_code',
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now(),
  unique(user_id, course_id, player_card_id)
);

create table if not exists public.age_group_codes (
  id uuid primary key default gen_random_uuid(),
  code text not null unique,
  course_id uuid not null references public.courses(id) on delete cascade,
  age_group_id uuid not null references public.age_groups(id) on delete cascade,
  player_card_id uuid references public.player_cards(id) on delete cascade,
  duration_days int not null default 30,
  max_redemptions int not null default 1,
  active boolean not null default true,
  note text,
  created_by uuid references auth.users(id),
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

create table if not exists public.age_group_code_redemptions (
  id uuid primary key default gen_random_uuid(),
  code_id uuid not null references public.age_group_codes(id) on delete cascade,
  user_id uuid not null references auth.users(id) on delete cascade,
  redeemed_at timestamptz not null default now(),
  unique(code_id, user_id)
);

 alter table public.course_age_group_access
   add column if not exists player_card_id uuid references public.player_cards(id) on delete cascade;

 alter table public.age_group_codes
   add column if not exists player_card_id uuid references public.player_cards(id) on delete cascade;

-- =========================================================
-- Timestamps trigger (updated_at)
-- =========================================================

create or replace function public.set_updated_at()
returns trigger
language plpgsql
as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

create or replace function public.request_device_id()
returns text
language sql
stable
security definer
set search_path = public
as $$
  select nullif(((current_setting('request.headers', true))::jsonb ->> 'x-device-id')::text, '');
$$;

create or replace function public.is_device_banned()
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.device_bans b
    where b.device_id = public.request_device_id()
      and b.active = true
      and (b.banned_until is null or b.banned_until > now())
  );
$$;

drop function if exists public.track_device();
drop function if exists public.redeem_subscription_code(text);
drop function if exists public.generate_subscription_codes(text, int, int, int);
drop function if exists public.redeem_month_code(text);
drop function if exists public.generate_month_codes(text, int, int, int, int);
drop function if exists public.redeem_age_group_code(text);
drop function if exists public.redeem_any_code(text);
drop function if exists public.generate_age_group_codes(text, uuid, int, int, int);
drop function if exists public.has_active_age_group_access(uuid, uuid);
drop function if exists public.has_active_player_card_access(uuid, uuid);

create or replace function public.preview_months(p_age_group_id uuid)
returns table (
  id uuid,
  age_group_id uuid,
  title text,
  month_number int,
  sort_order int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  return query
  select m.id, m.age_group_id, m.title, m.month_number, m.sort_order, m.created_at
  from public.months m
  where m.age_group_id = p_age_group_id
  order by m.month_number nulls last, m.sort_order, m.created_at;
end;
$$;

create or replace function public.preview_days(p_month_id uuid)
returns table (
  id uuid,
  month_id uuid,
  title text,
  day_number int,
  sort_order int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  return query
  select d.id, d.month_id, d.title, d.day_number, d.sort_order, d.created_at
  from public.days d
  where d.month_id = p_month_id
  order by d.day_number nulls last, d.sort_order, d.created_at;
end;
$$;

create or replace function public.preview_videos(p_day_id uuid)
returns table (
  id uuid,
  day_id uuid,
  title text,
  video_url text,
  thumbnail_url text,
  details text,
  duration_sec int,
  is_free_preview boolean,
  sort_order int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  return query
  select
    v.id,
    v.day_id,
    v.title,
    case when v.is_free_preview then v.video_url else null end as video_url,
    v.thumbnail_url,
    case when v.is_free_preview then v.details else null end as details,
    v.duration_sec,
    v.is_free_preview,
    v.sort_order,
    v.created_at
  from public.videos v
  where v.day_id = p_day_id
  order by v.sort_order, v.created_at;
end;
$$;

create or replace function public.preview_age_groups(p_course_id uuid)
returns table (
  id uuid,
  course_id uuid,
  title text,
  min_age int,
  max_age int,
  sort_order int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  if not exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and c.is_published = true
      and exists (
        select 1
        from public.package_courses pc
        join public.packages p on p.id = pc.package_id
        where pc.course_id = c.id
          and p.active = true
      )
  ) then
    return;
  end if;

  return query
  select ag.id, ag.course_id, ag.title, ag.min_age, ag.max_age, ag.sort_order, ag.created_at
  from public.age_groups ag
  where ag.course_id = p_course_id
  order by ag.sort_order, ag.created_at;
end;
$$;

create or replace function public.preview_course_player_cards(p_course_id uuid, p_package_id uuid default null)
returns table (
  id uuid,
  age_group_id uuid,
  age int,
  height_cm int,
  weight_kg int,
  note text,
  sort_order int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  if not exists (
    select 1
    from public.courses c
    where c.id = p_course_id
      and c.is_published = true
      and exists (
        select 1
        from public.package_courses pc
        join public.packages p on p.id = pc.package_id
        where pc.course_id = c.id
          and p.active = true
      )
  ) then
    return;
  end if;

  return query
  select
    pc.id,
    pc.age_group_id,
    pc.age,
    pc.height_cm,
    pc.weight_kg,
    pc.note,
    pc.sort_order,
    pc.created_at
  from public.player_cards pc
  join public.age_groups ag on ag.id = pc.age_group_id
  where ag.course_id = p_course_id
    and (
      p_package_id is null
      or (
        exists (
          select 1
          from public.package_courses pc0
          join public.packages p0 on p0.id = pc0.package_id
          where pc0.package_id = p_package_id
            and pc0.course_id = p_course_id
            and p0.active = true
        )
        and (
          not exists (
            select 1
            from public.package_course_age_groups pca0
            where pca0.package_id = p_package_id
              and pca0.course_id = p_course_id
          )
          or exists (
            select 1
            from public.package_course_age_groups pca
            where pca.package_id = p_package_id
              and pca.course_id = p_course_id
              and pca.age_group_id = ag.id
          )
        )
      )
    )
  order by ag.sort_order, pc.sort_order, pc.created_at;
end;
$$;

create or replace function public.preview_player_card(p_card_id uuid)
returns table (
  id uuid,
  age_group_id uuid,
  course_id uuid,
  age int,
  height_cm int,
  weight_kg int,
  note text,
  age_group_title text,
  sort_order int,
  created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  return query
  select
    pc.id,
    pc.age_group_id,
    ag.course_id,
    pc.age,
    pc.height_cm,
    pc.weight_kg,
    pc.note,
    ag.title as age_group_title,
    pc.sort_order,
    pc.created_at
  from public.player_cards pc
  join public.age_groups ag on ag.id = pc.age_group_id
  join public.courses c on c.id = ag.course_id
  where pc.id = p_card_id
    and c.is_published = true
    and exists (
      select 1
      from public.package_courses pc2
      join public.packages p on p.id = pc2.package_id
      where pc2.course_id = c.id
        and p.active = true
    )
  limit 1;
end;
$$;

create or replace function public.preview_month_schedule(p_month_id uuid)
returns table (
  day_id uuid,
  day_month_id uuid,
  day_title text,
  day_number int,
  day_sort_order int,
  day_created_at timestamptz,
  video_id uuid,
  video_day_id uuid,
  video_title text,
  video_url text,
  thumbnail_url text,
  details text,
  duration_sec int,
  is_free_preview boolean,
  video_sort_order int,
  video_created_at timestamptz
)
language plpgsql
stable
security definer
set search_path = public
as $$
declare
  v_uid uuid;
begin
  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_uid := auth.uid();
  if v_uid is not null and public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  if not exists (
    select 1
    from public.months m
    join public.age_groups ag on ag.id = m.age_group_id
    join public.courses c on c.id = ag.course_id
    where m.id = p_month_id
      and c.is_published = true
      and exists (
        select 1
        from public.package_courses pc
        join public.packages p on p.id = pc.package_id
        where pc.course_id = c.id
          and p.active = true
      )
  ) then
    return;
  end if;

  return query
  select
    d.id as day_id,
    d.month_id as day_month_id,
    d.title as day_title,
    d.day_number,
    d.sort_order as day_sort_order,
    d.created_at as day_created_at,
    v.id as video_id,
    v.day_id as video_day_id,
    v.title as video_title,
    case when v.is_free_preview then v.video_url else null end as video_url,
    v.thumbnail_url,
    case when v.is_free_preview then v.details else null end as details,
    v.duration_sec,
    v.is_free_preview,
    v.sort_order as video_sort_order,
    v.created_at as video_created_at
  from public.days d
  left join public.videos v on v.day_id = d.id
  where d.month_id = p_month_id
  order by d.day_number nulls last, d.sort_order, d.created_at, v.sort_order, v.created_at;
end;
$$;

create or replace function public.track_device()
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_device_id text;
  v_ua text;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  v_device_id := public.request_device_id();
  if v_device_id is null or length(v_device_id) < 8 then
    raise exception 'Missing device id';
  end if;

  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  v_ua := nullif(((current_setting('request.headers', true))::jsonb ->> 'user-agent')::text, '');

  if exists(
    select 1
    from public.user_devices ud
    where ud.user_id = v_uid
      and ud.device_id <> v_device_id
      and ud.last_seen > now() - interval '90 seconds'
  ) then
    insert into public.user_bans(user_id, active, banned_until, reason, created_by)
    values (v_uid, true, null, 'AUTO: multiple devices detected', null)
    on conflict (user_id) where active = true
    do update set
      banned_until = excluded.banned_until,
      reason = excluded.reason,
      updated_at = now();

    raise exception 'Multiple devices';
  end if;

  insert into public.user_devices(device_id, user_id, user_agent, first_seen, last_seen)
  values (v_device_id, v_uid, v_ua, now(), now())
  on conflict (device_id)
  do update set
    user_id = excluded.user_id,
    user_agent = excluded.user_agent,
    last_seen = now(),
    updated_at = now();

  return jsonb_build_object('ok', true, 'device_id', v_device_id);
end;
$$;

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_courses_updated_at') then
    create trigger trg_courses_updated_at before update on public.courses
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_packages_updated_at') then
    create trigger trg_packages_updated_at before update on public.packages
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_age_groups_updated_at') then
    create trigger trg_age_groups_updated_at before update on public.age_groups
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_player_cards_updated_at') then
    create trigger trg_player_cards_updated_at before update on public.player_cards
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_months_updated_at') then
    create trigger trg_months_updated_at before update on public.months
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_days_updated_at') then
    create trigger trg_days_updated_at before update on public.days
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_videos_updated_at') then
    create trigger trg_videos_updated_at before update on public.videos
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_enrollments_updated_at') then
    create trigger trg_enrollments_updated_at before update on public.enrollments
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_subscription_codes_updated_at') then
    create trigger trg_subscription_codes_updated_at before update on public.subscription_codes
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_course_month_access_updated_at') then
    create trigger trg_course_month_access_updated_at before update on public.course_month_access
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_month_codes_updated_at') then
    create trigger trg_month_codes_updated_at before update on public.month_codes
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_age_group_codes_updated_at') then
    create trigger trg_age_group_codes_updated_at before update on public.age_group_codes
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_course_age_group_access_updated_at') then
    create trigger trg_course_age_group_access_updated_at before update on public.course_age_group_access
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_devices_updated_at') then
    create trigger trg_user_devices_updated_at before update on public.user_devices
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_device_bans_updated_at') then
    create trigger trg_device_bans_updated_at before update on public.device_bans
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_bans_updated_at') then
    create trigger trg_user_bans_updated_at before update on public.user_bans
    for each row execute function public.set_updated_at();
  end if;
  if not exists (select 1 from pg_trigger where tgname = 'trg_user_profiles_updated_at') then
    create trigger trg_user_profiles_updated_at before update on public.user_profiles
    for each row execute function public.set_updated_at();
  end if;
end $$;

-- =========================================================
-- Helper functions (admin + enrollment)
-- =========================================================

create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(select 1 from public.admin_users au where au.user_id = uid);
$$;

drop trigger if exists trg_package_courses_require_course on public.package_courses;
drop function if exists public.enforce_course_in_package();

create or replace function public.enforce_course_in_package()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
  v_ids uuid[];
begin
  v_ids := array_remove(array[old.course_id, new.course_id], null);
  if coalesce(array_length(v_ids, 1), 0) = 0 then
    return null;
  end if;

  foreach v_course_id in array v_ids loop
    if not exists (select 1 from public.courses c where c.id = v_course_id) then
      continue;
    end if;

    if not exists (select 1 from public.package_courses pc where pc.course_id = v_course_id) then
      raise exception 'Course must belong to a package';
    end if;
  end loop;

  return null;
end;
$$;

drop trigger if exists trg_courses_require_package on public.courses;
drop function if exists public.enforce_course_has_package();

create or replace function public.enforce_course_has_package()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
begin
  if new.id is null then
    return null;
  end if;

  if not exists (select 1 from public.package_courses pc where pc.course_id = new.id) then
    raise exception 'Course must belong to a package';
  end if;

  return null;
end;
$$;

drop function if exists public.admin_create_course_in_package(uuid, text, text, text, text, text);
drop function if exists public.admin_create_course_in_package(uuid, text, text, text, text, text, text);

create or replace function public.admin_create_course_in_package(
  p_package_id uuid,
  p_slug text,
  p_title_ar text,
  p_title_en text,
  p_description text,
  p_cover_image_url text,
  p_theme text
)
returns uuid
language plpgsql
security definer
set search_path = public
as $$
declare
  v_course_id uuid;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  if p_package_id is null then
    raise exception 'Missing package';
  end if;

  if not exists (select 1 from public.packages p where p.id = p_package_id) then
    raise exception 'Package not found';
  end if;

  if p_slug is null or length(trim(p_slug)) = 0 then
    raise exception 'Missing slug';
  end if;

  insert into public.courses (slug, title_ar, title_en, description, cover_image_url, theme)
  values (
    lower(trim(p_slug)),
    nullif(trim(coalesce(p_title_ar, '')), ''),
    nullif(trim(coalesce(p_title_en, '')), ''),
    nullif(trim(coalesce(p_description, '')), ''),
    nullif(trim(coalesce(p_cover_image_url, '')), ''),
    nullif(trim(coalesce(p_theme, '')), '')
  )
  returning id into v_course_id;

  insert into public.package_courses (package_id, course_id, sort_order)
  values (
    p_package_id,
    v_course_id,
    coalesce((select max(pc.sort_order) + 1 from public.package_courses pc where pc.package_id = p_package_id), 0)
  );

  return v_course_id;
end;
$$;

drop trigger if exists trg_packages_attach_courses on public.packages;

drop function if exists public.trg_packages_attach_courses_fn();

do $$
begin
  if not exists (select 1 from pg_trigger where tgname = 'trg_courses_require_package') then
    create constraint trigger trg_courses_require_package
    after insert on public.courses
    deferrable initially deferred
    for each row execute function public.enforce_course_has_package();
  end if;

  if not exists (select 1 from pg_trigger where tgname = 'trg_package_courses_require_course') then
    create constraint trigger trg_package_courses_require_course
    after insert or update or delete on public.package_courses
    deferrable initially deferred
    for each row execute function public.enforce_course_in_package();
  end if;

end $$;

create or replace function public.is_user_banned(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.user_bans b
    where b.user_id = uid
      and b.active = true
      and (b.banned_until is null or b.banned_until > now())
  );
$$;

create or replace function public.has_active_enrollment(
  p_course_id uuid,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.enrollments e
    where e.user_id = uid
      and e.course_id = p_course_id
      and e.status = 'active'
      and (e.end_at is null or e.end_at > now())
  );
$$;

create or replace function public.has_full_course_access(
  p_course_id uuid,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.enrollments e
    where e.user_id = uid
      and e.course_id = p_course_id
      and e.status = 'active'
      and (e.end_at is null or e.end_at > now())
      and coalesce(e.source, 'manual') in ('code', 'manual', 'admin')
  );
$$;

create or replace function public.has_active_month_access(
  p_course_id uuid,
  p_month_number int,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.course_month_access a
    where a.user_id = uid
      and a.course_id = p_course_id
      and a.month_number = p_month_number
      and a.status = 'active'
      and a.end_at is not null
      and a.end_at > now()
  );
$$;

create or replace function public.has_any_active_month_access(
  p_course_id uuid,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.course_month_access a
    where a.user_id = uid
      and a.course_id = p_course_id
      and a.status = 'active'
      and a.end_at is not null
      and a.end_at > now()
  );
$$;

create or replace function public.has_active_age_group_access(
  p_age_group_id uuid,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.course_age_group_access a
    where a.user_id = uid
      and a.age_group_id = p_age_group_id
      and a.status = 'active'
      and (a.end_at is null or a.end_at > now())
  );
$$;

create or replace function public.has_active_player_card_access(
  p_player_card_id uuid,
  uid uuid default auth.uid()
)
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  select exists(
    select 1
    from public.course_age_group_access a
    where a.user_id = uid
      and a.player_card_id = p_player_card_id
      and a.status = 'active'
      and (a.end_at is null or a.end_at > now())
  );
$$;

-- Redeem code: creates/extends enrollment + logs redemption
create or replace function public.redeem_subscription_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_code public.subscription_codes%rowtype;
  v_used_count int;
  v_now timestamptz := now();
  v_end timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  if public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  select * into v_code
  from public.subscription_codes
  where code = p_code and active = true
  limit 1;

  if v_code.id is null then
    if exists (
      select 1
      from public.month_codes mc
      where mc.code = p_code and mc.active = true
      limit 1
    ) then
      raise exception 'Month code';
    end if;

    if exists (
      select 1
      from public.age_group_codes agc
      where agc.code = p_code and agc.active = true
      limit 1
    ) then
      raise exception 'Card code';
    end if;

    raise exception 'Invalid code';
  end if;

  select count(*) into v_used_count
  from public.code_redemptions
  where code_id = v_code.id;

  if v_used_count >= v_code.max_redemptions then
    raise exception 'Code already used';
  end if;

  insert into public.code_redemptions(code_id, user_id)
  values (v_code.id, v_uid);

  v_end := v_now + make_interval(days => v_code.duration_days);

  insert into public.enrollments as e(user_id, course_id, status, start_at, end_at, source, created_by)
  values (v_uid, v_code.course_id, 'active', v_now, v_end, 'code', v_uid)
  on conflict (user_id, course_id)
  do update set
    status = 'active',
    start_at = least(e.start_at, excluded.start_at),
    end_at = greatest(coalesce(e.end_at, excluded.end_at), excluded.end_at),
    source = 'code',
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'course_id', v_code.course_id,
    'end_at', v_end
  );
end;
$$;

create or replace function public.redeem_month_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_code public.month_codes%rowtype;
  v_used_count int;
  v_now timestamptz := now();
  v_end timestamptz;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  if public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  select * into v_code
  from public.month_codes
  where code = p_code and active = true
  limit 1;

  if v_code.id is null then
    if exists (
      select 1
      from public.subscription_codes sc
      where sc.code = p_code and sc.active = true
      limit 1
    ) then
      raise exception 'Course code';
    end if;

    if exists (
      select 1
      from public.age_group_codes agc
      where agc.code = p_code and agc.active = true
      limit 1
    ) then
      raise exception 'Card code';
    end if;

    raise exception 'Invalid code';
  end if;

  select count(*) into v_used_count
  from public.month_code_redemptions
  where code_id = v_code.id;

  if v_used_count >= v_code.max_redemptions then
    raise exception 'Code already used';
  end if;

  insert into public.month_code_redemptions(code_id, user_id)
  values (v_code.id, v_uid);

  v_end := v_now + make_interval(days => v_code.duration_days);

  insert into public.course_month_access as a(user_id, course_id, month_number, status, start_at, end_at, source, created_by)
  values (v_uid, v_code.course_id, v_code.month_number, 'active', v_now, v_end, 'code', v_uid)
  on conflict (user_id, course_id, month_number)
  do update set
    status = 'active',
    start_at = least(a.start_at, excluded.start_at),
    end_at = greatest(coalesce(a.end_at, excluded.end_at), excluded.end_at),
    source = 'code',
    updated_at = now();

  insert into public.enrollments as e(user_id, course_id, status, start_at, end_at, source, created_by)
  values (v_uid, v_code.course_id, 'active', v_now, v_end, 'month_code', v_uid)
  on conflict (user_id, course_id)
  do update set
    status = 'active',
    start_at = least(e.start_at, excluded.start_at),
    end_at = greatest(coalesce(e.end_at, excluded.end_at), excluded.end_at),
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'course_id', v_code.course_id,
    'month_number', v_code.month_number,
    'end_at', v_end
  );
end;
$$;

create or replace function public.redeem_age_group_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
declare
  v_uid uuid;
  v_code public.age_group_codes%rowtype;
  v_used_count int;
  v_now timestamptz := now();
  v_end timestamptz;
  v_card public.player_cards%rowtype;
  v_ag public.age_groups%rowtype;
begin
  v_uid := auth.uid();
  if v_uid is null then
    raise exception 'Not authenticated';
  end if;

  if public.is_device_banned() then
    raise exception 'Device banned';
  end if;

  if public.is_user_banned(v_uid) then
    raise exception 'User banned';
  end if;

  select * into v_code
  from public.age_group_codes
  where code = p_code and active = true
  limit 1;

  if v_code.id is null then
    if exists (
      select 1
      from public.subscription_codes sc
      where sc.code = p_code and sc.active = true
      limit 1
    ) then
      raise exception 'Course code';
    end if;

    if exists (
      select 1
      from public.month_codes mc
      where mc.code = p_code and mc.active = true
      limit 1
    ) then
      raise exception 'Month code';
    end if;

    raise exception 'Invalid code';
  end if;

  if v_code.player_card_id is null then
    raise exception 'Invalid code';
  end if;

  select * into v_card
  from public.player_cards
  where id = v_code.player_card_id
  limit 1;

  if v_card.id is null then
    raise exception 'Invalid code';
  end if;

  select * into v_ag
  from public.age_groups
  where id = v_card.age_group_id
  limit 1;

  if v_ag.id is null then
    raise exception 'Invalid code';
  end if;

  if v_ag.course_id <> v_code.course_id then
    raise exception 'Invalid code';
  end if;

  if v_code.age_group_id <> v_ag.id then
    raise exception 'Invalid code';
  end if;

  select count(*) into v_used_count
  from public.age_group_code_redemptions
  where code_id = v_code.id;

  if v_used_count >= v_code.max_redemptions then
    raise exception 'Code already used';
  end if;

  insert into public.age_group_code_redemptions(code_id, user_id)
  values (v_code.id, v_uid);

  v_end := v_now + make_interval(days => v_code.duration_days);

  insert into public.course_age_group_access as a(user_id, course_id, age_group_id, player_card_id, status, start_at, end_at, source, created_by)
  values (v_uid, v_code.course_id, v_ag.id, v_code.player_card_id, 'active', v_now, v_end, 'age_code', v_uid)
  on conflict (user_id, course_id, player_card_id)
  do update set
    status = 'active',
    start_at = least(a.start_at, excluded.start_at),
    end_at = greatest(coalesce(a.end_at, excluded.end_at), excluded.end_at),
    source = 'age_code',
    updated_at = now();

  return jsonb_build_object(
    'ok', true,
    'course_id', v_code.course_id,
    'age_group_id', v_ag.id,
    'player_card_id', v_code.player_card_id,
    'end_at', v_end
  );
end;
$$;

create or replace function public.redeem_any_code(p_code text)
returns jsonb
language plpgsql
security definer
set search_path = public
as $$
begin
  begin
    return public.redeem_subscription_code(p_code);
  exception when others then
    if SQLERRM = 'Month code' then
      return public.redeem_month_code(p_code);
    end if;

    if SQLERRM = 'Card code' then
      return public.redeem_age_group_code(p_code);
    end if;

    raise;
  end;
end;
$$;

-- Admin-only generator
create or replace function public.generate_subscription_codes(
  p_course_slug text,
  p_count int,
  p_duration_days int default 30,
  p_max_redemptions int default 1
)
returns table(code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_course_id uuid;
  i int;
  v_code text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select id into v_course_id from public.courses where slug = p_course_slug limit 1;
  if v_course_id is null then
    raise exception 'Course not found';
  end if;

  if p_count is null or p_count <= 0 then
    raise exception 'Count must be > 0';
  end if;

  i := 0;
  while i < p_count loop
    v_code := upper(encode(gen_random_bytes(6), 'hex'));

    begin
      insert into public.subscription_codes(code, course_id, duration_days, max_redemptions, active, created_by)
      values (v_code, v_course_id, p_duration_days, p_max_redemptions, true, auth.uid());

      code := v_code;
      return next;
      i := i + 1;
    exception when unique_violation then
      -- retry
      null;
    end;
  end loop;
end;
$$;

create or replace function public.generate_age_group_codes(
  p_course_slug text,
  p_player_card_id uuid,
  p_count int,
  p_duration_days int default 30,
  p_max_redemptions int default 1
)
returns table(code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_course_id uuid;
  v_age_group_id uuid;
  v_course_from_card uuid;
  i int;
  v_code text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select id into v_course_id from public.courses where slug = p_course_slug limit 1;
  if v_course_id is null then
    raise exception 'Course not found';
  end if;

  if p_player_card_id is null then
    raise exception 'Missing card';
  end if;

  select pc.age_group_id into v_age_group_id
  from public.player_cards pc
  where pc.id = p_player_card_id
  limit 1;

  if v_age_group_id is null then
    raise exception 'Card not found';
  end if;

  select ag.course_id into v_course_from_card
  from public.age_groups ag
  where ag.id = v_age_group_id
  limit 1;

  if v_course_from_card is null or v_course_from_card <> v_course_id then
    raise exception 'Card not in course';
  end if;

  if p_count is null or p_count <= 0 then
    raise exception 'Count must be > 0';
  end if;

  i := 0;
  while i < p_count loop
    v_code := upper(encode(gen_random_bytes(6), 'hex'));

    begin
      insert into public.age_group_codes(code, course_id, age_group_id, player_card_id, duration_days, max_redemptions, active, created_by)
      values (v_code, v_course_id, v_age_group_id, p_player_card_id, p_duration_days, p_max_redemptions, true, auth.uid());

      code := v_code;
      return next;
      i := i + 1;
    exception when unique_violation then
      null;
    end;
  end loop;
end;
$$;

create or replace function public.generate_month_codes(
  p_course_slug text,
  p_month_number int,
  p_count int,
  p_duration_days int default 40,
  p_max_redemptions int default 1
)
returns table(code text)
language plpgsql
security definer
set search_path = public, extensions
as $$
declare
  v_course_id uuid;
  i int;
  v_code text;
begin
  if not public.is_admin(auth.uid()) then
    raise exception 'Not authorized';
  end if;

  select id into v_course_id from public.courses where slug = p_course_slug limit 1;
  if v_course_id is null then
    raise exception 'Course not found';
  end if;

  if p_month_number is null or p_month_number <= 0 then
    raise exception 'Month number must be > 0';
  end if;

  if p_count is null or p_count <= 0 then
    raise exception 'Count must be > 0';
  end if;

  i := 0;
  while i < p_count loop
    v_code := upper(encode(gen_random_bytes(6), 'hex'));

    begin
      insert into public.month_codes(code, course_id, month_number, duration_days, max_redemptions, active, created_by)
      values (v_code, v_course_id, p_month_number, p_duration_days, p_max_redemptions, true, auth.uid());

      code := v_code;
      return next;
      i := i + 1;
    exception when unique_violation then
      null;
    end;
  end loop;
end;
$$;

-- =========================================================
-- Row Level Security (RLS)
-- =========================================================

alter table public.courses enable row level security;
alter table public.packages enable row level security;
alter table public.package_courses enable row level security;
alter table public.package_course_age_groups enable row level security;
alter table public.age_groups enable row level security;
alter table public.player_cards enable row level security;
alter table public.months enable row level security;
alter table public.days enable row level security;
alter table public.videos enable row level security;
alter table public.admin_users enable row level security;
alter table public.enrollments enable row level security;
alter table public.subscription_codes enable row level security;
alter table public.code_redemptions enable row level security;
alter table public.user_devices enable row level security;
alter table public.device_bans enable row level security;
alter table public.user_bans enable row level security;
alter table public.user_profiles enable row level security;
alter table public.contact_requests enable row level security;
alter table public.course_age_group_access enable row level security;
alter table public.age_group_codes enable row level security;
alter table public.age_group_code_redemptions enable row level security;

-- Courses: public read, admin write
drop policy if exists "courses_select_public" on public.courses;
create policy "courses_select_public" on public.courses
for select
to anon, authenticated
using (
  is_published = true
  and exists (
    select 1
    from public.package_courses pc
    join public.packages p on p.id = pc.package_id
    where pc.course_id = public.courses.id
      and p.active = true
  )
);

drop policy if exists "packages_select_public" on public.packages;
create policy "packages_select_public" on public.packages
for select
to anon, authenticated
using (active = true);

drop policy if exists "packages_admin_write" on public.packages;
create policy "packages_admin_write" on public.packages
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "package_courses_select_public" on public.package_courses;
create policy "package_courses_select_public" on public.package_courses
for select
to anon, authenticated
using (exists (select 1 from public.packages p where p.id = package_id and p.active = true));

drop policy if exists "package_courses_admin_write" on public.package_courses;
create policy "package_courses_admin_write" on public.package_courses
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "package_course_age_groups_select_public" on public.package_course_age_groups;
create policy "package_course_age_groups_select_public" on public.package_course_age_groups
for select
to anon, authenticated
using (exists (select 1 from public.packages p where p.id = package_id and p.active = true));

drop policy if exists "package_course_age_groups_admin_write" on public.package_course_age_groups;
create policy "package_course_age_groups_admin_write" on public.package_course_age_groups
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "courses_admin_write" on public.courses;
drop policy if exists "courses_admin_select" on public.courses;
drop policy if exists "courses_admin_update" on public.courses;
drop policy if exists "courses_admin_delete" on public.courses;

create policy "courses_admin_select" on public.courses
for select
to authenticated
using (public.is_admin(auth.uid()));

create policy "courses_admin_update" on public.courses
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

create policy "courses_admin_delete" on public.courses
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Age groups: public read, admin write
drop policy if exists "age_groups_select_public" on public.age_groups;
create policy "age_groups_select_public" on public.age_groups
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
    and (
      public.has_full_course_access(public.age_groups.course_id, auth.uid())
      or public.has_active_age_group_access(public.age_groups.id, auth.uid())
    )
  )
);

drop policy if exists "age_groups_admin_write" on public.age_groups;
create policy "age_groups_admin_write" on public.age_groups
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Player cards: public read, admin write
drop policy if exists "player_cards_select_public" on public.player_cards;
create policy "player_cards_select_public" on public.player_cards
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
    and (
      public.has_active_player_card_access(public.player_cards.id, auth.uid())
      or exists (
        select 1
        from public.age_groups ag
        where ag.id = public.player_cards.age_group_id
          and public.has_full_course_access(ag.course_id, auth.uid())
      )
    )
  )
);

drop policy if exists "player_cards_admin_write" on public.player_cards;
create policy "player_cards_admin_write" on public.player_cards
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

do $$
declare
  r record;
begin
  for r in (
    select policyname, tablename
    from pg_policies
    where schemaname = 'public'
      and tablename in ('months', 'days', 'videos')
  ) loop
    execute format('drop policy if exists %I on public.%I', r.policyname, r.tablename);
  end loop;
end $$;

-- Months: admin or active enrollment (via course)
drop policy if exists "months_select_gated" on public.months;
create policy "months_select_gated" on public.months
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
    and exists (
      select 1
      from public.age_groups ag
      join public.courses c on c.id = ag.course_id
      where ag.id = public.months.age_group_id
        and (
          public.has_full_course_access(c.id, auth.uid())
          or public.has_active_age_group_access(ag.id, auth.uid())
        )
    )
  )
);

drop policy if exists "months_admin_write" on public.months;
create policy "months_admin_write" on public.months
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Days: admin or active enrollment (via course)
drop policy if exists "days_select_gated" on public.days;
create policy "days_select_gated" on public.days
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
    and exists (
      select 1
      from public.months m
      join public.age_groups ag on ag.id = m.age_group_id
      join public.courses c on c.id = ag.course_id
      where m.id = public.days.month_id
        and (
          public.has_full_course_access(c.id, auth.uid())
          or public.has_active_age_group_access(ag.id, auth.uid())
        )
    )
  )
);

drop policy if exists "days_admin_write" on public.days;
create policy "days_admin_write" on public.days
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Videos: admin or active enrollment (via course)
drop policy if exists "videos_select_gated" on public.videos;
create policy "videos_select_gated" on public.videos
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
    and exists (
      select 1
      from public.days d
      join public.months m on m.id = d.month_id
      join public.age_groups ag on ag.id = m.age_group_id
      join public.courses c on c.id = ag.course_id
      where d.id = public.videos.day_id
        and (
          public.has_full_course_access(c.id, auth.uid())
          or public.has_active_age_group_access(ag.id, auth.uid())
        )
    )
  )
);

drop policy if exists "videos_admin_write" on public.videos;
create policy "videos_admin_write" on public.videos
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Month codes: admin only
alter table public.course_month_access enable row level security;
alter table public.month_codes enable row level security;
alter table public.month_code_redemptions enable row level security;

drop policy if exists "course_month_access_select" on public.course_month_access;
create policy "course_month_access_select" on public.course_month_access
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "course_month_access_insert" on public.course_month_access;
create policy "course_month_access_insert" on public.course_month_access
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "course_month_access_admin_update" on public.course_month_access;
create policy "course_month_access_admin_update" on public.course_month_access
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "course_month_access_admin_delete" on public.course_month_access;
create policy "course_month_access_admin_delete" on public.course_month_access
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "month_codes_admin_only" on public.month_codes;
create policy "month_codes_admin_only" on public.month_codes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "month_code_redemptions_select" on public.month_code_redemptions;
create policy "month_code_redemptions_select" on public.month_code_redemptions
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "month_code_redemptions_insert" on public.month_code_redemptions;
create policy "month_code_redemptions_insert" on public.month_code_redemptions
for insert
to authenticated
with check (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false);

-- Card codes: admin only
drop policy if exists "age_group_codes_admin_only" on public.age_group_codes;
create policy "age_group_codes_admin_only" on public.age_group_codes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Card access: user can see their access; admin can manage
drop policy if exists "course_age_group_access_select" on public.course_age_group_access;
create policy "course_age_group_access_select" on public.course_age_group_access
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "course_age_group_access_insert" on public.course_age_group_access;
create policy "course_age_group_access_insert" on public.course_age_group_access
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "course_age_group_access_admin_update" on public.course_age_group_access;
create policy "course_age_group_access_admin_update" on public.course_age_group_access
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "course_age_group_access_admin_delete" on public.course_age_group_access;
create policy "course_age_group_access_admin_delete" on public.course_age_group_access
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Card code redemptions: user can see their redemptions; admin can see all
drop policy if exists "age_group_code_redemptions_select" on public.age_group_code_redemptions;
create policy "age_group_code_redemptions_select" on public.age_group_code_redemptions
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "age_group_code_redemptions_insert" on public.age_group_code_redemptions;
create policy "age_group_code_redemptions_insert" on public.age_group_code_redemptions
for insert
to authenticated
with check (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false);

-- Admin users: allow a user to see their own row (to check if admin); admin can see all
drop policy if exists "admin_users_select_self" on public.admin_users;
create policy "admin_users_select_self" on public.admin_users
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "admin_users_admin_write" on public.admin_users;
create policy "admin_users_admin_write" on public.admin_users
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Enrollments: user can see their enrollments; admin can manage
drop policy if exists "enrollments_select" on public.enrollments;
create policy "enrollments_select" on public.enrollments
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "enrollments_insert_self" on public.enrollments;
create policy "enrollments_insert_self" on public.enrollments
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "enrollments_admin_write" on public.enrollments;
drop policy if exists "enrollments_admin_update" on public.enrollments;
create policy "enrollments_admin_update" on public.enrollments
for update
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "enrollments_admin_delete" on public.enrollments;
create policy "enrollments_admin_delete" on public.enrollments
for delete
to authenticated
using (public.is_admin(auth.uid()));

-- Subscription codes: admin only
drop policy if exists "subscription_codes_admin_only" on public.subscription_codes;
create policy "subscription_codes_admin_only" on public.subscription_codes
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- Code redemptions: user can see their redemptions; admin can see all
drop policy if exists "code_redemptions_select" on public.code_redemptions;
create policy "code_redemptions_select" on public.code_redemptions
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "code_redemptions_insert" on public.code_redemptions;
create policy "code_redemptions_insert" on public.code_redemptions
for insert
to authenticated
with check (public.is_admin(auth.uid()));

drop policy if exists "user_profiles_select" on public.user_profiles;
create policy "user_profiles_select" on public.user_profiles
for select
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "user_profiles_insert_self" on public.user_profiles;
create policy "user_profiles_insert_self" on public.user_profiles
for insert
to authenticated
with check (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "user_profiles_update_self" on public.user_profiles;
create policy "user_profiles_update_self" on public.user_profiles
for update
to authenticated
using (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false))
with check (public.is_admin(auth.uid()) or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false));

drop policy if exists "user_profiles_delete_admin" on public.user_profiles;
create policy "user_profiles_delete_admin" on public.user_profiles
for delete
to authenticated
using (public.is_admin(auth.uid()));

drop policy if exists "contact_requests_insert" on public.contact_requests;
create policy "contact_requests_insert" on public.contact_requests
for insert
to anon, authenticated
with check (public.is_device_banned() = false and (auth.uid() is null or public.is_user_banned(auth.uid()) = false));

drop policy if exists "contact_requests_admin_only" on public.contact_requests;
create policy "contact_requests_admin_only" on public.contact_requests
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

-- User devices: user can upsert their own device row; admin can view all
drop policy if exists "user_devices_select" on public.user_devices;
create policy "user_devices_select" on public.user_devices
for select
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    (user_id = auth.uid() or device_id = public.request_device_id())
    and public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
  )
);

drop policy if exists "user_devices_upsert" on public.user_devices;
create policy "user_devices_upsert" on public.user_devices
for insert
to authenticated
with check (
  public.is_admin(auth.uid())
  or (
    user_id = auth.uid()
    and device_id = public.request_device_id()
    and public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
  )
);

drop policy if exists "user_devices_update" on public.user_devices;
create policy "user_devices_update" on public.user_devices
for update
to authenticated
using (
  public.is_admin(auth.uid())
  or (
    (user_id = auth.uid() or device_id = public.request_device_id())
    and public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
  )
)
with check (
  public.is_admin(auth.uid())
  or (
    user_id = auth.uid()
    and device_id = public.request_device_id()
    and public.is_device_banned() = false
    and public.is_user_banned(auth.uid()) = false
  )
);

-- Device bans: admin only
drop policy if exists "device_bans_admin_only" on public.device_bans;
create policy "device_bans_admin_only" on public.device_bans
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

drop policy if exists "user_bans_select_self" on public.user_bans;
create policy "user_bans_select_self" on public.user_bans
for select
to authenticated
using (user_id = auth.uid() or public.is_admin(auth.uid()));

drop policy if exists "user_bans_admin_only" on public.user_bans;
create policy "user_bans_admin_only" on public.user_bans
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant usage on schema public to anon, authenticated;

grant select on table public.courses to anon, authenticated;
grant select on table public.packages to anon, authenticated;
grant select on table public.package_courses to anon, authenticated;
grant select on table public.package_course_age_groups to anon, authenticated;
grant select on table public.age_groups to anon, authenticated;
grant select on table public.player_cards to anon, authenticated;

revoke insert on table public.courses from authenticated;
grant select, update, delete on table public.courses to authenticated;
grant select, insert, update, delete on table public.age_groups to authenticated;
grant select, insert, update, delete on table public.player_cards to authenticated;
grant select, insert, update, delete on table public.months to authenticated;
grant select, insert, update, delete on table public.days to authenticated;
grant select, insert, update, delete on table public.videos to authenticated;
grant select, insert, update, delete on table public.packages to authenticated;
grant select, insert, update, delete on table public.package_courses to authenticated;
grant select, insert, update, delete on table public.package_course_age_groups to authenticated;
grant select, insert, update, delete on table public.admin_users to authenticated;
grant select, insert, update, delete on table public.enrollments to authenticated;
grant select, insert, update, delete on table public.subscription_codes to authenticated;
grant select, insert, update, delete on table public.code_redemptions to authenticated;
grant select, insert, update, delete on table public.course_month_access to authenticated;
grant select, insert, update, delete on table public.month_codes to authenticated;
grant select, insert, update, delete on table public.month_code_redemptions to authenticated;
grant select, insert, update, delete on table public.course_age_group_access to authenticated;
grant select, insert, update, delete on table public.age_group_codes to authenticated;
grant select, insert, update, delete on table public.age_group_code_redemptions to authenticated;
grant select, insert, update, delete on table public.user_devices to authenticated;
grant select, insert, update, delete on table public.device_bans to authenticated;
grant select, insert, update, delete on table public.user_bans to authenticated;
grant select, insert, update, delete on table public.user_profiles to authenticated;
grant select, insert, update, delete on table public.contact_requests to authenticated;

grant insert on table public.contact_requests to anon;

grant execute on function public.request_device_id() to anon, authenticated;
grant execute on function public.is_device_banned() to anon, authenticated;
grant execute on function public.preview_months(uuid) to anon, authenticated;
grant execute on function public.preview_days(uuid) to anon, authenticated;
grant execute on function public.preview_videos(uuid) to anon, authenticated;
grant execute on function public.preview_age_groups(uuid) to anon, authenticated;
grant execute on function public.preview_course_player_cards(uuid, uuid) to anon, authenticated;
grant execute on function public.preview_player_card(uuid) to anon, authenticated;
grant execute on function public.preview_month_schedule(uuid) to anon, authenticated;
grant execute on function public.is_admin(uuid) to authenticated;
grant execute on function public.is_user_banned(uuid) to authenticated;
grant execute on function public.has_active_enrollment(uuid, uuid) to authenticated;
grant execute on function public.has_full_course_access(uuid, uuid) to authenticated;
grant execute on function public.has_active_month_access(uuid, int, uuid) to authenticated;
grant execute on function public.has_any_active_month_access(uuid, uuid) to authenticated;
grant execute on function public.has_active_age_group_access(uuid, uuid) to authenticated;
grant execute on function public.has_active_player_card_access(uuid, uuid) to authenticated;
grant execute on function public.track_device() to authenticated;
grant execute on function public.admin_create_course_in_package(uuid, text, text, text, text, text, text) to authenticated;
grant execute on function public.redeem_subscription_code(text) to authenticated;
grant execute on function public.generate_subscription_codes(text, int, int, int) to authenticated;
grant execute on function public.redeem_month_code(text) to authenticated;
grant execute on function public.generate_month_codes(text, int, int, int, int) to authenticated;
grant execute on function public.redeem_age_group_code(text) to authenticated;
grant execute on function public.redeem_any_code(text) to authenticated;
grant execute on function public.generate_age_group_codes(text, uuid, int, int, int) to authenticated;

-- =========================================================
-- Helpful indexes
-- =========================================================

create index if not exists idx_age_groups_course_id on public.age_groups(course_id);
create index if not exists idx_player_cards_age_group_id on public.player_cards(age_group_id);
create index if not exists idx_months_age_group_id on public.months(age_group_id);
create index if not exists idx_days_month_id on public.days(month_id);
create index if not exists idx_course_month_access_user_course on public.course_month_access(user_id, course_id);
create index if not exists idx_month_codes_course_month on public.month_codes(course_id, month_number);
create index if not exists idx_month_code_redemptions_code_id on public.month_code_redemptions(code_id);
create index if not exists idx_course_age_group_access_user_course on public.course_age_group_access(user_id, course_id);
create index if not exists idx_course_age_group_access_player_card_id on public.course_age_group_access(player_card_id);
create unique index if not exists ux_course_age_group_access_user_course_card on public.course_age_group_access(user_id, course_id, player_card_id);
create index if not exists idx_age_group_codes_course_id on public.age_group_codes(course_id);
create index if not exists idx_age_group_codes_player_card_id on public.age_group_codes(player_card_id);
create index if not exists idx_age_group_code_redemptions_code_id on public.age_group_code_redemptions(code_id);
create index if not exists idx_videos_day_id on public.videos(day_id);
create index if not exists idx_enrollments_user_course on public.enrollments(user_id, course_id);
create index if not exists idx_subscription_codes_course on public.subscription_codes(course_id);
create index if not exists idx_code_redemptions_user on public.code_redemptions(user_id);
create index if not exists idx_package_courses_course_id on public.package_courses(course_id);

create index if not exists idx_user_devices_user_id on public.user_devices(user_id);
create index if not exists idx_device_bans_device_id on public.device_bans(device_id);
create unique index if not exists idx_device_bans_device_id_active_unique on public.device_bans(device_id) where active = true;

create index if not exists idx_user_bans_user_id on public.user_bans(user_id);
create unique index if not exists idx_user_bans_user_id_active_unique on public.user_bans(user_id) where active = true;

create index if not exists idx_contact_requests_course_title on public.contact_requests(course_title);
create index if not exists idx_contact_requests_created_at on public.contact_requests(created_at);

-- =========================================================
-- Optional: minimal seed (edit as needed)
-- =========================================================
-- insert into public.courses (slug, title_ar, title_en, description, cover_image_url, theme)
-- values
-- ('football','كورس كرة القدم','Football','...','/kalya.png','green');
