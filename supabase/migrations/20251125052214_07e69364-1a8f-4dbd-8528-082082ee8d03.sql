-- Create reward settings table
CREATE TABLE public.reward_settings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  reward_enabled BOOLEAN NOT NULL DEFAULT false,
  reward_token TEXT NOT NULL DEFAULT 'CAMLY',
  reward_amount NUMERIC NOT NULL DEFAULT 9.999,
  min_watch_percentage INTEGER NOT NULL DEFAULT 80,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Insert default settings
INSERT INTO public.reward_settings (reward_enabled, reward_token, reward_amount, min_watch_percentage)
VALUES (false, 'CAMLY', 9.999, 80);

-- Enable RLS
ALTER TABLE public.reward_settings ENABLE ROW LEVEL SECURITY;

-- Anyone can view settings
CREATE POLICY "Reward settings are viewable by everyone"
ON public.reward_settings
FOR SELECT
USING (true);

-- Only admins can update settings (for now, allow authenticated users - you can restrict later)
CREATE POLICY "Authenticated users can update reward settings"
ON public.reward_settings
FOR UPDATE
USING (auth.uid() IS NOT NULL);

-- Create video watch progress table to track who watched what
CREATE TABLE public.video_watch_progress (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  watch_percentage INTEGER NOT NULL DEFAULT 0,
  rewarded BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(user_id, video_id)
);

-- Enable RLS
ALTER TABLE public.video_watch_progress ENABLE ROW LEVEL SECURITY;

-- Users can view their own watch progress
CREATE POLICY "Users can view their own watch progress"
ON public.video_watch_progress
FOR SELECT
USING (auth.uid() = user_id);

-- Users can insert their own watch progress
CREATE POLICY "Users can insert their own watch progress"
ON public.video_watch_progress
FOR INSERT
WITH CHECK (auth.uid() = user_id);

-- Users can update their own watch progress
CREATE POLICY "Users can update their own watch progress"
ON public.video_watch_progress
FOR UPDATE
USING (auth.uid() = user_id);

-- Add trigger for updated_at on reward_settings
CREATE TRIGGER update_reward_settings_updated_at
BEFORE UPDATE ON public.reward_settings
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Add trigger for updated_at on video_watch_progress
CREATE TRIGGER update_video_watch_progress_updated_at
BEFORE UPDATE ON public.video_watch_progress
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();