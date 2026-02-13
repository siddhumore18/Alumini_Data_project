-- ============================================
-- ADMIN SYSTEM SETUP
-- Run this AFTER 000_setup_database.sql
-- ============================================

-- Step 1: Update profiles table to support admin role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('alumni', 'faculty', 'admin'));

-- Step 1.5: Update profile trigger to auto-assign admin role for admin@sharas.edu
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  user_role text;
BEGIN
  -- Auto-assign admin role for admin emails (support multiple formats)
  IF new.email IN ('admin@sharas.edu', 'admin@sharas.edu.in', 'admin.sharas@gmail.com', 'admin@sharasinstitute.edu') THEN
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

-- Recreate trigger
DROP TRIGGER IF EXISTS on_auth_user_created ON auth.users;
CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW
  EXECUTE FUNCTION public.handle_new_user();

-- Step 2: Create announcements table
CREATE TABLE IF NOT EXISTS public.announcements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  message text NOT NULL,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  expires_at timestamp with time zone,
  is_active boolean DEFAULT true,
  priority text DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 3: Create events table
CREATE TABLE IF NOT EXISTS public.events (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  event_type text NOT NULL CHECK (event_type IN ('reunion', 'webinar', 'workshop', 'other')),
  start_date timestamp with time zone NOT NULL,
  end_date timestamp with time zone,
  location text,
  online_link text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published boolean DEFAULT false,
  max_attendees integer,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 4: Create event_registrations table
CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

-- Step 5: Create job_postings table
CREATE TABLE IF NOT EXISTS public.job_postings (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  company_name text NOT NULL,
  description text NOT NULL,
  requirements text,
  location text,
  job_type text CHECK (job_type IN ('full-time', 'part-time', 'internship', 'contract')),
  salary_range text,
  application_link text,
  posted_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_active boolean DEFAULT true,
  expires_at timestamp with time zone,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 6: Create forums table
CREATE TABLE IF NOT EXISTS public.forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 7: Create forum_posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES public.forums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 8: Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Step 9: Create mentorship_connections table
CREATE TABLE IF NOT EXISTS public.mentorship_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'rejected', 'completed')),
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Step 10: Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text CHECK (feedback_type IN ('suggestion', 'complaint', 'compliment', 'other')),
  subject text NOT NULL,
  message text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Step 11: Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  payment_method text,
  is_anonymous boolean DEFAULT false,
  purpose text,
  created_at timestamp with time zone DEFAULT now()
);

-- Step 12: Enable RLS on all new tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Step 13: Create RLS Policies for announcements
-- Everyone can read active announcements
CREATE POLICY "announcements_select_active"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Admins can do everything
CREATE POLICY "announcements_admin_all"
  ON public.announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 14: Create RLS Policies for events
CREATE POLICY "events_select_published"
  ON public.events FOR SELECT
  TO authenticated
  USING (is_published = true);

CREATE POLICY "events_admin_all"
  ON public.events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 15: Create RLS Policies for event_registrations
CREATE POLICY "event_registrations_select_own"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "event_registrations_insert_own"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 16: Create RLS Policies for job_postings
CREATE POLICY "job_postings_select_active"
  ON public.job_postings FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "job_postings_insert_authenticated"
  ON public.job_postings FOR INSERT
  TO authenticated
  WITH CHECK (posted_by = auth.uid());

-- Step 17: Create RLS Policies for forums
CREATE POLICY "forums_select_all"
  ON public.forums FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forums_insert_authenticated"
  ON public.forums FOR INSERT
  TO authenticated
  WITH CHECK (created_by = auth.uid());

-- Step 18: Create RLS Policies for forum_posts
CREATE POLICY "forum_posts_select_all"
  ON public.forum_posts FOR SELECT
  TO authenticated
  USING (true);

CREATE POLICY "forum_posts_insert_own"
  ON public.forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- Step 19: Create RLS Policies for messages
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  TO authenticated
  USING (sender_id = auth.uid() OR receiver_id = auth.uid());

CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (sender_id = auth.uid());

-- Step 20: Create RLS Policies for mentorship_connections
CREATE POLICY "mentorship_select_own"
  ON public.mentorship_connections FOR SELECT
  TO authenticated
  USING (mentor_id = auth.uid() OR mentee_id = auth.uid());

CREATE POLICY "mentorship_insert_own"
  ON public.mentorship_connections FOR INSERT
  TO authenticated
  WITH CHECK (mentee_id = auth.uid());

-- Step 21: Create RLS Policies for feedback
CREATE POLICY "feedback_insert_own"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "feedback_admin_select"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- Step 22: Create RLS Policies for donations
CREATE POLICY "donations_insert_own"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

CREATE POLICY "donations_select_own"
  ON public.donations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid() OR is_anonymous = false);

-- Step 23: Create function to auto-delete expired announcements
CREATE OR REPLACE FUNCTION public.delete_expired_announcements()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  DELETE FROM public.announcements
  WHERE expires_at IS NOT NULL 
    AND expires_at < now()
    AND is_active = true;
END;
$$;

-- Step 24: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON public.job_postings(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- ============================================
-- ADMIN SYSTEM SETUP COMPLETE!
-- ============================================
-- To create an admin user:
-- 1. Sign up a user through the app
-- 2. Run this SQL to make them admin:
--    UPDATE public.profiles SET role = 'admin' WHERE email = 'admin@example.com';
-- ============================================

