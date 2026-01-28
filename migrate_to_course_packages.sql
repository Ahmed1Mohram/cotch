-- Migration: Change structure from Packages->Courses to Courses->Packages
-- Run this in Supabase SQL Editor

-- Step 1: Add course_id column to packages table
ALTER TABLE public.packages 
ADD COLUMN IF NOT EXISTS course_id uuid REFERENCES public.courses(id) ON DELETE CASCADE;

-- Step 2: Migrate existing data from package_courses to packages
-- This will link packages to courses based on existing package_courses relationships
UPDATE public.packages p
SET course_id = (
  SELECT pc.course_id 
  FROM public.package_courses pc 
  WHERE pc.package_id = p.id 
  ORDER BY pc.sort_order ASC, pc.created_at ASC 
  LIMIT 1
)
WHERE p.course_id IS NULL;

-- Step 3: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_packages_course_id ON public.packages(course_id);

-- Step 4: Update package_course_age_groups to use course_id from packages
-- (This table already has course_id, so we just need to ensure consistency)

-- Step 5: Add NOT NULL constraint after migration (optional, comment out if you want to allow packages without courses temporarily)
-- ALTER TABLE public.packages ALTER COLUMN course_id SET NOT NULL;

-- Step 6: Verify the migration
SELECT 
  c.slug as course_slug,
  c.title_ar as course_title,
  COUNT(p.id) as packages_count
FROM public.courses c
LEFT JOIN public.packages p ON p.course_id = c.id
GROUP BY c.id, c.slug, c.title_ar
ORDER BY c.created_at ASC;

