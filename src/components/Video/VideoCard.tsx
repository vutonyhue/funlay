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
    <Card className="group overflow-hidden bg-card border-0 hover:bg-hover-blue dark:hover:bg-hover-blue-dark transition-all duration-300 cursor-pointer hover:shadow-xl">
      {/* Thumbnail */}
      <div className="relative aspect-video overflow-hidden rounded-lg" onClick={handlePlay}>
        <img
          src={thumbnail}
          alt={title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
        />
        
        {/* Play button overlay */}
        <div className="absolute inset-0 flex items-center justify-center bg-background/20 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button
            size="icon"
            className="h-14 w-14 rounded-full bg-primary/90 hover:bg-primary"
          >
            <Play className="h-7 w-7 fill-current" />
          </Button>
        </div>

        {/* Edit button for owner */}
        {isOwner && (
          <Button
            size="icon"
            className="absolute top-2 left-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
            onClick={handleEdit}
            title="Chỉnh sửa trong Studio"
          >
            <Edit className="h-4 w-4" />
          </Button>
        )}

        {/* Share button */}
        <Button
          size="icon"
          variant="secondary"
          className="absolute top-2 right-2 h-8 w-8 bg-blue-600 hover:bg-blue-700 text-white opacity-0 group-hover:opacity-100 transition-opacity"
          onClick={handleShare}
          title="Chia sẻ video"
        >
          <Share2 className="h-4 w-4" />
        </Button>
      
      </div>

      {/* Info */}
      <div className="p-3 flex gap-3">
        <div className="flex-shrink-0">
          <div className="w-9 h-9 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold text-sm">
            {channel[0]}
          </div>
        </div>
        <div className="flex-1 min-w-0">
          <h3 className="font-semibold text-sm line-clamp-2 mb-1 group-hover:text-primary-foreground transition-colors">
            {title}
          </h3>
          <p className="text-xs text-muted-foreground group-hover:text-primary-foreground/80">{channel}</p>
          <div className="flex items-center gap-2 text-xs text-muted-foreground group-hover:text-primary-foreground/80 mt-1">
            <span>{views}</span>
            <span>•</span>
            <span>{timestamp}</span>
          </div>
        </div>
      </div>

    </Card>
  );
};
