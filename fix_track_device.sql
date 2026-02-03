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

  if not public.is_admin(v_uid) then
    if exists(
      select 1
      from public.user_devices ud
      where ud.user_id = v_uid
        and ud.device_id <> v_device_id
        and ud.last_seen > now() - interval '90 seconds'
    ) then
      raise exception 'Multiple devices';
    end if;
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
