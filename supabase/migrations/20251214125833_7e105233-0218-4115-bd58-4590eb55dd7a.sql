-- Add category column to videos table for meditation content
ALTER TABLE public.videos 
ADD COLUMN IF NOT EXISTS category TEXT DEFAULT 'general';

-- Create meditation_playlists table for special meditation playlists
CREATE TABLE IF NOT EXISTS public.meditation_playlists (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL,
  description TEXT,
  is_featured BOOLEAN DEFAULT false,
  thumbnail_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.meditation_playlists ENABLE ROW LEVEL SECURITY;

-- RLS Policies for meditation_playlists
CREATE POLICY "Meditation playlists are viewable by everyone" 
ON public.meditation_playlists 
FOR SELECT 
USING (true);

CREATE POLICY "Users can create meditation playlists" 
ON public.meditation_playlists 
FOR INSERT 
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update their own meditation playlists" 
ON public.meditation_playlists 
FOR UPDATE 
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete their own meditation playlists" 
ON public.meditation_playlists 
FOR DELETE 
USING (auth.uid() = user_id);

-- Create meditation_playlist_videos junction table
CREATE TABLE IF NOT EXISTS public.meditation_playlist_videos (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  playlist_id UUID NOT NULL REFERENCES public.meditation_playlists(id) ON DELETE CASCADE,
  video_id UUID NOT NULL REFERENCES public.videos(id) ON DELETE CASCADE,
  position INTEGER NOT NULL DEFAULT 0,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(playlist_id, video_id)
);

-- Enable RLS
ALTER TABLE public.meditation_playlist_videos ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Meditation playlist videos viewable by everyone" 
ON public.meditation_playlist_videos 
FOR SELECT 
USING (true);

CREATE POLICY "Playlist owners can manage videos" 
ON public.meditation_playlist_videos 
FOR ALL 
USING (EXISTS (
  SELECT 1 FROM public.meditation_playlists 
  WHERE id = playlist_id AND user_id = auth.uid()
));

-- Add trigger for updated_at
CREATE TRIGGER update_meditation_playlists_updated_at
BEFORE UPDATE ON public.meditation_playlists
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();