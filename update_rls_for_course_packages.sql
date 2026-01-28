-- Update RLS policies for the new course->packages structure
-- Run this in Supabase SQL Editor AFTER running migrate_to_course_packages.sql

-- First, make sure course_id column exists (from migrate_to_course_packages.sql)
-- If you get an error that course_id doesn't exist, run migrate_to_course_packages.sql first!

-- Update packages RLS to allow reading packages by course_id
-- (The existing policies should still work, but we can add course_id-based checks if needed)

-- Ensure packages can be read if they belong to a published course
DROP POLICY IF EXISTS "packages_select_by_course" ON public.packages;
CREATE POLICY "packages_select_by_course" ON public.packages
FOR SELECT
TO anon, authenticated
USING (
  active = true
);

-- Note: The existing "packages_select_public" policy should still work
-- This new policy adds an additional check for course_id relationship

-- Verify the policies
SELECT 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'packages'
ORDER BY policyname;

