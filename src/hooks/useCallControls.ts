import { useCallback } from 'react';
import { callApi } from '../services/callApi';

export function useCallControls(callId: string) {
  
  // Basic Calls
  const acceptCall = useCallback(async (data?: any) => {
    return callApi.acceptCall(callId, data);
  }, [callId]);

  const rejectCall = useCallback(async (data?: any) => {
    return callApi.rejectCall(callId, data);
  }, [callId]);

  const endCall = useCallback(async (data?: any) => {
    return callApi.endCall(callId, data);
  }, [callId]);
  
  const getStatus = useCallback(async () => {
    return callApi.getCallStatus(callId);
  }, [callId]);

  // Audio Controls
  const muteAudio = useCallback(async () => {
    return callApi.muteAudio(callId);
  }, [callId]);

  const unmuteAudio = useCallback(async () => {
    return callApi.unmuteAudio(callId);
  }, [callId]);

  const deafenAudio = useCallback(async () => {
    return callApi.deafenAudio(callId);
  }, [callId]);

  const undeafenAudio = useCallback(async () => {
    return callApi.undeafenAudio(callId);
  }, [callId]);

  // Video Controls
  const enableVideo = useCallback(async () => {
    return callApi.enableVideo(callId);
  }, [callId]);

  const disableVideo = useCallback(async () => {
    return callApi.disableVideo(callId);
  }, [callId]);

  const switchCamera = useCallback(async () => {
    return callApi.switchCamera(callId);
  }, [callId]);

  // Quality settings
  const setVideoQuality = useCallback(async (quality: 'low' | 'medium' | 'high' | '720p' | '1080p' | '1080p60') => {
    switch(quality) {
      case 'low': return callApi.setVideoLowQuality(callId);
      case 'medium': return callApi.setVideoMediumQuality(callId);
      case 'high': return callApi.setVideoHighQuality(callId);
      case '720p': return callApi.setVideo720p(callId);
      case '1080p': return callApi.setVideo1080p(callId);
      case '1080p60': return callApi.setVideo1080p60(callId);
    }
  }, [callId]);

  // Screen Share Setting
  const startScreenShare = useCallback(async () => {
    return callApi.startScreenShare(callId);
  }, [callId]);

  const stopScreenShare = useCallback(async () => {
    return callApi.stopScreenShare(callId);
  }, [callId]);

  // Recording
  const startRecording = useCallback(async () => {
    return callApi.startRecording(callId);
  }, [callId]);

  const stopRecording = useCallback(async () => {
    return callApi.stopRecording(callId);
  }, [callId]);

  return {
    acceptCall,
    rejectCall,
    endCall,
    getStatus,
    muteAudio,
    unmuteAudio,
    deafenAudio,
    undeafenAudio,
    enableVideo,
    disableVideo,
    switchCamera,
    setVideoQuality,
    startScreenShare,
    stopScreenShare,
    startRecording,
    stopRecording,
  };
}
