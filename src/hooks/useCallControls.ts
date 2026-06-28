import { useCallback } from 'react';
import { callApi } from '../services/callApi';

const safeCall = async (apiCall: Promise<any>) => {
  try {
    return await apiCall;
  } catch (e) {
    console.warn("Call API failed, continuing anyway", e);
    return null;
  }
};

export function useCallControls(callId: string) {
  
  // Basic Calls
  const acceptCall = useCallback(async (data?: any) => {
    return safeCall(callApi.acceptCall(callId, data));
  }, [callId]);

  const rejectCall = useCallback(async (data?: any) => {
    return safeCall(callApi.rejectCall(callId, data));
  }, [callId]);

  const endCall = useCallback(async (data?: any) => {
    return safeCall(callApi.endCall(callId, data));
  }, [callId]);
  
  const getStatus = useCallback(async () => {
    return safeCall(callApi.getCallStatus(callId));
  }, [callId]);

  // Audio Controls
  const muteAudio = useCallback(async () => {
    return safeCall(callApi.muteAudio(callId));
  }, [callId]);

  const unmuteAudio = useCallback(async () => {
    return safeCall(callApi.unmuteAudio(callId));
  }, [callId]);

  const deafenAudio = useCallback(async () => {
    return safeCall(callApi.deafenAudio(callId));
  }, [callId]);

  const undeafenAudio = useCallback(async () => {
    return safeCall(callApi.undeafenAudio(callId));
  }, [callId]);

  // Video Controls
  const enableVideo = useCallback(async () => {
    return safeCall(callApi.enableVideo(callId));
  }, [callId]);

  const disableVideo = useCallback(async () => {
    return safeCall(callApi.disableVideo(callId));
  }, [callId]);

  const switchCamera = useCallback(async () => {
    return safeCall(callApi.switchCamera(callId));
  }, [callId]);

  // Quality settings
  const setVideoQuality = useCallback(async (quality: 'low' | 'medium' | 'high' | '720p' | '1080p' | '1080p60') => {
    let call;
    switch(quality) {
      case 'low': call = callApi.setVideoLowQuality(callId); break;
      case 'medium': call = callApi.setVideoMediumQuality(callId); break;
      case 'high': call = callApi.setVideoHighQuality(callId); break;
      case '720p': call = callApi.setVideo720p(callId); break;
      case '1080p': call = callApi.setVideo1080p(callId); break;
      case '1080p60': call = callApi.setVideo1080p60(callId); break;
    }
    return safeCall(call!);
  }, [callId]);

  // Screen Share Setting
  const startScreenShare = useCallback(async () => {
    return safeCall(callApi.startScreenShare(callId));
  }, [callId]);

  const stopScreenShare = useCallback(async () => {
    return safeCall(callApi.stopScreenShare(callId));
  }, [callId]);

  // Recording
  const startRecording = useCallback(async () => {
    return safeCall(callApi.startRecording(callId));
  }, [callId]);

  const stopRecording = useCallback(async () => {
    return safeCall(callApi.stopRecording(callId));
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
