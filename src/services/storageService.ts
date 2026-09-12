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

const MYCLOUD_BUCKET_ID = "5500ceff-6d51-4f33-aee4-a07e2725ddaf";

function generateUniquePath(file: File, folder: string = 'files'): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  return `${folder}/${timestamp}-${randomStr}.${ext}`;
}

export function getPublicFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  // Proxy via server to inject X-API-Key natively without exposing to frontend
  return `${CALL_API_BASE}/api/storage/v1/buckets/${MYCLOUD_BUCKET_ID}/objects/${encodeURIComponent(cleanPath)}/stream`;
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
  return { status: "online", storage: "mycloud" };
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
  file?: any; 
}

export async function uploadToR2({ file, folder = 'files', onProgress }: UploadFileParams): Promise<UploadedFileSuccess> {
  const path = generateUniquePath(file, folder);
  const contentType = file.type || 'application/octet-stream';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${CALL_API_BASE}/api/storage/v1/buckets/${MYCLOUD_BUCKET_ID}/objects`;
    xhr.open("POST", url);
    
    const formData = new FormData();
    formData.append("file", file, path);
    
    xhr.upload.onprogress = (event) => {
      if (event.lengthComputable && onProgress) {
        onProgress(Math.round((event.loaded / event.total) * 100));
      }
    };
    
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        let fileId = path;
        try {
           const response = JSON.parse(xhr.responseText);
           fileId = response.id || response.key || response.filename || response.name || path;
        } catch(e) {}
        
        const publicUrl = getPublicFileUrl(fileId);
        
        const result = {
          success: true,
          key: fileId,
          url: publicUrl,
          mimeType: contentType,
          size: file.size,
          storage: "mycloud",
          file: {
            name: file.name,
            mimeType: contentType,
            size: file.size,
            filename: fileId.split('/').pop(),
            path: fileId,
            url: publicUrl,
            createdAt: new Date().toISOString()
          }
        };
        resolve(result);
      } else {
        reject(new Error(`Storage proxy error: ${xhr.statusText}`));
      }
    };
    
    xhr.onerror = () => reject(new Error("Falha na rede ou erro na proxy de upload pro servidor."));
    xhr.send(formData);
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
    mimeType: result.mimeType,
    file: result.file
  };
}

export function getVoiceMediaUrl(path: string): string {
  return getPublicFileUrl(path);
}

export async function deleteFile(fileIdOrPath: string): Promise<{success: boolean}> {
  let file = fileIdOrPath;
  if (fileIdOrPath.startsWith('http')) {
    const match = fileIdOrPath.match(/\/objects\/([^\/]+)\/stream/);
    if (match) {
       file = decodeURIComponent(match[1]);
    } else {
       file = fileIdOrPath.split('/').pop() || fileIdOrPath;
    }
  }

  const res = await fetch(`${CALL_API_BASE}/api/storage/v1/buckets/${MYCLOUD_BUCKET_ID}/objects/${encodeURIComponent(file)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
  });
  
  if (!res.ok) {
     throw new Error("Erro na camada HTTPS ao enviar instrução letal (Delete) ao Backend Proxy.");
  }
  
  return { success: true };
}

export async function listFiles(bucket = "attachments"): Promise<any[]> {
  const res = await fetch(`${CALL_API_BASE}/api/storage/v1/buckets/${MYCLOUD_BUCKET_ID}/objects`);
  if (!res.ok) return [];
  const data = await res.json();
  const contents = data.objects || data.contents || data || [];
  
  return contents.map((obj: any) => ({
    name: obj.name || obj.id || obj.Key,
    id: obj.id || obj.Key || obj.name,
    updated_at: obj.updated_at || obj.LastModified,
    created_at: obj.created_at || obj.LastModified,
    last_accessed_at: obj.last_accessed_at || obj.LastModified,
    metadata: {
      size: obj.size || obj.Size,
      mimetype: obj.mimetype || obj.metadata?.mimetype || 'application/octet-stream'
    }
  }));
}

export async function mkdirFileApi(path: string): Promise<{success: boolean}> {
  return { success: true };
}

export const uploadToMyCloud = uploadToR2;
export { MYCLOUD_BUCKET_ID };
