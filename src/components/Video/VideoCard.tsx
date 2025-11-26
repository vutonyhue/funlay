import { Play, Volume2, Edit, Share2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface VideoCardProps {
  thumbnail: string;
  title: string;
  channel: string;
  views: string;
  timestamp: string;
  videoId: string;
  userId?: string;
  onPlay?: (videoId: string) => void;
}

export const VideoCard = ({
  thumbnail,
  title,
  channel,
  views,
  timestamp,
  videoId,
  userId,
  onPlay,
}: VideoCardProps) => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { toast } = useToast();
  const isOwner = user?.id === userId;

  const handlePlay = () => {
    if (onPlay) {
      onPlay(videoId);
    }
  };

  const handleEdit = (e: React.MouseEvent) => {
    e.stopPropagation();
    navigate(`/studio?tab=content&edit=${videoId}`);
  };

  const handleShare = (e: React.MouseEvent) => {
    e.stopPropagation();
    const shareUrl = `${window.location.origin}/watch/${videoId}`;
    navigator.clipboard.writeText(shareUrl);
    toast({
      title: "Đã copy link",
      description: "Link video đã được copy vào clipboard",
    });
  };

  return (
    <Card className="group overflow-hidden glass-card holographic border-2 border-white/10 hover:border-white/30 transition-all duration-500 cursor-pointer relative">
      {/* Golden diamond sparkle effect on hover */}
      <div className="absolute inset-0 pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <div className="absolute top-1/4 left-1/4 w-2.5 h-2.5 bg-glow-gold rounded-full animate-[sparkle_1s_ease-in-out_infinite] shadow-[0_0_15px_rgba(255,215,0,0.8)]" />
        <div className="absolute top-1/3 right-1/3 w-2 h-2 bg-glow-light-gold rounded-full animate-[sparkle_1.2s_ease-in-out_infinite_0.2s] shadow-[0_0_12px_rgba(255,255,128,0.8)]" />
        <div className="absolute bottom-1/4 right-1/4 w-2.5 h-2.5 bg-cosmic-cyan rounded-full animate-[sparkle_1.4s_ease-in-out_infinite_0.4s] shadow-[0_0_15px_rgba(0,255,255,0.8)]" />
        <div className="absolute top-1/2 left-1/3 w-1.5 h-1.5 bg-glow-white rounded-full animate-[sparkle_1.1s_ease-in-out_infinite_0.3s] shadow-[0_0_10px_rgba(255,255,255,0.9)]" />
        <div className="absolute bottom-1/3 left-1/2 w-2 h-2 bg-glow-gold rounded-full animate-[sparkle_1.3s_ease-in-out_infinite_0.5s] shadow-[0_0_12px_rgba(255,215,0,0.8)]" />
      </div>

      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-t-lg" onClick={handlePlay}>
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-700"
        />
        
        {/* Golden rainbow halo overlay on hover */}
        <div className="absolute inset-0 bg-gradient-to-br from-glow-gold/25 via-glow-light-gold/20 to-cosmic-cyan/20 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
        
        {/* Play button overlay with golden divine glow */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/40 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-opacity duration-500">
          <Button
            size="icon"
            className="h-16 w-16 rounded-full bg-gradient-to-br from-cosmic-gold via-glow-light-gold to-cosmic-cyan divine-glow border-2 border-glow-gold/70 shadow-[0_0_40px_rgba(255,215,0,0.8)]"
          >
            <Play className="h-8 w-8 fill-current text-background" />
          </Button>
        </div>

        {/* Edit button for owner */}
        {isOwner && (
          <Button
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 bg-cosmic-cyan/90 hover:bg-cosmic-cyan border border-glow-cyan/60 text-background opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_25px_rgba(0,255,255,0.6)]"
            onClick={handleEdit}
            title="Chỉnh sửa trong Studio"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Share button with golden glow */}
        <Button
          size="icon"
          className="absolute top-2 right-2 h-8 w-8 bg-cosmic-gold/90 hover:bg-cosmic-gold border border-glow-gold/60 text-background opacity-0 group-hover:opacity-100 transition-all duration-300 shadow-[0_0_30px_rgba(255,215,0,0.7)]"
          onClick={handleShare}
          title="Chia sẻ video"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      </div>

      {/* Info with glassmorphism */}
      <div className="p-4 flex gap-3 bg-gradient-to-b from-transparent to-background/20">
        <div className="flex-shrink-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-cosmic-gold via-glow-light-gold to-cosmic-cyan flex items-center justify-center text-background font-bold text-sm shadow-[0_0_20px_rgba(255,215,0,0.5)]">
            {channel[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-bold text-sm line-clamp-2 mb-1 text-foreground group-hover:text-cosmic-gold transition-colors duration-300">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground group-hover:text-divine-lavender transition-colors duration-300">{channel}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-cosmic-cyan/90 mt-1 transition-colors duration-300">
            <span>{views}</span>
            <span className="text-cosmic-gold">•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>
    </Card>
  );
};
