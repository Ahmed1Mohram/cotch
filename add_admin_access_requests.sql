create table if not exists public.admin_access_requests (
  id uuid primary key default gen_random_uuid(),
  requester_user_id uuid not null references auth.users(id) on delete cascade,
  status text not null default 'pending',
  reviewed_by uuid references auth.users(id),
  reviewed_at timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admin_access_requests_touch on public.admin_access_requests;
create trigger trg_admin_access_requests_touch
before update on public.admin_access_requests
for each row
execute function public.set_updated_at();

create unique index if not exists ux_admin_access_requests_requester on public.admin_access_requests (requester_user_id);

alter table public.admin_access_requests enable row level security;

drop policy if exists "admin_access_requests_select_self" on public.admin_access_requests;
create policy "admin_access_requests_select_self" on public.admin_access_requests
for select
to authenticated
using (public.is_admin(auth.uid()) or requester_user_id = auth.uid());

drop policy if exists "admin_access_requests_insert_self" on public.admin_access_requests;
create policy "admin_access_requests_insert_self" on public.admin_access_requests
for insert
to authenticated
with check (
  requester_user_id = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and public.is_device_banned() = false
  and public.is_user_banned(auth.uid()) = false
);

drop policy if exists "admin_access_requests_update_self" on public.admin_access_requests;
create policy "admin_access_requests_update_self" on public.admin_access_requests
for update
to authenticated
using (requester_user_id = auth.uid() and status <> 'approved' and public.is_device_banned() = false and public.is_user_banned(auth.uid()) = false)
with check (
  requester_user_id = auth.uid()
  and status = 'pending'
  and reviewed_by is null
  and reviewed_at is null
  and public.is_device_banned() = false
  and public.is_user_banned(auth.uid()) = false
);

drop policy if exists "admin_access_requests_admin_all" on public.admin_access_requests;
create policy "admin_access_requests_admin_all" on public.admin_access_requests
for all
to authenticated
using (public.is_admin(auth.uid()))
with check (public.is_admin(auth.uid()));

grant select, insert, update, delete on table public.admin_access_requests to authenticated;
