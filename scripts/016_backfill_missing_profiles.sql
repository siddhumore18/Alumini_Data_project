-- Backfill missing profiles for users who have posts but no profile
-- This script creates profile records for any user in auth.users who doesn't have a corresponding profile

INSERT INTO public.profiles (id, first_name, last_name, email, role)
SELECT 
  au.id,
  COALESCE(au.raw_user_meta_data->>'first_name', ''),
  COALESCE(au.raw_user_meta_data->>'last_name', ''),
  au.email,
  COALESCE(au.raw_user_meta_data->>'role', 'alumni')
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id
WHERE p.id IS NULL
ON CONFLICT (id) DO NOTHING;

-- Verify the backfill
SELECT 
  COUNT(*) as total_users,
  COUNT(p.id) as users_with_profiles,
  COUNT(*) - COUNT(p.id) as users_without_profiles
FROM auth.users au
LEFT JOIN public.profiles p ON au.id = p.id;
