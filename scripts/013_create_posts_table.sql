-- ============================================
-- POSTS/FEED TABLE SETUP
-- Creates a LinkedIn-like posts feed system
-- ============================================

-- Step 1: Create posts table
CREATE TABLE IF NOT EXISTS public.posts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  post_type text NOT NULL DEFAULT 'general' CHECK (post_type IN ('general', 'placement', 'event', 'reunion', 'webinar', 'workshop', 'achievement', 'announcement')),
  
  -- Event-specific fields (for event posts)
  event_title text,
  event_date timestamp with time zone,
  event_location text,
  event_link text,
  is_online boolean DEFAULT false,
  
  -- Placement-specific fields
  company_name text,
  position_title text,
  job_description text,
  application_link text,
  salary_range text,
  
  -- Media/attachments (for future use)
  image_url text,
  
  -- Engagement metrics (for future use)
  likes_count integer DEFAULT 0,
  comments_count integer DEFAULT 0,
  
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 2: Create post_likes table (for likes functionality)
CREATE TABLE IF NOT EXISTS public.post_likes (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  created_at timestamp with time zone DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Step 3: Create post_comments table (for comments functionality)
CREATE TABLE IF NOT EXISTS public.post_comments (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  post_id uuid NOT NULL REFERENCES public.posts(id) ON DELETE CASCADE,
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  content text NOT NULL,
  created_at timestamp with time zone DEFAULT now(),
  updated_at timestamp with time zone DEFAULT now()
);

-- Step 4: Enable RLS
ALTER TABLE public.posts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_likes ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.post_comments ENABLE ROW LEVEL SECURITY;

-- Step 5: Create RLS Policies for posts
-- Anyone can read posts
CREATE POLICY "Anyone can view posts"
  ON public.posts
  FOR SELECT
  USING (true);

-- Users can create their own posts
CREATE POLICY "Users can create posts"
  ON public.posts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

-- Users can update their own posts
CREATE POLICY "Users can update own posts"
  ON public.posts
  FOR UPDATE
  USING (auth.uid() = user_id);

-- Users can delete their own posts
CREATE POLICY "Users can delete own posts"
  ON public.posts
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 6: Create RLS Policies for post_likes
CREATE POLICY "Anyone can view likes"
  ON public.post_likes
  FOR SELECT
  USING (true);

CREATE POLICY "Users can like posts"
  ON public.post_likes
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can unlike posts"
  ON public.post_likes
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 7: Create RLS Policies for post_comments
CREATE POLICY "Anyone can view comments"
  ON public.post_comments
  FOR SELECT
  USING (true);

CREATE POLICY "Users can create comments"
  ON public.post_comments
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.post_comments
  FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.post_comments
  FOR DELETE
  USING (auth.uid() = user_id);

-- Step 8: Create function to update likes count
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

-- Step 9: Create trigger for likes count
DROP TRIGGER IF EXISTS trigger_update_post_likes_count ON public.post_likes;
CREATE TRIGGER trigger_update_post_likes_count
  AFTER INSERT OR DELETE ON public.post_likes
  FOR EACH ROW
  EXECUTE FUNCTION update_post_likes_count();

-- Step 10: Create function to update comments count
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

-- Step 11: Create trigger for comments count
DROP TRIGGER IF EXISTS trigger_update_post_comments_count ON public.post_comments;
CREATE TRIGGER trigger_update_post_comments_count
  AFTER INSERT OR DELETE ON public.post_comments
  FOR EACH ROW
  EXECUTE FUNCTION update_post_comments_count();

-- Step 12: Create index for better performance
CREATE INDEX IF NOT EXISTS idx_posts_user_id ON public.posts(user_id);
CREATE INDEX IF NOT EXISTS idx_posts_created_at ON public.posts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_posts_post_type ON public.posts(post_type);
CREATE INDEX IF NOT EXISTS idx_post_likes_post_id ON public.post_likes(post_id);
CREATE INDEX IF NOT EXISTS idx_post_comments_post_id ON public.post_comments(post_id);

