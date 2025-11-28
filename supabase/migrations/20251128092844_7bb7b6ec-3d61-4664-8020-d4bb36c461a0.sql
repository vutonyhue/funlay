-- Add total_camly_rewards column to profiles table to track cumulative rewards
-- This tracks the total amount of CAMLY tokens a user has ever received, never decreases
ALTER TABLE public.profiles
ADD COLUMN total_camly_rewards numeric DEFAULT 0 NOT NULL;

-- Create index for performance
CREATE INDEX idx_profiles_total_camly_rewards ON public.profiles(total_camly_rewards DESC);

-- Add comment
COMMENT ON COLUMN public.profiles.total_camly_rewards IS 'Total cumulative CAMLY rewards earned from all activities (views, likes, comments, shares) - never decreases even if transferred';