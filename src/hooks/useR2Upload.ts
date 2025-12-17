import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
}

interface UseR2UploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
}

export function useR2Upload(options: UseR2UploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const { toast } = useToast();

  const uploadToR2 = async (
    file: File, 
    customFileName?: string
  ): Promise<{ publicUrl: string; fileName: string } | null> => {
    try {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0 });

      // Get current user for folder naming
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        throw new Error("Authentication required");
      }

      // Generate file path - edge function will prefix with userId for security
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_").substring(0, 50);
      const fileName = customFileName || 
        `${options.folder || 'uploads'}/${Date.now()}-${sanitizedName}`;

      // Use proxy upload through edge function
      const formData = new FormData();
      formData.append('file', file);
      formData.append('fileName', fileName);

      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Authentication required");
      }

      // Upload with progress tracking using XMLHttpRequest
      const xhr = new XMLHttpRequest();
      
      const result = await new Promise<{ publicUrl: string; fileName: string }>((resolve, reject) => {
        xhr.upload.onprogress = (event) => {
          if (event.lengthComputable) {
            const uploadProgress = {
              loaded: event.loaded,
              total: event.total,
              percentage: Math.round((event.loaded / event.total) * 100),
            };
            setProgress(uploadProgress);
            options.onProgress?.(uploadProgress);
          }
        };

        xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
            try {
              const response = JSON.parse(xhr.responseText);
              if (response.publicUrl) {
                resolve({
                  publicUrl: response.publicUrl,
                  fileName: response.fileName,
                });
              } else {
                reject(new Error(response.error || 'Upload failed'));
              }
            } catch {
              reject(new Error('Invalid response from server'));
            }
          } else {
            try {
              const error = JSON.parse(xhr.responseText);
              reject(new Error(error.error || `Upload failed: ${xhr.status}`));
            } catch {
              reject(new Error(`Upload failed: ${xhr.status}`));
            }
          }
        };

        xhr.onerror = () => reject(new Error("Lỗi mạng khi upload"));
        xhr.ontimeout = () => reject(new Error("Upload timeout"));

        const url = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/r2-upload`;
        xhr.open('POST', url);
        xhr.setRequestHeader('Authorization', `Bearer ${session.access_token}`);
        xhr.setRequestHeader('apikey', import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY);
        xhr.timeout = 600000; // 10 minutes
        xhr.send(formData);
      });

      console.log("R2 Upload successful:", result.publicUrl);

      return result;

    } catch (error: any) {
      console.error("R2 Upload error:", error);
      toast({
        title: "Lỗi tải lên",
        description: error.message || "Không thể tải file lên",
        variant: "destructive",
      });
      return null;
    } finally {
      setUploading(false);
      setProgress(null);
    }
  };

  const deleteFromR2 = async (fileName: string): Promise<boolean> => {
    try {
      const { data, error } = await supabase.functions.invoke('r2-upload', {
        body: {
          action: 'delete',
          fileName,
        }
      });

      if (error) throw error;
      return true;
    } catch (error: any) {
      console.error("R2 Delete error:", error);
      return false;
    }
  };

  return {
    uploadToR2,
    deleteFromR2,
    uploading,
    progress,
  };
}
