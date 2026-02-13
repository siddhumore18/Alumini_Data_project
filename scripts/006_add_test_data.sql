-- Add test data to verify the directory is working
-- Run this AFTER running 000_setup_database.sql
-- This creates sample profiles for testing

-- First, check if you have any users in auth.users
-- If you don't have users, you need to sign up first through the app

-- This script assumes you have at least one user in auth.users
-- If you just signed up, your profile should be auto-created by the trigger

-- To add test profiles manually (if you have user IDs):
-- Replace the UUIDs below with actual user IDs from auth.users table

-- Example: Get your user ID first
-- SELECT id, email FROM auth.users;

-- Then insert a test profile (replace 'YOUR_USER_ID_HERE' with actual UUID)
/*
INSERT INTO public.profiles (id, role, first_name, last_name, email, batch_year, current_position, company_name, bio)
VALUES 
  ('YOUR_USER_ID_HERE', 'alumni', 'John', 'Doe', 'john@example.com', 2020, 'Software Engineer', 'Tech Corp', 'Alumni from 2020 batch'),
  ('YOUR_USER_ID_HERE', 'alumni', 'Jane', 'Smith', 'jane@example.com', 2021, 'Data Scientist', 'Data Inc', 'Alumni from 2021 batch'),
  ('YOUR_USER_ID_HERE', 'faculty', 'Dr. Robert', 'Johnson', 'robert@example.com', NULL, 'Professor', 'Sharad Institute', 'Faculty member')
ON CONFLICT (id) DO NOTHING;
*/

-- Better approach: Check what profiles exist
SELECT 
  id,
  first_name,
  last_name,
  email,
  role,
  batch_year,
  current_position,
  company_name
FROM public.profiles
ORDER BY created_at DESC;

-- If this returns 0 rows, you need to:
-- 1. Sign up through the app (which will auto-create a profile)
-- 2. Or manually create profiles using the INSERT statement above

