-- Create profiles table for alumni and faculty
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

-- Create academic records table
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

-- Create projects table
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

-- Enable Row Level Security
alter table public.profiles enable row level security;
alter table public.academic_records enable row level security;
alter table public.projects enable row level security;

-- Profiles RLS Policies
create policy "profiles_select_own"
  on public.profiles for select
  using (auth.uid() = id);

create policy "profiles_select_all_public"
  on public.profiles for select
  using (true);

create policy "profiles_insert_own"
  on public.profiles for insert
  with check (auth.uid() = id);

create policy "profiles_update_own"
  on public.profiles for update
  using (auth.uid() = id);

-- Academic Records RLS Policies
create policy "academic_records_select_own"
  on public.academic_records for select
  using (auth.uid() = user_id);

create policy "academic_records_insert_own"
  on public.academic_records for insert
  with check (auth.uid() = user_id);

create policy "academic_records_update_own"
  on public.academic_records for update
  using (auth.uid() = user_id);

-- Projects RLS Policies
create policy "projects_select_own"
  on public.projects for select
  using (auth.uid() = user_id);

create policy "projects_insert_own"
  on public.projects for insert
  with check (auth.uid() = user_id);

create policy "projects_update_own"
  on public.projects for update
  using (auth.uid() = user_id);

create policy "projects_delete_own"
  on public.projects for delete
  using (auth.uid() = user_id);
