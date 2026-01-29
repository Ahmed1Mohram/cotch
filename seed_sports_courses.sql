alter table public.courses add column if not exists featured boolean not null default false;
alter table public.courses add column if not exists featured_sort_order int;
alter table public.courses add column if not exists featured_package_id uuid;

do $$
declare
  v_small uuid;
  v_medium uuid;
  v_vip uuid;
begin
  select id into v_small from public.packages where slug = 'small' limit 1;
  select id into v_medium from public.packages where slug = 'medium' limit 1;
  select id into v_vip from public.packages where slug = 'vip' limit 1;

  insert into public.courses (
    slug,
    title_ar,
    title_en,
    description,
    cover_image_url,
    theme,
    is_published,
    featured,
    featured_sort_order
  )
  values
    ('football', 'كورس كرة القدم', 'Football', 'تدريب بدني ورفع مستوى الأداء في الملعب.', '/kalya.png', 'green', true, true, 1),
    ('volleyball', 'كورس كرة الطائرة', 'Volleyball', 'قوة، قفز، وتحمل للاعبين الكرة الطائرة.', '/kalya.png', 'blue', true, true, 2),
    ('basketball', 'كورس كرة السلة', 'Basketball', 'سرعة، رشاقة، وتحكم للجسم للاعبين السلة.', '/kalya.png', 'orange', true, true, 3),
    ('handball', 'كورس كرة اليد', 'Handball', 'قوة ومرونة وتحمّل للاعبين كرة اليد.', '/kalya.png', 'orange', true, true, 4),
    ('injuries', 'كورس الوقاية من الإصابات', 'Injuries', 'تقوية، مرونة، وتجهيز بدني لتقليل الإصابات.', '/kalya.png', 'orange', true, true, 5)
  on conflict (slug)
  do update set
    title_ar = excluded.title_ar,
    title_en = excluded.title_en,
    description = excluded.description,
    cover_image_url = excluded.cover_image_url,
    theme = excluded.theme,
    is_published = excluded.is_published,
    featured = excluded.featured,
    featured_sort_order = excluded.featured_sort_order,
    updated_at = now();

  if v_small is not null then
    update public.courses
    set featured_package_id = v_small
    where slug in ('football');

    insert into public.package_courses (package_id, course_id, sort_order)
    select
      v_small,
      c.id,
      case c.slug
        when 'football' then 0
        else 0
      end
    from public.courses c
    where c.slug in ('football')
    on conflict (package_id, course_id)
    do update set sort_order = excluded.sort_order;
  end if;

  if v_vip is not null then
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
        else 0
      end
    from public.courses c
    where c.slug in ('football','volleyball','basketball','handball','injuries')
    on conflict (package_id, course_id)
    do update set sort_order = excluded.sort_order;
  end if;



  if v_small is not null then
    if v_vip is not null then
      update public.courses
      set featured_package_id = v_vip
      where slug <> 'football'
        and featured_package_id = v_small;
    end if;

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
    if v_vip is not null then
      update public.courses
      set featured_package_id = v_vip
      where slug <> 'football'
        and featured_package_id = v_medium;
    end if;

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

  if v_vip is not null then
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
        else 0
      end
    from public.courses c
    where c.slug in ('volleyball','basketball','handball','injuries')
    on conflict (package_id, course_id)
    do update set sort_order = excluded.sort_order;
  end if;
end $$;
