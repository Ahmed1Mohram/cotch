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



alter table public.courses add column if not exists featured boolean not null default false;

alter table public.courses add column if not exists featured_sort_order int;

alter table public.courses add column if not exists featured_package_id uuid;



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

  package_id uuid references public.packages(id) on delete cascade,

  title text,

  month_number int,

  sort_order int not null default 0,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now()

);



alter table public.months

  add column if not exists package_id uuid references public.packages(id) on delete cascade;



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



create table if not exists public.chat_threads (

  id uuid primary key default gen_random_uuid(),

  course_id uuid not null references public.courses(id) on delete cascade,

  user_id uuid not null references auth.users(id) on delete cascade,

  user_full_name text,

  user_phone text,

  last_message_at timestamptz,

  last_message_text text,

  created_at timestamptz not null default now(),

  updated_at timestamptz not null default now(),

  unique(course_id, user_id)

);



create table if not exists public.chat_messages (

  id uuid primary key default gen_random_uuid(),

  thread_id uuid not null references public.chat_threads(id) on delete cascade,

  sender_user_id uuid not null references auth.users(id) on delete cascade,

  sender_role text not null default 'user',

  body text not null,

  created_at timestamptz not null default now(),

  constraint chat_messages_sender_role_check check (sender_role in ('user','admin'))

);



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



create or replace function public.trg_chat_messages_touch_thread_fn()

returns trigger

language plpgsql

security definer

set search_path = public

as $$

begin

  update public.chat_threads

  set

    last_message_at = new.created_at,

    last_message_text = left(new.body, 240),

    updated_at = now()

  where id = new.thread_id;



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

    and m.package_id is null

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



create or replace function public.preview_months_for_package(

  p_age_group_id uuid,

  p_package_id uuid default null

)

returns table (

  id uuid,

  age_group_id uuid,

  package_id uuid,

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

  v_use_pkg boolean := false;

  v_course_id uuid;

begin

  if public.is_device_banned() then

    raise exception 'Device banned';

  end if;



  v_uid := auth.uid();

  if v_uid is not null and public.is_user_banned(v_uid) then

    raise exception 'User banned';

  end if;



  select ag.course_id into v_course_id

  from public.age_groups ag

  where ag.id = p_age_group_id

  limit 1;



  if p_package_id is not null then

    if v_course_id is not null

      and exists (

        select 1

        from public.package_courses pc

        join public.packages p on p.id = pc.package_id

        where pc.course_id = v_course_id

          and pc.package_id = p_package_id

          and p.active = true

      )

    then

      v_use_pkg := exists (

        select 1

        from public.months m

        where m.age_group_id = p_age_group_id

          and m.package_id = p_package_id

      );

    else

      v_use_pkg := false;

    end if;

  end if;



  return query

  select m.id, m.age_group_id, m.package_id, m.title, m.month_number, m.sort_order, m.created_at

  from public.months m

  where m.age_group_id = p_age_group_id

    and (

      (v_use_pkg and m.package_id = p_package_id)

      or (not v_use_pkg and m.package_id is null)

    )

  order by m.month_number nulls last, m.sort_order, m.created_at;

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



  if not exists (select 1 from pg_trigger where tgname = 'trg_chat_threads_updated_at') then

    create trigger trg_chat_threads_updated_at before update on public.chat_threads

    for each row execute function public.set_updated_at();

  end if;



  if not exists (select 1 from pg_trigger where tgname = 'trg_chat_messages_touch_thread') then

    create trigger trg_chat_messages_touch_thread after insert on public.chat_messages

    for each row execute function public.trg_chat_messages_touch_thread_fn();

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



  insert into public.courses (slug, title_ar, title_en, description, cover_image_url, theme, featured_package_id)

  values (

    lower(trim(p_slug)),

    nullif(trim(coalesce(p_title_ar, '')), ''),

    nullif(trim(coalesce(p_title_en, '')), ''),

    nullif(trim(coalesce(p_description, '')), ''),

    nullif(trim(coalesce(p_cover_image_url, '')), ''),

    nullif(trim(coalesce(p_theme, '')), ''),

    p_package_id

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



create or replace function public.can_chat_course(

  p_course_id uuid,

  uid uuid default auth.uid()

)

returns boolean

language sql

stable

security definer

set search_path = public

as $$

  select

    public.is_admin(uid)

    or (

      uid is not null

      and public.is_device_banned() = false

      and public.is_user_banned(uid) = false

      and exists (select 1 from public.courses c where c.id = p_course_id and c.is_published = true)

      and (

        public.has_full_course_access(p_course_id, uid)

        or exists (

          select 1

          from public.course_month_access a

          where a.user_id = uid

            and a.course_id = p_course_id

            and a.status = 'active'

            and (a.end_at is null or a.end_at > now())

        )

        or exists (

          select 1

          from public.course_age_group_access a

          where a.user_id = uid

            and a.course_id = p_course_id

            and a.status = 'active'

            and (a.end_at is null or a.end_at > now())

        )

      )

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

alter table public.chat_threads enable row level security;

alter table public.chat_messages enable row level security;

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



drop policy if exists "chat_threads_select" on public.chat_threads;

create policy "chat_threads_select" on public.chat_threads

for select

to authenticated

using (

  public.is_admin(auth.uid())

  or (user_id = auth.uid() and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false)

);



drop policy if exists "chat_threads_insert" on public.chat_threads;

create policy "chat_threads_insert" on public.chat_threads

for insert

to authenticated

with check (

  public.is_admin(auth.uid())

  or (

    user_id = auth.uid()

    and public.can_chat_course(course_id, auth.uid())

    and public.is_device_banned() = false

    and public.is_user_banned(auth.uid()) = false

  )

);



drop policy if exists "chat_threads_admin_update" on public.chat_threads;

create policy "chat_threads_admin_update" on public.chat_threads

for update

to authenticated

using (public.is_admin(auth.uid()))

with check (public.is_admin(auth.uid()));



drop policy if exists "chat_threads_admin_delete" on public.chat_threads;

create policy "chat_threads_admin_delete" on public.chat_threads

for delete

to authenticated

using (public.is_admin(auth.uid()));



drop policy if exists "chat_messages_select" on public.chat_messages;

create policy "chat_messages_select" on public.chat_messages

for select

to authenticated

using (

  public.is_admin(auth.uid())

  or (

    public.is_device_banned() = false

    and public.is_user_banned(auth.uid()) = false

    and exists (

      select 1

      from public.chat_threads t

      where t.id = thread_id

        and t.user_id = auth.uid()

    )

  )

);



drop policy if exists "chat_messages_insert" on public.chat_messages;

create policy "chat_messages_insert" on public.chat_messages

for insert

to authenticated

with check (

  (

    sender_role = 'user'

    and sender_user_id = auth.uid()

    and public.is_device_banned() = false

    and public.is_user_banned(auth.uid()) = false

    and exists (

      select 1

      from public.chat_threads t

      where t.id = thread_id

        and t.user_id = auth.uid()

        and public.can_chat_course(t.course_id, auth.uid())

    )

  )

  or (

    sender_role = 'admin'

    and sender_user_id = auth.uid()

    and public.is_admin(auth.uid())

  )

);



drop policy if exists "chat_messages_admin_update" on public.chat_messages;

create policy "chat_messages_admin_update" on public.chat_messages

for update

to authenticated

using (public.is_admin(auth.uid()))

with check (public.is_admin(auth.uid()));



drop policy if exists "chat_messages_admin_delete" on public.chat_messages;

create policy "chat_messages_admin_delete" on public.chat_messages

for delete

to authenticated

using (public.is_admin(auth.uid()));



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

 grant select, insert, update, delete on table public.chat_threads to authenticated;

 grant select, insert, update, delete on table public.chat_messages to authenticated;



grant insert on table public.contact_requests to anon;



grant execute on function public.request_device_id() to anon, authenticated;

grant execute on function public.is_device_banned() to anon, authenticated;

grant execute on function public.preview_months(uuid) to anon, authenticated;

grant execute on function public.preview_months_for_package(uuid, uuid) to anon, authenticated;

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

 grant execute on function public.can_chat_course(uuid, uuid) to authenticated;

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

 create index if not exists idx_months_package_id on public.months(package_id);

 create index if not exists idx_months_age_group_package_id on public.months(age_group_id, package_id);



 do $$

 declare

   r record;

   v_keep uuid;

   v_dup uuid;

 begin

   for r in

     select

       m.age_group_id,

       m.package_id,

       m.month_number,

       array_agg(m.id order by m.created_at, m.id) as ids

     from public.months m

     where m.month_number is not null

     group by m.age_group_id, m.package_id, m.month_number

     having count(*) > 1

   loop

     v_keep := r.ids[1];

     foreach v_dup in array r.ids[2:array_length(r.ids, 1)] loop

       update public.days

       set month_id = v_keep

       where month_id = v_dup;



       delete from public.months

       where id = v_dup;

     end loop;

   end loop;

 end $$;



 create unique index if not exists ux_months_default_age_group_month_number

 on public.months(age_group_id, month_number)

 where package_id is null;



 create unique index if not exists ux_months_pkg_age_group_package_month_number

 on public.months(age_group_id, package_id, month_number)

 where package_id is not null;



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



do $$

begin

  if exists (select 1 from pg_publication where pubname = 'supabase_realtime') then

    begin

      alter publication supabase_realtime add table public.chat_threads;

    exception when duplicate_object then

      null;

    end;

    begin

      alter publication supabase_realtime add table public.chat_messages;

    exception when duplicate_object then

      null;

    end;

  end if;

end $$;



create index if not exists idx_chat_threads_user_id on public.chat_threads(user_id);

create index if not exists idx_chat_threads_course_id on public.chat_threads(course_id);

create index if not exists idx_chat_threads_last_message_at on public.chat_threads(last_message_at);

create index if not exists idx_chat_messages_thread_id_created_at on public.chat_messages(thread_id, created_at);



 -- =========================================================

 -- Optional: minimal seed (edit as needed)

 -- =========================================================

 -- insert into public.courses (slug, title_ar, title_en, description, cover_image_url, theme)

 -- values

 -- ('football','كورس كرة القدم','Football','...','/kalya.png','green');



 do $$

 declare

   v_pkg_id uuid;

   v_course_id uuid;

   v_ag_id uuid;

   v_month_id uuid;

   v_day1 uuid;

   v_day2 uuid;

   v_day3 uuid;

   v_day4 uuid;

 begin

   select id into v_pkg_id from public.packages where slug = 'small' limit 1;

   if v_pkg_id is null then

     return;

   end if;



   select id into v_course_id from public.courses where slug = 'football' limit 1;

   if v_course_id is null then

     insert into public.courses (slug, title_ar, title_en, theme, is_published)

     values ('football', 'كورس كرة القدم', 'Football', 'green', true)

     returning id into v_course_id;

   end if;



   if not exists (

     select 1

     from public.package_courses pc

     where pc.package_id = v_pkg_id

       and pc.course_id = v_course_id

   ) then

     update public.package_courses
     set sort_order = sort_order + 100
     where package_id = v_pkg_id
       and course_id <> v_course_id
       and sort_order <= 0;

     insert into public.package_courses (package_id, course_id, sort_order)
     values (v_pkg_id, v_course_id, 0)
     on conflict (package_id, course_id)
     do update set sort_order = excluded.sort_order;

   end if;



   if not exists (select 1 from public.age_groups ag where ag.course_id = v_course_id) then

     insert into public.age_groups (course_id, title, min_age, max_age, sort_order)

     values (v_course_id, 'عام', null, null, 0);

   end if;



   for v_ag_id in

     select ag.id

     from public.age_groups ag

     where ag.course_id = v_course_id

     order by ag.sort_order, ag.created_at

   loop

     select m.id into v_month_id

     from public.months m

     where m.age_group_id = v_ag_id

       and m.package_id = v_pkg_id

       and m.month_number = 1

     limit 1;



     if v_month_id is null then

       insert into public.months (age_group_id, package_id, title, month_number, sort_order)

       values (v_ag_id, v_pkg_id, 'الشهر الأول', 1, 0)

       returning id into v_month_id;

     end if;



     select d.id into v_day1 from public.days d where d.month_id = v_month_id and d.day_number = 1 limit 1;

     if v_day1 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الأول', 1, 0)

       returning id into v_day1;

     end if;



     select d.id into v_day2 from public.days d where d.month_id = v_month_id and d.day_number = 2 limit 1;

     if v_day2 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الثاني', 2, 1)

       returning id into v_day2;

     end if;



     select d.id into v_day3 from public.days d where d.month_id = v_month_id and d.day_number = 3 limit 1;

     if v_day3 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الثالث (بدني في الملعب)', 3, 2)

       returning id into v_day3;

     end if;



     select d.id into v_day4 from public.days d where d.month_id = v_month_id and d.day_number = 4 limit 1;

     if v_day4 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الرابع', 4, 3)

       returning id into v_day4;

     end if;



     -- Day 1 videos

     if not exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 1',

         'https://drive.google.com/file/d/1KkINO_uD2rsPTh312EpP7oMArths6Rhf/view',

         $txt$

📌 3 مجاميع

1️⃣ دنبل 10 كيلو – 12 عدة

2️⃣ دنبل 12.5 كيلو – 12 عدة

3️⃣ دنبل 15 كيلو – 10 عدات



وقت الراحة بين كل مجموعة: دقيقة واحدة

$txt$,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 1) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 2',

         'https://drive.google.com/file/d/1Cxm9pZMsNN8YeVjXepDOqi6Xx8LGjyTZ/view',

         $txt$

📌 3 مجاميع

1️⃣ دنبل 10 كيلو – 15 عدة

2️⃣ دنبل 12.5 كيلو – 15 عدة

3️⃣ دنبل 15 كيلو – 10 عدات



وقت الراحة: دقيقة ونصف

$txt$,

         false,

         1

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 2) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 3',

         'https://drive.google.com/file/d/1OZ4rtp34jppxFntB-hwQZoGlMT8C3I-P/view',

         $txt$

📌 3 مجاميع

1️⃣ 12 عدة لكل رجل (من غير وزن)

2️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)

3️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)



وقت الراحة بين المجاميع: دقيقتين

$txt$,

         false,

         2

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 3) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 4',

         'https://drive.google.com/file/d/1OeDz0ygoneKZiwww9n4o0qyC-lePvTWP/view',

         $txt$

📌 مجموعتين

1️⃣ 25 عدة يمين وشمال

2️⃣ 30 عدة يمين وشمال



وقت الراحة بين المجاميع: 30 ثانية

$txt$,

         false,

         3

       );

     end if;



     -- Day 2 videos

     if not exists (select 1 from public.videos v where v.day_id = v_day2 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day2,

         'تمرين 1',

         'https://drive.google.com/file/d/1kk8XVxulLHCwhhg98avSAQB6c26jaKJA/view',

         $txt$

📌 3 مجاميع

1️⃣ 12 جامب لكل رجل (من غير وزن)

2️⃣ 10 جمبات لكل رجل (دنبل 5 كيلو في كل إيد)

3️⃣ 8 جمبات لكل رجل (دنبل 7.5 كيلو – دنبل واحد في الإيد العكسية)



وقت الراحة: دقيقتين

$txt$,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day2 and v.sort_order = 1) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day2,

         'تمرين 2',

         'https://drive.google.com/file/d/15dQA7dtUzEoz_eiMhigNTzjk4bQ_eiD0/view',

         $txt$

📌 3 مجاميع

1️⃣ 12 جامب لكل رجل

2️⃣ 15 جامب لكل رجل

3️⃣ 12 جامب لكل رجل (دنبل 5 كيلو في كل إيد)



وقت الراحة: دقيقتين

$txt$,

         false,

         1

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day2 and v.sort_order = 2) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day2,

         'تمرين 3',

         'https://drive.google.com/file/d/17rBMxGrfJllRr5sPrza6esjPGbE4D68f/view',

         $txt$

📌 3 مجاميع

1️⃣ 15 عدة لكل رجل

2️⃣ 15 عدة لكل رجل

3️⃣ 10 عدات لكل رجل (دنبل 5 كيلو في إيد واحدة والتانية فاضية)



وقت الراحة: دقيقة واحدة

$txt$,

         false,

         2

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day2 and v.sort_order = 3) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day2,

         'تمرين 4',

         'https://drive.google.com/file/d/1MtVR4oCC1qMrhG5HcBdbKxwUVAP5ldX4/view',

         $txt$

📌 3 مجاميع

1️⃣ 30 ثانية

2️⃣ 40 ثانية

3️⃣ من 50 إلى 60 ثانية



وقت الراحة: 30 ثانية

$txt$,

         false,

         3

       );

     end if;



     -- Day 3 (field conditioning)

     if not exists (select 1 from public.videos v where v.day_id = v_day3 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day3,

         'بدني في الملعب',

         null,

         $txt$

📌 جري

1️⃣ جري 10 دقائق حول الملعب بسرعة 50% — راحة: دقيقتين

2️⃣ جري 5 دقائق حول الملعب بسرعة 70% — راحة: 4 دقائق

3️⃣ جري 3 دقائق حول الملعب بسرعة 100% — راحة: دقيقة

4️⃣ جري دقيقة واحدة بسرعة 100%

$txt$,

         false,

         0

       );

     end if;



     -- Day 4 videos

     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'تمرين 1',

         'https://drive.google.com/file/d/1w8db3y8kqUeGV1Kp2tChIqHQ6uHN-tZo/view',

         $txt$

📌 3 مجاميع

1️⃣ 12 عدة (البار فاضي)

2️⃣ 10 عدات (البار فيه طارة 5)

3️⃣ 8 عدات (البار فيه وزن 7.5)



وقت الراحة: دقيقة ونصف

$txt$,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 1) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'تمرين 2',

         'https://drive.google.com/file/d/1DpEimw8YkJp7epv_BoI6Sb4j39CbXhjW/view',

         $txt$

📌 3 مجاميع

1️⃣ 12

2️⃣ 12

3️⃣ 12



وقت الراحة: دقيقتين

$txt$,

         false,

         1

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 2) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'تمرين 3',

         'https://drive.google.com/file/d/1JNVXbZmyFkDr6a4Rq2vT9_p6m4WWhC_o/view',

         $txt$

📌 3 مجاميع

1️⃣ 15 عدة

2️⃣ 20 عدة

3️⃣ 20 عدة



وقت الراحة: دقيقة ونصف

$txt$,

         false,

         2

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 3) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'تمرين 4',

         'https://drive.google.com/file/d/1y_yVkmnxqHb7pi39vAbXXClF96XDKR5_/view',

         $txt$

📌 3 مجاميع

1️⃣ 12 عدة (وزن 5 كيلو)

2️⃣ 12 عدة (وزن 5 كيلو)

3️⃣ 10 عدات (وزن 10 كيلو)



وقت الراحة: دقيقة ونصف

$txt$,

         false,

         3

       );

     end if;



   end loop;

 end $$;



 do $$

 declare

   v_pkg_id uuid;

   v_course_id uuid;

   v_ag_id uuid;

   v_month_id uuid;

   v_day1 uuid;

   v_day2 uuid;

   v_day3 uuid;

   v_day4 uuid;

   v_day5 uuid;

   v_day6 uuid;

 begin

   select id into v_pkg_id from public.packages where slug = 'medium' limit 1;

   if v_pkg_id is null then

     return;

   end if;



   select id into v_course_id from public.courses where slug = 'football' limit 1;

   if v_course_id is null then

     insert into public.courses (slug, title_ar, title_en, theme, is_published)

     values ('football', 'كورس كرة القدم', 'Football', 'green', true)

     returning id into v_course_id;

   end if;



   update public.package_courses
   set sort_order = sort_order + 100
   where package_id = v_pkg_id
     and course_id <> v_course_id
     and sort_order <= 0;

   insert into public.package_courses (package_id, course_id, sort_order)
   values (v_pkg_id, v_course_id, 0)
   on conflict (package_id, course_id)
   do update set sort_order = excluded.sort_order;



   if not exists (select 1 from public.age_groups ag where ag.course_id = v_course_id) then

     insert into public.age_groups (course_id, title, min_age, max_age, sort_order)

     values (v_course_id, 'عام', null, null, 0);

   end if;



   for v_ag_id in

     select ag.id

     from public.age_groups ag

     where ag.course_id = v_course_id

     order by ag.sort_order, ag.created_at

   loop

     select m.id into v_month_id

     from public.months m

     where m.age_group_id = v_ag_id

       and m.package_id = v_pkg_id

       and m.month_number = 1

     limit 1;



     if v_month_id is null then

       insert into public.months (age_group_id, package_id, title, month_number, sort_order)

       values (v_ag_id, v_pkg_id, 'الشهر الأول', 1, 0)

       returning id into v_month_id;

     end if;



     select d.id into v_day1 from public.days d where d.month_id = v_month_id and d.day_number = 1 limit 1;

     if v_day1 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الأول', 1, 0)

       returning id into v_day1;

     end if;



     select d.id into v_day2 from public.days d where d.month_id = v_month_id and d.day_number = 2 limit 1;

     if v_day2 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الثاني (بدني في الملعب)', 2, 1)

       returning id into v_day2;

     end if;



     select d.id into v_day3 from public.days d where d.month_id = v_month_id and d.day_number = 3 limit 1;

     if v_day3 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الثالث', 3, 2)

       returning id into v_day3;

     end if;



     select d.id into v_day4 from public.days d where d.month_id = v_month_id and d.day_number = 4 limit 1;

     if v_day4 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الرابع', 4, 3)

       returning id into v_day4;

     end if;



     select d.id into v_day5 from public.days d where d.month_id = v_month_id and d.day_number = 5 limit 1;

     if v_day5 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم الخامس', 5, 4)

       returning id into v_day5;

     end if;



     select d.id into v_day6 from public.days d where d.month_id = v_month_id and d.day_number = 6 limit 1;

     if v_day6 is null then

       insert into public.days (month_id, title, day_number, sort_order)

       values (v_month_id, 'اليوم السادس', 6, 5)

       returning id into v_day6;

     end if;



     if exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 0) then

       update public.videos
       set
         title = 'تمرين 1',
         video_url = 'https://drive.google.com/file/d/19RznlJL4qz1JZ3K10TtZ-Hts-lqcDHz6/view?usp=drivesdk',
         details = $txt$

📌 3 مجاميع

1️⃣10 عدات يمين شمال

2️⃣15 عده يمين شمال

3️⃣15 عده يمين شمال ( دنبل 5 كيلو في كل ايد



وقت الراحه دقيقتين

$txt$,
         is_free_preview = false
       where day_id = v_day1 and sort_order = 0;

     else

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 1',

         'https://drive.google.com/file/d/19RznlJL4qz1JZ3K10TtZ-Hts-lqcDHz6/view?usp=drivesdk',

         $txt$

📌 3 مجاميع

1️⃣10 عدات يمين شمال

2️⃣15 عده يمين شمال

3️⃣15 عده يمين شمال ( دنبل 5 كيلو في كل ايد



وقت الراحه دقيقتين

$txt$,

         false,

         0

       );

     end if;



     if exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 1) then

       update public.videos
       set
         title = 'تمرين 2',
         video_url = 'https://drive.google.com/file/d/15dQA7dtUzEoz_eiMhigNTzjk4bQ_eiD0/view?usp=drivesdk',
         details = $txt$

📌(3 مجاميع)

1️⃣ 12 جامب لكل رجل

2️⃣15 جامب لكل رجل

3️⃣12 جامب لكل رجل (دنبل 5 كيلو في كل ايد)



💆🏽اوقات الراحه دقيقتين

$txt$,
         is_free_preview = false
       where day_id = v_day1 and sort_order = 1;

     else

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 2',

         'https://drive.google.com/file/d/15dQA7dtUzEoz_eiMhigNTzjk4bQ_eiD0/view?usp=drivesdk',

         $txt$

📌(3 مجاميع)

1️⃣ 12 جامب لكل رجل

2️⃣15 جامب لكل رجل

3️⃣12 جامب لكل رجل (دنبل 5 كيلو في كل ايد)



💆🏽اوقات الراحه دقيقتين

$txt$,

         false,

         1

       );

     end if;



     if exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 2) then

       update public.videos
       set
         title = 'تمرين 3',
         video_url = 'https://drive.google.com/file/d/1zcHpGu6OqlOdpWuY6-FYLo44SulK5264/view?usp=drivesdk',
         details = $txt$

📌3 مجاميع

1️⃣12 عده لكل جمب من جسمك (وزن 5 كيلو :/طاره او كوره طبيه)

2️⃣12 عده (وزن 10 كيلو)

3️⃣12 عده ( وزن 10 كيلو )



وقت الراحه دقيقتين

$txt$,
         is_free_preview = false
       where day_id = v_day1 and sort_order = 2;

     else

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 3',

         'https://drive.google.com/file/d/1zcHpGu6OqlOdpWuY6-FYLo44SulK5264/view?usp=drivesdk',

         $txt$

📌3 مجاميع

1️⃣12 عده لكل جمب من جسمك (وزن 5 كيلو :/طاره او كوره طبيه)

2️⃣12 عده (وزن 10 كيلو)

3️⃣12 عده ( وزن 10 كيلو )



وقت الراحه دقيقتين

$txt$,

         false,

         2

       );

     end if;



     if exists (select 1 from public.videos v where v.day_id = v_day1 and v.sort_order = 3) then

       update public.videos
       set
         title = 'تمرين 4',
         video_url = 'https://drive.google.com/file/d/12BQtixNw3-susYrT_Tl-XqzRDd3iixYA/view?usp=drivesdk',
         details = $txt$

📌(مجموعتين)

1️⃣20 عده يمين وشمال

2️⃣30 عده يمين وشمال



وقت الراحه30 ثانيه

$txt$,
         is_free_preview = false
       where day_id = v_day1 and sort_order = 3;

     else

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day1,

         'تمرين 4',

         'https://drive.google.com/file/d/12BQtixNw3-susYrT_Tl-XqzRDd3iixYA/view?usp=drivesdk',

         $txt$

📌(مجموعتين)

1️⃣20 عده يمين وشمال

2️⃣30 عده يمين وشمال



وقت الراحه30 ثانيه

$txt$,

         false,

         3

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day2 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day2,

         'بدني في الملعب',

         null,

         $txt$

📌 بدني (في الملعب)

1️⃣ جري 10 دقائق حولين الملعب سرعة 50% — راحة: دقيقتين

2️⃣ جري 5 دقائق حولين الملعب سرعة 70% — راحة: 4 دقائق

3️⃣ جري 3 دقائق حولين الملعب سرعة 10% — راحة: دقيقة

4️⃣ جري دقيقة واحدة سرعة 100%

$txt$,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day3 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day3,

         'تمرين 1',

         'https://drive.google.com/file/d/1Cxm9pZMsNN8YeVjXepDOqi6Xx8LGjyTZ/view',

         $txt$

📌 (3 مجاميع)

1️⃣ دنبل 10 كيلو — 15 عدة

2️⃣ دنبل 12.5 كيلو — 15 عدة

3️⃣ دنبل 15 كيلو — 10 عدات



وقت الراحة: دقيقة ونصف

$txt$,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day3 and v.sort_order = 1) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day3,

         'تمرين 2',

         'https://drive.google.com/file/d/1OZ4rtp34jppxFntB-hwQZoGlMT8C3I-P/view',

         $txt$

📌 (3 مجاميع)

1️⃣ 12 عدة لكل رجل (من غير وزن)

2️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)

3️⃣ 12 عدة لكل رجل (دنبل 5 كيلو في كل إيد)



وقت الراحة مبين المجاميع: دقيقتين

$txt$,

         false,

         1

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day3 and v.sort_order = 2) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day3,

         'تمرين 3',

         'https://drive.google.com/file/d/1KkINO_uD2rsPTh312EpP7oMArths6Rhf/view',

         $txt$

📌 3 مجاميع

1️⃣ دنبل 10 كيلو — 12 عدة

2️⃣ دنبل 12.5 كيلو — 12 عدة

3️⃣ دنبل 15 كيلو — 10 عدات



وقت الراحة مبين كل مجموعة: دقيقة واحدة

$txt$,

         false,

         2

       );

     end if;



     if exists (select 1 from public.videos v where v.day_id = v_day3 and v.sort_order = 3) then

       update public.videos
       set
         title = 'تمرين 4',
         video_url = 'https://drive.google.com/file/d/1ldtvSE5fVH4dQn9eDyyLgppsgzuPERGH/view?usp=drivesdk',
         details = $txt$

📌(مجموعتين )

1️⃣ 20عده لكل رجل

2️⃣20 عده لكل رجل

$txt$,
         is_free_preview = false
       where day_id = v_day3
         and sort_order = 3;

     else

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day3,

         'تمرين 4',

         'https://drive.google.com/file/d/1ldtvSE5fVH4dQn9eDyyLgppsgzuPERGH/view?usp=drivesdk',

         $txt$

📌(مجموعتين )

1️⃣ 20عده لكل رجل

2️⃣20 عده لكل رجل

$txt$,

         false,

         3

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'بداية اليوم الرابع',

         'https://drive.google.com/file/d/1IH6tTVWYiYtEGQzqzZ9T3PSfZQdtFrJm/view',

         null,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 1) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'تمرين 1',

         'https://drive.google.com/file/d/1hlnS66Zy2BeZc10aAYaDkpTSNyPgT5wJ/view',

         $txt$

📌 (مجموعتين)

1️⃣ 3 اسبرنتات لكل رجل والمسافة لكل واحد 5 متر بالظبط

2️⃣ 4 اسبرنتات لكل رجل والمسافة هي هي



أوقات الراحة: 20 ثانية مبين كل اسبرنت للتاني

$txt$,

         false,

         1

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day4 and v.sort_order = 2) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day4,

         'تمرين 2',

         'https://drive.google.com/file/d/1OaFuvqZrGgg1EYV8iX0SynI2if5ig4J5/view',

         $txt$

📌 مجموعتين

1️⃣ 3 اسبرنتات لكل رجل والمسافة ثابتة

2️⃣ 4 اسبرنتات لكل رجل والمسافة ثابتة



أوقات الراحة: 20 ثانية مبين كل اسبرنت

$txt$,

         false,

         2

       );

     end if;



     delete from public.videos
     where day_id = v_day4
       and sort_order = 3;



     if not exists (select 1 from public.videos v where v.day_id = v_day5 and v.sort_order = 0) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day5,

         'تمرين 1',

         'https://drive.google.com/file/d/1DpEimw8YkJp7epv_BoI6Sb4j39CbXhjW/view',

         $txt$

📌 3 مجاميع

1️⃣ 12

2️⃣ 12

3️⃣ 12



أوقات الراحة: دقيقتين

$txt$,

         false,

         0

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day5 and v.sort_order = 1) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day5,

         'تمرين 2',

         'https://drive.google.com/file/d/1JNVXbZmyFkDr6a4Rq2vT9_p6m4WWhC_o/view',

         $txt$

📌 3 مجاميع

1️⃣ 15 عدة

2️⃣ 20 عدة

3️⃣ 20 عدة



وقت الراحة: دقيقة ونصف

$txt$,

         false,

         1

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day5 and v.sort_order = 2) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day5,

         'تمرين 3',

         'https://drive.google.com/file/d/1y_yVkmnxqHb7pi39vAbXXClF96XDKR5_/view',

         $txt$

📌 3 مجاميع

1️⃣ 12 عدة (وزن 5 كيلو)

2️⃣ 12 عدة (وزن 5 كيلو)

3️⃣ 10 عدات (وزن 10 كيلو)



أوقات الراحة: دقيقة ونصف

$txt$,

         false,

         2

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day5 and v.sort_order = 3) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day5,

         'تمرين 4',

         'https://drive.google.com/file/d/1Nu8MwOcI4wG_rnp93pFkcbQHHNcSAXqQ/view',

         $txt$

📌 3 مجاميع

1️⃣ 20 عدة (وزن 2.5 كيلو في كل إيد)

2️⃣ 25 عدة (وزن 2.5 كيلو في كل إيد)

3️⃣ 15 عدة (دنبل 5 كيلو في كل إيد)



⏱️ وقت الراحة: دقيقة ونص

$txt$,

         false,

         3

       );

     end if;



     if not exists (select 1 from public.videos v where v.day_id = v_day5 and v.sort_order = 4) then

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day5,

         'تمرين 5',

         'https://drive.google.com/file/d/1PI86Cq4Aw3dG8t4Qsi_Ri_eKst1HBkCz/view',

         $txt$

📌 3 مجاميع

1️⃣ 15 عدة يمين / شمال (من غير وزن)

2️⃣ 15 عدة يمين / شمال (دنبل 5 كيلو في كل إيد)

3️⃣ 12 عدة يمين / شمال



دنبل 10 كيلو في إيد واحدة

6 عدات وتبدل الدنبل للإيد التانية في الـ 6 عدات الباقيين



⏱️ وقت الراحة: دقيقة ونص

$txt$,

         false,

         4

       );

     end if;

     if exists (select 1 from public.videos v where v.day_id = v_day6 and v.sort_order = 0) then

       update public.videos
       set
         title = 'تمرين 1',
         video_url = 'https://drive.google.com/file/d/1tdPwdBHJL5MD1jTJM0CT64gkI1VemcBK/view?usp=drivesdk',
         details = $txt$

📌 مجموعتين

1️⃣ مسافه 10 متر

2️⃣مسافه 10 متر

3️⃣مسافه 10 متر



وقت الراحه دقيقتين

$txt$,
         is_free_preview = false
       where day_id = v_day6
         and sort_order = 0;

     else

       insert into public.videos (day_id, title, video_url, details, is_free_preview, sort_order)

       values (

         v_day6,

         'تمرين 1',

         'https://drive.google.com/file/d/1tdPwdBHJL5MD1jTJM0CT64gkI1VemcBK/view?usp=drivesdk',

         $txt$

📌 مجموعتين

1️⃣ مسافه 10 متر

2️⃣مسافه 10 متر

3️⃣مسافه 10 متر



وقت الراحه دقيقتين

$txt$,

         false,

         0

       );

     end if;

   end loop;

 end $$;


 do $$

 declare

   v_pkg_medium uuid;

   v_pkg_vip uuid;

   v_course_id uuid;

   v_ag_id uuid;

   v_src_month_id uuid;

   v_dst_month_id uuid;

   v_src_day_id uuid;

   v_dst_day_id uuid;

   v_video record;

 begin

   select id into v_pkg_medium from public.packages where slug = 'medium' limit 1;
   select id into v_pkg_vip from public.packages where slug = 'vip' limit 1;
   select id into v_course_id from public.courses where slug = 'football' limit 1;

   if v_pkg_medium is null or v_pkg_vip is null or v_course_id is null then
     return;
   end if;

   update public.package_courses
   set sort_order = sort_order + 100
   where package_id = v_pkg_vip
     and course_id <> v_course_id
     and sort_order <= 0;

   insert into public.package_courses (package_id, course_id, sort_order)
   values (v_pkg_vip, v_course_id, 0)
   on conflict (package_id, course_id)
   do update set sort_order = excluded.sort_order;

   for v_ag_id in
     select ag.id
     from public.age_groups ag
     where ag.course_id = v_course_id
     order by ag.sort_order, ag.created_at
   loop
     insert into public.package_course_age_groups (package_id, course_id, age_group_id)
     values (v_pkg_vip, v_course_id, v_ag_id)
     on conflict (package_id, course_id, age_group_id)
     do nothing;

     for v_src_month_id in
       select m.id
       from public.months m
       where m.age_group_id = v_ag_id
         and m.package_id = v_pkg_medium
       order by m.month_number nulls last, m.sort_order, m.created_at
     loop
       select dst.id into v_dst_month_id
       from public.months dst
       join public.months src on src.id = v_src_month_id
       where dst.age_group_id = v_ag_id
         and dst.package_id = v_pkg_vip
         and (
           dst.month_number = src.month_number
           or (
             dst.month_number is null
             and src.month_number is null
             and dst.title = src.title
           )
         )
       order by dst.created_at
       limit 1;

       if v_dst_month_id is null then
         insert into public.months (age_group_id, package_id, title, month_number, sort_order)
         select m.age_group_id, v_pkg_vip, m.title, m.month_number, m.sort_order
         from public.months m
         where m.id = v_src_month_id
         returning id into v_dst_month_id;
       else
         update public.months dst
         set
           title = src.title,
           sort_order = src.sort_order
         from public.months src
         where src.id = v_src_month_id
           and dst.id = v_dst_month_id;
       end if;

       for v_src_day_id in
         select d.id
         from public.days d
         where d.month_id = v_src_month_id
         order by d.day_number nulls last, d.sort_order, d.created_at
       loop
         select d2.id into v_dst_day_id
         from public.days d2
         join public.days d1 on d1.id = v_src_day_id
         where d2.month_id = v_dst_month_id
           and (
             d2.day_number = d1.day_number
             or (
               d2.day_number is null
               and d1.day_number is null
               and d2.sort_order = d1.sort_order
               and d2.title = d1.title
             )
           )
         order by d2.created_at
         limit 1;

         if v_dst_day_id is null then
           insert into public.days (month_id, title, day_number, sort_order)
           select v_dst_month_id, d.title, d.day_number, d.sort_order
           from public.days d
           where d.id = v_src_day_id
           returning id into v_dst_day_id;
         else
           update public.days dst
           set
             title = src.title,
             sort_order = src.sort_order
           from public.days src
           where src.id = v_src_day_id
             and dst.id = v_dst_day_id;
         end if;

         for v_video in
           select
             vsrc.title,
             vsrc.video_url,
             vsrc.thumbnail_url,
             vsrc.details,
             vsrc.duration_sec,
             vsrc.is_free_preview,
             vsrc.sort_order
           from public.videos vsrc
           where vsrc.day_id = v_src_day_id
           order by vsrc.sort_order, vsrc.created_at
         loop
           if exists (
             select 1
             from public.videos vdst
             where vdst.day_id = v_dst_day_id
               and vdst.sort_order = v_video.sort_order
           ) then
             update public.videos
             set
               title = v_video.title,
               video_url = v_video.video_url,
               thumbnail_url = v_video.thumbnail_url,
               details = v_video.details,
               duration_sec = v_video.duration_sec,
               is_free_preview = v_video.is_free_preview
             where day_id = v_dst_day_id
               and sort_order = v_video.sort_order;
           else
             insert into public.videos (day_id, title, video_url, thumbnail_url, details, duration_sec, is_free_preview, sort_order)
             values (v_dst_day_id, v_video.title, v_video.video_url, v_video.thumbnail_url, v_video.details, v_video.duration_sec, v_video.is_free_preview, v_video.sort_order);
           end if;
         end loop;

         delete from public.videos vdel
         where vdel.day_id = v_dst_day_id
           and not exists (
             select 1
             from public.videos vsrc2
             where vsrc2.day_id = v_src_day_id
               and vsrc2.sort_order = vdel.sort_order
           );
       end loop;
     end loop;
   end loop;
 end $$;


 do $$

 declare

   v_pkg_vip uuid;

   v_course_id uuid;

   v_ag_id uuid;

   v_month_id uuid;

   v_day_id uuid;

 begin

   select id into v_pkg_vip from public.packages where slug = 'vip' limit 1;
   select id into v_course_id from public.courses where slug = 'handball' limit 1;

   if v_pkg_vip is null or v_course_id is null then
     return;
   end if;

   for v_ag_id in
     select ag.id
     from public.age_groups ag
     where ag.course_id = v_course_id
     order by ag.sort_order, ag.created_at
   loop
     select m.id into v_month_id
     from public.months m
     where m.age_group_id = v_ag_id
       and m.package_id = v_pkg_vip
       and m.month_number = 1
     limit 1;

     if v_month_id is null then
       continue;
     end if;

     select d.id into v_day_id
     from public.days d
     where d.month_id = v_month_id
       and d.day_number = 1
     limit 1;

     if v_day_id is null then
       continue;
     end if;

     update public.videos
     set details = $txt$

📌 3 مجاميع

1️⃣ 12 عده لكل جمب من جسمك (وزن 5 كيلو :/طاره او كوره طبيه)

2️⃣ 12 عده (وزن 10 كيلو)

3️⃣ 12 عده (وزن 10 كيلو)


وقت الراحه دقيقتين

$txt$
     where day_id = v_day_id
       and sort_order = 3;
   end loop;
 end $$;

 do $$

 declare

   v_pkg_vip uuid;

   v_course_id uuid;

   v_ag_id uuid;

   v_month_id uuid;

   v_day_id uuid;

   v_speed_id uuid;

   v_ex1_id uuid;

   v_speed_details text;

 begin

   select id into v_pkg_vip from public.packages where slug = 'vip' limit 1;
   select id into v_course_id from public.courses where slug = 'handball' limit 1;

   if v_pkg_vip is null or v_course_id is null then
     return;
   end if;

   for v_ag_id in
     select ag.id
     from public.age_groups ag
     where ag.course_id = v_course_id
     order by ag.sort_order, ag.created_at
   loop
     select m.id into v_month_id
     from public.months m
     where m.age_group_id = v_ag_id
       and m.package_id = v_pkg_vip
       and m.month_number = 1
     order by m.created_at
     limit 1;

     if v_month_id is null then
       continue;
     end if;

     select d.id into v_day_id
     from public.days d
     where d.month_id = v_month_id
       and d.day_number = 7
     order by d.created_at
     limit 1;

     if v_day_id is null then
       continue;
     end if;

     select v.id, v.details
     into v_speed_id, v_speed_details
     from public.videos v
     where v.day_id = v_day_id
       and v.title ilike '%سرعات%'
       and (v.video_url is null or length(trim(v.video_url)) = 0)
     order by v.sort_order, v.created_at
     limit 1;

     if v_speed_id is null or v_speed_details is null or length(trim(v_speed_details)) = 0 then
       continue;
     end if;

     select v.id
     into v_ex1_id
     from public.videos v
     where v.day_id = v_day_id
       and v.title ilike '%تمرين 1%'
       and (v.video_url is not null and length(trim(v.video_url)) > 0)
     order by v.sort_order, v.created_at
     limit 1;

     if v_ex1_id is null then
       continue;
     end if;

     update public.videos
     set details = btrim(
       coalesce(details, '') ||
       case when coalesce(details, '') = '' then '' else E'\n\n' end ||
       v_speed_details
     )
     where id = v_ex1_id;

     update public.videos
     set details = null
     where id = v_speed_id;
   end loop;
 end $$;

 do $$

 declare

   v_small uuid;

   v_medium uuid;

   v_vip uuid;

   v_football uuid;

 begin

   select id into v_small from public.packages where slug = 'small' limit 1;
   select id into v_medium from public.packages where slug = 'medium' limit 1;
   select id into v_vip from public.packages where slug = 'vip' limit 1;
   select id into v_football from public.courses where slug = 'football' limit 1;

   if v_vip is null then
     return;
   end if;

   insert into public.package_courses (package_id, course_id, sort_order)
   select
     v_vip,
     c.id,
     case c.slug
       when 'football' then 0
       when 'volleyball' then 1
       when 'basketball' then 2
       when 'handball' then 3
       when 'injuries' then 4
       else 999
     end
   from public.courses c
   where c.slug <> 'football'
     and (
       (v_small is not null and exists (select 1 from public.package_courses pc where pc.package_id = v_small and pc.course_id = c.id))
       or (v_medium is not null and exists (select 1 from public.package_courses pc where pc.package_id = v_medium and pc.course_id = c.id))
     )
   on conflict (package_id, course_id)
   do update set sort_order = excluded.sort_order;

   update public.courses
   set featured_package_id = v_vip
   where slug <> 'football'
     and (
       (v_small is not null and featured_package_id = v_small)
       or (v_medium is not null and featured_package_id = v_medium)
     );

   if v_small is not null then
     delete from public.package_course_age_groups pca
     using public.courses c
     where pca.package_id = v_small
       and pca.course_id = c.id
       and c.slug <> 'football';

     delete from public.package_courses pc
     using public.courses c
     where pc.package_id = v_small
       and pc.course_id = c.id
       and c.slug <> 'football';
   end if;

   if v_medium is not null then
     delete from public.package_course_age_groups pca
     using public.courses c
     where pca.package_id = v_medium
       and pca.course_id = c.id
       and c.slug <> 'football';

     delete from public.package_courses pc
     using public.courses c
     where pc.package_id = v_medium
       and pc.course_id = c.id
       and c.slug <> 'football';
   end if;
 end $$;
