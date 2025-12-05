import { useState, useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Play, Pause, Camera, Image, Star, Save } from "lucide-react";
import { Header } from "@/components/Layout/Header";
import { DragDropImageUpload } from "@/components/Profile/DragDropImageUpload";
import { ProfileCompletionIndicator } from "@/components/Profile/ProfileCompletionIndicator";
import { KYCButton } from "@/components/Profile/KYCButton";

// 7-color rainbow gradient for luxury avatar
const rainbowColors = [
  '#FF0000', '#FF7F00', '#FFFF00', '#00FF00', '#00E7FF', '#4B0082', '#9400D3'
];

// Luxury Avatar Preview Component with rainbow glow + sparkles
const LuxuryAvatarPreview = ({ 
  avatarUrl, 
  displayName, 
  onImageChange,
  userId 
}: { 
  avatarUrl: string | null; 
  displayName: string; 
  onImageChange: (url: string) => void;
  userId: string;
}) => {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { toast } = useToast();
  const [uploading, setUploading] = useState(false);
  
  const sparkles = Array.from({ length: 12 }, (_, i) => ({
    id: i,
    delay: i * 0.3,
    duration: 1.5 + Math.random() * 2,
    size: 8 + Math.random() * 8,
    angle: (i * 30) * (Math.PI / 180),
    distance: 70 + Math.random() * 20,
  }));

  const handleFileSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const filePath = `${userId}/avatar_${Date.now()}.${fileExt}`;
      
      const { error: uploadError } = await supabase.storage
        .from('uploads')
        .upload(filePath, file, { upsert: true });
      
      if (uploadError) throw uploadError;
      
      const { data: urlData } = supabase.storage
        .from('uploads')
        .getPublicUrl(filePath);
      
      onImageChange(urlData.publicUrl);
      toast({ title: "✨ Avatar updated!" });
    } catch (error: any) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="relative">
      {/* Outer glow */}
      <motion.div
        className="absolute inset-[-12px] rounded-full blur-xl opacity-60"
        style={{ background: `conic-gradient(from 0deg, ${rainbowColors.join(', ')}, ${rainbowColors[0]})` }}
        animate={{ rotate: [0, 360], opacity: [0.4, 0.7, 0.4] }}
        transition={{ rotate: { duration: 8, repeat: Infinity, ease: "linear" }, opacity: { duration: 3, repeat: Infinity } }}
      />
      
      {/* Rainbow border */}
      <motion.div
        className="absolute inset-[-4px] rounded-full"
        style={{ background: `conic-gradient(from 0deg, ${rainbowColors.join(', ')}, ${rainbowColors[0]})`, padding: '4px' }}
        animate={{ rotate: [0, 360], scale: [1, 1.02, 1] }}
        transition={{ rotate: { duration: 6, repeat: Infinity, ease: "linear" }, scale: { duration: 2, repeat: Infinity } }}
      >
        <div className="w-full h-full rounded-full bg-card" />
      </motion.div>
      
      {/* Avatar - 120px */}
      <motion.div
        className="relative w-[120px] h-[120px] rounded-full overflow-hidden cursor-pointer z-10 shadow-2xl"
        whileHover={{ scale: 1.05 }}
        whileTap={{ scale: 0.95 }}
        onClick={() => fileInputRef.current?.click()}
      >
        {avatarUrl ? (
          <img src={avatarUrl} alt={displayName} className="w-full h-full object-cover" />
        ) : (
          <div className="w-full h-full bg-gradient-to-br from-[hsl(var(--cosmic-cyan))] via-[hsl(var(--cosmic-magenta))] to-[hsl(var(--cosmic-gold))] flex items-center justify-center text-4xl font-bold text-white">
            {displayName?.[0]?.toUpperCase() || '?'}
          </div>
        )}
        
        {/* Edit overlay */}
        <motion.div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
          {uploading ? (
            <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity }}>
              <Star className="w-8 h-8 text-[hsl(var(--cosmic-gold))]" fill="currentColor" />
            </motion.div>
          ) : (
            <Camera className="w-8 h-8 text-white" />
          )}
        </motion.div>
      </motion.div>
      
      {/* Sparkle particles */}
      {sparkles.map((sparkle) => (
        <motion.div
          key={sparkle.id}
          className="absolute pointer-events-none z-20"
          style={{ width: sparkle.size, height: sparkle.size, left: '50%', top: '50%', marginLeft: -sparkle.size / 2, marginTop: -sparkle.size / 2 }}
          animate={{
            opacity: [0, 1, 1, 0],
            scale: [0, 1.2, 1, 0],
            x: [0, Math.cos(sparkle.angle) * sparkle.distance],
            y: [0, Math.sin(sparkle.angle) * sparkle.distance],
          }}
          transition={{ duration: sparkle.duration, repeat: Infinity, delay: sparkle.delay }}
        >
          <Star className="text-[hsl(var(--cosmic-gold))] drop-shadow-[0_0_6px_rgba(255,215,0,0.8)]" style={{ width: sparkle.size, height: sparkle.size }} fill="currentColor" />
        </motion.div>
      ))}
      
      <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleFileSelect} />
    </div>
  );
};

export default function ProfileSettings() {
  const { user, loading } = useAuth();
  const navigate = useNavigate();
  const { toast } = useToast();
  
  const [displayName, setDisplayName] = useState("");
  const [walletAddress, setWalletAddress] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [bannerUrl, setBannerUrl] = useState("");
  const [bio, setBio] = useState("");
  const [musicUrl, setMusicUrl] = useState("");
  const [saving, setSaving] = useState(false);
  const [loadingProfile, setLoadingProfile] = useState(true);
  const [channelId, setChannelId] = useState<string | null>(null);
  const [isPlayingPreview, setIsPlayingPreview] = useState(false);
  const [isUploadingMusic, setIsUploadingMusic] = useState(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const musicFileInputRef = useRef<HTMLInputElement | null>(null);


  useEffect(() => {
    if (!loading && !user) {
      navigate("/auth");
      return;
    }

    if (user) {
      fetchProfile();
    }
  }, [user, loading, navigate]);

  const fetchProfile = async () => {
    try {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", user!.id)
        .maybeSingle();

      if (error) throw error;

      if (data) {
        setDisplayName(data.display_name || "");
        setWalletAddress(data.wallet_address || "");
        setAvatarUrl(data.avatar_url || "");
        setBio(data.bio || "");
        setMusicUrl(data.music_url || "");
      }

      // Fetch channel info for banner
      const { data: channelData } = await supabase
        .from("channels")
        .select("id, banner_url")
        .eq("user_id", user!.id)
        .maybeSingle();

      if (channelData) {
        setChannelId(channelData.id);
        setBannerUrl(channelData.banner_url || "");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to load profile",
        variant: "destructive",
      });
    } finally {
      setLoadingProfile(false);
    }
  };

  const extractSunoAudioUrl = async (sunoPageUrl: string): Promise<string | null> => {
    // Extract song ID from Suno page URL
    const songIdMatch = sunoPageUrl.match(/suno\.com\/song\/([a-zA-Z0-9-]+)/);
    const shortLinkMatch = sunoPageUrl.match(/suno\.com\/s\/([a-zA-Z0-9-]+)/);
    
    if (songIdMatch || shortLinkMatch) {
      const songId = songIdMatch ? songIdMatch[1] : shortLinkMatch[1];
      // Construct direct audio URL
      return `https://cdn1.suno.ai/${songId}.mp3`;
    }
    
    return null;
  };

  const handleAudioPreview = async () => {
    if (!musicUrl) {
      toast({
        title: "Chưa có link nhạc",
        description: "Vui lòng nhập link nhạc trước",
        variant: "destructive",
      });
      return;
    }

    let audioUrlToPlay = musicUrl;

    // Check if it's a Suno song page URL and extract audio URL
    const isSunoPageUrl = /suno\.com\/(song|s)\//i.test(musicUrl);
    if (isSunoPageUrl) {
      const extractedUrl = await extractSunoAudioUrl(musicUrl);
      if (extractedUrl) {
        audioUrlToPlay = extractedUrl;
        toast({
          title: "Đã chuyển đổi link Suno",
          description: "Tự động trích xuất link nhạc từ trang Suno",
        });
      }
    }

    // Check if it's a valid audio URL format
    const isDirectAudioUrl = /\.(mp3|wav|ogg|m4a|aac|flac)(\?.*)?$/i.test(audioUrlToPlay);
    const isYouTubeUrl = /youtube\.com|youtu\.be/i.test(musicUrl);

    if (isYouTubeUrl) {
      toast({
        title: "YouTube không được hỗ trợ",
        description: "Vui lòng sử dụng link nhạc trực tiếp (.mp3, .wav, .ogg) hoặc tải file nhạc lên",
        variant: "destructive",
      });
      return;
    }

    if (isPlayingPreview && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    } else {
      if (!audioRef.current) {
        audioRef.current = new Audio(audioUrlToPlay);
        audioRef.current.addEventListener('ended', () => setIsPlayingPreview(false));
        audioRef.current.addEventListener('error', () => {
          toast({
            title: "Không thể phát nhạc",
            description: "Link nhạc không hợp lệ. Vui lòng sử dụng link nhạc trực tiếp (.mp3, .wav, .ogg)",
            variant: "destructive",
          });
          setIsPlayingPreview(false);
        });
      } else {
        audioRef.current.src = audioUrlToPlay;
      }
      
      audioRef.current.play().catch((error) => {
        console.error("Audio playback error:", error);
        toast({
          title: "Không thể phát nhạc",
          description: "Link nhạc không hợp lệ. Vui lòng sử dụng link file nhạc trực tiếp (.mp3, .wav, .ogg) thay vì link trang web",
          variant: "destructive",
        });
        setIsPlayingPreview(false);
      });
      setIsPlayingPreview(true);
    }
  };

  const handleMusicFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    const validTypes = ['audio/mpeg', 'audio/mp3', 'audio/wav', 'audio/ogg', 'audio/m4a'];
    if (!validTypes.includes(file.type) && !file.name.match(/\.(mp3|wav|ogg|m4a)$/i)) {
      toast({
        title: "File không hợp lệ",
        description: "Vui lòng chọn file nhạc định dạng .mp3, .wav, .ogg hoặc .m4a",
        variant: "destructive",
      });
      return;
    }

    // Check file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File quá lớn",
        description: "Kích thước file không được vượt quá 10MB",
        variant: "destructive",
      });
      return;
    }

    setIsUploadingMusic(true);

    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${user!.id}/music_${Date.now()}.${fileExt}`;

      const { error: uploadError, data } = await supabase.storage
        .from('uploads')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false
        });

      if (uploadError) throw uploadError;

      const { data: { publicUrl } } = supabase.storage
        .from('uploads')
        .getPublicUrl(fileName);

      setMusicUrl(publicUrl);
      
      toast({
        title: "Tải lên thành công",
        description: "File nhạc đã được tải lên và sẵn sàng sử dụng",
      });
    } catch (error: any) {
      toast({
        title: "Lỗi tải lên",
        description: error.message || "Không thể tải file nhạc lên",
        variant: "destructive",
      });
    } finally {
      setIsUploadingMusic(false);
      if (musicFileInputRef.current) {
        musicFileInputRef.current.value = '';
      }
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    // Stop preview if playing
    if (audioRef.current) {
      audioRef.current.pause();
      setIsPlayingPreview(false);
    }

    // Optimistic update - dispatch event immediately to show changes in UI
    window.dispatchEvent(new Event('profile-updated'));

    // Convert Suno page URL to direct audio URL before saving
    let finalMusicUrl = musicUrl;
    const isSunoPageUrl = /suno\.com\/(song|s)\//i.test(musicUrl);
    if (isSunoPageUrl) {
      const extractedUrl = await extractSunoAudioUrl(musicUrl);
      if (extractedUrl) {
        finalMusicUrl = extractedUrl;
      }
    }

    try {
      // First check if profile exists, if not create it
      const { data: existingProfile } = await supabase
        .from("profiles")
        .select("id")
        .eq("id", user!.id)
        .maybeSingle();

      if (!existingProfile) {
        // Create profile first
        const { error: insertError } = await supabase
          .from("profiles")
          .insert({
            id: user!.id,
            display_name: displayName,
            username: `user_${user!.id.substring(0, 8)}`,
          });

        if (insertError) throw insertError;
      }

      // Now update the profile
      const { error } = await supabase
        .from("profiles")
        .update({
          display_name: displayName,
          wallet_address: walletAddress,
          avatar_url: avatarUrl,
          bio: bio,
          music_url: finalMusicUrl,
        })
        .eq("id", user!.id);

      if (error) throw error;

      // Update channel banner if channel exists
      if (channelId && bannerUrl !== undefined) {
        const { error: channelError } = await supabase
          .from("channels")
          .update({ banner_url: bannerUrl })
          .eq("id", channelId);

        if (channelError) throw channelError;
      }

      toast({
        title: "Đã cập nhật",
        description: "Cài đặt của bạn đã được lưu thành công!",
      });
    } catch (error: any) {
      // On error, refetch to revert optimistic update
      await fetchProfile();
      window.dispatchEvent(new Event('profile-updated'));
      
      toast({
        title: "Cập nhật thất bại",
        description: error.message || "Không thể cập nhật thông tin",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  };

  if (loading || loadingProfile) {
    return (
      <div className="min-h-screen bg-background">
        <Header onMenuClick={() => {}} />
        <div className="flex items-center justify-center pt-20">
          <div className="text-foreground">Loading...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <Header onMenuClick={() => {}} />
      
      <main className="pt-20 pb-10 px-4">
        <div className="max-w-2xl mx-auto">
          {/* Header */}
          <div className="flex items-center gap-4 mb-6">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => navigate("/")}
            >
              <ArrowLeft className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-foreground">Profile Settings</h1>
          </div>

          {/* Profile Completion Indicator */}
          <div className="mb-6">
            <ProfileCompletionIndicator
              avatar={!!avatarUrl}
              banner={!!bannerUrl}
              bio={!!bio}
              wallet={!!walletAddress}
            />
          </div>

          {/* Form */}
          <div className="bg-card border border-border rounded-lg p-6 shadow-lg">
            <form onSubmit={handleSave} className="space-y-6">
              <div>
                <Label htmlFor="displayName">Display Name</Label>
                <Input
                  id="displayName"
                  type="text"
                  placeholder="Your display name"
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="mt-1"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  This is how your name will appear on your channel and comments
                </p>
              </div>

              <div>
                <Label htmlFor="walletAddress">Wallet Address (BSC)</Label>
                <Input
                  id="walletAddress"
                  type="text"
                  placeholder="0x..."
                  value={walletAddress}
                  onChange={(e) => setWalletAddress(e.target.value)}
                  className="mt-1 font-mono text-sm"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Your BSC wallet address where you'll receive tips
                </p>
              </div>

              {/* Luxury Avatar Preview with Rainbow Glow + KYC Badge */}
              <div className="space-y-4">
                <Label>Ảnh đại diện (Avatar)</Label>
                <div className="flex items-center gap-6">
                  {/* Luxury Avatar with Rainbow Border + Sparkles */}
                  <LuxuryAvatarPreview 
                    avatarUrl={avatarUrl}
                    displayName={displayName}
                    onImageChange={(url) => setAvatarUrl(url)}
                    userId={user?.id || ''}
                  />
                  
                  {/* KYC Badge */}
                  <KYCButton
                    isVerified={false}
                    onClick={() => {
                      toast({
                        title: "KYC Coming Soon",
                        description: "Tính năng xác minh KYC sẽ sớm được cập nhật!"
                      });
                    }}
                  />
                </div>
                <p className="text-xs text-muted-foreground">
                  Click vào avatar để thay đổi ảnh đại diện
                </p>
              </div>

              <DragDropImageUpload
                currentImageUrl={bannerUrl}
                onImageUploaded={(url) => setBannerUrl(url)}
                label="Ảnh bìa trang chủ (Banner)"
                aspectRatio="aspect-[16/9]"
                folderPath="banners"
                maxSizeMB={10}
              />

              <div>
                <Label htmlFor="bio">Bio</Label>
                <Textarea
                  id="bio"
                  placeholder="Tell viewers about yourself..."
                  value={bio}
                  onChange={(e) => setBio(e.target.value)}
                  className="mt-1 min-h-[100px]"
                />
                <p className="text-xs text-muted-foreground mt-1">
                  Write a short bio for your channel
                </p>
              </div>

              <div className="border-t border-border pt-6 mt-6">
                <h3 className="text-lg font-semibold text-foreground mb-4">
                  Cài đặt thông báo giọng nói "RICH"
                </h3>
                
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="musicUrl">Link nhạc thông báo</Label>
                    <div className="flex gap-2">
                      <Input
                        id="musicUrl"
                        type="url"
                        placeholder="https://suno.com/s/... hoặc https://example.com/music.mp3"
                        value={musicUrl}
                        onChange={(e) => setMusicUrl(e.target.value)}
                        className="mt-1 flex-1"
                      />
                      <Button
                        type="button"
                        variant="outline"
                        size="icon"
                        onClick={handleAudioPreview}
                        className="mt-1"
                        title="Test nhạc"
                      >
                        {isPlayingPreview ? (
                          <Pause className="h-4 w-4" />
                        ) : (
                          <Play className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    
                    {/* File upload button */}
                    <div className="flex items-center gap-2">
                      <input
                        ref={musicFileInputRef}
                        type="file"
                        accept=".mp3,.wav,.ogg,.m4a,audio/mpeg,audio/wav,audio/ogg,audio/m4a"
                        onChange={handleMusicFileUpload}
                        className="hidden"
                        id="music-file-upload"
                      />
                      <Button
                        type="button"
                        variant="secondary"
                        size="sm"
                        onClick={() => musicFileInputRef.current?.click()}
                        disabled={isUploadingMusic}
                        className="gap-2"
                      >
                        {isUploadingMusic ? (
                          <>
                            <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
                            Đang tải lên...
                          </>
                        ) : (
                          <>
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                            </svg>
                            Hoặc tải file lên
                          </>
                        )}
                      </Button>
                    </div>
                    
                    <p className="text-xs text-muted-foreground">
                      Hỗ trợ: Link Suno trực tiếp (suno.com/s/...), file nhạc trực tiếp (.mp3, .wav, .ogg), hoặc tải file lên (tối đa 10MB).
                      <strong className="text-foreground"> KHÔNG</strong> hỗ trợ YouTube/Spotify.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex justify-end gap-3 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={() => navigate("/")}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  disabled={saving}
                  className="gap-2"
                >
                  <Save className="h-4 w-4" />
                  {saving ? "Saving..." : "Save Changes"}
                </Button>
              </div>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
