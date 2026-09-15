import { describe, it, expect, vi, beforeEach } from 'vitest';
import { parseMimeDetails, getVoiceMediaConstraints } from '../utils/audioUtils';
import { formatDuration } from '../components/VoiceMessageBubble';

describe('Audio Recording and Utility Functions', () => {
  it('correctly parses webm with opus', () => {
    const details = parseMimeDetails('audio/webm;codecs=opus');
    expect(details.container).toBe('webm');
    expect(details.codec).toBe('opus');
    expect(details.extension).toBe('webm');
  });

  it('correctly parses mp4/m4a with aac', () => {
    const details = parseMimeDetails('audio/mp4');
    expect(details.container).toBe('mp4');
    expect(details.codec).toBe('aac');
    expect(details.extension).toBe('m4a');
  });

  it('correctly parses ogg with opus', () => {
    const details = parseMimeDetails('audio/ogg;codecs=opus');
    expect(details.container).toBe('ogg');
    expect(details.codec).toBe('opus');
    expect(details.extension).toBe('ogg');
  });

  it('returns appropriate audio track constraints for speech', () => {
    const constraints = getVoiceMediaConstraints();
    expect(constraints.channelCount).toEqual({ ideal: 1 });
    expect(constraints.sampleRate).toEqual({ ideal: 48000 });
    expect(constraints.echoCancellation).toEqual({ ideal: true });
    expect(constraints.noiseSuppression).toEqual({ ideal: true });
  });

  it('formats duration in seconds to mm:ss reliably', () => {
    expect(formatDuration(0)).toBe('0:00');
    expect(formatDuration(5)).toBe('0:05');
    expect(formatDuration(65)).toBe('1:05');
    expect(formatDuration(600)).toBe('10:00');
    expect(formatDuration(-1)).toBe('0:00');
    expect(formatDuration(NaN)).toBe('0:00');
  });
});
