-- ============================================
-- AUTO-CREATE ADMIN USER
-- This script automatically creates an admin user
-- Run this ONCE after setting up the database
-- ============================================

-- Step 1: Create or update the profile trigger to auto-assign admin role
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Check if email matches admin email pattern
  IF new.email = 'admin@sharas.edu' THEN
    user_role := 'admin';
  ELSE
    -- Extract role from metadata or default to alumni
    user_role := COALESCE(new.raw_user_meta_data ->> 'role', 'alumni');
    -- Map 'student' to 'alumni' if needed
    IF user_role = 'student' THEN
      user_role := 'alumni';
    END IF;
  END IF;

  -- Insert profile with determined role
  INSERT INTO public.profiles (id, first_name, last_name, email, role)
  VALUES (
    new.id,
    COALESCE(new.raw_user_meta_data ->> 'first_name', ''),
    COALESCE(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    user_role
  )
  ON CONFLICT (id) DO UPDATE
  SET role = EXCLUDED.role,
      email = EXCLUDED.email,
      first_name = COALESCE(EXCLUDED.first_name, profiles.first_name),
      last_name = COALESCE(EXCLUDED.last_name, profiles.last_name);

  RETURN new;
END;
$$;

-- Step 2: Create function to seed admin user (if doesn't exist)
CREATE OR REPLACE FUNCTION public.create_admin_user_if_not_exists()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  admin_user_id uuid;
  admin_email text := 'admin@sharas.edu';
BEGIN
  -- Check if admin user already exists in auth.users
  SELECT id INTO admin_user_id
  FROM auth.users
  WHERE email = admin_email
  LIMIT 1;

  -- If admin user exists, ensure profile has admin role
  IF admin_user_id IS NOT NULL THEN
    -- Update or insert profile with admin role
    INSERT INTO public.profiles (id, email, role, first_name, last_name)
    VALUES (admin_user_id, admin_email, 'admin', 'Admin', 'User')
    ON CONFLICT (id) DO UPDATE
    SET role = 'admin',
        email = admin_email;
    
    RAISE NOTICE 'Admin user profile updated/created for: %', admin_email;
  ELSE
    RAISE NOTICE 'Admin user does not exist in auth.users. Please sign up first at /auth/sign-up with email: %', admin_email;
  END IF;
END;
$$;

-- Step 3: Run the function to create/update admin profile
SELECT public.create_admin_user_if_not_exists();

-- ============================================
-- INSTRUCTIONS:
-- ============================================
-- 1. Sign up at /auth/sign-up with:
--    Email: admin@sharas.edu
--    Password: Admin@123
--    Name: Admin User
--    Role: Any (will be auto-set to admin)
--
-- 2. After signup, run this script again OR the trigger will automatically
--    set the role to 'admin' for admin@sharas.edu
--
-- 3. The trigger will now automatically assign 'admin' role to admin@sharas.edu
-- ============================================

