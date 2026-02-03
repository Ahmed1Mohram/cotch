create table if not exists public.admin_device_locks (
  admin_user_id uuid primary key references auth.users(id) on delete cascade,
  allowed_device_id text not null,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

drop trigger if exists trg_admin_device_locks_touch on public.admin_device_locks;
create trigger trg_admin_device_locks_touch
before update on public.admin_device_locks
for each row
execute function public.set_updated_at();

alter table public.admin_device_locks enable row level security;

drop policy if exists "admin_device_locks_select_self" on public.admin_device_locks;
create policy "admin_device_locks_select_self" on public.admin_device_locks
for select
to authenticated
using (public.is_admin(auth.uid()) and admin_user_id = auth.uid());

drop policy if exists "admin_device_locks_insert_self" on public.admin_device_locks;
create policy "admin_device_locks_insert_self" on public.admin_device_locks
for insert
to authenticated
with check (public.is_admin(auth.uid()) and admin_user_id = auth.uid());

drop policy if exists "admin_device_locks_update_self" on public.admin_device_locks;
create policy "admin_device_locks_update_self" on public.admin_device_locks
for update
to authenticated
using (public.is_admin(auth.uid()) and admin_user_id = auth.uid())
with check (public.is_admin(auth.uid()) and admin_user_id = auth.uid());

grant select, insert, update, delete on table public.admin_device_locks to authenticated;
