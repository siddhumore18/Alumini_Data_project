-- ============================================
-- COMPLETE DATABASE SETUP - ALL IN ONE
-- Copy and paste this ENTIRE script into Supabase SQL Editor
-- ============================================

-- PART 1: Update profiles to support admin role
ALTER TABLE public.profiles 
DROP CONSTRAINT IF EXISTS profiles_role_check;

ALTER TABLE public.profiles 
ADD CONSTRAINT profiles_role_check 
CHECK (role IN ('alumni', 'faculty', 'admin'));

-- PART 2: Create all admin tables
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

CREATE TABLE IF NOT EXISTS public.event_registrations (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  event_id uuid NOT NULL REFERENCES public.events(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  registered_at timestamp with time zone DEFAULT now(),
  UNIQUE(event_id, user_id)
);

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

-- PART 3: Create posts/feed tables
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'placement', 'event', 'reunion', 'webinar', 'workshop', 'achievement', 'announcement')),
  event_title text,
  event_date timestamp with time zone,
  event_location text,
  event_link text,
  is_online boolean DEFAULT false,
  company_name text,
  position_title text,
  job_description text,
  application_link text,
  salary_range text,
  image_url text,
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- PART 4: Enable RLS on all tables
ALTER TABLE public.announcements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.events ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.event_registrations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.job_postings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- PART 5: Create RLS Policies for announcements
DROP POLICY IF EXISTS "announcements_select_active" ON public.announcements;
DROP POLICY IF EXISTS "announcements_admin_all" ON public.announcements;

CREATE POLICY "announcements_select_active"
  ON public.announcements FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "announcements_admin_all"
  ON public.announcements FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM public.profiles
      WHERE profiles.id = auth.uid() AND profiles.role = 'admin'
    )
  );

-- PART 6: Create RLS Policies for events
DROP POLICY IF EXISTS "events_select_published" ON public.events;
DROP POLICY IF EXISTS "events_admin_all" ON public.events;

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

-- PART 7: Create RLS Policies for event_registrations
DROP POLICY IF EXISTS "event_registrations_select_own" ON public.event_registrations;
DROP POLICY IF EXISTS "event_registrations_insert_own" ON public.event_registrations;

CREATE POLICY "event_registrations_select_own"
  ON public.event_registrations FOR SELECT
  TO authenticated
  USING (user_id = auth.uid());

CREATE POLICY "event_registrations_insert_own"
  ON public.event_registrations FOR INSERT
  TO authenticated
  WITH CHECK (user_id = auth.uid());

-- PART 8: Create RLS Policies for job_postings
DROP POLICY IF EXISTS "job_postings_select_active" ON public.job_postings;
DROP POLICY IF EXISTS "job_postings_insert_authenticated" ON public.job_postings;

CREATE POLICY "job_postings_select_active"
  ON public.job_postings FOR SELECT
  TO authenticated
  USING (is_active = true AND (expires_at IS NULL OR expires_at > now()));

CREATE POLICY "job_postings_insert_authenticated"
  ON public.job_postings FOR INSERT
  TO authenticated
  WITH CHECK (posted_by = auth.uid());

-- PART 9: Create RLS Policies for posts
DROP POLICY IF EXISTS "Anyone can view posts" ON public.posts;
DROP POLICY IF EXISTS "Users can create posts" ON public.posts;
DROP POLICY IF EXISTS "Users can update own posts" ON public.posts;
DROP POLICY IF EXISTS "Users can delete own posts" ON public.posts;

CREATE POLICY "Anyone can view posts"
  ON public.posts FOR SELECT
  USING (true);

CREATE POLICY "Users can create posts"
  ON public.posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.posts FOR DELETE
  USING (auth.uid() = user_id);

-- PART 10: Create RLS Policies for post_likes
DROP POLICY IF EXISTS "Anyone can view likes" ON public.post_likes;
DROP POLICY IF EXISTS "Users can like posts" ON public.post_likes;
DROP POLICY IF EXISTS "Users can unlike posts" ON public.post_likes;

CREATE POLICY "Anyone can view likes"
  ON public.post_likes FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes FOR DELETE
  USING (auth.uid() = user_id);

-- PART 11: Create RLS Policies for post_comments
DROP POLICY IF EXISTS "Anyone can view comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can create comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can update own comments" ON public.post_comments;
DROP POLICY IF EXISTS "Users can delete own comments" ON public.post_comments;

CREATE POLICY "Anyone can view comments"
  ON public.post_comments FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.post_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.post_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments FOR DELETE
  USING (auth.uid() = user_id);

-- PART 12: Create triggers for post engagement counts
CREATE OR REPLACE FUNCTION update_post_likes_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET likes_count = (
      SELECT COUNT(*) FROM public.post_likes WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET likes_count = (
      SELECT COUNT(*) FROM public.post_likes WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

CREATE OR REPLACE FUNCTION update_post_comments_count()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'INSERT' THEN
    UPDATE public.posts
    SET comments_count = (
      SELECT COUNT(*) FROM public.post_comments WHERE post_id = NEW.post_id
    )
    WHERE id = NEW.post_id;
    RETURN NEW;
  ELSIF TG_OP = 'DELETE' THEN
    UPDATE public.posts
    SET comments_count = (
      SELECT COUNT(*) FROM public.post_comments WHERE post_id = OLD.post_id
    )
    WHERE id = OLD.post_id;
    RETURN OLD;
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON public.post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- PART 13: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_announcements_expires_at ON public.announcements(expires_at);
CREATE INDEX IF NOT EXISTS idx_announcements_is_active ON public.announcements(is_active);
CREATE INDEX IF NOT EXISTS idx_events_start_date ON public.events(start_date);
CREATE INDEX IF NOT EXISTS idx_events_is_published ON public.events(is_published);
CREATE INDEX IF NOT EXISTS idx_job_postings_expires_at ON public.job_postings(expires_at);
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

-- ============================================
-- SETUP COMPLETE!
-- ============================================
-- Your database is now ready to use!
-- Try signing up and logging in to test.
-- ============================================
