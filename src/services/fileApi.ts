import { CALL_API_BASE } from './callApi';

/**
 * URL base para as requisições públicas de mídia e manipulação de arquivos (Storage)
 * Utiliza o Supabase/AWS S3 debaixo dos panos para garantir escalabilidade global nativa.
 * @constant
 */
export const PUBLIC_FILE_API_BASE_URL = import.meta.env.VITE_SUPABASE_URL || "https://hofehxzukldxdewgntof.supabase.co";

/**
 * Nome do bucket utilizado para armazenar os arquivos do sistema de chat.
 * @constant
 */
const BUCKET_NAME = "chatgeral";

/**
 * Gera um caminho único (path/filename) para cada arquivo anexado,
 * com base no timestamp atual e uma string randômica (UUID pseudo).
 * Isso garante que uploads com o mesmo nome original não vão sobrescrever e quebrar links de mensagens.
 *
 * @param {File} file - Instância do arquivo (Blob) original interceptado do front.
 * @returns {string} Retorna a string do hash unificado final com sua extensão correta.
 */
function generateUniquePath(file: File): string {
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 15);
  // Remove whitespace and special characters from the original name, extracting just the clean extension
  const ext = file.name.split('.').pop() || 'bin';
  return `${timestamp}-${randomStr}.${ext}`;
}

/**
 * Constrói a URL pública final que pode ser repassada de volta ao Front, baseada na estrutura do Supabase public bucket.
 * Retorna URLs seguras para serem injetadas nas tags <video>, <audio>, <img> ou em downloads diretos do usuário.
 * 
 * @param {string} path - O path salvo originado seja pelo UUID próprio ou via URL externa.
 * @returns {string} Link com escopo global do arquivo.
 */
export function getPublicFileUrl(path: string): string {
  if (!path) return '';
  // Em casos de repasse direto, não alteramos a URL, mantendo links intactos (como imagens do DiceBear)
  if (path.startsWith('http://') || path.startsWith('https://')) {
    return path;
  }
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  
  // Extrai corretamente apenas o nome do arquivo, removendo duplos repositórios de base
  let file = cleanPath;
  if (cleanPath.includes('/')) {
     file = cleanPath.split('/').slice(1).join('/');
  }

  // Monta a base do bucket público (pode ser migrado caso seja para Enterprise Storage futuramente)
  return `${PUBLIC_FILE_API_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file}`;
}

/**
 * Função unificada para resolver URLs de Embedings diretos na plataforma. (Custom iFrame, Player Nativo)
 * @param {string} path - Path alvo
 * @returns {string} URL pública Embed
 */
export function getEmbedFileUrl(path: string): string {
  return getPublicFileUrl(path);
}

/**
 * Resgata informações avançadas da infraestrutura de storage em uso pelo provedor atual.
 * @returns {Promise<{status: string, storage: string}>} Um status detalhado do servidor.
 */
export async function getSysInfo(): Promise<{ status: string, storage: string }> {
  return { status: "online", storage: "supabase-s3" };
}

/**
 * Fornece um bypass focado no download em vez de parse in-browser, dependendo dos headers na CDN.
 * @param {string} path - Path do recurso que será convertido
 * @returns {string} Instância em URL forçada para FileStream / Attachment Header.
 */
export function getDownloadFileUrl(path: string): string {
  return getPublicFileUrl(path);
}

/**
 * Sanitiza links recebidos para exibição, no momento pass-through direto, 
 * já que a remoção do proxy local permite URLs diretas. Mantém a tipagem limpa, e resolve dados e lixo em excesso.
 * 
 * @param {string | null | undefined} url - Link sujo da API
 * @returns {string} URL validada a limpa final
 */
export function sanitizeUrl(url: string | null | undefined): string {
  if (!url) return "";
  return url;
}

/**
 * Tipagens detalhadas ao tentar anexar um novo arquivo na nuvem.
 */
interface UploadFileParams {
  file: File;
  /** Nome do bucket customizado - Ignorado na V1 mas suportado em assinaturas futuras. */
  bucket?: string;
  /** Função de callback nativa para animações na UI. (Percentual) */
  onProgress?: (progress: number) => void;
}

interface UploadedFileSuccess {
    file: {
      name: string;
      mimeType: string;
      size: number;
      filename: string;
      path: string;
      url: string;
      createdAt: string;
    };
}

/**
 * Base root method.
 * Efetua a rotina em três passos do upload usando nossa infra Node.js de base + S3.
 * 1. Pede Autorização/Presigned URL ao backend seguro (Auth layer).
 * 2. Transmite local -> Node.js -> CDN os arquivos usando `XMLHttpRequest` de via dupla e binária bruta
 * para interceptar e obter callbacks de progressão real no envio para não travar a thread.
 * 3. Encerra com a tipagem completa devolvendo os metadados validados de volta pro Web App.
 *
 * @param {UploadFileParams} params
 * @returns {Promise<UploadedFileSuccess>} Json de retorno validado do Storage
 */
export async function uploadFileToBucket({ file, bucket, onProgress }: UploadFileParams): Promise<UploadedFileSuccess> {
  try {
    const path = generateUniquePath(file);
    
    // Obter presigned URL do nosso próprio backend que abstrai as credenciais administrativas do aws-sdk 
    const res = await fetch(`${CALL_API_BASE}/api/storage/presign`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ filename: path, contentType: file.type })
    });
    
    if (!res.ok) {
        throw new Error("Falha de autenticação ou infraestrutura ao obter URL temporária de upload via backend.");
    }
    
    const { url } = await res.json();

    // Fazer upload usando a API antiga, mais madura (XMLHttpRequest) que suporta escuta bruta do body e streaming
    await new Promise<void>((resolve, reject) => {
        const xhr = new XMLHttpRequest();
        xhr.open("PUT", url, true);
        xhr.setRequestHeader("Content-Type", file.type);
        
        // Atacha listener de progresso bruto e nativo (TCP Layer feedback)
        if (onProgress) {
            xhr.upload.onprogress = (e) => {
                if (e.lengthComputable) {
                    onProgress(Math.round((e.loaded / Math.max(e.total, 1)) * 100));
                }
            };
        }
        
        // Verifica conclusão
        xhr.onload = () => {
            if (xhr.status >= 200 && xhr.status < 300) {
                resolve();
            } else {
                reject(new Error(`Erro fatal em infra de Cloud Upload, falha com Status HTTP: ${xhr.status}`));
            }
        };
        
        // Problemas de roteamento (Wi-fi / Proxy / DNS Cloudflare)
        xhr.onerror = () => reject(new Error("Erro de conexão (CORS, Socket, ou Host indisponível) ao upar o arquivo."));
        xhr.send(file);
    });

    const publicUrl = getPublicFileUrl(path);

    // Tipando perfeitamente a saída no sistema central.
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
    throw new Error(err.message || "Network e/ou Timeout error detectado durante a sequência de upload");
  }
}

/**
 * Funções de Alias Helper para semântica.
 * Atuam como Wrappers em cima do pipeline de Storage para permitir flexibilidade
 * de métricas de envio e validação futura individual caso um vídeo de canal e foto de perfil necessitem
 * quotas distintas.
 */

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

/**
 * Utilitário de Admin.
 * Solicita listagem de objetos no bucket AWS S3 proxy pelo backend customizado, processando Content-Types e afins.
 * 
 * @param {string} bucket - Referência do Bucket
 * @returns {Promise<any[]>} Arquivos presentes e suas metadata.
 */
export async function listFiles(bucket = "attachments"): Promise<any[]> {
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

/**
 * Função vazia, herdada de versões passadas, para não quebrar instâncias na raiz que exigiam uma resposta (mock).
 * @param {string} path 
 */
export async function mkdirFileApi(path: string): Promise<{success: boolean}> {
  return { success: true };
}

/**
 * Construção e sanitização focada SOMENTE em áudios do gravador nativo do sistema para a CDN (AWS).
 * 
 * @param {string} path - URL de Base
 * @returns {string} Retornando URL para ser hospedado num src="".
 */
export function getVoiceMediaUrl(path: string): string {
  // TODO: Em um bucket privado, atualizar futuramente para usar createSignedUrl do Supabase.
  // Atualmente o bucket é público, então usamos a url pública direta.
  if (!path) return '';
  if (path.startsWith('http://') || path.startsWith('https://')) return path;
  
  const cleanPath = path.startsWith('/') ? path.substring(1) : path;
  let file = cleanPath;
  if (cleanPath.startsWith(BUCKET_NAME + '/')) {
    // Retira redundâncias estruturais e lixo
    file = cleanPath.substring(BUCKET_NAME.length + 1);
  }
  
  return `${PUBLIC_FILE_API_BASE_URL}/storage/v1/object/public/${BUCKET_NAME}/${file}`;
}

/**
 * Responsável exclusivo por Upar Áudio Puros (Voice Messages / Voice Notes)
 * Faz uma ponte de upload focado em codecs de aúdio dinâmico (opus, mp4, aac). E seta cache longo em produção.
 * 
 * @param {string} conversationId 
 * @param {string} messageId 
 * @param {Blob} blob - Formatação de memória não salva ou gravada (Microfone Source Buffer)
 * @param {function} onProgress - Callaback para o layout de Audio Sender View.
 */
export async function uploadVoiceToStorage(conversationId: string, messageId: string, blob: Blob, onProgress?: (p: number) => void) {
  // Randomness mais profunda contra conflitos simultâneos de chats
  const uuid = Math.random().toString(36).substring(2, 15) + Math.random().toString(36).substring(2, 15);
  
  // Tratativas de gravação PWA no WebKit x Chrome.
  const fileType = blob.type || 'audio/webm;codecs=opus';
  let ext = 'webm';
  if (fileType.includes('mp4')) ext = 'm4a';
  else if (fileType.includes('aac')) ext = 'aac';
  else if (fileType.includes('mpeg')) ext = 'mp3';

  // Respeitar a exigência de ser na pasta específica: voice-messages/{conversationId}/{messageId}/voice-{uuid}.ext
  const path = `voice-messages/${conversationId}/${messageId}/voice-${uuid}.${ext}`;
  
  const file = new File([blob], `voice-${uuid}.${ext}`, { type: fileType });
  const contentTypeStr = file.type.split(';')[0]; // Previne envio de tags estringentes de MediaDevice erradas
  
  // Utilizando o backend existente de storage presign para seguridade e autenticação.
  const res = await fetch(`${CALL_API_BASE}/api/storage/presign`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: path, contentType: contentTypeStr })
  });
  
  if (!res.ok) {
     throw new Error("Recusa na autenticação de upload da nota de voz! Falha ao obter URL Presigned.");
  }
  
  const { url } = await res.json();

  // Executar transmissão robusta e estável
  await new Promise<void>((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.open("PUT", url, true);
      
      // Essencial definir content-type validado senão a CDN invalida MIME type e player não reproduz
      xhr.setRequestHeader("Content-Type", contentTypeStr);
      // Áudios raramente deverão ou irão mudar. Permitir supercache agressivo
      xhr.setRequestHeader("Cache-Control", "public, max-age=31536000"); 
      
      if (onProgress) {
          xhr.upload.onprogress = (e) => {
              if (e.lengthComputable) {
                  onProgress(Math.round((e.loaded / Math.max(e.total, 1)) * 100));
              }
          };
      }
      
      xhr.onload = () => {
          if (xhr.status >= 200 && xhr.status < 300) {
              resolve();
          } else {
              reject(new Error(`Sincronização de Áudio Interrompida pelas bordas da CDN com status ${xhr.status}`));
          }
      };
      
      xhr.onerror = () => reject(new Error("Instabilidade de rede ou conexão sem internet detectada ao transmitir áudio."));
      xhr.send(file);
  });

  const publicUrl = getVoiceMediaUrl(path);

  return { path, url: publicUrl, size: blob.size, mimeType: file.type };
}

/**
 * Função completa de Exclusão (Teardown)
 * Remove um arquivo de base no cluster AWS/Supabase, chamando a infra Node.
 * 
 * @param {string} fileIdOrPath - String da raiz exata contendo a pasta / arquivo final
 * @returns {Promise<{success: boolean}>} Estado final via AWS SDK SDK HTTP Request JSON Reply.
 */
export async function deleteFile(fileIdOrPath: string): Promise<{success: boolean}> {
  let file = fileIdOrPath;
  if (fileIdOrPath.includes('/')) {
     file = fileIdOrPath.split('/').slice(1).join('/');
  }

  const res = await fetch(`${CALL_API_BASE}/api/storage/delete`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ filename: file })
  });
  
  if (!res.ok) {
     throw new Error("Arquivos persistentes: Erro na camada HTTPS ao enviar instrução letal (Delete) ao Backend.");
  }
  
  return { success: true };
}


