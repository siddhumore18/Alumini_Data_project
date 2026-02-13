-- ============================================
-- ADMIN FEATURES DATABASE SETUP
-- Run this AFTER 000_setup_database.sql
-- ============================================

-- Step 1: Update profiles table to include admin role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('alumni', 'faculty', 'admin'));

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
  is_online boolean DEFAULT false,
  meeting_link text,
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_published boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 4: Create job_postings table
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

-- Step 5: Create discussion_forums table
CREATE TABLE IF NOT EXISTS public.discussion_forums (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  title text NOT NULL,
  description text,
  category text DEFAULT 'general' CHECK (category IN ('general', 'career', 'academic', 'networking', 'events')),
  created_by uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  is_pinned boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 6: Create forum_posts table
CREATE TABLE IF NOT EXISTS public.forum_posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  forum_id uuid NOT NULL REFERENCES public.discussion_forums(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  parent_post_id uuid REFERENCES public.forum_posts(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 7: Create messages table
CREATE TABLE IF NOT EXISTS public.messages (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  sender_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  receiver_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  subject text,
  content text NOT NULL,
  is_read boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Step 8: Create mentorship_connections table
CREATE TABLE IF NOT EXISTS public.mentorship_connections (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  mentor_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  mentee_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status text DEFAULT 'pending' CHECK (status IN ('pending', 'active', 'completed', 'rejected')),
  message text,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now(),
  UNIQUE(mentor_id, mentee_id)
);

-- Step 9: Create feedback table
CREATE TABLE IF NOT EXISTS public.feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  feedback_type text CHECK (feedback_type IN ('general', 'event', 'platform', 'suggestion')),
  subject text,
  message text NOT NULL,
  is_anonymous boolean DEFAULT false,
  created_at timestamp with time zone DEFAULT now()
);

-- Step 10: Create donations table
CREATE TABLE IF NOT EXISTS public.donations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid REFERENCES auth.users(id) ON DELETE SET NULL,
  amount numeric(10, 2) NOT NULL,
  currency text DEFAULT 'USD',
  donation_type text CHECK (donation_type IN ('one-time', 'monthly', 'yearly')),
  is_anonymous boolean DEFAULT false,
  message text,
  payment_status text DEFAULT 'pending' CHECK (payment_status IN ('pending', 'completed', 'failed')),
  created_at timestamp with time zone DEFAULT now()
);

-- Step 11: Enable RLS on all new tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.discussion_forums ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.forum_posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.mentorship_connections ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.donations ENABLE ROW LEVEL SECURITY;

-- Step 12: Create RLS Policies for announcements
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
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 13: Create RLS Policies for events
-- Everyone can read published events
CREATE POLICY "events_select_published"
  ON public.events FOR SELECT
  TO authenticated
  USING (is_published = true);

-- Admins can do everything
CREATE POLICY "events_admin_all"
  ON public.events FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 14: Create RLS Policies for job_postings
-- Everyone can read active job postings
CREATE POLICY "job_postings_select_active"
  ON public.job_postings FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

-- Users can create job postings
CREATE POLICY "job_postings_insert_own"
  ON public.job_postings FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = posted_by);

-- Admins can do everything
CREATE POLICY "job_postings_admin_all"
  ON public.job_postings FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 15: Create RLS Policies for discussion_forums
-- Everyone can read forums
CREATE POLICY "forums_select_all"
  ON public.discussion_forums FOR SELECT
  TO authenticated
  USING (true);

-- Users can create forums
CREATE POLICY "forums_insert_own"
  ON public.discussion_forums FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = created_by);

-- Step 16: Create RLS Policies for forum_posts
-- Everyone can read posts
CREATE POLICY "forum_posts_select_all"
  ON public.forum_posts FOR SELECT
  TO authenticated
  USING (true);

-- Users can create posts
CREATE POLICY "forum_posts_insert_own"
  ON public.forum_posts FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Step 17: Create RLS Policies for messages
-- Users can read their own messages
CREATE POLICY "messages_select_own"
  ON public.messages FOR SELECT
  TO authenticated
  USING (auth.uid() = sender_id OR auth.uid() = receiver_id);

-- Users can send messages
CREATE POLICY "messages_insert_own"
  ON public.messages FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = sender_id);

-- Step 18: Create RLS Policies for mentorship_connections
-- Users can read their own connections
CREATE POLICY "mentorship_select_own"
  ON public.mentorship_connections FOR SELECT
  TO authenticated
  USING (auth.uid() = mentor_id OR auth.uid() = mentee_id);

-- Users can create mentorship requests
CREATE POLICY "mentorship_insert_own"
  ON public.mentorship_connections FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = mentee_id);

-- Step 19: Create RLS Policies for feedback
-- Users can create feedback
CREATE POLICY "feedback_insert_own"
  ON public.feedback FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id);

-- Admins can read all feedback
CREATE POLICY "feedback_admin_select"
  ON public.feedback FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 20: Create RLS Policies for donations
-- Users can create donations
CREATE POLICY "donations_insert_own"
  ON public.donations FOR INSERT
  TO authenticated
  WITH CHECK (auth.uid() = user_id OR user_id IS NULL);

-- Users can read their own donations
CREATE POLICY "donations_select_own"
  ON public.donations FOR SELECT
  TO authenticated
  USING (auth.uid() = user_id OR user_id IS NULL);

-- Admins can read all donations
CREATE POLICY "donations_admin_select"
  ON public.donations FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE id = auth.uid() AND role = 'admin'
    )
  );

-- Step 21: Create function to auto-delete expired announcements
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

-- Step 22: Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON public.job_postings(expires_at);
CREATE INDEX IF NOT EXISTS idx_messages_receiver_id ON public.messages(receiver_id);
CREATE INDEX IF NOT EXISTS idx_messages_sender_id ON public.messages(sender_id);

-- Step 23: Create function to update updated_at timestamp
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create triggers for updated_at
CREATE TRIGGER update_announcements_updated_at BEFORE UPDATE ON public.announcements
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_events_updated_at BEFORE UPDATE ON public.events
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

CREATE TRIGGER update_job_postings_updated_at BEFORE UPDATE ON public.job_postings
  FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Next: Create admin user manually or through signup
-- Default admin credentials will be provided in the app

