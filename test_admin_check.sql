-- Test admin check - Run this in Supabase SQL Editor to verify your admin status
-- Replace 'f521c589-eeee-40f7-8496-7db53c466173' with your actual user ID

-- Check if user exists in admin_users table
SELECT 
  au.user_id,
  u.email,
  au.created_at,
  'Found in admin_users table' as status
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
WHERE au.user_id = 'f521c589-eeee-40f7-8496-7db53c466173';

-- Test is_admin RPC function with your user ID
SELECT 
  public.is_admin('f521c589-eeee-40f7-8496-7db53c466173'::uuid) as is_admin_result,
  'RPC function result' as test_type;

-- Check RLS policies on admin_users
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
FROM pg_policies
WHERE schemaname = 'public' AND tablename = 'admin_users';

-- Check if is_admin function exists and its definition
SELECT 
  p.proname as function_name,
  pg_get_functiondef(p.oid) as function_definition
FROM pg_proc p
JOIN pg_namespace n ON p.pronamespace = n.oid
WHERE n.nspname = 'public' AND p.proname = 'is_admin';

