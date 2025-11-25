import { useState, useEffect, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal, Coins, Gift } from "lucide-react";
import { TipModal } from "@/components/Tipping/TipModal";
import { sendTip } from "@/lib/tipping";

interface Video {
  id: string;
  title: string;
  description: string;
  video_url: string;
  view_count: number;
  like_count: number;
  dislike_count: number;
  created_at: string;
  channels: {
    id: string;
    name: string;
    subscriber_count: number;
  };
}

interface Comment {
  id: string;
  content: string;
  created_at: string;
  like_count: number;
  profiles: {
    display_name: string;
    avatar_url: string;
  };
}

interface RecommendedVideo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
  channels: {
    name: string;
  };
}

export default function Watch() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [recommendedVideos, setRecommendedVideos] = useState<RecommendedVideo[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const [tipModalOpen, setTipModalOpen] = useState(false);
  const [rewardSettings, setRewardSettings] = useState<any>(null);
  const [watchProgress, setWatchProgress] = useState(0);
  const [rewardClaimed, setRewardClaimed] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
      fetchRecommendedVideos();
      fetchRewardSettings();
      checkWatchProgress();
    }
  }, [id]);

  const fetchRewardSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("reward_settings")
        .select("*")
        .single();

      if (error) throw error;
      setRewardSettings(data);
    } catch (error) {
      console.error("Error fetching reward settings:", error);
    }
  };

  const checkWatchProgress = async () => {
    if (!user || !id) return;

    try {
      const { data, error } = await supabase
        .from("video_watch_progress")
        .select("*")
        .eq("user_id", user.id)
        .eq("video_id", id)
        .single();

      if (data) {
        setRewardClaimed(data.rewarded);
        setWatchProgress(data.watch_percentage);
      }
    } catch (error) {
      // No existing progress
    }
  };

  const fetchVideo = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          *,
          channels (
            id,
            name,
            subscriber_count
          )
        `)
        .eq("id", id)
        .single();

      if (error) throw error;
      setVideo(data);

      // Increment view count
      await supabase
        .from("videos")
        .update({ view_count: (data.view_count || 0) + 1 })
        .eq("id", id);
    } catch (error: any) {
      toast({
        title: "Error loading video",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchComments = async () => {
    try {
      const { data, error } = await supabase
        .from("comments")
        .select("*")
        .eq("video_id", id)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;

      // Fetch profiles separately
      if (data && data.length > 0) {
        const userIds = [...new Set(data.map(c => c.user_id))];
        const { data: profilesData } = await supabase
          .from("profiles")
          .select("id, display_name, avatar_url")
          .in("id", userIds);

        const profilesMap = new Map(
          profilesData?.map(p => [p.id, p]) || []
        );

        const commentsWithProfiles = data.map(comment => ({
          ...comment,
          profiles: profilesMap.get(comment.user_id) || {
            display_name: "User",
            avatar_url: null,
          },
        }));

        setComments(commentsWithProfiles as any);
      } else {
        setComments([]);
      }
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
  };

  const fetchRecommendedVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select(`
          id,
          title,
          thumbnail_url,
          view_count,
          created_at,
          channels (
            name
          )
        `)
        .eq("is_public", true)
        .neq("id", id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (error) throw error;
      setRecommendedVideos(data || []);
    } catch (error: any) {
      console.error("Error loading recommended videos:", error);
    }
  };

  const handleVideoEnd = () => {
    // Autoplay next video
    if (recommendedVideos.length > 0) {
      const nextVideo = recommendedVideos[0];
      navigate(`/watch/${nextVideo.id}`);
      toast({
        title: "Đang phát video tiếp theo",
        description: nextVideo.title,
      });
    }
  };

  const formatViews = (views: number | null) => {
    if (!views) return "0 lượt xem";
    if (views >= 1000000) return `${(views / 1000000).toFixed(1)}M lượt xem`;
    if (views >= 1000) return `${(views / 1000).toFixed(1)}K lượt xem`;
    return `${views} lượt xem`;
  };

  const formatTimestamp = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return "Hôm nay";
    if (diffDays === 1) return "1 ngày trước";
    if (diffDays < 30) return `${diffDays} ngày trước`;
    if (diffDays < 365) return `${Math.floor(diffDays / 30)} tháng trước`;
    return `${Math.floor(diffDays / 365)} năm trước`;
  };

  const handleAddComment = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    if (!newComment.trim()) return;

    try {
      const { error } = await supabase.from("comments").insert({
        video_id: id,
        user_id: user.id,
        content: newComment,
      });

      if (error) throw error;

      setNewComment("");
      fetchComments();

      toast({
        title: "Comment posted",
        description: "Your comment has been added",
      });
    } catch (error: any) {
      toast({
        title: "Error posting comment",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleVideoProgress = async () => {
    if (!videoRef.current || !user || !id || rewardClaimed) return;

    const currentTime = videoRef.current.currentTime;
    const duration = videoRef.current.duration;
    const percentage = Math.floor((currentTime / duration) * 100);

    setWatchProgress(percentage);

    // Update watch progress in database
    if (percentage > watchProgress) {
      await supabase.from("video_watch_progress").upsert({
        user_id: user.id,
        video_id: id,
        watch_percentage: percentage,
        rewarded: rewardClaimed,
      });
    }

    // Check if user reached 80% and reward is enabled
    if (
      percentage >= (rewardSettings?.min_watch_percentage || 80) &&
      rewardSettings?.reward_enabled &&
      !rewardClaimed
    ) {
      await claimReward();
    }
  };

  const claimReward = async () => {
    if (!user || !video || rewardClaimed) return;

    try {
      // Get user's wallet address
      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", user.id)
        .single();

      if (!profile?.wallet_address) {
        toast({
          title: "Kết nối ví",
          description: "Vui lòng kết nối ví MetaMask để nhận thưởng!",
          variant: "destructive",
        });
        return;
      }

      // Mark as rewarded
      await supabase.from("video_watch_progress").upsert({
        user_id: user.id,
        video_id: id!,
        watch_percentage: watchProgress,
        rewarded: true,
      });

      setRewardClaimed(true);

      toast({
        title: `🎉 Bạn vừa nhận được ${rewardSettings.reward_amount} ${rewardSettings.reward_token}!`,
        description: "Phần thưởng sẽ được gửi đến ví của bạn.",
      });
    } catch (error: any) {
      console.error("Error claiming reward:", error);
    }
  };

  const handleQuickTip = async (amount: number, token: string, tokenAddress: string) => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      // Get channel owner's wallet address
      const { data: channelData } = await supabase
        .from("channels")
        .select("user_id")
        .eq("id", video?.channels.id)
        .single();

      if (!channelData) throw new Error("Channel not found");

      const { data: profile } = await supabase
        .from("profiles")
        .select("wallet_address")
        .eq("id", channelData.user_id)
        .single();

      if (!profile?.wallet_address) {
        toast({
          title: "Không thể gửi tip",
          description: "Chủ kênh chưa thiết lập địa chỉ ví",
          variant: "destructive",
        });
        return;
      }

      const result = await sendTip({
        toAddress: profile.wallet_address,
        amount,
        tokenSymbol: token,
        tokenAddress,
        decimals: 18,
        videoId: id,
      });

      toast({
        title: "Tip đã gửi thành công! 🎉",
        description: `${amount} ${token} đã được gửi đến ${video?.channels.name}`,
      });
    } catch (error: any) {
      toast({
        title: "Gửi tip thất bại",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const handleLike = async () => {
    if (!user) {
      navigate("/auth");
      return;
    }

    try {
      const { error } = await supabase.from("likes").insert({
        video_id: id,
        user_id: user.id,
        is_dislike: false,
      });

      if (error) throw error;

      await supabase
        .from("videos")
        .update({ like_count: (video?.like_count || 0) + 1 })
        .eq("id", id);

      fetchVideo();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!video) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Video not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-[1920px] mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-[1fr_400px] gap-6 p-6">
            {/* Main Content */}
            <div className="space-y-4">
              {/* Video Player */}
              <div className="aspect-video bg-black rounded-xl overflow-hidden">
                <video
                  ref={videoRef}
                  src={video.video_url}
                  controls
                  className="w-full h-full"
                  autoPlay
                  onEnded={handleVideoEnd}
                  onTimeUpdate={handleVideoProgress}
                />
              </div>

              {/* Watch Progress & Reward */}
              {user && rewardSettings?.reward_enabled && (
                <div className="bg-gradient-to-r from-fun-yellow/20 to-fun-red/20 border border-fun-yellow/30 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Gift className="h-5 w-5 text-fun-yellow" />
                      <div>
                        <p className="text-sm font-semibold text-foreground">
                          {rewardClaimed ? "Đã nhận thưởng!" : `Xem ${rewardSettings.min_watch_percentage}% để nhận thưởng`}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {rewardClaimed 
                            ? `Bạn đã nhận ${rewardSettings.reward_amount} ${rewardSettings.reward_token}` 
                            : `Nhận ${rewardSettings.reward_amount} ${rewardSettings.reward_token} khi xem đủ video`}
                        </p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-fun-yellow">{watchProgress}%</p>
                      <p className="text-xs text-muted-foreground">Đã xem</p>
                    </div>
                  </div>
                  <div className="mt-3 h-2 bg-muted rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-gradient-to-r from-fun-yellow to-fun-red transition-all duration-300"
                      style={{ width: `${Math.min(watchProgress, 100)}%` }}
                    />
                  </div>
                </div>
              )}

              {/* Quick Tip Buttons */}
              <div className="bg-card border rounded-lg p-4">
                <div className="flex items-center gap-2 mb-3">
                  <Coins className="h-5 w-5 text-fun-yellow" />
                  <h3 className="font-semibold text-foreground">Ủng hộ tác giả</h3>
                </div>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTip(0.1, "USDT", "0x55d398326f99059fF775485246999027B3197955")}
                    className="flex flex-col h-auto py-3 hover:bg-fun-yellow/10 hover:border-fun-yellow"
                  >
                    <span className="text-lg font-bold">0.1</span>
                    <span className="text-xs text-muted-foreground">USDT</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTip(0.0001, "BNB", "native")}
                    className="flex flex-col h-auto py-3 hover:bg-fun-yellow/10 hover:border-fun-yellow"
                  >
                    <span className="text-lg font-bold">0.0001</span>
                    <span className="text-xs text-muted-foreground">BNB</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTip(9.999, "CAMLY", "0x0910320181889fefde0bb1ca63962b0a8882e413")}
                    className="flex flex-col h-auto py-3 hover:bg-fun-yellow/10 hover:border-fun-yellow"
                  >
                    <span className="text-lg font-bold">9.999</span>
                    <span className="text-xs text-muted-foreground">CAMLY</span>
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => handleQuickTip(0.000001, "BTC", "0x7130d2A12B9BCbFAe4f2634d864A1Ee1Ce3Ead9c")}
                    className="flex flex-col h-auto py-3 hover:bg-fun-yellow/10 hover:border-fun-yellow"
                  >
                    <span className="text-lg font-bold">0.000001</span>
                    <span className="text-xs text-muted-foreground">BTC</span>
                  </Button>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => setTipModalOpen(true)}
                  className="w-full mt-2 text-fun-yellow hover:text-fun-yellow hover:bg-fun-yellow/10"
                >
                  Hoặc nhập số tiền tùy chỉnh
                </Button>
              </div>

              {/* Video Title */}
              <h1 className="text-xl font-bold text-foreground">
                {video.title}
              </h1>

              {/* Channel Info & Actions */}
              <div className="flex items-center justify-between flex-wrap gap-4">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                    {video.channels.name[0]}
                  </div>
                  <div>
                    <p className="font-semibold text-foreground">
                      {video.channels.name}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {video.channels.subscriber_count || 0} người đăng ký
                    </p>
                  </div>
                  <Button className="rounded-full ml-2">
                    Đăng ký
                  </Button>
                </div>

                <div className="flex items-center gap-2 flex-wrap">
                  <div className="flex items-center bg-muted rounded-full overflow-hidden">
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full rounded-r-none gap-2 hover:bg-muted-foreground/10"
                      onClick={handleLike}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      <span>{video.like_count || 0}</span>
                    </Button>
                    <div className="w-px h-6 bg-border"></div>
                    <Button
                      variant="ghost"
                      size="sm"
                      className="rounded-full rounded-l-none hover:bg-muted-foreground/10"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button
                    variant="secondary"
                    size="sm"
                    className="rounded-full gap-2"
                  >
                    <Share2 className="h-4 w-4" />
                    Chia sẻ
                  </Button>
                  <Button
                    variant="secondary"
                    size="icon"
                    className="rounded-full"
                  >
                    <MoreHorizontal className="h-4 w-4" />
                  </Button>
                </div>
              </div>

              {/* Description */}
              <div className="bg-muted rounded-xl p-4">
                <div className="flex items-center gap-2 text-sm font-semibold text-foreground mb-2">
                  <span>{video.view_count || 0} lượt xem</span>
                  <span>•</span>
                  <span>{new Date(video.created_at).toLocaleDateString("vi-VN")}</span>
                </div>
                <p className="text-sm text-foreground whitespace-pre-wrap">
                  {video.description}
                </p>
              </div>

              {/* Comments Section */}
              <div className="mt-6">
                <h2 className="text-xl font-semibold mb-6 text-foreground">
                  {comments.length} bình luận
                </h2>

                {/* Add Comment */}
                {user ? (
                  <div className="flex gap-3 mb-8">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Viết bình luận..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="border-0 border-b border-border rounded-none px-0 focus-visible:ring-0 focus-visible:border-foreground resize-none"
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewComment("")}
                        >
                          Hủy
                        </Button>
                        <Button 
                          size="sm" 
                          onClick={handleAddComment}
                          disabled={!newComment.trim()}
                        >
                          Bình luận
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="text-center py-4 text-muted-foreground">
                    <Button onClick={() => navigate("/auth")}>Đăng nhập để bình luận</Button>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-6">
                  {comments.map((comment) => (
                    <div key={comment.id} className="flex gap-3">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                        {comment.profiles.display_name?.[0] || "U"}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="font-semibold text-sm text-foreground">
                            {comment.profiles.display_name || "User"}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            {new Date(comment.created_at).toLocaleDateString("vi-VN")}
                          </span>
                        </div>
                        <p className="text-sm text-foreground mb-2">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-full">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {comment.like_count || 0}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2 rounded-full">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Videos Sidebar */}
            <div className="space-y-3">
              {recommendedVideos.map((recVideo) => (
                <div
                  key={recVideo.id}
                  onClick={() => navigate(`/watch/${recVideo.id}`)}
                  className="flex gap-2 cursor-pointer group"
                >
                  <div className="relative flex-shrink-0 w-40 aspect-video rounded-lg overflow-hidden bg-muted">
                    <img
                      src={recVideo.thumbnail_url || "https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=400&h=225&fit=crop"}
                      alt={recVideo.title}
                      className="w-full h-full object-cover group-hover:opacity-80 transition-opacity"
                    />
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="text-sm font-semibold text-foreground line-clamp-2 mb-1 group-hover:text-primary transition-colors">
                      {recVideo.title}
                    </h3>
                    <p className="text-xs text-muted-foreground mb-1">
                      {recVideo.channels?.name || "Unknown Channel"}
                    </p>
                    <div className="flex items-center gap-1 text-xs text-muted-foreground">
                      <span>{formatViews(recVideo.view_count)}</span>
                      <span>•</span>
                      <span>{formatTimestamp(recVideo.created_at)}</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </main>

      <TipModal
        open={tipModalOpen}
        onOpenChange={setTipModalOpen}
        creatorAddress={video?.channels.id}
        videoId={id}
        creatorName={video?.channels.name || ""}
      />
    </div>
  );
}
