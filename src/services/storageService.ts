export const sanitizeUrl = (url: string) => url || '';

const BUCKET_ID = "5500ceff-6d51-4f33-aee4-a07e2725ddaf";

export const getPublicFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:') || path.startsWith('data:')) return path;
  if (path.includes('firebasestorage')) return path;
  
  // If it's a UUID (from our backend)
  if (/^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i.test(path)) {
      return `/api/storage/v1/buckets/${BUCKET_ID}/objects/${path}/stream`;
  }
  
  if (path.includes('/api/storage/')) return path;
  
  return `/api/storage/file/${path}`;
};

export const getEmbedFileUrl = (path: string) => getPublicFileUrl(path);

const uploadToProxy = (
    file: File | Blob, 
    pathPrefix: string, 
    onProgress?: (progress: number) => void
): Promise<any> => {
  return new Promise((resolve, reject) => {
    let ext = '';
    if (file instanceof File) {
       ext = file.name.split('.').pop() || '';
    } else {
       ext = file.type.split('/')[1] || 'bin';
       if (ext.startsWith('audio')) ext = 'webm';
       if (ext.includes('webm')) ext = 'webm';
       if (ext.includes('mp4')) ext = 'mp4';
    }
    
    // We send to the proxy exactly as requested
    const fd = new FormData();
    // We can just append the file, backend doesn't need path in URL if it generates IDs
    // wait, does the backend accept path? In the previous curl we didn't specify path.
    // The audit says: POST /api/storage/v1/buckets/5500ceff-6d51-4f33-aee4-a07e2725ddaf/objects
    fd.append('file', file);

    const xhr = new XMLHttpRequest();
    xhr.open('POST', `/api/storage/v1/buckets/${BUCKET_ID}/objects`, true);
    
    xhr.upload.onprogress = (e) => {
        if (e.lengthComputable && onProgress) {
            const percentComplete = (e.loaded / e.total) * 100;
            onProgress(percentComplete);
        }
    };
    
    xhr.onload = () => {
        if (xhr.status >= 200 && xhr.status < 300) {
            try {
                const response = JSON.parse(xhr.responseText);
                // Contract required by app components
                const result = {
                    ...response,
                    id: response.id,
                    url: `/api/storage/v1/buckets/${BUCKET_ID}/objects/${response.id}/stream`,
                    path: response.id, // we store the ID as the path/reference
                    mimeType: file.type,
                    size: file.size,
                    success: true,
                    file: {
                        id: response.id,
                        url: `/api/storage/v1/buckets/${BUCKET_ID}/objects/${response.id}/stream`,
                        path: response.id,
                        mimeType: file.type,
                        size: file.size
                    }
                };
                resolve(result);
            } catch (err) {
                reject(new Error("Invalid JSON response from server"));
            }
        } else {
            reject(new Error(`Upload failed with status ${xhr.status}: ${xhr.responseText}`));
        }
    };
    
    xhr.onerror = () => {
        reject(new Error("Network error during upload"));
    };
    
    xhr.send(fd);
  });
};

const extractParams = (args: any[]) => {
    let file = null;
    let onProgress = undefined;
    
    // Attempt to extract file and onProgress callback from arguments
    for (const arg of args) {
        if (arg instanceof File || arg instanceof Blob) {
            file = arg;
        } else if (arg && typeof arg === 'object' && (arg.file instanceof File || arg.file instanceof Blob)) {
            file = arg.file;
            if (arg.onProgress && typeof arg.onProgress === 'function') {
                onProgress = arg.onProgress;
            }
        } else if (typeof arg === 'function') {
            onProgress = arg;
        }
    }
    
    return { file, onProgress };
};

export const uploadProfilePhoto = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'profiles', onProgress);
};
export const uploadUserBanner = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'banners', onProgress);
};
export const uploadChatImage = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'chat-images', onProgress);
};
export const uploadChatVideo = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'chat-videos', onProgress);
};
export const uploadChatAudio = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'chat-audio', onProgress);
};
export const uploadChatDocument = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'chat-docs', onProgress);
};
export const uploadGroupImage = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'group-images', onProgress);
};
export const uploadGroupVideo = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'group-videos', onProgress);
};
export const uploadGroupAudio = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'group-audio', onProgress);
};
export const uploadGroupDocument = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'group-docs', onProgress);
};
export const uploadGroupAvatar = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'group-avatars', onProgress);
};
export const uploadGroupBanner = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'group-banners', onProgress);
};
export const uploadStatusMedia = async (params: any) => {
    const { file, onProgress } = extractParams([params]);
    return uploadToProxy(file!, 'status-media', onProgress);
};

export const uploadVoiceToStorage = async (...args: any[]) => {
    const { file, onProgress } = extractParams(args);
    if (!file) throw new Error("File not found in arguments");
    return uploadToProxy(file, 'voice-messages', onProgress);
};
