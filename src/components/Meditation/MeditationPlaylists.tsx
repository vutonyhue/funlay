import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Music, Star, Play, MoreVertical, Edit2, Trash2, GripVertical, Save, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { useToast } from "@/hooks/use-toast";

interface MeditationPlaylist {
  id: string;
  name: string;
  description: string | null;
  is_featured: boolean;
  thumbnail_url: string | null;
  user_id: string;
}

interface PlaylistVideo {
  id: string;
  video_id: string;
  position: number;
  video?: {
    id: string;
    title: string;
    thumbnail_url: string | null;
  };
}

export const MeditationPlaylists = () => {
  const [playlists, setPlaylists] = useState<MeditationPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: "", description: "" });
  const [editingPlaylist, setEditingPlaylist] = useState<MeditationPlaylist | null>(null);
  const [playlistVideos, setPlaylistVideos] = useState<PlaylistVideo[]>([]);
  const [isEditingVideos, setIsEditingVideos] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const fetchPlaylists = async () => {
    setIsLoading(true);
    const { data, error } = await supabase
      .from("meditation_playlists")
      .select("*")
      .order("is_featured", { ascending: false })
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching playlists:", error);
    } else {
      setPlaylists(data || []);
    }
    setIsLoading(false);
  };

  const fetchPlaylistVideos = async (playlistId: string) => {
    const { data, error } = await supabase
      .from("meditation_playlist_videos")
      .select(`
        id,
        video_id,
        position,
        video:videos(id, title, thumbnail_url)
      `)
      .eq("playlist_id", playlistId)
      .order("position", { ascending: true });

    if (!error && data) {
      setPlaylistVideos(data.map(item => ({
        ...item,
        video: Array.isArray(item.video) ? item.video[0] : item.video
      })));
    }
  };

  const createPlaylist = async () => {
    if (!user || !newPlaylist.name.trim()) {
      toast({
        title: "Lỗi",
        description: "Vui lòng đăng nhập và nhập tên playlist",
        variant: "destructive",
      });
      return;
    }

    const { data, error } = await supabase
      .from("meditation_playlists")
      .insert({
        user_id: user.id,
        name: newPlaylist.name.trim(),
        description: newPlaylist.description.trim() || null,
      })
      .select()
      .single();

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể tạo playlist",
        variant: "destructive",
      });
    } else {
      setPlaylists([data, ...playlists]);
      setNewPlaylist({ name: "", description: "" });
      setIsCreateOpen(false);
      toast({
        title: "✨ Thành công",
        description: "Playlist thiền định đã được tạo!",
      });
    }
  };

  const updatePlaylist = async () => {
    if (!editingPlaylist) return;

    const { error } = await supabase
      .from("meditation_playlists")
      .update({
        name: editingPlaylist.name,
        description: editingPlaylist.description,
      })
      .eq("id", editingPlaylist.id);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể cập nhật playlist",
        variant: "destructive",
      });
    } else {
      setPlaylists(playlists.map(p => p.id === editingPlaylist.id ? editingPlaylist : p));
      setEditingPlaylist(null);
      setIsEditingVideos(false);
      toast({
        title: "✨ Đã lưu",
        description: "Playlist đã được cập nhật!",
      });
    }
  };

  const deletePlaylist = async (id: string) => {
    const { error } = await supabase
      .from("meditation_playlists")
      .delete()
      .eq("id", id);

    if (error) {
      toast({
        title: "Lỗi",
        description: "Không thể xóa playlist",
        variant: "destructive",
      });
    } else {
      setPlaylists(playlists.filter(p => p.id !== id));
      toast({
        title: "Đã xóa",
        description: "Playlist đã được xóa",
      });
    }
  };

  const moveVideo = async (index: number, direction: 'up' | 'down') => {
    const newVideos = [...playlistVideos];
    const newIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (newIndex < 0 || newIndex >= newVideos.length) return;
    
    [newVideos[index], newVideos[newIndex]] = [newVideos[newIndex], newVideos[index]];
    
    // Update positions
    newVideos.forEach((video, i) => {
      video.position = i;
    });
    
    setPlaylistVideos(newVideos);
    
    // Save to database
    for (const video of newVideos) {
      await supabase
        .from("meditation_playlist_videos")
        .update({ position: video.position })
        .eq("id", video.id);
    }
  };

  const openEditPlaylist = async (playlist: MeditationPlaylist) => {
    setEditingPlaylist(playlist);
    setIsEditingVideos(true);
    await fetchPlaylistVideos(playlist.id);
  };

  const featuredPlaylists = playlists.filter(p => p.is_featured);
  const userPlaylists = playlists.filter(p => !p.is_featured);

  return (
    <div className="space-y-8">
      {/* Featured Playlists */}
      {featuredPlaylists.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-amber-800 mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-500" />
            Playlist của Father Universe
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {featuredPlaylists.map((playlist, index) => (
              <PlaylistCard key={playlist.id} playlist={playlist} index={index} isFeatured />
            ))}
          </div>
        </section>
      )}

      {/* User Playlists */}
      <section>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-amber-800 flex items-center gap-2">
            <Music className="w-5 h-5 text-amber-500" />
            Playlist của bạn
          </h3>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white shadow-md">
                <Plus className="w-4 h-4 mr-2" />
                Tạo playlist mới
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-white border-amber-200">
              <DialogHeader>
                <DialogTitle className="text-amber-800">Tạo Playlist Thiền Định</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm text-amber-700 mb-1 block">Tên playlist</label>
                  <Input
                    value={newPlaylist.name}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                    placeholder="VD: Thiền buổi sáng, Chữa lành Chakra..."
                    className="border-amber-200 focus:border-amber-400"
                  />
                </div>
                <div>
                  <label className="text-sm text-amber-700 mb-1 block">Mô tả (tùy chọn)</label>
                  <Textarea
                    value={newPlaylist.description}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                    placeholder="Mô tả playlist của bạn..."
                    className="border-amber-200 focus:border-amber-400"
                  />
                </div>
                <Button onClick={createPlaylist} className="w-full bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
                  Tạo playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {userPlaylists.length === 0 ? (
          <div className="text-center py-12 bg-amber-50/50 rounded-xl border border-amber-200/50">
            <Music className="w-12 h-12 text-amber-300 mx-auto mb-3" />
            <p className="text-amber-700">Chưa có playlist nào</p>
            <p className="text-amber-500 text-sm">Tạo playlist đầu tiên để lưu các video thiền định yêu thích!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlaylists.map((playlist, index) => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist} 
                index={index}
                onDelete={deletePlaylist}
                onEdit={() => openEditPlaylist(playlist)}
                canEdit={user?.id === playlist.user_id}
              />
            ))}
          </div>
        )}
      </section>

      {/* Edit Playlist Dialog */}
      <Dialog open={isEditingVideos} onOpenChange={(open) => {
        if (!open) {
          setIsEditingVideos(false);
          setEditingPlaylist(null);
          setPlaylistVideos([]);
        }
      }}>
        <DialogContent className="bg-white border-amber-200 max-w-2xl">
          <DialogHeader>
            <DialogTitle className="text-amber-800">Chỉnh sửa Playlist</DialogTitle>
          </DialogHeader>
          {editingPlaylist && (
            <div className="space-y-4 pt-4">
              <div>
                <label className="text-sm text-amber-700 mb-1 block">Tên playlist</label>
                <Input
                  value={editingPlaylist.name}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, name: e.target.value })}
                  className="border-amber-200 focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-sm text-amber-700 mb-1 block">Mô tả</label>
                <Textarea
                  value={editingPlaylist.description || ""}
                  onChange={(e) => setEditingPlaylist({ ...editingPlaylist, description: e.target.value })}
                  className="border-amber-200 focus:border-amber-400"
                />
              </div>

              {/* Video Reorder Section */}
              <div>
                <label className="text-sm text-amber-700 mb-2 block flex items-center gap-2">
                  <GripVertical className="w-4 h-4" />
                  Sắp xếp thứ tự video (kéo thả)
                </label>
                <div className="space-y-2 max-h-60 overflow-y-auto border border-amber-200 rounded-lg p-2">
                  {playlistVideos.length === 0 ? (
                    <p className="text-amber-500 text-sm text-center py-4">Chưa có video trong playlist</p>
                  ) : (
                    playlistVideos.map((pv, index) => (
                      <div
                        key={pv.id}
                        className="flex items-center gap-2 p-2 bg-amber-50 rounded-lg border border-amber-100"
                      >
                        <div className="flex flex-col gap-1">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => moveVideo(index, 'up')}
                            disabled={index === 0}
                          >
                            ▲
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="h-5 w-5 p-0"
                            onClick={() => moveVideo(index, 'down')}
                            disabled={index === playlistVideos.length - 1}
                          >
                            ▼
                          </Button>
                        </div>
                        <span className="text-amber-600 text-sm w-6">{index + 1}.</span>
                        {pv.video?.thumbnail_url && (
                          <img src={pv.video.thumbnail_url} alt="" className="w-12 h-8 object-cover rounded" />
                        )}
                        <span className="text-amber-800 text-sm flex-1 truncate">{pv.video?.title || "Video"}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>

              <div className="flex gap-2">
                <Button onClick={updatePlaylist} className="flex-1 bg-gradient-to-r from-amber-500 to-yellow-500 hover:from-amber-600 hover:to-yellow-600 text-white">
                  <Save className="w-4 h-4 mr-2" />
                  Lưu thay đổi
                </Button>
                <Button variant="outline" onClick={() => setIsEditingVideos(false)} className="border-amber-300">
                  <X className="w-4 h-4 mr-2" />
                  Hủy
                </Button>
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

interface PlaylistCardProps {
  playlist: MeditationPlaylist;
  index: number;
  isFeatured?: boolean;
  onDelete?: (id: string) => void;
  onEdit?: () => void;
  canEdit?: boolean;
}

const PlaylistCard = ({ playlist, index, isFeatured, onDelete, onEdit, canEdit }: PlaylistCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer shadow-md ${
        isFeatured 
          ? 'bg-gradient-to-br from-amber-100 via-yellow-50 to-amber-100 border-2 border-amber-300' 
          : 'bg-white border border-amber-200 hover:border-amber-400 hover:shadow-lg'
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative">
        <div className={`absolute inset-0 ${
          isFeatured 
            ? 'bg-gradient-to-br from-amber-400/30 via-yellow-300/30 to-amber-400/30' 
            : 'bg-gradient-to-br from-amber-300/20 to-yellow-300/20'
        }`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isFeatured 
              ? 'bg-gradient-to-r from-amber-500 to-yellow-500' 
              : 'bg-gradient-to-r from-amber-400 to-yellow-400'
          } opacity-90 group-hover:opacity-100 transition-opacity shadow-lg`}>
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
        
        {isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-yellow-500 rounded-full text-xs text-white flex items-center gap-1 shadow-md">
            <Star className="w-3 h-3" />
            Father Universe
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-amber-800 truncate group-hover:text-amber-600 transition-colors">
              {playlist.name}
            </h4>
            {playlist.description && (
              <p className="text-sm text-amber-600/70 line-clamp-2 mt-1">
                {playlist.description}
              </p>
            )}
          </div>
          
          {canEdit && (onDelete || onEdit) && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-amber-500 hover:text-amber-700 hover:bg-amber-100">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-white border-amber-200">
                {onEdit && (
                  <DropdownMenuItem className="text-amber-700 hover:bg-amber-50" onClick={onEdit}>
                    <Edit2 className="w-4 h-4 mr-2" />
                    Chỉnh sửa
                  </DropdownMenuItem>
                )}
                {onDelete && (
                  <DropdownMenuItem 
                    className="text-red-500 hover:bg-red-50"
                    onClick={() => onDelete(playlist.id)}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Xóa
                  </DropdownMenuItem>
                )}
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
};
