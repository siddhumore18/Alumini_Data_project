-- ============================================
-- MAKE ANY USER ADMIN (Quick Fix)
-- Use this to make any existing user an admin
-- ============================================

-- Replace 'your-email@example.com' with the email you signed up with
UPDATE public.profiles 
SET role = 'admin' 
WHERE email = 'admin@sharad.edu';

-- Verify the update
SELECT id, email, role, first_name, last_name 
FROM public.profiles 
WHERE email = 'admin@sharad.edu';

-- ============================================
-- EXAMPLE USAGE:
-- ============================================
-- If you signed up with: admin.sharad@gmail.com
-- Run:
-- UPDATE public.profiles 
-- SET role = 'admin' 
-- WHERE email = 'admin.sharad@gmail.com';
-- ============================================

