import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Header } from "@/components/Layout/Header";
import { Sidebar } from "@/components/Layout/Sidebar";
import { Button } from "@/components/ui/button";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Edit, Trash2, EyeOff } from "lucide-react";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Video {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  view_count: number | null;
  created_at: string;
}

const YourVideos = () => {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [videos, setVideos] = useState<Video[]>([]);
  const [loading, setLoading] = useState(true);
  const [deleteVideoId, setDeleteVideoId] = useState<string | null>(null);
  const { user } = useAuth();
  const { toast } = useToast();
  const navigate = useNavigate();

  useEffect(() => {
    if (!user) {
      navigate("/auth");
      return;
    }
    fetchVideos();
  }, [user, navigate]);

  const fetchVideos = async () => {
    try {
      const { data, error } = await supabase
        .from("videos")
        .select("id, title, description, thumbnail_url, view_count, created_at")
        .eq("user_id", user?.id)
        .order("created_at", { ascending: false });

      if (error) throw error;
      setVideos(data || []);
    } catch (error: any) {
      console.error("Error fetching videos:", error);
      toast({
        title: "Lỗi",
        description: "Không thể tải video",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (videoId: string) => {
    try {
      const { error } = await supabase
        .from("videos")
        .delete()
        .eq("id", videoId);

      if (error) throw error;

      toast({
        title: "Thành công",
        description: "Video đã được xóa",
      });

      setVideos(videos.filter(v => v.id !== videoId));
      setDeleteVideoId(null);
    } catch (error: any) {
      console.error("Error deleting video:", error);
      toast({
        title: "Lỗi",
        description: "Không thể xóa video",
        variant: "destructive",
      });
    }
  };

  if (loading) {
    return <div className="flex items-center justify-center h-screen">Loading...</div>;
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => setSidebarOpen(!sidebarOpen)} />
      <Sidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
      
      <main className="pt-14 lg:pl-64">
        <div className="max-w-7xl mx-auto p-6">
          <div className="bg-blue-600 text-white p-6 rounded-lg mb-6 shadow-lg">
            <h1 className="text-4xl font-bold mb-2">📹 Video của bạn</h1>
            <p className="text-lg">Quản lý video đã đăng - Click các nút <span className="font-bold bg-white text-blue-600 px-2 py-1 rounded">SỬA</span> hoặc <span className="font-bold bg-red-600 px-2 py-1 rounded">XÓA</span> bên phải mỗi video</p>
          </div>
          <div className="flex justify-between items-center mb-6">
            <Button onClick={() => navigate("/upload")} size="lg" className="font-bold">
              ➕ Tải video mới lên
            </Button>
          </div>

          {videos.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-muted-foreground mb-4">Bạn chưa có video nào</p>
              <Button onClick={() => navigate("/upload")}>
                Tải video đầu tiên
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {videos.map((video) => (
                <div
                  key={video.id}
                  className="bg-card border border-border rounded-lg p-6 flex items-start gap-6"
                >
                  {video.thumbnail_url && (
                    <img
                      src={video.thumbnail_url}
                      alt={video.title}
                      className="w-40 h-24 object-cover rounded flex-shrink-0"
                    />
                  )}
                  <div className="flex-1 min-w-0">
                    <h3 className="font-semibold text-xl mb-2 text-foreground">{video.title}</h3>
                    {video.description && (
                      <p className="text-sm text-muted-foreground mb-3 line-clamp-2">
                        {video.description}
                      </p>
                    )}
                    <div className="flex items-center gap-3 text-sm text-muted-foreground">
                      <span>{video.view_count || 0} lượt xem</span>
                      <span>•</span>
                      <span>0 thích</span>
                      <span>•</span>
                      <span className="flex items-center gap-1">
                        <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                        Công khai
                      </span>
                    </div>
                  </div>
                  <div className="flex flex-col gap-3 flex-shrink-0">
                    <Button
                      variant="default"
                      size="lg"
                      onClick={() => navigate(`/edit-video/${video.id}`)}
                      className="gap-3 min-w-[140px] justify-start bg-blue-600 text-white hover:bg-hover-yellow hover:text-primary transition-all duration-300 font-bold text-base border-2 border-blue-700 shadow-lg"
                    >
                      <Edit className="h-6 w-6" />
                      SỬA
                    </Button>
                    <Button
                      variant="outline"
                      size="lg"
                      className="gap-3 min-w-[140px] justify-start border-3 border-gray-400 hover:bg-hover-yellow hover:text-primary hover:border-hover-yellow transition-all duration-300 font-bold text-base shadow-lg bg-white text-gray-700"
                    >
                      <EyeOff className="h-6 w-6" />
                      ẨN
                    </Button>
                    <Button
                      variant="destructive"
                      size="lg"
                      onClick={() => setDeleteVideoId(video.id)}
                      className="gap-3 min-w-[140px] justify-start bg-red-600 text-white hover:bg-hover-yellow hover:text-primary transition-all duration-300 font-bold text-base border-2 border-red-700 shadow-lg"
                    >
                      <Trash2 className="h-6 w-6" />
                      XÓA
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </main>

      <AlertDialog open={!!deleteVideoId} onOpenChange={() => setDeleteVideoId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Xác nhận xóa</AlertDialogTitle>
            <AlertDialogDescription>
              Bạn có chắc chắn muốn xóa video này? Hành động này không thể hoàn tác.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction onClick={() => deleteVideoId && handleDelete(deleteVideoId)}>
              Xóa
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default YourVideos;
