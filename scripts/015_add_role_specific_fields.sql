-- ============================================
-- ADD ROLE-SPECIFIC FIELDS TO PROFILES
-- Adds fields for students, alumni, and faculty
-- ============================================

-- Add student-specific fields
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS course text,
ADD COLUMN IF NOT EXISTS semester integer,
ADD COLUMN IF NOT EXISTS enrollment_year integer;

-- Add alumni-specific fields (some already exist, but ensure they're there)
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS graduation_year integer,
ADD COLUMN IF NOT EXISTS work_experience_years integer,
ADD COLUMN IF NOT EXISTS is_currently_working boolean DEFAULT false;

-- Add faculty-specific fields to profiles (or use faculty_profiles table)
-- Note: Faculty can use both profiles and faculty_profiles tables

-- Update role check to include 'student'
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('student', 'alumni', 'faculty', 'admin'));

-- Add index for working status
CREATE INDEX IF NOT EXISTS idx_profiles_working ON public.profiles(is_currently_working) WHERE is_currently_working = true;
CREATE INDEX IF NOT EXISTS idx_profiles_company ON public.profiles(company_name) WHERE company_name IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.is_currently_working IS 'Whether the user is currently employed';
COMMENT ON COLUMN public.profiles.course IS 'Course name for students (e.g., Computer Science, Mechanical Engineering)';
COMMENT ON COLUMN public.profiles.semester IS 'Current semester for students';
COMMENT ON COLUMN public.profiles.enrollment_year IS 'Year when student enrolled';
COMMENT ON COLUMN public.profiles.graduation_year IS 'Year when alumni graduated';
COMMENT ON COLUMN public.profiles.work_experience_years IS 'Years of work experience for alumni';

