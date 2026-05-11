import { CALL_API_BASE } from './callApi';

function cleanEnvUrl(url?: string): string {
  if (!url) return "";
  if (url.includes('google.com/url')) {
    try {
      const urlObj = new URL(url);
      return decodeURIComponent(urlObj.searchParams.get('q') || url);
    } catch {
      return url;
    }
  }
  return url;
}

export const R2_PUBLIC_URL = cleanEnvUrl(import.meta.env.VITE_R2_PUBLIC_URL) || "https://storage.cysmk.online";

function generateUniquePath(file: File, folder: string = 'files'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  // Remove special chars and keep extension
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  return `${folder}/${timestamp}-${randomStr}.${ext}`;
}

export function getPublicFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  return `${R2_PUBLIC_URL}/${cleanPath}`;
}

export function getEmbedFileUrl(path: string): string {
  return getPublicFileUrl(path);
}

export function getDownloadFileUrl(path: string): string {
  return getPublicFileUrl(path);
}

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url;
}

export async function getSysInfo(): Promise<{ status: string, storage: string }> {
  return { status: "online", storage: "cloudflare-r2" };
}

interface UploadFileParams {
  file: File;
  folder?: string;
  onProgress?: (progress: number) => void;
}

interface UploadedFileSuccess {
  success: boolean;
  key: string;
  url: string;
  mimeType: string;
  size: number;
  storage: string;
  file?: any; // For backward compatibility
}

export async function uploadToR2({ file, folder = 'files', onProgress }: UploadFileParams): Promise<UploadedFileSuccess> {
  const path = generateUniquePath(file, folder);
  const contentType = file.type || 'application/octet-stream';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    // Use the backend proxy instead of presigned URL to avoid R2 CORS issues
    xhr.open("PUT", `/api/storage/upload?filename=${encodeURIComponent(path)}`);
    xhr.setRequestHeader("Content-Type", contentType);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        const publicUrl = getPublicFileUrl(path);
        
        // Return standardized object
        const result = {
          success: true,
          key: path,
          url: publicUrl,
          mimeType: contentType,
          size: file.size,
          storage: "cloudflare-r2",
          // Keep backward compatibility fields
          file: {
            name: file.name,
            mimeType: contentType,
            size: file.size,
            filename: path.split('/').pop(),
            path: path,
            url: publicUrl,
            createdAt: new Date().toISOString()
          }
        };
        resolve(result);
      } else {
        reject(new Error(`Storage proxy error: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error("Falha na rede ou erro na proxy de upload pro servidor. Verifique recursos ou limite de tamanho."));
    xhr.send(file);
  });
}

// Helper aliases
export async function uploadProfilePhoto({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `avatars/${userId}`, onProgress });
}

export async function uploadUserPhoto({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `avatars/${userId}`, onProgress });
}

export async function uploadChatImage({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `images/${chatId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadChatVideo({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `video/${chatId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadChatAudio({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `audio/${chatId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadChatDocument({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `files/${chatId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadGroupImage({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `images/${groupId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadGroupVideo({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `video/${groupId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadGroupAudio({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `audio/${groupId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadGroupDocument({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `files/${groupId}/${messageId || Date.now()}`, onProgress });
}

export async function uploadGroupAvatar({ groupId, userId, file, onProgress }: { groupId: string, userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadToR2({ file, folder: `avatars/${groupId}`, onProgress });
}

export async function uploadVoiceToStorage(conversationId: string, messageId: string, blob: Blob, onProgress?: (p: number) => void) {
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const fileType = blob.type || 'audio/webm;codecs=opus';
  let ext = 'webm';
  if (fileType.includes('mp4')) ext = 'm4a';
  else if (fileType.includes('aac')) ext = 'aac';
  else if (fileType.includes('mpeg')) ext = 'mp3';

  const file = new File([blob], `voice-${uuid}.${ext}`, { type: fileType });
  const result = await uploadToR2({ file, folder: `audio/${conversationId}/${messageId || Date.now()}`, onProgress });
  
  return { 
    path: result.key, 
    url: result.url, 
    size: result.size, 
    mimeType: result.mimeType 
  };
}

export function getVoiceMediaUrl(path: string): string {
  return getPublicFileUrl(path);
}

export async function deleteFile(fileIdOrPath: string): Promise<{success: boolean}> {
  let file = fileIdOrPath;
  if (fileIdOrPath.includes('/')) {
     // Ensure we don't strip useful folders if it's not a supabase url
     if (fileIdOrPath.includes('chatgeral/')) {
        file = fileIdOrPath.split('chatgeral/').pop() || fileIdOrPath;
     } else if (fileIdOrPath.startsWith('http')) {
        // Try to extract path from URL
        try {
           const urlObj = new URL(fileIdOrPath);
           file = urlObj.pathname.substring(1);
        } catch(e) {}
     }
  }

  const res = await fetch(`/api/storage/delete`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file })
  });
  
  if (!res.ok) {
     throw new Error("Erro na camada HTTPS ao enviar instrução letal (Delete) ao Backend R2.");
  }
  
  return { success: true };
}

export async function listFiles(bucket = "attachments"): Promise<any[]> {
  const res = await fetch(`/api/storage/file-info`);
  if (!res.ok) return [];
  const data = await res.json();
  const contents = data.contents || [];
  
  return contents.map((obj: any) => ({
    name: obj.Key,
    id: obj.Key,
    updated_at: obj.LastModified,
    created_at: obj.LastModified,
    last_accessed_at: obj.LastModified,
    metadata: {
      size: obj.Size,
      mimetype: obj.Key?.endsWith('.jpg') || obj.Key?.endsWith('.jpeg') ? 'image/jpeg' 
              : obj.Key?.endsWith('.png') ? 'image/png' 
              : obj.Key?.endsWith('.mp4') ? 'video/mp4' : 'application/octet-stream'
    }
  }));
}

export async function mkdirFileApi(path: string): Promise<{success: boolean}> {
  return { success: true };
}
