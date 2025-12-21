import { useState, useEffect, useRef } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";
import { ScrollArea } from "@/components/ui/scroll-area";
import { toast } from "sonner";
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
import { 
  Cloud, 
  CloudUpload, 
  CheckCircle, 
  XCircle, 
  Loader2, 
  Play, 
  RefreshCw,
  Database,
  StopCircle,
  Trash2,
  HardDrive,
  AlertTriangle
} from "lucide-react";

interface MigrationStats {
  pending: number;
  migrating: number;
  completed: number;
  failed: number;
  supabaseStorageCount: number;
  r2Count: number;
}

interface PendingVideo {
  id: string;
  title: string;
  video_url: string;
  thumbnail_url: string | null;
  user_id: string;
}

interface MigrationResult {
  videoId: string;
  success: boolean;
  newVideoUrl?: string;
  error?: string;
}

interface StorageFile {
  name: string;
  size: number;
  bucket: string;
}

interface StorageStats {
  videosCount: number;
  videosSize: number;
  thumbnailsCount: number;
  thumbnailsSize: number;
  totalSize: number;
}

const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB chunks

const formatBytes = (bytes: number): string => {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
};

const VideoMigrationPanel = () => {
  const [stats, setStats] = useState<MigrationStats | null>(null);
  const [pendingVideos, setPendingVideos] = useState<PendingVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [migrating, setMigrating] = useState(false);
  const [currentVideoId, setCurrentVideoId] = useState<string | null>(null);
  const [migrationResults, setMigrationResults] = useState<MigrationResult[]>([]);
  const [batchProgress, setBatchProgress] = useState({ current: 0, total: 0 });
  const [currentStatus, setCurrentStatus] = useState<string>('');
  const [uploadProgress, setUploadProgress] = useState(0);
  const abortControllerRef = useRef<AbortController | null>(null);
  const stopRequestedRef = useRef(false);
  
  // Cleanup states
  const [storageStats, setStorageStats] = useState<StorageStats | null>(null);
  const [storageFiles, setStorageFiles] = useState<StorageFile[]>([]);
  const [loadingStorage, setLoadingStorage] = useState(false);
  const [cleaning, setCleaning] = useState(false);
  const [cleanupProgress, setCleanupProgress] = useState({ current: 0, total: 0 });
  const [showCleanupDialog, setShowCleanupDialog] = useState(false);
  const [cleanupResults, setCleanupResults] = useState<{ deleted: number; failed: number } | null>(null);

  const fetchStats = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-r2', {
        body: { action: 'get-stats' }
      });
      
      if (error) throw error;
      setStats(data);
    } catch (error: any) {
      console.error('Error fetching stats:', error);
      toast.error('Không thể tải thống kê migration');
    }
  };

  const fetchPendingVideos = async () => {
    try {
      const { data, error } = await supabase.functions.invoke('migrate-to-r2', {
        body: { action: 'get-pending' }
      });
      
      if (error) throw error;
      setPendingVideos(data.videos || []);
    } catch (error: any) {
      console.error('Error fetching pending videos:', error);
    }
  };

  // Fetch Supabase Storage stats
  const fetchStorageStats = async () => {
    setLoadingStorage(true);
    try {
      const buckets = ['videos', 'thumbnails'];
      let videosCount = 0;
      let videosSize = 0;
      let thumbnailsCount = 0;
      let thumbnailsSize = 0;
      const allFiles: StorageFile[] = [];
      
      for (const bucket of buckets) {
        const { data: files, error } = await supabase.storage
          .from(bucket)
          .list('', { limit: 1000 });
        
        if (error) {
          console.error(`Error listing ${bucket}:`, error);
          continue;
        }
        
        if (files) {
          for (const file of files) {
            // Skip folders - they have null metadata
            if (!file.metadata) continue;
            
            const fileSize = file.metadata?.size || 0;
            allFiles.push({
              name: file.name,
              size: fileSize,
              bucket
            });
            
            if (bucket === 'videos') {
              videosCount++;
              videosSize += fileSize;
            } else {
              thumbnailsCount++;
              thumbnailsSize += fileSize;
            }
          }
        }
      }
      
      setStorageFiles(allFiles);
      setStorageStats({
        videosCount,
        videosSize,
        thumbnailsCount,
        thumbnailsSize,
        totalSize: videosSize + thumbnailsSize
      });
    } catch (error: any) {
      console.error('Error fetching storage stats:', error);
      toast.error('Không thể tải thông tin storage');
    } finally {
      setLoadingStorage(false);
    }
  };

  const refreshData = async () => {
    setLoading(true);
    await Promise.all([fetchStats(), fetchPendingVideos(), fetchStorageStats()]);
    setLoading(false);
  };

  useEffect(() => {
    refreshData();
  }, []);

  // Upload video using multipart chunked upload
  const uploadWithMultipart = async (
    videoBlob: Blob, 
    fileName: string, 
    contentType: string,
    signal: AbortSignal
  ): Promise<string> => {
    const totalSize = videoBlob.size;
    const totalParts = Math.ceil(totalSize / CHUNK_SIZE);
    
    console.log(`Starting multipart upload: ${fileName}, size: ${(totalSize / 1024 / 1024).toFixed(2)}MB, parts: ${totalParts}`);
    
    // 1. Initiate multipart upload
    setCurrentStatus(`Khởi tạo multipart upload...`);
    const { data: initData, error: initError } = await supabase.functions.invoke('migrate-to-r2', {
      body: { 
        action: 'initiate-multipart', 
        fileName,
        contentType
      }
    });
    
    if (initError || !initData?.uploadId) {
      throw new Error(initError?.message || 'Failed to initiate multipart upload');
    }
    
    const { uploadId, publicUrl } = initData;
    console.log(`Multipart upload initiated: ${uploadId}`);
    
    const parts: { partNumber: number; etag: string }[] = [];
    
    try {
      // 2. Upload each chunk
      for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
        if (signal.aborted || stopRequestedRef.current) {
          throw new Error('Upload cancelled');
        }
        
        const start = (partNumber - 1) * CHUNK_SIZE;
        const end = Math.min(start + CHUNK_SIZE, totalSize);
        const chunk = videoBlob.slice(start, end);
        
        setCurrentStatus(`Uploading part ${partNumber}/${totalParts} (${(chunk.size / 1024 / 1024).toFixed(1)}MB)...`);
        setUploadProgress(Math.round(((partNumber - 1) / totalParts) * 100));
        
        // Get presigned URL for this part
        const { data: partData, error: partError } = await supabase.functions.invoke('migrate-to-r2', {
          body: { 
            action: 'get-part-url',
            fileName,
            uploadId,
            partNumber
          }
        });
        
        if (partError || !partData?.presignedUrl) {
          throw new Error(partError?.message || `Failed to get URL for part ${partNumber}`);
        }
        
        // Upload chunk directly to R2 with retry
        let etag: string | null = null;
        let retries = 3;
        
        while (retries > 0 && !etag) {
          try {
            const uploadResponse = await fetch(partData.presignedUrl, {
              method: 'PUT',
              body: chunk,
              signal
            });
            
            if (!uploadResponse.ok) {
              const errorText = await uploadResponse.text();
              throw new Error(`Part upload failed: ${uploadResponse.status} - ${errorText}`);
            }
            
            etag = uploadResponse.headers.get('ETag');
            if (!etag) {
              throw new Error(`No ETag returned for part ${partNumber}`);
            }
          } catch (err: any) {
            retries--;
            if (retries === 0 || err.name === 'AbortError') throw err;
            console.warn(`Part ${partNumber} failed, retrying... (${retries} left)`);
            await new Promise(r => setTimeout(r, 1000));
          }
        }
        
        parts.push({ partNumber, etag: etag! });
        console.log(`Part ${partNumber}/${totalParts} uploaded: ${etag}`);
        setUploadProgress(Math.round((partNumber / totalParts) * 100));
      }
      
      // 3. Complete multipart upload
      setCurrentStatus('Hoàn tất multipart upload...');
      const { error: completeError } = await supabase.functions.invoke('migrate-to-r2', {
        body: { 
          action: 'complete-multipart',
          fileName,
          uploadId,
          parts
        }
      });
      
      if (completeError) {
        throw new Error(completeError.message || 'Failed to complete multipart upload');
      }
      
      console.log(`Multipart upload completed: ${publicUrl}`);
      return publicUrl;
      
    } catch (error: any) {
      // Abort the multipart upload on failure
      console.error('Multipart upload failed, aborting:', error);
      await supabase.functions.invoke('migrate-to-r2', {
        body: { action: 'abort-multipart', fileName, uploadId }
      }).catch(() => {});
      throw error;
    }
  };

  // Upload small file with simple presigned URL
  const uploadSimple = async (
    blob: Blob, 
    fileName: string, 
    contentType: string,
    signal: AbortSignal
  ): Promise<string> => {
    const { data: presignedData, error: presignedError } = await supabase.functions.invoke('migrate-to-r2', {
      body: { 
        action: 'get-presigned-url', 
        fileName,
        contentType
      }
    });
    
    if (presignedError) throw presignedError;
    
    const uploadResponse = await fetch(presignedData.presignedUrl, {
      method: 'PUT',
      body: blob,
      signal
    });
    
    if (!uploadResponse.ok) {
      const errorText = await uploadResponse.text();
      throw new Error(`Upload failed: ${uploadResponse.status} - ${errorText}`);
    }
    
    return presignedData.publicUrl;
  };

  // Migrate a single video using chunked streaming
  const migrateVideo = async (video: PendingVideo): Promise<{ success: boolean; newVideoUrl?: string; newThumbnailUrl?: string; error?: string }> => {
    const controller = new AbortController();
    abortControllerRef.current = controller;
    
    try {
      setUploadProgress(0);
      setCurrentStatus('Đang tải video từ Supabase...');
      
      // Fetch video as blob using streaming
      const videoResponse = await fetch(video.video_url, { signal: controller.signal });
      if (!videoResponse.ok) {
        throw new Error(`Failed to download video: ${videoResponse.status}`);
      }
      
      const contentLength = videoResponse.headers.get('content-length');
      const videoSize = contentLength ? parseInt(contentLength) : 0;
      const videoBlob = await videoResponse.blob();
      
      console.log(`Video downloaded: ${video.title}, size: ${(videoBlob.size / 1024 / 1024).toFixed(2)}MB`);
      
      // Generate R2 filename
      const timestamp = Date.now();
      const originalFileName = video.video_url.split('/').pop()?.split('?')[0] || 'video.mp4';
      const videoFileName = `${video.user_id}/videos/migrated-${timestamp}-${originalFileName}`;
      const contentType = videoBlob.type || 'video/mp4';
      
      // Upload video - use multipart for files > 10MB, simple for smaller
      let newVideoUrl: string;
      if (videoBlob.size > 10 * 1024 * 1024) {
        newVideoUrl = await uploadWithMultipart(videoBlob, videoFileName, contentType, controller.signal);
      } else {
        setCurrentStatus(`Uploading video (${(videoBlob.size / 1024 / 1024).toFixed(1)}MB)...`);
        newVideoUrl = await uploadSimple(videoBlob, videoFileName, contentType, controller.signal);
      }
      
      let newThumbnailUrl: string | undefined;
      
      // Migrate thumbnail if exists
      if (video.thumbnail_url && !video.thumbnail_url.includes('r2.dev')) {
        setCurrentStatus('Đang migrate thumbnail...');
        
        try {
          const thumbResponse = await fetch(video.thumbnail_url, { signal: controller.signal });
          if (thumbResponse.ok) {
            const thumbBlob = await thumbResponse.blob();
            const thumbFileName = video.thumbnail_url.split('/').pop()?.split('?')[0] || 'thumb.jpg';
            const newThumbFileName = `${video.user_id}/thumbnails/migrated-${timestamp}-${thumbFileName}`;
            
            newThumbnailUrl = await uploadSimple(
              thumbBlob, 
              newThumbFileName, 
              thumbBlob.type || 'image/jpeg',
              controller.signal
            );
          }
        } catch (thumbError) {
          console.warn('Thumbnail migration failed:', thumbError);
        }
      }
      
      // Update database
      setCurrentStatus('Đang cập nhật database...');
      const { error: updateError } = await supabase.functions.invoke('migrate-to-r2', {
        body: { 
          action: 'update-video-urls', 
          videoId: video.id,
          videoUrl: newVideoUrl,
          thumbnailUrl: newThumbnailUrl
        }
      });
      
      if (updateError) throw updateError;
      
      return { success: true, newVideoUrl, newThumbnailUrl };
      
    } catch (error: any) {
      console.error('Migration error:', error);
      
      // Mark as failed in database
      await supabase.functions.invoke('migrate-to-r2', {
        body: { 
          action: 'mark-failed', 
          videoId: video.id,
          errorMessage: error.message
        }
      }).catch(() => {});
      
      return { success: false, error: error.message };
    }
  };

  const migrateSingleVideo = async (videoId: string) => {
    const video = pendingVideos.find(v => v.id === videoId);
    if (!video) return;
    
    setMigrating(true);
    setCurrentVideoId(videoId);
    setCurrentStatus('Bắt đầu migrate...');
    stopRequestedRef.current = false;
    
    const result = await migrateVideo(video);
    
    if (result.success) {
      toast.success(`Video migrated successfully`);
      setMigrationResults(prev => [...prev, { videoId, success: true, newVideoUrl: result.newVideoUrl }]);
    } else {
      toast.error(`Migration failed: ${result.error}`);
      setMigrationResults(prev => [...prev, { videoId, success: false, error: result.error }]);
    }
    
    setCurrentVideoId(null);
    setCurrentStatus('');
    setUploadProgress(0);
    setMigrating(false);
    await refreshData();
  };

  const migrateAllVideos = async () => {
    if (pendingVideos.length === 0) {
      toast.info('Không có video nào cần migrate');
      return;
    }

    setMigrating(true);
    setBatchProgress({ current: 0, total: pendingVideos.length });
    setMigrationResults([]);
    stopRequestedRef.current = false;

    let migratedCount = 0;
    let failedCount = 0;

    for (let i = 0; i < pendingVideos.length; i++) {
      if (stopRequestedRef.current) {
        toast.info('Migration đã dừng');
        break;
      }
      
      const video = pendingVideos[i];
      setCurrentVideoId(video.id);
      setBatchProgress({ current: i, total: pendingVideos.length });
      
      const result = await migrateVideo(video);
      
      if (result.success) {
        migratedCount++;
        setMigrationResults(prev => [...prev, { videoId: video.id, success: true, newVideoUrl: result.newVideoUrl }]);
        toast.success(`Video ${i + 1}/${pendingVideos.length} migrated`);
      } else {
        failedCount++;
        setMigrationResults(prev => [...prev, { videoId: video.id, success: false, error: result.error }]);
        toast.error(`Video ${i + 1} failed: ${result.error}`);
      }
      
      setBatchProgress({ current: i + 1, total: pendingVideos.length });
      
      // Small delay between videos
      if (i < pendingVideos.length - 1 && !stopRequestedRef.current) {
        await new Promise(resolve => setTimeout(resolve, 500));
      }
    }

    setMigrating(false);
    setCurrentVideoId(null);
    setCurrentStatus('');
    setUploadProgress(0);
    
    toast.success(`Migration hoàn tất: ${migratedCount} thành công, ${failedCount} thất bại`);
    await refreshData();
  };

  const stopMigration = () => {
    stopRequestedRef.current = true;
    abortControllerRef.current?.abort();
    toast.info('Đang dừng migration...');
  };

  // Cleanup Supabase Storage
  const cleanupSupabaseStorage = async () => {
    if (storageFiles.length === 0) {
      toast.info('Không có file nào cần xóa');
      return;
    }

    setCleaning(true);
    setCleanupProgress({ current: 0, total: storageFiles.length });
    setCleanupResults(null);

    let deleted = 0;
    let failed = 0;

    // Group files by bucket
    const videoFiles = storageFiles.filter(f => f.bucket === 'videos');
    const thumbnailFiles = storageFiles.filter(f => f.bucket === 'thumbnails');

    // Delete video files
    for (let i = 0; i < videoFiles.length; i++) {
      try {
        const { error } = await supabase.storage
          .from('videos')
          .remove([videoFiles[i].name]);
        
        if (error) throw error;
        deleted++;
      } catch (err) {
        console.error(`Failed to delete video: ${videoFiles[i].name}`, err);
        failed++;
      }
      setCleanupProgress({ current: i + 1, total: storageFiles.length });
    }

    // Delete thumbnail files
    for (let i = 0; i < thumbnailFiles.length; i++) {
      try {
        const { error } = await supabase.storage
          .from('thumbnails')
          .remove([thumbnailFiles[i].name]);
        
        if (error) throw error;
        deleted++;
      } catch (err) {
        console.error(`Failed to delete thumbnail: ${thumbnailFiles[i].name}`, err);
        failed++;
      }
      setCleanupProgress({ current: videoFiles.length + i + 1, total: storageFiles.length });
    }

    setCleaning(false);
    setCleanupResults({ deleted, failed });
    setShowCleanupDialog(false);
    
    toast.success(`Cleanup hoàn tất: ${deleted} đã xóa, ${failed} thất bại`);
    await fetchStorageStats();
  };

  const getStatusBadge = (videoId: string) => {
    const result = migrationResults.find(r => r.videoId === videoId);
    
    if (currentVideoId === videoId) {
      return <Badge className="bg-blue-500"><Loader2 className="w-3 h-3 mr-1 animate-spin" />Đang migrate</Badge>;
    }
    
    if (result) {
      return result.success 
        ? <Badge className="bg-green-500"><CheckCircle className="w-3 h-3 mr-1" />Thành công</Badge>
        : <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Thất bại</Badge>;
    }
    
    return <Badge variant="secondary">Chờ xử lý</Badge>;
  };

  const cleanupProgressPercent = cleanupProgress.total > 0 
    ? (cleanupProgress.current / cleanupProgress.total) * 100 
    : 0;

  if (loading) {
    return (
      <div className="flex items-center justify-center p-8">
        <Loader2 className="w-8 h-8 animate-spin text-primary" />
      </div>
    );
  }

  const progressPercent = batchProgress.total > 0 
    ? (batchProgress.current / batchProgress.total) * 100 
    : 0;

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
        <Card className="bg-gradient-to-br from-orange-500/10 to-orange-500/5 border-orange-500/30">
          <CardContent className="p-4 text-center">
            <Database className="w-8 h-8 mx-auto text-orange-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.supabaseStorageCount || 0}</div>
            <div className="text-xs text-muted-foreground">Supabase Storage</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-blue-500/10 to-blue-500/5 border-blue-500/30">
          <CardContent className="p-4 text-center">
            <Cloud className="w-8 h-8 mx-auto text-blue-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.r2Count || 0}</div>
            <div className="text-xs text-muted-foreground">Cloudflare R2</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-green-500/10 to-green-500/5 border-green-500/30">
          <CardContent className="p-4 text-center">
            <CheckCircle className="w-8 h-8 mx-auto text-green-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.completed || 0}</div>
            <div className="text-xs text-muted-foreground">Đã migrate</div>
          </CardContent>
        </Card>

        <Card className="bg-gradient-to-br from-red-500/10 to-red-500/5 border-red-500/30">
          <CardContent className="p-4 text-center">
            <XCircle className="w-8 h-8 mx-auto text-red-500 mb-2" />
            <div className="text-2xl font-bold">{stats?.failed || 0}</div>
            <div className="text-xs text-muted-foreground">Thất bại</div>
          </CardContent>
        </Card>
      </div>

      {/* Migration Control */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <CloudUpload className="w-5 h-5" />
            Migrate Videos sang Cloudflare R2
          </CardTitle>
          <div className="flex gap-2">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={refreshData}
              disabled={migrating}
            >
              <RefreshCw className="w-4 h-4 mr-1" />
              Refresh
            </Button>
            {migrating ? (
              <Button 
                variant="destructive"
                size="sm"
                onClick={stopMigration}
              >
                <StopCircle className="w-4 h-4 mr-2" />
                Dừng lại
              </Button>
            ) : (
              <Button 
                onClick={migrateAllVideos}
                disabled={migrating || pendingVideos.length === 0}
                className="bg-gradient-to-r from-blue-500 to-purple-500"
              >
                <Play className="w-4 h-4 mr-2" />
                Migrate tất cả ({pendingVideos.length})
              </Button>
            )}
          </div>
        </CardHeader>
        <CardContent>
          {migrating && (
            <div className="mb-6 space-y-3">
              <div className="flex justify-between text-sm">
                <span>Video: {batchProgress.current}/{batchProgress.total}</span>
                <span>{Math.round(progressPercent)}%</span>
              </div>
              <Progress value={progressPercent} className="h-2" />
              
              {uploadProgress > 0 && (
                <>
                  <div className="flex justify-between text-xs text-muted-foreground">
                    <span>Upload progress</span>
                    <span>{uploadProgress}%</span>
                  </div>
                  <Progress value={uploadProgress} className="h-1.5 bg-muted" />
                </>
              )}
              
              {currentStatus && (
                <div className="text-xs text-muted-foreground animate-pulse">
                  {currentStatus}
                </div>
              )}
            </div>
          )}

          {pendingVideos.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-4 text-green-500" />
              <p>Tất cả videos đã được migrate sang R2!</p>
            </div>
          ) : (
            <ScrollArea className="h-[400px]">
              <div className="space-y-2">
                {pendingVideos.map((video) => (
                  <div 
                    key={video.id}
                    className="flex items-center gap-4 p-3 rounded-lg bg-muted/30 hover:bg-muted/50 transition-colors"
                  >
                    <div className="w-16 h-10 rounded overflow-hidden bg-muted flex-shrink-0">
                      {video.thumbnail_url && (
                        <img 
                          src={video.thumbnail_url} 
                          alt={video.title}
                          className="w-full h-full object-cover"
                        />
                      )}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate">{video.title}</div>
                      <div className="text-xs text-muted-foreground truncate">
                        {video.video_url.includes('supabase') ? 'Supabase Storage' : 'External'}
                      </div>
                    </div>
                    {getStatusBadge(video.id)}
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => migrateSingleVideo(video.id)}
                      disabled={migrating}
                    >
                      {currentVideoId === video.id ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <CloudUpload className="w-4 h-4" />
                      )}
                    </Button>
                  </div>
                ))}
              </div>
            </ScrollArea>
          )}
        </CardContent>
      </Card>

      {/* Migration Results */}
      {migrationResults.length > 0 && (
        <Card>
          <CardHeader>
            <CardTitle>Kết quả Migration</CardTitle>
          </CardHeader>
          <CardContent>
            <ScrollArea className="h-[200px]">
              <div className="space-y-2">
                {migrationResults.map((result, index) => (
                  <div 
                    key={index}
                    className={`p-2 rounded text-sm ${
                      result.success ? 'bg-green-500/10 text-green-500' : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {result.success ? (
                      <span>✓ Video {result.videoId.slice(0, 8)}... → R2</span>
                    ) : (
                      <span>✗ Video {result.videoId.slice(0, 8)}... - {result.error}</span>
                    )}
                  </div>
                ))}
              </div>
            </ScrollArea>
          </CardContent>
        </Card>
      )}

      {/* Cleanup Supabase Storage */}
      <Card className="border-red-500/30">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle className="flex items-center gap-2 text-red-500">
            <Trash2 className="w-5 h-5" />
            Cleanup Supabase Storage
          </CardTitle>
          <Button 
            variant="outline" 
            size="sm" 
            onClick={fetchStorageStats}
            disabled={loadingStorage || cleaning}
          >
            <RefreshCw className={`w-4 h-4 mr-1 ${loadingStorage ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Storage Stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-3 rounded-lg bg-orange-500/10 border border-orange-500/30">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-4 h-4 text-orange-500" />
                <span className="text-sm font-medium">Videos</span>
              </div>
              <div className="text-lg font-bold">{storageStats?.videosCount || 0} files</div>
              <div className="text-xs text-muted-foreground">{formatBytes(storageStats?.videosSize || 0)}</div>
            </div>
            
            <div className="p-3 rounded-lg bg-purple-500/10 border border-purple-500/30">
              <div className="flex items-center gap-2 mb-1">
                <HardDrive className="w-4 h-4 text-purple-500" />
                <span className="text-sm font-medium">Thumbnails</span>
              </div>
              <div className="text-lg font-bold">{storageStats?.thumbnailsCount || 0} files</div>
              <div className="text-xs text-muted-foreground">{formatBytes(storageStats?.thumbnailsSize || 0)}</div>
            </div>
            
            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/30 md:col-span-2">
              <div className="flex items-center gap-2 mb-1">
                <Database className="w-4 h-4 text-red-500" />
                <span className="text-sm font-medium">Tổng dung lượng Supabase</span>
              </div>
              <div className="text-xl font-bold text-red-500">{formatBytes(storageStats?.totalSize || 0)}</div>
              <div className="text-xs text-muted-foreground">
                {storageFiles.length} files sẵn sàng để xóa
              </div>
            </div>
          </div>

          {/* Cleanup Progress */}
          {cleaning && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Đang xóa: {cleanupProgress.current}/{cleanupProgress.total}</span>
                <span>{Math.round(cleanupProgressPercent)}%</span>
              </div>
              <Progress value={cleanupProgressPercent} className="h-2" />
            </div>
          )}

          {/* Cleanup Results */}
          {cleanupResults && (
            <div className="p-3 rounded-lg bg-muted/50 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-green-500" />
              <span>
                Đã xóa: <strong className="text-green-500">{cleanupResults.deleted}</strong> files
                {cleanupResults.failed > 0 && (
                  <>, Thất bại: <strong className="text-red-500">{cleanupResults.failed}</strong></>
                )}
              </span>
            </div>
          )}

          {/* Warning & Action */}
          {storageFiles.length > 0 ? (
            <div className="space-y-3">
              <div className="p-3 rounded-lg bg-yellow-500/10 border border-yellow-500/30 flex items-start gap-2">
                <AlertTriangle className="w-5 h-5 text-yellow-500 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <strong>Cảnh báo:</strong> Hành động này sẽ xóa vĩnh viễn {storageFiles.length} files khỏi Supabase Storage. 
                  Hãy đảm bảo rằng tất cả videos đã được migrate sang R2 và đang hoạt động bình thường trước khi xóa.
                </div>
              </div>
              
              <Button 
                variant="destructive"
                onClick={() => setShowCleanupDialog(true)}
                disabled={cleaning || migrating || pendingVideos.length > 0}
                className="w-full"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Xóa {storageFiles.length} files ({formatBytes(storageStats?.totalSize || 0)})
              </Button>
              
              {pendingVideos.length > 0 && (
                <p className="text-xs text-muted-foreground text-center">
                  ⚠️ Hoàn thành migrate {pendingVideos.length} video(s) còn lại trước khi cleanup
                </p>
              )}
            </div>
          ) : (
            <div className="text-center py-6 text-muted-foreground">
              <CheckCircle className="w-12 h-12 mx-auto mb-3 text-green-500" />
              <p>Supabase Storage đã trống!</p>
              <p className="text-xs mt-1">Không có files nào cần xóa</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Cleanup Confirmation Dialog */}
      <AlertDialog open={showCleanupDialog} onOpenChange={setShowCleanupDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle className="flex items-center gap-2 text-red-500">
              <AlertTriangle className="w-5 h-5" />
              Xác nhận xóa Supabase Storage
            </AlertDialogTitle>
            <AlertDialogDescription className="space-y-2">
              <p>Bạn sắp xóa vĩnh viễn:</p>
              <ul className="list-disc list-inside space-y-1">
                <li><strong>{storageStats?.videosCount}</strong> video files ({formatBytes(storageStats?.videosSize || 0)})</li>
                <li><strong>{storageStats?.thumbnailsCount}</strong> thumbnail files ({formatBytes(storageStats?.thumbnailsSize || 0)})</li>
              </ul>
              <p className="text-red-500 font-medium mt-2">
                Hành động này KHÔNG thể hoàn tác. Đảm bảo rằng tất cả videos đang hoạt động từ R2.
              </p>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Hủy</AlertDialogCancel>
            <AlertDialogAction 
              onClick={cleanupSupabaseStorage}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Xóa {storageFiles.length} files
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default VideoMigrationPanel;
