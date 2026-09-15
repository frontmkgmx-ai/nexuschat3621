/**
 * Audio Recording, Storage and Quality Policy Types
 * Etapa 2 - Melhorar qualidade de áudio e mensagens de voz
 */

export interface AudioRecordingPolicy {
  channelCount: number;
  sampleRate: number;
  sampleSize: number;
  echoCancellation: boolean;
  noiseSuppression: boolean;
  autoGainControl: boolean;
  targetBitrate: number;
  qualityMode: 'voice-speech' | 'high-quality';
}

export const DEFAULT_AUDIO_RECORDING_POLICY: AudioRecordingPolicy = {
  channelCount: 1, // Mono quando suportado
  sampleRate: 48000, // Alvo de 48 kHz (ou 44.1 kHz fallback)
  sampleSize: 16,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true, // Voz comum
  targetBitrate: 64000, // 64 kbps padrão para fala
  qualityMode: 'voice-speech'
};

export const HIGH_QUALITY_AUDIO_POLICY: AudioRecordingPolicy = {
  channelCount: 1,
  sampleRate: 48000,
  sampleSize: 16,
  echoCancellation: true,
  noiseSuppression: true,
  autoGainControl: true,
  targetBitrate: 128000, // 128 kbps modo maior qualidade
  qualityMode: 'high-quality'
};

export interface AudioConstraintsConfig {
  audio: MediaTrackConstraints;
}

export const PREFERRED_AUDIO_MIME_TYPES = [
  'audio/webm;codecs=opus',
  'audio/ogg;codecs=opus',
  'audio/mp4',
  'audio/aac'
] as const;

export interface AudioMetadata {
  durationSeconds: number;
  durationSource: 'decoded-metadata' | 'capture-clock';
  mimeType: string;
  codec: string;
  sizeBytes: number;
  sampleRate?: number;
  channels?: number;
  bitrate?: number;
}

export interface AudioLimits {
  minDurationSeconds: number; // Ex: 0.3s
  maxDurationSeconds: number; // Ex: 600s (10 min)
  maxVoiceSizeBytes: number;  // Ex: 25MB
  maxAttachmentSizeBytes: number; // Ex: 100MB
  allowedMimeTypes: readonly string[];
  allowedExtensions: readonly string[];
}

export const DEFAULT_AUDIO_LIMITS: AudioLimits = {
  minDurationSeconds: 0.3,
  maxDurationSeconds: 600, // 10 minutos
  maxVoiceSizeBytes: 26214400, // 25 MB
  maxAttachmentSizeBytes: 104857600, // 100 MB
  allowedMimeTypes: [
    'audio/webm',
    'audio/webm;codecs=opus',
    'audio/ogg',
    'audio/ogg;codecs=opus',
    'audio/mp4',
    'audio/aac',
    'audio/mpeg',
    'audio/mp3',
    'audio/wav',
    'audio/x-m4a',
    'audio/m4a'
  ],
  allowedExtensions: ['webm', 'ogg', 'mp4', 'm4a', 'aac', 'mp3', 'wav']
};

export interface NormalizedStorageUploadResponse {
  success: boolean;
  fileId: string;
  name: string;
  mimeType: string;
  sizeBytes: number;
  durationSeconds?: number;
  durationSource?: 'decoded-metadata' | 'capture-clock';
  streamUrl: string;
  storage: 'mycloud';
}
