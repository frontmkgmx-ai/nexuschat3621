/**
 * Server Media and Audio Validator
 * Etapa 2 - Backend Audio Integrity, Size & MIME Verification
 */

import { Request, Response, NextFunction } from 'express';

// Limites rígidos de áudio
export const AUDIO_LIMITS = {
  maxVoiceSizeBytes: 26214400, // 25MB
  maxAttachmentSizeBytes: 104857600, // 100MB
  allowedMimePrefixes: ['audio/'],
  allowedContainers: ['webm', 'ogg', 'mp4', 'm4a', 'aac', 'mpeg', 'mp3', 'wav', 'octet-stream']
};

/**
 * Validação de integridade e rejeição de path traversal
 */
export function validateStoragePath(targetPath: string): { valid: boolean; reason?: string } {
  if (!targetPath || typeof targetPath !== 'string') {
    return { valid: false, reason: 'Empty or invalid path' };
  }

  // Rejeitar path traversal
  if (targetPath.includes('..') || targetPath.includes('\\') || targetPath.startsWith('/')) {
    return { valid: false, reason: 'Path traversal or invalid characters detected' };
  }

  // Rejeitar caracteres perigosos
  if (/[<>:"|?*]/.test(targetPath)) {
    return { valid: false, reason: 'Dangerous characters in path' };
  }

  return { valid: true };
}

/**
 * Validação de Assinatura de Container de Áudio (Magic Bytes)
 */
export function verifyAudioContainerSignature(buffer: Buffer): { detectedType: string; isAudioOrMedia: boolean } {
  if (!buffer || buffer.length < 4) {
    return { detectedType: 'unknown', isAudioOrMedia: false };
  }

  // WebM / Matroska (EBML ID: 0x1A 0x45 0xDF 0xA3)
  if (buffer[0] === 0x1A && buffer[1] === 0x45 && buffer[2] === 0xDF && buffer[3] === 0xA3) {
    return { detectedType: 'audio/webm', isAudioOrMedia: true };
  }

  // Ogg container (OggS: 0x4F 0x67 0x67 0x53)
  if (buffer[0] === 0x4F && buffer[1] === 0x67 && buffer[2] === 0x67 && buffer[3] === 0x53) {
    return { detectedType: 'audio/ogg', isAudioOrMedia: true };
  }

  // MP4 / M4A / AAC container ('ftyp' at offset 4)
  if (buffer.length >= 8 && buffer.subarray(4, 8).toString('ascii') === 'ftyp') {
    return { detectedType: 'audio/mp4', isAudioOrMedia: true };
  }

  // MP3 with ID3v2 tag ('ID3')
  if (buffer[0] === 0x49 && buffer[1] === 0x44 && buffer[2] === 0x33) {
    return { detectedType: 'audio/mpeg', isAudioOrMedia: true };
  }

  // MP3 Sync Word (0xFF 0xFB, 0xFF 0xF3, 0xFF 0xF2)
  if (buffer[0] === 0xFF && (buffer[1] & 0xE0) === 0xE0) {
    return { detectedType: 'audio/mpeg', isAudioOrMedia: true };
  }

  // WAV container ('RIFF'....'WAVE')
  if (buffer.length >= 12 && buffer.subarray(0, 4).toString('ascii') === 'RIFF' && buffer.subarray(8, 12).toString('ascii') === 'WAVE') {
    return { detectedType: 'audio/wav', isAudioOrMedia: true };
  }

  // AAC ADTS headers (0xFF 0xF1 or 0xFF 0xF9)
  if (buffer[0] === 0xFF && (buffer[1] & 0xF6) === 0xF0) {
    return { detectedType: 'audio/aac', isAudioOrMedia: true };
  }

  return { detectedType: 'application/octet-stream', isAudioOrMedia: false };
}
