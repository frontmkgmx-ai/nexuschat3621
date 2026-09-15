import { storage } from '../lib/firebase';
import { ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';

export const getPublicFileUrl = (path: string) => {
  if (!path) return '';
  if (path.startsWith('http') || path.startsWith('blob:')) return path;
  if (!path.includes('firebasestorage')) return `/api/storage/file/${path}`;
  return path;
};

export const sanitizeUrl = (url: string) => url || '';
export const getEmbedFileUrl = (path: string) => path;

const uploadToFirebase = (file: File | Blob, path: string): Promise<any> => {
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
    
    const uniqueId = Date.now().toString(36) + Math.random().toString(36).substring(2);
    const fileName = `${uniqueId}.${ext}`;
    const fullPath = `${path}/${fileName}`;
    
    const storageRef = ref(storage, fullPath);
    const uploadTask = uploadBytesResumable(storageRef, file);
    
    uploadTask.on('state_changed', 
      (snapshot) => {},
      (error) => reject(error),
      async () => {
         const url = await getDownloadURL(uploadTask.snapshot.ref);
         resolve({
             url,
             path: fullPath,
             mimeType: file.type,
             size: file.size,
             success: true,
             file: {
                 url,
                 path: fullPath,
                 mimeType: file.type,
                 size: file.size
             }
         });
      }
    );
  });
};

export const uploadProfilePhoto = async (params: any) => uploadToFirebase(params.file || params, 'profiles');
export const uploadUserBanner = async (params: any) => uploadToFirebase(params.file || params, 'banners');
export const uploadChatImage = async (params: any) => uploadToFirebase(params.file || params, 'chat-images');
export const uploadChatVideo = async (params: any) => uploadToFirebase(params.file || params, 'chat-videos');
export const uploadChatAudio = async (params: any) => uploadToFirebase(params.file || params, 'chat-audio');
export const uploadChatDocument = async (params: any) => uploadToFirebase(params.file || params, 'chat-docs');
export const uploadGroupImage = async (params: any) => uploadToFirebase(params.file || params, 'group-images');
export const uploadGroupVideo = async (params: any) => uploadToFirebase(params.file || params, 'group-videos');
export const uploadGroupAudio = async (params: any) => uploadToFirebase(params.file || params, 'group-audio');
export const uploadGroupDocument = async (params: any) => uploadToFirebase(params.file || params, 'group-docs');
export const uploadGroupAvatar = async (params: any) => uploadToFirebase(params.file || params, 'group-avatars');
export const uploadGroupBanner = async (params: any) => uploadToFirebase(params.file || params, 'group-banners');
export const uploadStatusMedia = async (params: any) => uploadToFirebase(params.file || params, 'status-media');

export const uploadVoiceToStorage = async (...args: any[]) => {
    let file = null;
    if (args[0] instanceof File || args[0] instanceof Blob) file = args[0];
    else if (args[0]?.file instanceof File || args[0]?.file instanceof Blob) file = args[0].file;
    else if (args[1] instanceof File || args[1] instanceof Blob) file = args[1];
    else if (args[2] instanceof File || args[2] instanceof Blob) file = args[2];
    
    if (!file) throw new Error("File not found in arguments");
    return uploadToFirebase(file, 'voice-messages');
};
