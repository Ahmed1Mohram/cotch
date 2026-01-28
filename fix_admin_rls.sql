-- Fix admin_users RLS policy to allow users to check if they are admin
-- This should be run in Supabase SQL Editor

-- Drop existing policies
drop policy if exists "admin_users_select_self" on public.admin_users;
drop policy if exists "admin_users_admin_write" on public.admin_users;

-- Create policy that allows users to check if they are admin
-- This uses security definer function to bypass RLS check
create policy "admin_users_select_self" on public.admin_users
for select
to authenticated
using (
  -- Allow if user is checking themselves
  user_id = auth.uid()
  -- OR if user is already admin (for admin to see all)
  OR exists(select 1 from public.admin_users au where au.user_id = auth.uid())
);

-- Admin write policy (only admins can modify)
create policy "admin_users_admin_write" on public.admin_users
for all
to authenticated
using (exists(select 1 from public.admin_users au where au.user_id = auth.uid()))
with check (exists(select 1 from public.admin_users au where au.user_id = auth.uid()));

-- Ensure is_admin function works correctly
create or replace function public.is_admin(uid uuid default auth.uid())
returns boolean
language sql
stable
security definer
set search_path = public
as $$
  -- Use security definer to bypass RLS
  select exists(select 1 from public.admin_users au where au.user_id = uid);
$$;

-- Grant necessary permissions
grant select, insert, update, delete on table public.admin_users to authenticated;

-- Note: To add yourself as admin, run this query (replace with your user ID or email):
-- Option 1: Using user ID
-- INSERT INTO public.admin_users (user_id) VALUES ('YOUR_USER_ID_HERE') ON CONFLICT (user_id) DO NOTHING;

-- Option 2: Using email
-- INSERT INTO public.admin_users (user_id) SELECT id FROM auth.users WHERE email = 'your-email@example.com' ON CONFLICT (user_id) DO NOTHING;

-- Option 3: Add current logged-in user (run while logged in)
-- INSERT INTO public.admin_users (user_id) VALUES (auth.uid()) ON CONFLICT (user_id) DO NOTHING;

