import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Maximize2, Minimize2, Moon, Waves, Wind, CloudRain } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Slider } from "@/components/ui/slider";
import { LightParticles } from "./LightParticles";

interface Video {
  id: string;
  title: string;
  thumbnail_url: string | null;
  video_url: string;
  duration: number | null;
}

interface MeditationPlayerProps {
  video: Video;
  isAutoPlaying: boolean;
  onVideoEnd: () => void;
  onClose: () => void;
  sleepTimer: number | null;
}

const ambientSounds = [
  { id: "waves", name: "Sóng biển", icon: Waves, url: "https://assets.mixkit.co/sfx/preview/mixkit-sea-waves-loop-1196.mp3" },
  { id: "wind", name: "Gió nhẹ", icon: Wind, url: "https://assets.mixkit.co/sfx/preview/mixkit-forest-wind-ambience-1232.mp3" },
  { id: "rain", name: "Mưa nhẹ", icon: CloudRain, url: "https://assets.mixkit.co/sfx/preview/mixkit-light-rain-loop-2393.mp3" },
];

export const MeditationPlayer = ({ 
  video, 
  isAutoPlaying, 
  onVideoEnd, 
  onClose,
  sleepTimer 
}: MeditationPlayerProps) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const ambientRef = useRef<HTMLAudioElement>(null);
  const [isFullscreen, setIsFullscreen] = useState(true);
  const [volume, setVolume] = useState(0.7);
  const [isMuted, setIsMuted] = useState(false);
  const [activeAmbient, setActiveAmbient] = useState<string | null>(null);
  const [ambientVolume, setAmbientVolume] = useState(0.3);
  const [showControls, setShowControls] = useState(true);
  const controlsTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = volume;
      videoRef.current.play();
    }
  }, [video]);

  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.volume = isMuted ? 0 : volume;
    }
  }, [volume, isMuted]);

  useEffect(() => {
    if (ambientRef.current) {
      ambientRef.current.volume = ambientVolume;
    }
  }, [ambientVolume]);

  const handleMouseMove = () => {
    setShowControls(true);
    if (controlsTimeoutRef.current) {
      clearTimeout(controlsTimeoutRef.current);
    }
    controlsTimeoutRef.current = setTimeout(() => {
      setShowControls(false);
    }, 3000);
  };

  const toggleAmbientSound = (soundId: string) => {
    if (activeAmbient === soundId) {
      setActiveAmbient(null);
      if (ambientRef.current) {
        ambientRef.current.pause();
      }
    } else {
      setActiveAmbient(soundId);
      const sound = ambientSounds.find(s => s.id === soundId);
      if (ambientRef.current && sound) {
        ambientRef.current.src = sound.url;
        ambientRef.current.play();
      }
    }
  };

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen();
      setIsFullscreen(true);
    } else {
      document.exitFullscreen();
      setIsFullscreen(false);
    }
  };

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-50 bg-black"
        onMouseMove={handleMouseMove}
      >
        {/* Cosmic Background */}
        <div className="absolute inset-0 overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-b from-slate-950 via-purple-950/30 to-slate-950" />
          <LightParticles />
          
          {/* Rotating Lotus */}
          <motion.div
            className="absolute bottom-10 left-1/2 -translate-x-1/2 w-40 h-40 opacity-20"
            animate={{ rotate: 360 }}
            transition={{ duration: 60, repeat: Infinity, ease: "linear" }}
          >
            <div className="w-full h-full rounded-full bg-gradient-to-r from-pink-500/50 via-purple-500/50 to-cyan-500/50 blur-xl" />
          </motion.div>
        </div>

        {/* Video Player */}
        <video
          ref={videoRef}
          src={video.video_url}
          className="absolute inset-0 w-full h-full object-contain z-10"
          onEnded={onVideoEnd}
          playsInline
        />

        {/* Ambient Audio */}
        <audio ref={ambientRef} loop />

        {/* Controls Overlay */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: showControls ? 1 : 0 }}
          className="absolute inset-0 z-20"
        >
          {/* Top Bar */}
          <div className="absolute top-0 left-0 right-0 p-6 bg-gradient-to-b from-black/60 to-transparent">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-white text-xl font-semibold">{video.title}</h2>
                {sleepTimer && (
                  <div className="flex items-center gap-2 text-amber-300 text-sm mt-1">
                    <Moon className="w-4 h-4" />
                    <span>Hẹn giờ: {sleepTimer < 60 ? `${sleepTimer} phút` : `${sleepTimer / 60} giờ`}</span>
                  </div>
                )}
              </div>
              <Button
                variant="ghost"
                size="icon"
                onClick={onClose}
                className="text-white hover:bg-white/20"
              >
                <X className="w-6 h-6" />
              </Button>
            </div>
          </div>

          {/* Bottom Controls */}
          <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-black/60 to-transparent">
            <div className="flex flex-col gap-4">
              {/* Ambient Sounds */}
              <div className="flex items-center gap-3">
                <span className="text-white/60 text-sm">Âm thanh:</span>
                {ambientSounds.map((sound) => (
                  <Button
                    key={sound.id}
                    variant="ghost"
                    size="sm"
                    onClick={() => toggleAmbientSound(sound.id)}
                    className={`text-white hover:bg-white/20 ${
                      activeAmbient === sound.id ? 'bg-white/20 ring-1 ring-cyan-400' : ''
                    }`}
                  >
                    <sound.icon className="w-4 h-4 mr-1" />
                    {sound.name}
                  </Button>
                ))}
                {activeAmbient && (
                  <div className="flex items-center gap-2 ml-4">
                    <span className="text-white/60 text-xs">Độ lớn:</span>
                    <Slider
                      value={[ambientVolume * 100]}
                      onValueChange={(v) => setAmbientVolume(v[0] / 100)}
                      max={100}
                      step={1}
                      className="w-24"
                    />
                  </div>
                )}
              </div>

              {/* Volume & Fullscreen */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => setIsMuted(!isMuted)}
                    className="text-white hover:bg-white/20"
                  >
                    {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                  </Button>
                  <Slider
                    value={[volume * 100]}
                    onValueChange={(v) => setVolume(v[0] / 100)}
                    max={100}
                    step={1}
                    className="w-32"
                  />
                </div>

                <Button
                  variant="ghost"
                  size="icon"
                  onClick={toggleFullscreen}
                  className="text-white hover:bg-white/20"
                >
                  {isFullscreen ? <Minimize2 className="w-5 h-5" /> : <Maximize2 className="w-5 h-5" />}
                </Button>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Auto-play indicator */}
        {isAutoPlaying && (
          <div className="absolute top-20 right-6 z-30 flex items-center gap-2 px-3 py-1.5 bg-gradient-to-r from-cyan-500/20 to-purple-500/20 rounded-full border border-cyan-500/30">
            <div className="w-2 h-2 bg-cyan-400 rounded-full animate-pulse" />
            <span className="text-cyan-300 text-sm">Đang phát tự động</span>
          </div>
        )}
      </motion.div>
    </AnimatePresence>
  );
};
