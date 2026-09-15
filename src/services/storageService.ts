export const sanitizeUrl = (url: string) => url;
export const getEmbedFileUrl = (path: string) => path;
export const getPublicFileUrl = (path: string) => path;

const dummyFile = (file: any) => ({
  url: file ? URL.createObjectURL(file) : '',
  path: 'mock-path',
  mimeType: file?.type || 'application/octet-stream',
  size: file?.size || 0,
  createdAt: new Date().toISOString(),
  success: true,
  file: {
    url: file ? URL.createObjectURL(file) : '',
    path: 'mock-path',
    mimeType: file?.type || 'application/octet-stream',
    size: file?.size || 0,
    createdAt: new Date().toISOString(),
  }
});

export const uploadProfilePhoto = async (params: any) => dummyFile(params.file);
export const uploadUserBanner = async (params: any) => dummyFile(params.file);
export const uploadGroupAvatar = async (params: any) => dummyFile(params.file);
export const uploadGroupBanner = async (params: any) => dummyFile(params.file);

export const uploadChatImage = async (params: any) => dummyFile(params?.file || params);
export const uploadChatVideo = async (params: any) => dummyFile(params?.file || params);
export const uploadChatAudio = async (params: any) => dummyFile(params?.file || params);
export const uploadChatDocument = async (params: any) => dummyFile(params?.file || params);

export const uploadGroupImage = async (params: any) => dummyFile(params?.file || params);
export const uploadGroupVideo = async (params: any) => dummyFile(params?.file || params);
export const uploadGroupAudio = async (params: any) => dummyFile(params?.file || params);
export const uploadGroupDocument = async (params: any) => dummyFile(params?.file || params);
export const uploadVoiceToStorage = async (...args: any[]) => dummyFile(args[0]?.file || args[0] || args[1] || args[2] || args[3]);

export const uploadStatusMedia = async (params: any) => dummyFile(params?.file || params);

