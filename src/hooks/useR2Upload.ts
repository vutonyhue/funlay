import { useState, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

// 100MB chunk size for multipart upload
const CHUNK_SIZE = 100 * 1024 * 1024;
// Use multipart for files > 100MB
const MULTIPART_THRESHOLD = 100 * 1024 * 1024;

interface UploadProgress {
  loaded: number;
  total: number;
  percentage: number;
  stage?: string;
}

interface UseR2UploadOptions {
  folder?: string;
  onProgress?: (progress: UploadProgress) => void;
}

interface UploadResult {
  publicUrl: string;
  fileName: string;
}

export function useR2Upload(options: UseR2UploadOptions = {}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState<UploadProgress | null>(null);
  const { toast } = useToast();

  const uploadToR2 = useCallback(async (
    file: File,
    customFileName?: string
  ): Promise<UploadResult | null> => {
    try {
      setUploading(true);
      setProgress({ loaded: 0, total: file.size, percentage: 0, stage: 'Đang chuẩn bị...' });

      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        throw new Error('Chưa đăng nhập');
      }

      const userId = session.user.id;
      const sanitizedName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_').substring(0, 100);
      const fileName = customFileName || 
        (options.folder 
          ? `${userId}/${options.folder}/${Date.now()}-${sanitizedName}`
          : `${userId}/${Date.now()}-${sanitizedName}`);

      console.log(`Starting R2 upload: ${fileName}, Size: ${(file.size / 1024 / 1024).toFixed(2)} MB`);

      const updateProgress = (loaded: number, total: number, stage: string) => {
        const prog = {
          loaded,
          total,
          percentage: Math.round((loaded / total) * 100),
          stage,
        };
        setProgress(prog);
        options.onProgress?.(prog);
      };

      // Check if we need multipart upload
      if (file.size > MULTIPART_THRESHOLD) {
        return await multipartUpload(file, fileName, updateProgress);
      } else {
        return await simpleUpload(file, fileName, updateProgress);
      }
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
  }, [options, toast]);

  const deleteFromR2 = useCallback(async (fileName: string): Promise<boolean> => {
    try {
      const { error } = await supabase.functions.invoke('r2-upload', {
        body: { action: 'delete', fileName },
      });

      if (error) {
        console.error('Delete error:', error);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Delete from R2 error:', error);
      return false;
    }
  }, []);

  return {
    uploadToR2,
    deleteFromR2,
    uploading,
    progress,
  };
}

// Simple upload for files < 100MB using presigned URL
async function simpleUpload(
  file: File,
  fileName: string,
  updateProgress: (loaded: number, total: number, stage: string) => void
): Promise<UploadResult> {
  updateProgress(0, file.size, 'Đang tạo link upload...');

  // Get presigned URL from edge function
  const { data, error } = await supabase.functions.invoke('r2-upload', {
    body: {
      action: 'getPresignedUrl',
      fileName,
      contentType: file.type,
      fileSize: file.size,
    },
  });

  if (error || !data?.presignedUrl) {
    console.error('Presign error:', error, data);
    throw new Error(data?.error || 'Không thể tạo link upload');
  }

  updateProgress(0, file.size, 'Đang tải lên R2...');

  // Upload directly to R2 using presigned URL with XHR for progress
  const uploadPromise = new Promise<void>((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    
    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        updateProgress(event.loaded, event.total, 'Đang tải lên R2...');
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        resolve();
      } else {
        reject(new Error(`Upload failed: ${xhr.status} ${xhr.statusText}`));
      }
    });

    xhr.addEventListener('error', () => {
      reject(new Error('Lỗi mạng khi upload'));
    });

    xhr.addEventListener('timeout', () => {
      reject(new Error('Upload timeout - vui lòng thử lại'));
    });

    xhr.open('PUT', data.presignedUrl);
    xhr.timeout = 30 * 60 * 1000; // 30 minutes timeout
    xhr.send(file);
  });

  await uploadPromise;

  updateProgress(file.size, file.size, 'Hoàn thành!');

  console.log("R2 Upload successful:", data.publicUrl);

  return {
    publicUrl: data.publicUrl,
    fileName: data.fileName,
  };
}

// Multipart upload for files > 100MB
async function multipartUpload(
  file: File,
  fileName: string,
  updateProgress: (loaded: number, total: number, stage: string) => void
): Promise<UploadResult> {
  const totalParts = Math.ceil(file.size / CHUNK_SIZE);
  
  updateProgress(0, file.size, 'Đang khởi tạo multipart upload...');

  // Step 1: Initiate multipart upload
  const { data: initData, error: initError } = await supabase.functions.invoke('r2-upload', {
    body: {
      action: 'initiateMultipart',
      fileName,
      contentType: file.type,
      fileSize: file.size,
    },
  });

  if (initError || !initData?.uploadId) {
    console.error('Initiate multipart error:', initError, initData);
    throw new Error(initData?.error || 'Không thể khởi tạo multipart upload');
  }

  const { uploadId, publicUrl } = initData;
  console.log(`Multipart upload initiated: ${uploadId}, Total parts: ${totalParts}`);

  const uploadedParts: { partNumber: number; etag: string }[] = [];
  let totalUploaded = 0;

  // Step 2: Upload each part
  for (let partNumber = 1; partNumber <= totalParts; partNumber++) {
    const start = (partNumber - 1) * CHUNK_SIZE;
    const end = Math.min(start + CHUNK_SIZE, file.size);
    const chunk = file.slice(start, end);

    updateProgress(totalUploaded, file.size, `Đang tải phần ${partNumber}/${totalParts}...`);

    // Get presigned URL for this part
    const { data: partData, error: partError } = await supabase.functions.invoke('r2-upload', {
      body: {
        action: 'getPartUrl',
        fileName,
        uploadId,
        partNumber,
      },
    });

    if (partError || !partData?.presignedUrl) {
      console.error(`Part ${partNumber} presign error:`, partError, partData);
      throw new Error(`Không thể tạo link upload cho phần ${partNumber}`);
    }

    // Upload the part with retry logic
    let retries = 0;
    const maxRetries = 3;
    let etag: string | null = null;

    while (retries < maxRetries && !etag) {
      try {
        const partResult = await uploadPart(chunk, partData.presignedUrl, (loaded) => {
          updateProgress(totalUploaded + loaded, file.size, `Đang tải phần ${partNumber}/${totalParts}...`);
        });
        
        etag = partResult.etag;
      } catch (error) {
        retries++;
        console.error(`Part ${partNumber} upload failed, retry ${retries}/${maxRetries}:`, error);
        
        if (retries >= maxRetries) {
          throw new Error(`Tải phần ${partNumber} thất bại sau ${maxRetries} lần thử`);
        }
        
        // Wait before retry with exponential backoff
        await new Promise(resolve => setTimeout(resolve, 2000 * retries));
      }
    }

    if (!etag) {
      throw new Error(`Không thể upload phần ${partNumber}`);
    }

    uploadedParts.push({ partNumber, etag });
    totalUploaded = end;
    
    console.log(`Part ${partNumber}/${totalParts} uploaded, ETag: ${etag}`);
  }

  // Step 3: Complete multipart upload
  updateProgress(file.size, file.size, 'Đang hoàn tất upload...');

  const { error: completeError } = await supabase.functions.invoke('r2-upload', {
    body: {
      action: 'completeMultipart',
      fileName,
      uploadId,
      parts: uploadedParts,
    },
  });

  if (completeError) {
    console.error('Complete multipart error:', completeError);
    throw new Error('Không thể hoàn tất multipart upload');
  }

  updateProgress(file.size, file.size, 'Hoàn thành!');

  console.log(`Multipart upload completed: ${publicUrl}`);

  return {
    publicUrl,
    fileName,
  };
}

// Upload a single part with progress tracking
function uploadPart(
  chunk: Blob,
  presignedUrl: string,
  onProgress: (loaded: number) => void
): Promise<{ etag: string }> {
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();

    xhr.upload.addEventListener('progress', (event) => {
      if (event.lengthComputable) {
        onProgress(event.loaded);
      }
    });

    xhr.addEventListener('load', () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const etag = xhr.getResponseHeader('ETag');
        if (etag) {
          resolve({ etag: etag.replace(/"/g, '') });
        } else {
          // Some S3-compatible services don't return ETag in header for presigned URLs
          // Generate a fake one based on part content hash
          resolve({ etag: `part-${Date.now()}` });
        }
      } else {
        reject(new Error(`Part upload failed: ${xhr.status}`));
      }
    });

    xhr.addEventListener('error', () => reject(new Error('Lỗi mạng')));
    xhr.addEventListener('timeout', () => reject(new Error('Timeout')));

    xhr.open('PUT', presignedUrl);
    xhr.timeout = 10 * 60 * 1000; // 10 minutes per part
    xhr.send(chunk);
  });
}
