-- ============================================
-- COMPLETE DATABASE SETUP SCRIPT
-- Run this script FIRST in Supabase SQL Editor
-- ============================================

-- Step 1: Create profiles table for alumni and faculty
create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  role text not null check (role in ('alumni', 'faculty')), -- 'alumni' or 'faculty'
  first_name text,
  last_name text,
  email text,
  batch_year integer,
  current_position text,
  company_name text,
  bio text,
  phone text,
  profile_picture_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 2: Create academic records table
create table if not exists public.academic_records (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  semester integer not null,
  cgpa numeric(3, 2),
  total_marks numeric(5, 2),
  obtained_marks numeric(5, 2),
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 3: Create projects table
create table if not exists public.projects (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  project_name text not null,
  description text,
  technologies text,
  project_url text,
  github_url text,
  completion_date date,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 4: Create faculty_profiles table
create table if not exists public.faculty_profiles (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  full_name text,
  department text,
  designation text,
  employee_id text unique,
  email text,
  phone text,
  years_of_experience integer,
  skills_expertise text,
  bio text,
  profile_picture_url text,
  created_at timestamp with time zone default now(),
  updated_at timestamp with time zone default now()
);

-- Step 5: Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.academic_records enable row level security;
alter table public.projects enable row level security;
alter table public.faculty_profiles enable row level security;

-- Step 6: Drop existing policies if they exist (to avoid conflicts)
drop policy if exists "profiles_select_all_public" on public.profiles;
drop policy if exists "profiles_select_own" on public.profiles;
drop policy if exists "profiles_insert_own" on public.profiles;
drop policy if exists "profiles_update_own" on public.profiles;

-- Step 7: Create RLS Policies for profiles
-- Policy 1: Everyone can see all profiles (public read access) - MUST BE FIRST
create policy "profiles_select_all_public"
  on public.profiles for select
  to authenticated
  using (true);

-- Policy 2: Users can see their own profile
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

-- Step 8: Create RLS Policies for academic_records
drop policy if exists "academic_records_select_own" on public.academic_records;
drop policy if exists "academic_records_insert_own" on public.academic_records;
drop policy if exists "academic_records_update_own" on public.academic_records;

create policy "academic_records_select_own"
  on public.academic_records for select
  to authenticated
  using (auth.uid() = user_id);

create policy "academic_records_insert_own"
  on public.academic_records for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "academic_records_update_own"
  on public.academic_records for update
  to authenticated
  using (auth.uid() = user_id);

-- Step 9: Create RLS Policies for projects
drop policy if exists "projects_select_own" on public.projects;
drop policy if exists "projects_insert_own" on public.projects;
drop policy if exists "projects_update_own" on public.projects;
drop policy if exists "projects_delete_own" on public.projects;

create policy "projects_select_own"
  on public.projects for select
  to authenticated
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects for update
  to authenticated
  using (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects for delete
  to authenticated
  using (auth.uid() = user_id);

-- Step 10: Create RLS Policies for faculty_profiles
drop policy if exists "faculty_profiles_select_own" on public.faculty_profiles;
drop policy if exists "faculty_profiles_select_all_public" on public.faculty_profiles;
drop policy if exists "faculty_profiles_insert_own" on public.faculty_profiles;
drop policy if exists "faculty_profiles_update_own" on public.faculty_profiles;
drop policy if exists "faculty_profiles_delete_own" on public.faculty_profiles;

create policy "faculty_profiles_select_own"
  on public.faculty_profiles for select
  to authenticated
  using (auth.uid() = user_id);

create policy "faculty_profiles_select_all_public"
  on public.faculty_profiles for select
  to authenticated
  using (true);

create policy "faculty_profiles_insert_own"
  on public.faculty_profiles for insert
  to authenticated
  with check (auth.uid() = user_id);

create policy "faculty_profiles_update_own"
  on public.faculty_profiles for update
  to authenticated
  using (auth.uid() = user_id);

create policy "faculty_profiles_delete_own"
  on public.faculty_profiles for delete
  to authenticated
  using (auth.uid() = user_id);

-- Step 11: Create indexes for better performance
create index if not exists idx_faculty_profiles_user_id on public.faculty_profiles(user_id);
create index if not exists idx_faculty_profiles_department on public.faculty_profiles(department);
create index if not exists idx_profiles_role on public.profiles(role);
create index if not exists idx_profiles_batch_year on public.profiles(batch_year);

-- Step 12: Create trigger function for auto-creating profiles on user signup
-- This automatically assigns 'admin' role to admin@sharad.edu
create or replace function public.handle_new_user()
returns trigger
language plpgsql
security definer
set search_path = public
as $$
declare
  user_role text;
begin
  -- Auto-assign admin role for admin emails (support multiple formats)
  if new.email in ('admin@sharad.edu', 'admin@sharad.edu.in', 'admin.sharad@gmail.com', 'admin@sharadinstitute.edu') then
    user_role := 'admin';
  else
    -- Extract role from metadata or default to alumni
    user_role := coalesce(new.raw_user_meta_data ->> 'role', 'alumni');
    -- Map 'student' to 'alumni' if needed
    if user_role = 'student' then
      user_role := 'alumni';
    end if;
  end if;

  insert into public.profiles (id, first_name, last_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'first_name', ''),
    coalesce(new.raw_user_meta_data ->> 'last_name', ''),
    new.email,
    user_role
  )
  on conflict (id) do update
  set role = excluded.role,
      email = excluded.email,
      first_name = coalesce(excluded.first_name, profiles.first_name),
      last_name = coalesce(excluded.last_name, profiles.last_name);

  return new;
end;
$$;

-- Step 13: Create trigger to auto-create profile when user signs up
drop trigger if exists on_auth_user_created on auth.users;

create trigger on_auth_user_created
  after insert on auth.users
  for each row
  execute function public.handle_new_user();

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Verify the setup by running:
-- SELECT table_name FROM information_schema.tables WHERE table_schema = 'public';
-- 
-- You should see:
-- - profiles
-- - academic_records
-- - projects
-- - faculty_profiles
-- ============================================

