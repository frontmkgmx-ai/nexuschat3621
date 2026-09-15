import { useState, useEffect, useCallback, useRef } from 'react';
import { callApi } from '../services/callApi';

export type AudioQualityType = 'low' | 'normal' | 'ultra' | 'lossless';

export interface UseCallControlsReturn {
  devices: MediaDeviceInfo[];
  selectedMic: string;
  selectedCamera: string;
  selectedSpeaker: string;
  audioVolume: number;
  noiseSuppression: boolean;
  audioQuality: AudioQualityType;
  hasVideo: boolean;
  isMuted: boolean;
  isSharingScreen: boolean;
  showSettings: boolean;
  isDeafened: boolean;
  sinkIdSupported: boolean;
  setSelectedMic: (deviceId: string) => void;
  setSelectedCamera: (deviceId: string) => void;
  setSelectedSpeaker: (deviceId: string) => void;
  setAudioVolume: (volume: number) => void;
  setNoiseSuppression: (enabled: boolean) => void;
  setAudioQuality: (quality: AudioQualityType) => void;
  setIsSharingScreen: (isSharing: boolean) => void;
  setShowSettings: (show: boolean) => void;
  toggleVideo: () => void;
  toggleMute: () => void;
  toggleDeafen: () => void;
  refreshDevices: () => Promise<MediaDeviceInfo[]>;
  // API compatibility methods
  acceptCall: (data?: any) => Promise<any>;
  rejectCall: (data?: any) => Promise<any>;
  endCall: (data?: any) => Promise<any>;
  getStatus: () => Promise<any>;
}

export function useCallControls(
  initialVideoOrCallId: boolean | string = false,
  optionalCallId?: string
): UseCallControlsReturn {
  const initialVideo = typeof initialVideoOrCallId === 'boolean' ? initialVideoOrCallId : false;
  const callId = typeof initialVideoOrCallId === 'string' ? initialVideoOrCallId : optionalCallId || '';

  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedMic, setSelectedMic] = useState<string>('default');
  const [selectedCamera, setSelectedCamera] = useState<string>('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('default');
  
  const [audioVolume, setAudioVolume] = useState<number>(1.0);
  const [noiseSuppression, setNoiseSuppression] = useState<boolean>(true);
  const [audioQuality, setAudioQuality] = useState<AudioQualityType>('normal');
  
  const [hasVideo, setHasVideo] = useState<boolean>(initialVideo);
  const [isMuted, setIsMuted] = useState<boolean>(false);
  const [isDeafened, setIsDeafened] = useState<boolean>(false);
  const [isSharingScreen, setIsSharingScreen] = useState<boolean>(false);
  const [showSettings, setShowSettings] = useState<boolean>(false);
  
  const [sinkIdSupported, setSinkIdSupported] = useState<boolean>(false);
  const isEnumerating = useRef(false);

  // Check setSinkId support in current browser
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const audio = document.createElement('audio');
      setSinkIdSupported(typeof (audio as any).setSinkId === 'function');
    }
  }, []);

  // Device enumeration with labels when available
  const refreshDevices = useCallback(async (): Promise<MediaDeviceInfo[]> => {
    if (typeof navigator === 'undefined' || !navigator.mediaDevices?.enumerateDevices) {
      return [];
    }
    if (isEnumerating.current) return devices;
    isEnumerating.current = true;

    try {
      const deviceList = await navigator.mediaDevices.enumerateDevices();
      setDevices(deviceList);

      // Verify selected mic exists in current list
      const audioInputs = deviceList.filter(d => d.kind === 'audioinput');
      if (audioInputs.length > 0 && !audioInputs.some(d => d.deviceId === selectedMic)) {
        setSelectedMic(audioInputs[0].deviceId || 'default');
      }

      // Verify selected camera exists
      const videoInputs = deviceList.filter(d => d.kind === 'videoinput');
      if (videoInputs.length > 0 && !videoInputs.some(d => d.deviceId === selectedCamera)) {
        setSelectedCamera(videoInputs[0].deviceId || 'default');
      }

      // Verify selected speaker exists
      const audioOutputs = deviceList.filter(d => d.kind === 'audiooutput');
      if (audioOutputs.length > 0 && !audioOutputs.some(d => d.deviceId === selectedSpeaker)) {
        setSelectedSpeaker(audioOutputs[0].deviceId || 'default');
      }

      return deviceList;
    } catch (err) {
      console.warn('Failed to enumerate media devices:', err);
      return [];
    } finally {
      isEnumerating.current = false;
    }
  }, [selectedMic, selectedCamera, selectedSpeaker, devices]);

  // Initial enumeration and listen for device plug/unplug
  useEffect(() => {
    refreshDevices();

    if (typeof navigator !== 'undefined' && navigator.mediaDevices?.addEventListener) {
      const handleDeviceChange = () => {
        refreshDevices();
      };
      navigator.mediaDevices.addEventListener('devicechange', handleDeviceChange);
      return () => {
        navigator.mediaDevices.removeEventListener('devicechange', handleDeviceChange);
      };
    }
  }, [refreshDevices]);

  const toggleVideo = useCallback(() => {
    setHasVideo(prev => !prev);
  }, []);

  const toggleMute = useCallback(() => {
    setIsMuted(prev => !prev);
  }, []);

  const toggleDeafen = useCallback(() => {
    setIsDeafened(prev => {
      const next = !prev;
      if (next) {
        setIsMuted(true);
      }
      return next;
    });
  }, []);

  // Backwards-compatible API helpers
  const acceptCall = useCallback(async (data?: any) => {
    if (!callId) return null;
    return callApi.acceptCall(callId, data);
  }, [callId]);

  const rejectCall = useCallback(async (data?: any) => {
    if (!callId) return null;
    return callApi.rejectCall(callId, data);
  }, [callId]);

  const endCall = useCallback(async (data?: any) => {
    if (!callId) return null;
    return callApi.endCall(callId, data);
  }, [callId]);

  const getStatus = useCallback(async () => {
    if (!callId) return null;
    return callApi.getCallStatus(callId);
  }, [callId]);

  return {
    devices,
    selectedMic,
    selectedCamera,
    selectedSpeaker,
    audioVolume,
    noiseSuppression,
    audioQuality,
    hasVideo,
    isMuted,
    isSharingScreen,
    showSettings,
    isDeafened,
    sinkIdSupported,
    setSelectedMic,
    setSelectedCamera,
    setSelectedSpeaker,
    setAudioVolume,
    setNoiseSuppression,
    setAudioQuality,
    setIsSharingScreen,
    setShowSettings,
    toggleVideo,
    toggleMute,
    toggleDeafen,
    refreshDevices,
    acceptCall,
    rejectCall,
    endCall,
    getStatus
  };
}
