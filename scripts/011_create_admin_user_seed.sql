-- ============================================
-- UPDATE EXISTING ADMIN USER (If Already Signed Up)
-- Run this ONLY if you already signed up with admin@sharas.edu
-- ============================================

-- Update existing user to admin role
UPDATE public.profiles
SET role = 'admin'
WHERE email = 'admin@sharas.edu'
  AND role != 'admin';

-- Check if update was successful
DO $$
DECLARE
  updated_count integer;
BEGIN
  GET DIAGNOSTICS updated_count = ROW_COUNT;
  IF updated_count > 0 THEN
    RAISE NOTICE 'Admin user updated successfully! You can now login at /admin/login';
  ELSE
    RAISE NOTICE 'No user found with admin@sharas.edu. Please sign up first at /auth/sign-up';
  END IF;
END $$;

-- ============================================
-- USAGE:
-- ============================================
-- 1. Sign up at /auth/sign-up with:
--    - Email: admin@sharas.edu
--    - Password: Admin@123
--    - Name: Admin User
--    - Role: Any (will be auto-set to admin)
--
-- 2. After signup, the trigger automatically sets role to 'admin'
--
-- 3. If you already signed up, run this script to update existing user
-- ============================================
