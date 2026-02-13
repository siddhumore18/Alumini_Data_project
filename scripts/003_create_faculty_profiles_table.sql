-- Create faculty_profiles table for detailed faculty information
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

-- Enable Row Level Security
alter table public.faculty_profiles enable row level security;

-- RLS Policies for faculty_profiles
create policy "faculty_profiles_select_own"
  on public.faculty_profiles for select
  using (auth.uid() = user_id);

create policy "faculty_profiles_select_all_public"
  on public.faculty_profiles for select
  using (true);

create policy "faculty_profiles_insert_own"
  on public.faculty_profiles for insert
  with check (auth.uid() = user_id);

create policy "faculty_profiles_update_own"
  on public.faculty_profiles for update
  using (auth.uid() = user_id);

create policy "faculty_profiles_delete_own"
  on public.faculty_profiles for delete
  using (auth.uid() = user_id);

-- Create index for faster lookups
create index if not exists idx_faculty_profiles_user_id on public.faculty_profiles(user_id);
create index if not exists idx_faculty_profiles_department on public.faculty_profiles(department);
