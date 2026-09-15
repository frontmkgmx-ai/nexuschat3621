import { CALL_API_BASE } from './callApi';

const STREAMX_BUCKET_ID = import.meta.env.VITE_STREAMX_BUCKET_ID || "d36cc6d9-ad6d-4243-bd39-0543b4bea4be";
// Fallback para manter componentes antigos funcionando
const MYCLOUD_BUCKET_ID = STREAMX_BUCKET_ID;

function generateUniquePath(file: File, folder: string = 'files'): string {
  const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const ext = file.name.split('.').pop()?.toLowerCase() || 'bin';
  return `${folder}/${uuid}.${ext}`;
}

export function getPublicFileUrl(path: string): string {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Verifica se o caminho já é uma URL legada antiga com o bucket antigo
  if (cleanPath.includes('/objects/') && cleanPath.includes('5500ceff-6d51-4f33-aee4-a07e2725ddaf')) {
     return `${CALL_API_BASE}/api/storage/v1/buckets/5500ceff-6d51-4f33-aee4-a07e2725ddaf/objects/${encodeURIComponent(cleanPath.split('/objects/')[1]?.replace('/stream', '') || '')}/stream`;
  }
  
  return `${CALL_API_BASE}/api/storage/v1/buckets/${STREAMX_BUCKET_ID}/objects/${encodeURIComponent(cleanPath)}/stream`;
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
  return { status: "online", storage: "streamx" };
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

export async function uploadMedia({ file, folder = 'files', onProgress }: UploadFileParams): Promise<UploadedFileSuccess> {
  const path = generateUniquePath(file, folder);
  const contentType = file.type || 'application/octet-stream';

  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const url = `${CALL_API_BASE}/api/storage/v1/buckets/${STREAMX_BUCKET_ID}/objects`;
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
          storage: "streamx",
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

// Compatibilidade legada
export const uploadToR2 = uploadMedia;
export const uploadToMyCloud = uploadMedia;

export async function uploadProfilePhoto({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  const isGif = file.type === 'image/gif';
  const folder = isGif ? `users/${userId}/avatar-gif` : `users/${userId}/avatar`;
  return uploadMedia({ file, folder, onProgress });
}

export async function uploadUserBanner({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `users/${userId}/banner`, onProgress });
}

export async function uploadUserPhoto({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadProfilePhoto({ userId, file, onProgress });
}

export async function uploadChatImage({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${chatId}/${messageId || Date.now()}/images`, onProgress });
}

export async function uploadChatVideo({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${chatId}/${messageId || Date.now()}/videos`, onProgress });
}

export async function uploadChatAudio({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${chatId}/${messageId || Date.now()}/audio`, onProgress });
}

export async function uploadChatDocument({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${chatId}/${messageId || Date.now()}/documents`, onProgress });
}

export async function uploadGroupImage({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${groupId}/${messageId || Date.now()}/images`, onProgress });
}

export async function uploadGroupVideo({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${groupId}/${messageId || Date.now()}/videos`, onProgress });
}

export async function uploadGroupAudio({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${groupId}/${messageId || Date.now()}/audio`, onProgress });
}

export async function uploadGroupDocument({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `chats/${groupId}/${messageId || Date.now()}/documents`, onProgress });
}

export async function uploadGroupAvatar({ groupId, userId, file, onProgress }: { groupId: string, userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `communities/${groupId}/avatar`, onProgress });
}

export async function uploadGroupBanner({ groupId, userId, file, onProgress }: { groupId: string, userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `communities/${groupId}/banner`, onProgress });
}

export async function uploadStatusMedia({ userId, statusId, file, onProgress }: { userId: string, statusId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadMedia({ file, folder: `statuses/${userId}/${statusId}`, onProgress });
}

export async function uploadVoiceToStorage(conversationId: string, messageId: string, blob: Blob, onProgress?: (p: number) => void) {
  const uuid = crypto.randomUUID ? crypto.randomUUID() : Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  const fileType = blob.type || 'audio/webm;codecs=opus';
  let ext = 'webm';
  if (fileType.includes('mp4')) ext = 'm4a';
  else if (fileType.includes('aac')) ext = 'aac';
  else if (fileType.includes('mpeg')) ext = 'mp3';
  
  const file = new File([blob], `voice-${uuid}.${ext}`, { type: fileType });
  const result = await uploadMedia({ file, folder: `chats/${conversationId}/${messageId || Date.now()}/audio`, onProgress });
  
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
  let bucketId = STREAMX_BUCKET_ID;
  
  if (fileIdOrPath.startsWith('http')) {
    const match = fileIdOrPath.match(/\/buckets\/([^\/]+)\/objects\/([^\/]+)\/stream/);
    if (match) {
       bucketId = match[1];
       file = decodeURIComponent(match[2]);
    } else {
       const legacyMatch = fileIdOrPath.match(/\/objects\/([^\/]+)\/stream/);
       if (legacyMatch) {
         file = decodeURIComponent(legacyMatch[1]);
       } else {
         file = fileIdOrPath.split('/').pop() || fileIdOrPath;
       }
    }
  }
  
  const res = await fetch(`${CALL_API_BASE}/api/storage/v1/buckets/${bucketId}/objects/${encodeURIComponent(file)}`, {
      method: "DELETE",
      headers: { "Content-Type": "application/json" }
  });
  
  if (!res.ok) {
     throw new Error("Erro na camada HTTPS ao enviar instrução letal (Delete) ao Backend Proxy.");
  }
  
  return { success: true };
}

export async function listFiles(bucket = "attachments"): Promise<any[]> {
  const res = await fetch(`${CALL_API_BASE}/api/storage/v1/buckets/${STREAMX_BUCKET_ID}/objects`);
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

export { STREAMX_BUCKET_ID as MYCLOUD_BUCKET_ID, STREAMX_BUCKET_ID };
