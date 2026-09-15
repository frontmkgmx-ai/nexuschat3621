/**
 * Audio Recording, Codec Detection and Duration Measurement Utilities
 * Etapa 2 - Sistema de gravação e medição determinística de áudio
 */

import {
  DEFAULT_AUDIO_RECORDING_POLICY,
  HIGH_QUALITY_AUDIO_POLICY,
  PREFERRED_AUDIO_MIME_TYPES,
  AudioMetadata,
  DEFAULT_AUDIO_LIMITS
} from '../types/audio';

export interface RecorderSelection {
  mimeType: string;
  codec: string;
  container: string;
  extension: string;
}

/**
 * Detecta o melhor MIME suportado pelo navegador em ordem de preferência
 */
export function getSupportedAudioMimeType(): RecorderSelection {
  if (typeof window === 'undefined' || typeof MediaRecorder === 'undefined') {
    return {
      mimeType: 'audio/webm;codecs=opus',
      codec: 'opus',
      container: 'webm',
      extension: 'webm'
    };
  }

  for (const mime of PREFERRED_AUDIO_MIME_TYPES) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return parseMimeDetails(mime);
    }
  }

  // Fallbacks genéricos
  const fallbacks = ['audio/webm', 'audio/ogg', 'audio/mp4', 'audio/wav'];
  for (const mime of fallbacks) {
    if (MediaRecorder.isTypeSupported(mime)) {
      return parseMimeDetails(mime);
    }
  }

  // Fallback se nada anunciado
  return {
    mimeType: '',
    codec: 'unknown',
    container: 'unknown',
    extension: 'bin'
  };
}

export function parseMimeDetails(mime: string): RecorderSelection {
  const clean = mime.toLowerCase();
  let codec = 'unknown';
  let container = 'bin';
  let extension = 'bin';

  if (clean.includes('webm')) {
    container = 'webm';
    extension = 'webm';
    codec = clean.includes('opus') ? 'opus' : 'vorbis';
  } else if (clean.includes('ogg')) {
    container = 'ogg';
    extension = 'ogg';
    codec = clean.includes('opus') ? 'opus' : 'vorbis';
  } else if (clean.includes('mp4') || clean.includes('m4a')) {
    container = 'mp4';
    extension = 'm4a';
    codec = 'aac';
  } else if (clean.includes('aac')) {
    container = 'aac';
    extension = 'aac';
    codec = 'aac';
  } else if (clean.includes('wav')) {
    container = 'wav';
    extension = 'wav';
    codec = 'pcm';
  } else if (clean.includes('mpeg') || clean.includes('mp3')) {
    container = 'mp3';
    extension = 'mp3';
    codec = 'mp3';
  }

  return {
    mimeType: mime,
    codec,
    container,
    extension
  };
}

/**
 * Retorna constraints de áudio defensivas com mono, 48kHz, echoCancellation, etc.
 */
export function getVoiceMediaConstraints(): MediaTrackConstraints {
  return {
    channelCount: { ideal: DEFAULT_AUDIO_RECORDING_POLICY.channelCount },
    sampleRate: { ideal: DEFAULT_AUDIO_RECORDING_POLICY.sampleRate },
    sampleSize: { ideal: DEFAULT_AUDIO_RECORDING_POLICY.sampleSize },
    echoCancellation: { ideal: DEFAULT_AUDIO_RECORDING_POLICY.echoCancellation },
    noiseSuppression: { ideal: DEFAULT_AUDIO_RECORDING_POLICY.noiseSuppression },
    autoGainControl: { ideal: DEFAULT_AUDIO_RECORDING_POLICY.autoGainControl }
  };
}

/**
 * Registra configurações do stream para diagnóstico de desenvolvimento
 */
export function logNonSensitiveAudioTrackDiagnostics(stream: MediaStream) {
  try {
    const tracks = stream.getAudioTracks();
    tracks.forEach((track, i) => {
      const settings = track.getSettings ? track.getSettings() : {};
      const constraints = track.getConstraints ? track.getConstraints() : {};
      if (process.env.NODE_ENV !== 'production') {
        console.debug(`[Audio Track ${i}] Non-sensitive diagnostics:`, {
          sampleRate: settings.sampleRate,
          channelCount: settings.channelCount,
          echoCancellation: settings.echoCancellation,
          autoGainControl: settings.autoGainControl,
          noiseSuppression: settings.noiseSuppression,
          label: track.label ? track.label.substring(0, 20) : 'unknown',
          constraints
        });
      }
    });
  } catch (e) {
    // Silently ignore diagnostic errors
  }
}

/**
 * Mede a duração decodificada real do Blob através de um elemento <audio> temporário
 * com fallback para o relógio de captura monotônico
 */
export async function getAccurateAudioDuration(
  blob: Blob,
  captureClockSeconds: number,
  timeoutMs: number = 3000
): Promise<{ durationSeconds: number; durationSource: 'decoded-metadata' | 'capture-clock' }> {
  if (typeof window === 'undefined' || typeof document === 'undefined') {
    return {
      durationSeconds: Math.max(0.3, captureClockSeconds),
      durationSource: 'capture-clock'
    };
  }

  let objectUrl = '';
  try {
    objectUrl = URL.createObjectURL(blob);
    const audio = document.createElement('audio');
    audio.preload = 'metadata';
    audio.src = objectUrl;

    const decodedDuration = await new Promise<number>((resolve, reject) => {
      const timeout = setTimeout(() => {
        cleanup();
        reject(new Error('Audio metadata decode timeout'));
      }, timeoutMs);

      const onLoadedMetadata = () => {
        const d = audio.duration;
        cleanup();
        if (typeof d === 'number' && !isNaN(d) && isFinite(d) && d > 0) {
          resolve(d);
        } else {
          reject(new Error('Invalid duration in metadata'));
        }
      };

      const onError = () => {
        cleanup();
        reject(new Error('Audio decode error'));
      };

      function cleanup() {
        clearTimeout(timeout);
        audio.removeEventListener('loadedmetadata', onLoadedMetadata);
        audio.removeEventListener('error', onError);
      }

      audio.addEventListener('loadedmetadata', onLoadedMetadata);
      audio.addEventListener('error', onError);
    });

    return {
      durationSeconds: Math.round(decodedDuration * 100) / 100,
      durationSource: 'decoded-metadata'
    };
  } catch (err) {
    // Fallback gracioso para relógio monotônico de captura
    return {
      durationSeconds: Math.max(DEFAULT_AUDIO_LIMITS.minDurationSeconds, Math.round(captureClockSeconds * 100) / 100),
      durationSource: 'capture-clock'
    };
  } finally {
    if (objectUrl) {
      try {
        URL.revokeObjectURL(objectUrl);
      } catch (e) {}
    }
  }
}
