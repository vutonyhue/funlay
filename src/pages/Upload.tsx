import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { useAuth } from "@/hooks/useAuth";
import { supabase } from "@/integrations/supabase/client";
import { Upload as UploadIcon, Video } from "lucide-react";

export default function Upload() {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [videoFile, setVideoFile] = useState<File | null>(null);
  const [thumbnailFile, setThumbnailFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const { user, loading } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-foreground">Loading...</div>
      </div>
    );
  }

  if (!user) {
    navigate("/auth");
    return null;
  }

  const handleVideoUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!videoFile) {
      toast({
        title: "No video selected",
        description: "Please select a video file to upload",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    try {
      // Get or create user's channel
      const { data: channels } = await supabase
        .from("channels")
        .select("id")
        .eq("user_id", user.id)
        .maybeSingle();

      let channelId = channels?.id;

      if (!channelId) {
        // Create channel if it doesn't exist
        const { data: profile } = await supabase
          .from("profiles")
          .select("display_name")
          .eq("id", user.id)
          .single();

        const { data: newChannel, error: channelError } = await supabase
          .from("channels")
          .insert({
            user_id: user.id,
            name: profile?.display_name || user.email?.split("@")[0] || "My Channel",
          })
          .select()
          .single();

        if (channelError) throw channelError;
        channelId = newChannel.id;
      }

      // Upload video file to storage
      const videoPath = `${user.id}/${Date.now()}-${videoFile.name}`;
      const { error: videoUploadError } = await supabase.storage
        .from("videos")
        .upload(videoPath, videoFile);

      if (videoUploadError) throw videoUploadError;

      const { data: videoUrl } = supabase.storage
        .from("videos")
        .getPublicUrl(videoPath);

      // Upload thumbnail if provided
      let thumbnailUrl = null;
      if (thumbnailFile) {
        const thumbnailPath = `${user.id}/${Date.now()}-${thumbnailFile.name}`;
        const { error: thumbnailUploadError } = await supabase.storage
          .from("thumbnails")
          .upload(thumbnailPath, thumbnailFile);

        if (!thumbnailUploadError) {
          const { data: thumbUrl } = supabase.storage
            .from("thumbnails")
            .getPublicUrl(thumbnailPath);
          thumbnailUrl = thumbUrl.publicUrl;
        }
      }

      // Create video record in database
      const { error: videoError } = await supabase.from("videos").insert({
        user_id: user.id,
        channel_id: channelId,
        title,
        description,
        video_url: videoUrl.publicUrl,
        thumbnail_url: thumbnailUrl,
        is_public: true,
      });

      if (videoError) throw videoError;

      toast({
        title: "Video uploaded successfully!",
        description: "Your video is now live",
      });

      navigate("/");
    } catch (error: any) {
      toast({
        title: "Upload failed",
        description: error.message || "Failed to upload video",
        variant: "destructive",
      });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)} />
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      <main className="pt-14 lg:pl-64">
        <div className="max-w-4xl mx-auto p-6">
          <h1 className="text-3xl font-bold mb-6 text-foreground">Upload Video</h1>

          <form onSubmit={handleVideoUpload} className="space-y-6">
            {/* Video Upload */}
            <div className="border-2 border-dashed border-border rounded-lg p-8 text-center">
              {videoFile ? (
                <div className="space-y-4">
                  <Video className="h-16 w-16 mx-auto text-primary" />
                  <p className="text-sm text-foreground">{videoFile.name}</p>
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setVideoFile(null)}
                  >
                    Change Video
                  </Button>
                </div>
              ) : (
                <div className="space-y-4">
                  <UploadIcon className="h-16 w-16 mx-auto text-muted-foreground" />
                  <div>
                    <Label htmlFor="video-upload" className="cursor-pointer">
                      <span className="text-primary hover:underline">Select video file</span>
                    </Label>
                    <Input
                      id="video-upload"
                      type="file"
                      accept="video/*"
                      className="hidden"
                      onChange={(e) => setVideoFile(e.target.files?.[0] || null)}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    MP4, WebM, or AVI (max 10GB)
                  </p>
                </div>
              )}
            </div>

            {/* Title */}
            <div>
              <Label htmlFor="title">Title (required)</Label>
              <Input
                id="title"
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="Add a title that describes your video"
                required
                className="mt-1"
              />
            </div>

            {/* Description */}
            <div>
              <Label htmlFor="description">Description</Label>
              <Textarea
                id="description"
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Tell viewers about your video"
                rows={5}
                className="mt-1"
              />
            </div>

            {/* Thumbnail */}
            <div>
              <Label htmlFor="thumbnail">Thumbnail</Label>
              <Input
                id="thumbnail"
                type="file"
                accept="image/*"
                onChange={(e) => setThumbnailFile(e.target.files?.[0] || null)}
                className="mt-1"
              />
              {thumbnailFile && (
                <p className="text-sm text-muted-foreground mt-1">
                  {thumbnailFile.name}
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-4">
              <Button
                type="submit"
                disabled={uploading || !videoFile || !title}
                className="flex-1"
              >
                {uploading ? "Uploading..." : "Upload Video"}
              </Button>
              <Button
                type="button"
                variant="outline"
                onClick={() => navigate("/")}
              >
                Cancel
              </Button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}
