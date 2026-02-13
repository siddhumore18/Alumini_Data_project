-- Fix RLS policies to ensure all users can see all profiles
-- This script ensures the public read policy is correctly set

-- First, check if RLS is enabled
-- If you need to disable RLS temporarily for testing, uncomment the next line:
-- alter table public.profiles disable row level security;

-- Drop ALL existing policies to avoid conflicts
drop policy if exists "profiles_select_all_public" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- Recreate the policies in the correct order
-- Policy 1: Everyone can see all profiles (public read access) - MUST BE FIRST
-- This policy allows any authenticated user to read all profiles
create policy "profiles_select_all_public"
  on public.profiles for select
  to authenticated
  using (true);

-- Policy 2: Users can see their own profile (redundant but kept for clarity)
create policy "profiles_select_own"
  on public.profiles for select
  to authenticated
  using (auth.uid() = id);

-- Policy 3: Users can insert their own profile
create policy "profiles_insert_own"
  on public.profiles for insert
  to authenticated
  with check (auth.uid() = id);

-- Policy 4: Users can update their own profile
create policy "profiles_update_own"
  on public.profiles for update
  to authenticated
  using (auth.uid() = id);

-- Verify the policies are active
-- You can check this in Supabase Dashboard > Authentication > Policies
-- Make sure "profiles_select_all_public" is listed and enabled

