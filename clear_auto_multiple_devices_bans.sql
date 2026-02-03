update public.user_bans
set active = false, updated_at = now()
where active = true
  and reason = 'AUTO: multiple devices detected';
