-- Verification script to check RLS policies
-- Run this to see what policies are currently active

-- Check if RLS is enabled
select 
  schemaname,
  tablename,
  rowsecurity as rls_enabled
from pg_tables
where schemaname = 'public' and tablename = 'profiles';

-- List all policies on the profiles table
select 
  schemaname,
  tablename,
  policyname,
  permissive,
  roles,
  cmd,
  qual,
  with_check
from pg_policies
where schemaname = 'public' and tablename = 'profiles'
order by policyname;

-- Test query to see if you can select all profiles
-- This should work if RLS is set up correctly
select count(*) as total_profiles from public.profiles;

-- If the count works but the app doesn't, the issue might be with the client
-- Make sure you're using an authenticated Supabase client

