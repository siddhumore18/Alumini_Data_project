-- Diagnostic script to check database status
-- Run this to see what's in your database

-- 1. Check if tables exist
SELECT 
  table_name,
  table_type
FROM information_schema.tables
WHERE table_schema = 'public'
  AND table_name IN ('profiles', 'academic_records', 'projects', 'faculty_profiles')
ORDER BY table_name;

-- 2. Count profiles
SELECT 
  COUNT(*) as total_profiles,
  COUNT(CASE WHEN role = 'alumni' THEN 1 END) as alumni_count,
  COUNT(CASE WHEN role = 'faculty' THEN 1 END) as faculty_count
FROM public.profiles;

-- 3. List all profiles (if any exist)
SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  batch_year,
  current_position,
  company_name,
  created_at
FROM public.profiles
ORDER BY created_at DESC
LIMIT 10;

-- 4. Check RLS policies on profiles table
SELECT 
  policyname,
  cmd as command,
  roles,
  qual as using_clause
FROM pg_policies
WHERE schemaname = 'public' 
  AND tablename = 'profiles'
ORDER BY policyname;

-- 5. Check if trigger exists
SELECT 
  trigger_name,
  event_manipulation,
  event_object_table,
  action_statement
FROM information_schema.triggers
WHERE trigger_schema = 'public'
  AND event_object_table = 'users'
  AND trigger_name LIKE '%user%created%';

-- 6. Count users in auth.users
SELECT COUNT(*) as total_users FROM auth.users;

-- 7. Check if any users have profiles
SELECT 
  u.id,
  u.email,
  u.created_at as user_created,
  p.id as profile_id,
  p.first_name,
  p.last_name,
  p.role
FROM auth.users u
LEFT JOIN public.profiles p ON u.id = p.id
ORDER BY u.created_at DESC
LIMIT 10;

