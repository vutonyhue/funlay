import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { ThumbsUp, ThumbsDown, Share2, MoreHorizontal } from "lucide-react";

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

export default function Watch() {
  const { id } = useParams();
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [video, setVideo] = useState<Video | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);
  const [newComment, setNewComment] = useState("");
  const [loading, setLoading] = useState(true);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (id) {
      fetchVideo();
      fetchComments();
    }
  }, [id]);

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
        .select(`
          *,
          profiles (
            display_name,
            avatar_url
          )
        `)
        .eq("video_id", id)
        .is("parent_comment_id", null)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setComments(data || []);
    } catch (error: any) {
      console.error("Error loading comments:", error);
    }
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
        <div className="max-w-7xl mx-auto p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Video Player */}
            <div className="lg:col-span-2 space-y-4">
              <div className="aspect-video bg-black rounded-lg overflow-hidden">
                <video
                  src={video.video_url}
                  controls
                  className="w-full h-full"
                  autoPlay
                />
              </div>

              {/* Video Info */}
              <div>
                <h1 className="text-xl font-bold text-foreground mb-2">
                  {video.title}
                </h1>

                <div className="flex items-center justify-between flex-wrap gap-4">
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-2">
                      <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                        {video.channels.name[0]}
                      </div>
                      <div>
                        <p className="font-semibold text-foreground">
                          {video.channels.name}
                        </p>
                        <p className="text-sm text-muted-foreground">
                          {video.channels.subscriber_count || 0} subscribers
                        </p>
                      </div>
                    </div>
                    <Button size="sm" className="rounded-full">
                      Subscribe
                    </Button>
                  </div>

                  <div className="flex items-center gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full gap-2"
                      onClick={handleLike}
                    >
                      <ThumbsUp className="h-4 w-4" />
                      {video.like_count || 0}
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full"
                    >
                      <ThumbsDown className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="secondary"
                      size="sm"
                      className="rounded-full gap-2"
                    >
                      <Share2 className="h-4 w-4" />
                      Share
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
                <div className="mt-4 bg-muted rounded-lg p-4">
                  <p className="text-sm text-foreground whitespace-pre-wrap">
                    {video.view_count || 0} views •{" "}
                    {new Date(video.created_at).toLocaleDateString()}
                  </p>
                  <p className="text-sm text-foreground mt-2">
                    {video.description}
                  </p>
                </div>
              </div>

              {/* Comments */}
              <div className="mt-6">
                <h2 className="text-lg font-semibold mb-4 text-foreground">
                  {comments.length} Comments
                </h2>

                {/* Add Comment */}
                {user && (
                  <div className="flex gap-3 mb-6">
                    <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold flex-shrink-0">
                      {user.email?.[0].toUpperCase()}
                    </div>
                    <div className="flex-1">
                      <Textarea
                        placeholder="Add a comment..."
                        value={newComment}
                        onChange={(e) => setNewComment(e.target.value)}
                        className="min-h-[80px]"
                      />
                      <div className="flex gap-2 mt-2 justify-end">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => setNewComment("")}
                        >
                          Cancel
                        </Button>
                        <Button size="sm" onClick={handleAddComment}>
                          Comment
                        </Button>
                      </div>
                    </div>
                  </div>
                )}

                {/* Comments List */}
                <div className="space-y-4">
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
                            {new Date(comment.created_at).toLocaleDateString()}
                          </span>
                        </div>
                        <p className="text-sm text-foreground">
                          {comment.content}
                        </p>
                        <div className="flex items-center gap-4 mt-2">
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ThumbsUp className="h-3 w-3 mr-1" />
                            {comment.like_count || 0}
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            <ThumbsDown className="h-3 w-3" />
                          </Button>
                          <Button variant="ghost" size="sm" className="h-8 px-2">
                            Reply
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Recommended Videos */}
            <div className="space-y-3">
              <h2 className="text-lg font-semibold text-foreground">
                Recommended
              </h2>
              {/* Add recommended videos here */}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}
