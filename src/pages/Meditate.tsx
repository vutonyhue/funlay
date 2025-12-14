import { useState, useEffect, useRef, useCallback } from "react";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { MeditationVideoGrid } from "@/components/Meditation/MeditationVideoGrid";
import { MeditationPlayer } from "@/components/Meditation/MeditationPlayer";
import { MeditationPlaylists } from "@/components/Meditation/MeditationPlaylists";
import { LightParticles } from "@/components/Meditation/LightParticles";
import { MeditatingAngel } from "@/components/Meditation/MeditatingAngel";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Clock, Infinity, Moon, Sparkles } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number | null;
  view_count: number | null;
  channel_id: string;
  user_id: string;
}

const Meditate = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isAutoPlaying, setIsAutoPlaying] = useState(false);
  const [currentVideoIndex, setCurrentVideoIndex] = useState(0);
  const [sleepTimer, setSleepTimer] = useState<number | null>(null);
  const [showPlayer, setShowPlayer] = useState(false);
  const [selectedVideo, setSelectedVideo] = useState<Video | null>(null);
  const sleepTimerRef = useRef<NodeJS.Timeout | null>(null);
  const { toast } = useToast();

  useEffect(() => {
    fetchMeditationVideos();
  }, []);

  const fetchMeditationVideos = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("videos")
      .select("id, title, thumbnail_url, video_url, duration, view_count, channel_id, user_id")
      .eq("category", "meditation")
      .eq("is_public", true)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching meditation videos:", error);
    } else {
      setVideos(data || []);
    }
    setIsLoading(false);
  };

  const startAutoPlay = useCallback(() => {
    if (videos.length === 0) {
      toast({
        title: "Chưa có video thiền định",
        description: "Hãy upload video thiền định đầu tiên để bắt đầu!",
      });
      return;
    }
    setIsAutoPlaying(true);
    setCurrentVideoIndex(0);
    setSelectedVideo(videos[0]);
    setShowPlayer(true);
  }, [videos, toast]);

  const handleVideoEnd = useCallback(() => {
    if (isAutoPlaying && videos.length > 0) {
      const nextIndex = (currentVideoIndex + 1) % videos.length;
      setCurrentVideoIndex(nextIndex);
      setSelectedVideo(videos[nextIndex]);
    }
  }, [isAutoPlaying, currentVideoIndex, videos]);

  const handleVideoSelect = (video: Video) => {
    setSelectedVideo(video);
    setShowPlayer(true);
    setIsAutoPlaying(false);
  };

  const startSleepTimer = (minutes: number) => {
    if (sleepTimerRef.current) {
      clearTimeout(sleepTimerRef.current);
    }
    setSleepTimer(minutes);
    sleepTimerRef.current = setTimeout(() => {
      setIsAutoPlaying(false);
      setShowPlayer(false);
      setSleepTimer(null);
      toast({
        title: "🌙 Hẹn giờ ngủ",
        description: "Video đã dừng. Chúc bạn ngủ ngon và bình an.",
      });
    }, minutes * 60 * 1000);

    toast({
      title: "⏰ Hẹn giờ đã bật",
      description: `Video sẽ tự động dừng sau ${minutes} phút`,
    });
  };

  const closePlayer = () => {
    setShowPlayer(false);
    setIsAutoPlaying(false);
    setSelectedVideo(null);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-950 via-slate-900 to-slate-950 relative overflow-hidden">
      {/* Light Particles Background */}
      <LightParticles />

      {/* Meditating Angel */}
      <MeditatingAngel />

      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <main className="pt-14 lg:pl-60 min-h-screen relative z-10">
        <div className="p-4 md:p-6">
          {/* Header Section */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center gap-2 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-cyan-400 via-purple-500 to-amber-400 flex items-center justify-center animate-pulse">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <h1 className="text-3xl md:text-4xl font-bold bg-gradient-to-r from-cyan-400 via-purple-400 to-amber-400 bg-clip-text text-transparent">
                Meditate with Father
              </h1>
            </div>
            <p className="text-slate-400 max-w-2xl mx-auto">
              Không gian chữa lành và tái sinh năng lượng • Nơi mọi linh hồn được nghỉ ngơi trong dòng chảy ánh sáng 24/7
            </p>
          </div>

          {/* Auto Play Control */}
          <div className="flex flex-wrap items-center justify-center gap-4 mb-8">
            <Button
              onClick={startAutoPlay}
              className="bg-gradient-to-r from-cyan-500 via-purple-500 to-amber-500 hover:from-cyan-600 hover:via-purple-600 hover:to-amber-600 text-white px-8 py-6 text-lg rounded-full shadow-lg shadow-purple-500/25 transition-all hover:scale-105"
            >
              <Infinity className="w-6 h-6 mr-2 animate-spin" style={{ animationDuration: '3s' }} />
              Phát liên tục 24/7
            </Button>

            {/* Sleep Timer Options */}
            <div className="flex flex-wrap gap-2">
              {[30, 60, 180, 480].map((minutes) => (
                <Button
                  key={minutes}
                  variant="outline"
                  onClick={() => startSleepTimer(minutes)}
                  className={`border-slate-700 text-slate-300 hover:bg-slate-800 hover:text-white ${
                    sleepTimer === minutes ? 'bg-slate-800 border-cyan-500' : ''
                  }`}
                >
                  <Moon className="w-4 h-4 mr-1" />
                  {minutes < 60 ? `${minutes} phút` : `${minutes / 60} giờ`}
                </Button>
              ))}
            </div>
          </div>

          {/* Tabs */}
          <Tabs defaultValue="videos" className="w-full">
            <TabsList className="bg-slate-800/50 border border-slate-700 mb-6">
              <TabsTrigger value="videos" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20">
                <Play className="w-4 h-4 mr-2" />
                Video Thiền Định
              </TabsTrigger>
              <TabsTrigger value="playlists" className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500/20 data-[state=active]:to-purple-500/20">
                <Clock className="w-4 h-4 mr-2" />
                Playlist Chữa Lành
              </TabsTrigger>
            </TabsList>

            <TabsContent value="videos">
              <MeditationVideoGrid 
                videos={videos} 
                isLoading={isLoading} 
                onVideoSelect={handleVideoSelect}
              />
            </TabsContent>

            <TabsContent value="playlists">
              <MeditationPlaylists />
            </TabsContent>
          </Tabs>
        </div>
      </main>

      {/* Meditation Player Modal */}
      {showPlayer && selectedVideo && (
        <MeditationPlayer
          video={selectedVideo}
          isAutoPlaying={isAutoPlaying}
          onVideoEnd={handleVideoEnd}
          onClose={closePlayer}
          sleepTimer={sleepTimer}
        />
      )}
    </div>
  );
};

export default Meditate;
