-- ============================================
-- ADD LINKEDIN FIELD TO PROFILES
-- Adds LinkedIn URL field to profiles table
-- ============================================

-- Add LinkedIn URL column to profiles table
ALTER TABLE public.profiles 
ADD COLUMN IF NOT EXISTS linkedin_url text;

-- Add index for faster lookups
CREATE INDEX IF NOT EXISTS idx_profiles_linkedin_url ON public.profiles(linkedin_url) WHERE linkedin_url IS NOT NULL;

-- Add comment for documentation
COMMENT ON COLUMN public.profiles.linkedin_url IS 'LinkedIn profile URL for connecting with alumni';

