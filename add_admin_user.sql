-- Add a user as admin
-- Replace 'YOUR_USER_ID_HERE' with your actual user ID from auth.users table
-- You can find your user ID in Supabase Dashboard > Authentication > Users

-- Option 1: If you know your user ID (UUID) - USE THIS ONE
-- Uncomment and replace with your actual user ID:
INSERT INTO public.admin_users (user_id)
VALUES ('f521c589-eeee-40f7-8496-7db53c466173')
ON CONFLICT (user_id) DO NOTHING;

-- Option 2: If you know your email, use this (uncomment and replace email):
-- INSERT INTO public.admin_users (user_id)
-- SELECT id FROM auth.users WHERE email = 'your-email@example.com'
-- ON CONFLICT (user_id) DO NOTHING;

-- Option 3: Add yourself using auth.uid() (only works if you're logged in via API, not SQL Editor)
-- INSERT INTO public.admin_users (user_id)
-- VALUES (auth.uid())
-- ON CONFLICT (user_id) DO NOTHING;

-- Verify the admin was added
SELECT 
  au.user_id,
  u.email,
  au.created_at
FROM public.admin_users au
JOIN auth.users u ON u.id = au.user_id
ORDER BY au.created_at DESC
LIMIT 10;

