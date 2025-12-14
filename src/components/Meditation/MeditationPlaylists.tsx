import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { Plus, Music, Star, Play, MoreVertical, Edit2, Trash2 } from "lucide-react";
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

export const MeditationPlaylists = () => {
  const [playlists, setPlaylists] = useState<MeditationPlaylist[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [newPlaylist, setNewPlaylist] = useState({ name: "", description: "" });
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

  const featuredPlaylists = playlists.filter(p => p.is_featured);
  const userPlaylists = playlists.filter(p => !p.is_featured);

  return (
    <div className="space-y-8">
      {/* Featured Playlists */}
      {featuredPlaylists.length > 0 && (
        <section>
          <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
            <Star className="w-5 h-5 text-amber-400" />
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
          <h3 className="text-lg font-semibold text-white flex items-center gap-2">
            <Music className="w-5 h-5 text-cyan-400" />
            Playlist của bạn
          </h3>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button className="bg-gradient-to-r from-cyan-500 to-purple-500 hover:from-cyan-600 hover:to-purple-600">
                <Plus className="w-4 h-4 mr-2" />
                Tạo playlist mới
              </Button>
            </DialogTrigger>
            <DialogContent className="bg-slate-900 border-slate-700">
              <DialogHeader>
                <DialogTitle className="text-white">Tạo Playlist Thiền Định</DialogTitle>
              </DialogHeader>
              <div className="space-y-4 pt-4">
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Tên playlist</label>
                  <Input
                    value={newPlaylist.name}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, name: e.target.value })}
                    placeholder="VD: Thiền buổi sáng, Chữa lành Chakra..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <div>
                  <label className="text-sm text-slate-400 mb-1 block">Mô tả (tùy chọn)</label>
                  <Textarea
                    value={newPlaylist.description}
                    onChange={(e) => setNewPlaylist({ ...newPlaylist, description: e.target.value })}
                    placeholder="Mô tả playlist của bạn..."
                    className="bg-slate-800 border-slate-700 text-white"
                  />
                </div>
                <Button onClick={createPlaylist} className="w-full bg-gradient-to-r from-cyan-500 to-purple-500">
                  Tạo playlist
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {userPlaylists.length === 0 ? (
          <div className="text-center py-12 bg-slate-800/30 rounded-xl border border-slate-700/50">
            <Music className="w-12 h-12 text-slate-600 mx-auto mb-3" />
            <p className="text-slate-400">Chưa có playlist nào</p>
            <p className="text-slate-500 text-sm">Tạo playlist đầu tiên để lưu các video thiền định yêu thích!</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {userPlaylists.map((playlist, index) => (
              <PlaylistCard 
                key={playlist.id} 
                playlist={playlist} 
                index={index}
                onDelete={deletePlaylist}
                canEdit={user?.id === playlist.user_id}
              />
            ))}
          </div>
        )}
      </section>
    </div>
  );
};

interface PlaylistCardProps {
  playlist: MeditationPlaylist;
  index: number;
  isFeatured?: boolean;
  onDelete?: (id: string) => void;
  canEdit?: boolean;
}

const PlaylistCard = ({ playlist, index, isFeatured, onDelete, canEdit }: PlaylistCardProps) => {
  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      className={`group relative rounded-xl overflow-hidden cursor-pointer ${
        isFeatured 
          ? 'bg-gradient-to-br from-amber-500/20 via-purple-500/20 to-cyan-500/20 border border-amber-500/30' 
          : 'bg-slate-800/50 border border-slate-700/50 hover:border-cyan-500/30'
      }`}
    >
      {/* Thumbnail */}
      <div className="aspect-video relative">
        <div className={`absolute inset-0 ${
          isFeatured 
            ? 'bg-gradient-to-br from-amber-600/30 via-purple-600/30 to-cyan-600/30' 
            : 'bg-gradient-to-br from-cyan-600/20 to-purple-600/20'
        }`} />
        <div className="absolute inset-0 flex items-center justify-center">
          <div className={`w-16 h-16 rounded-full flex items-center justify-center ${
            isFeatured 
              ? 'bg-gradient-to-r from-amber-500 to-purple-500' 
              : 'bg-gradient-to-r from-cyan-500 to-purple-500'
          } opacity-80 group-hover:opacity-100 transition-opacity`}>
            <Play className="w-8 h-8 text-white fill-white" />
          </div>
        </div>
        
        {isFeatured && (
          <div className="absolute top-2 left-2 px-2 py-1 bg-gradient-to-r from-amber-500 to-amber-600 rounded-full text-xs text-white flex items-center gap-1">
            <Star className="w-3 h-3" />
            Father Universe
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between">
          <div className="flex-1 min-w-0">
            <h4 className="font-medium text-white truncate group-hover:text-cyan-300 transition-colors">
              {playlist.name}
            </h4>
            {playlist.description && (
              <p className="text-sm text-slate-400 line-clamp-2 mt-1">
                {playlist.description}
              </p>
            )}
          </div>
          
          {canEdit && onDelete && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" className="text-slate-400 hover:text-white">
                  <MoreVertical className="w-4 h-4" />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent className="bg-slate-800 border-slate-700">
                <DropdownMenuItem className="text-slate-200 hover:bg-slate-700">
                  <Edit2 className="w-4 h-4 mr-2" />
                  Chỉnh sửa
                </DropdownMenuItem>
                <DropdownMenuItem 
                  className="text-red-400 hover:bg-slate-700"
                  onClick={() => onDelete(playlist.id)}
                >
                  <Trash2 className="w-4 h-4 mr-2" />
                  Xóa
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </div>
      </div>
    </motion.div>
  );
};
