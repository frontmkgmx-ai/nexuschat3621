import { CALL_API_BASE } from './callApi';

export const PUBLIC_FILE_API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hofehxzukldxdewgntof.supabase.co";
const BUCKET_NAME = "chatgeral";

function generateUniquePath(file: File) {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  // remove whitespace and special characters from original name, just keep extension safe
  const ext = file.name.split('.').pop() || '';
  return `${timestamp}-${randomStr}.${ext}`;
}

// Função para obter URL pública de um arquivo para ser exibida nas tags <img>, <video>, etc.
export function getPublicFileUrl(path: string) {
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Extrai apenas o nome do arquivo se vier com caminho junto
  let file = cleanPath;
  if (cleanPath.includes('/')) {
     file = cleanPath.split('/').slice(1).join('/');
  }

  return `${PUBLIC_FILE_API_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file}`;
}

// Função para obter URL de um video pelo player de iFrame
export function getEmbedFileUrl(path: string) {
  return getPublicFileUrl(path);
}

export async function getSysInfo() {
  return { status: "online", storage: "supabase-s3" };
}

export function getDownloadFileUrl(path: string) {
  return getPublicFileUrl(path);
}

const SECRET_KEY = "chat-secret-key-123";

function encryptUrlSync(text: string) {
    let result = '';
    for (let i = 0; i < text.length; i++) {
        result += String.fromCharCode(text.charCodeAt(i) ^ SECRET_KEY.charCodeAt(i % SECRET_KEY.length));
    }
    return btoa(result).replace(/\+/g, '-').replace(/\//g, '_').replace(/=/g, '');
}

export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  if (url.startsWith('/api/media/')) return url;
  if (url.startsWith('data:')) return url; // Don't touch data URIs
  // Obfuscate and use backend proxy
  return `/api/media/${encryptUrlSync(url)}`;
}

interface UploadFileParams {
  file: File;
  bucket?: string; // we ignore bucket now and use BUCKET_NAME
  onProgress?: (progress: number) => void;
}

export async function uploadFileToBucket({ file, bucket, onProgress }: UploadFileParams) {
  try {
    const path = generateUniquePath(file);
    
    // Obter presigned URL do backend
    const res = await fetch(`${CALL_API_BASE}/api/storage/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: path, contentType: file.type })
    });
    if (!res.ok) throw new Error("Falha ao obter URL de upload");
    const { url } = await res.json();

    // Fazer upload usando XMLHttpRequest para ter progresso
    await new Promise((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", file.type);
        
        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / Math.max(e.total, 1)) * 100));
                }
            };
        }
        
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve(null);
            } else {
                reject(new Error("Erro no upload do arquivo"));
            }
        };
        xhr.onerror = () => reject(new Error("Erro de rede ao upar arquivo"));
        xhr.send(file);
    });

    const publicUrl = getPublicFileUrl(path);

    const fileData = {
      name: file.name,
      mimeType: file.type,
      size: file.size,
      filename: path,
      path: path,
      url: publicUrl,
      createdAt: new Date().toISOString()
    };

    return { file: fileData };
  } catch (err: any) {
    throw new Error(err.message || "Network error during upload");
  }
}

export async function uploadProfilePhoto({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadUserPhoto({ userId, file, onProgress }: { userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadChatImage({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadChatVideo({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadChatAudio({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadChatDocument({ chatId, userId, messageId, file, onProgress }: { chatId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadGroupImage({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadGroupVideo({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadGroupAudio({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadGroupDocument({ groupId, userId, messageId, file, onProgress }: { groupId: string, userId: string, messageId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

export async function uploadGroupAvatar({ groupId, userId, file, onProgress }: { groupId: string, userId: string, file: File, onProgress?: (p: number) => void }) {
  return uploadFileToBucket({ file, onProgress });
}

// Função de listagem do bucket da API
export async function listFiles(bucket = "attachments") {
  const res = await fetch(`${CALL_API_BASE}/api/storage/list`);
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

// Manter essa função vazia para não quebrar referências
export async function mkdirFileApi(path: string) {
  return { success: true };
}

export function getVoiceMediaUrl(path: string) {
  // TODO: Em um bucket privado, atualizar futuramente para usar createSignedUrl do Supabase.
  // Atualmente o bucket é público, então usamos a url pública direta.
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  let file = cleanPath;
  if (cleanPath.startsWith(BUCKET_NAME + '/')) {
    file = cleanPath.substring(BUCKET_NAME.length + 1);
  }
  
  return `${PUBLIC_FILE_API_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file}`;
}

export async function uploadVoiceToStorage(conversationId: string, messageId: string, blob: Blob, onProgress?: (p: number) => void) {
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  const fileType = blob.type || 'audio/webm;codecs=opus';
  let ext = 'webm';
  if (fileType.includes('mp4')) ext = 'm4a';
  else if (fileType.includes('aac')) ext = 'aac';
  else if (fileType.includes('mpeg')) ext = 'mp3';

  // Extrutura pedida: voice-messages/{conversationId}/{messageId}/voice-{uuid}.ext
  const path = `voice-messages/${conversationId}/${messageId}/voice-${uuid}.${ext}`;
  
  const file = new File([blob], `voice-${uuid}.${ext}`, { type: fileType });
  
  const contentTypeStr = file.type.split(';')[0];
  
  // Utilizando o backend existente de storage presign
  const res = await fetch(`${CALL_API_BASE}/api/storage/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: path, contentType: contentTypeStr })
  });
  if (!res.ok) throw new Error("Falha ao obter URL de upload");
  const { url } = await res.json();

  await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      xhr.setRequestHeader("Content-Type", contentTypeStr);
      xhr.setRequestHeader("Cache-Control", "public, max-age=31536000"); // cache longo
      
      if (onProgress) {
          xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                  onProgress(Math.round((e.loaded / Math.max(e.total, 1)) * 100));
              }
          };
      }
      
      xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
              resolve(null);
          } else {
              reject(new Error("Erro no upload do arquivo"));
          }
      };
      xhr.onerror = () => reject(new Error("Erro de rede ao upar arquivo"));
      xhr.send(file);
  });

  const publicUrl = getVoiceMediaUrl(path);

  return { path, url: publicUrl, size: blob.size, mimeType: file.type };
}

// Remover um arquivo do bucket especificado
export async function deleteFile(fileIdOrPath: string) {
  let file = fileIdOrPath;
  if (fileIdOrPath.includes('/')) {
     file = fileIdOrPath.split('/').slice(1).join('/');
  }

  const res = await fetch(`${CALL_API_BASE}/api/storage/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file })
  });
  
  if (!res.ok) throw new Error("Falha ao deletar arquivo");
  return { success: true };
}

