import { toast } from 'sonner';
import React, { useEffect, useRef, useState, useCallback } from 'react';
import {
  PhoneOff,
  Mic,
  MicOff,
  Camera,
  CameraOff,
  MonitorUp,
  ChevronDown,
  Volume2,
  VolumeX,
  Phone,
  User,
  Settings2,
  Wifi,
  X,
  Maximize,
  Minimize,
  RefreshCw,
  AlertCircle
} from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCallControls } from '../hooks/useCallControls';
import { sanitizeUrl } from '../services/storageService';
import { rtdb } from '../lib/firebase';
import { ref as dbRef, set, onDisconnect } from 'firebase/database';

interface CallRoomProps {
  currentUser: any;
  conversation: any;
  callType: 'audio' | 'video';
  onEndCall: () => void;
}

const ParticipantView: React.FC<{
  participant: any;
  isLocal?: boolean;
  volume?: number;
  selectedSpeaker?: string;
  isDeafened?: boolean;
}> = ({ participant, isLocal, volume = 1, selectedSpeaker, isDeafened = false }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);
  const [autoplayBlocked, setAutoplayBlocked] = useState(false);

  // Manage volume and muting
  useEffect(() => {
    const effectiveVolume = isDeafened ? 0 : volume;
    if (videoRef.current) {
      if (isLocal) {
        videoRef.current.volume = 0;
        videoRef.current.muted = true;
      } else {
        videoRef.current.volume = effectiveVolume;
        videoRef.current.muted = isDeafened;
      }
    }
    if (audioRef.current && !isLocal) {
      audioRef.current.volume = effectiveVolume;
      audioRef.current.muted = isDeafened;
    }
  }, [volume, isLocal, isDeafened]);

  // Apply audio output sink ID if supported by browser
  useEffect(() => {
    if (selectedSpeaker && !isLocal) {
      const sink = selectedSpeaker === 'default' ? '' : selectedSpeaker;
      if (videoRef.current && typeof (videoRef.current as any).setSinkId === 'function') {
        (videoRef.current as any).setSinkId(sink).catch((e: any) => console.warn('video.setSinkId failed:', e));
      }
      if (audioRef.current && typeof (audioRef.current as any).setSinkId === 'function') {
        (audioRef.current as any).setSinkId(sink).catch((e: any) => console.warn('audio.setSinkId failed:', e));
      }
    }
  }, [selectedSpeaker, isLocal]);

  // Handle stream assignment and autoplay policy
  useEffect(() => {
    if (participant.stream) {
      if (videoRef.current) {
        videoRef.current.srcObject = participant.stream;
      }
      if (audioRef.current && !isLocal) {
        audioRef.current.srcObject = participant.stream;
      }

      if (!isLocal && videoRef.current) {
        const playPromise = videoRef.current.play();
        if (playPromise !== undefined) {
          playPromise
            .then(() => {
              setAutoplayBlocked(false);
            })
            .catch((err) => {
              if (err.name === 'NotAllowedError') {
                console.warn('[CallRoom] Autoplay blocked for remote participant', participant.id);
                setAutoplayBlocked(true);
              }
            });
        }
      }
    }
    return () => {
      if (videoRef.current) {
        videoRef.current.srcObject = null;
      }
      if (audioRef.current) {
        audioRef.current.srcObject = null;
      }
    };
  }, [participant.stream, isLocal, participant.id]);

  // Monitor live video track state
  useEffect(() => {
    if (!participant.stream) return;
    const checkVideo = () => {
      const videoTracks = participant.stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks.some((t: any) => t.enabled && t.readyState === 'live' && !t.muted));
    };
    checkVideo();
    const interval = setInterval(checkVideo, 1000);
    return () => clearInterval(interval);
  }, [participant.stream]);

  // Audio level analysis for speaking indicator
  useEffect(() => {
    if (!participant.stream || !participant.stream.getAudioTracks().length) return;

    let audioContext: AudioContext | null = null;
    let analyser: AnalyserNode | null = null;
    let microphone: MediaStreamAudioSourceNode | null = null;
    let rafId: number;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      microphone = audioContext.createMediaStreamSource(participant.stream);
      microphone.connect(analyser);

      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
        if (!analyser) return;
        analyser.getByteFrequencyData(dataArray);
        let sum = 0;
        for (let i = 0; i < dataArray.length; i++) {
          sum += dataArray[i];
        }
        const average = sum / dataArray.length;
        setIsSpeaking(average > 15);
        rafId = requestAnimationFrame(checkVolume);
      };
      checkVolume();
    } catch (e) {
      // AudioContext may fail if suspended before interaction
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (microphone) microphone.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [participant.stream]);

  const handleUnlockAudio = () => {
    if (videoRef.current) {
      videoRef.current.play().then(() => setAutoplayBlocked(false)).catch(() => {});
    }
    if (audioRef.current) {
      audioRef.current.play().catch(() => {});
    }
  };

  return (
    <div
      className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111111] border-[3px] transition-all duration-300 shadow-lg ${
        isSpeaking ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] ring-2 ring-green-500/50' : 'border-[#2d2d2d]'
      }`}
    >
      <video
        autoPlay
        playsInline
        muted={isLocal}
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${hasVideo ? 'opacity-100' : 'opacity-0'}`}
        ref={videoRef}
      />
      {!isLocal && <audio ref={audioRef} autoPlay playsInline />}

      {autoplayBlocked && !isLocal && (
        <div className="absolute inset-0 z-20 flex flex-col items-center justify-center bg-black/75 backdrop-blur-md p-4 text-center">
          <button
            onClick={handleUnlockAudio}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-500 text-white px-6 py-3 rounded-full font-semibold shadow-xl transition-all hover:scale-105 active:scale-95"
          >
            <Volume2 className="w-5 h-5" />
            Ativar Áudio
          </button>
          <span className="text-white/70 text-xs sm:text-sm mt-3 max-w-xs">
            O navegador bloqueou a reprodução automática. Clique acima para liberar o áudio da chamada.
          </span>
        </div>
      )}

      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111111] overflow-hidden">
          {participant.bannerUrl && (
            <img
              src={sanitizeUrl(participant.bannerUrl)}
              alt="Background"
              className="absolute inset-0 w-full h-full object-cover opacity-[0.25] blur-[8px] scale-110 pointer-events-none"
            />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80" />

          <div className="relative flex flex-col items-center gap-4 z-10 w-full px-4">
            <div className={`relative rounded-full transition-all duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
              <img
                src={participant.avatarUrl ? sanitizeUrl(participant.avatarUrl) : `https://api.dicebear.com/7.x/initials/svg?seed=${participant.seed}`}
                alt={participant.displayName}
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-[3px] transition-colors duration-300 shadow-2xl ${
                  isSpeaking ? 'border-green-500' : 'border-zinc-700'
                }`}
                onError={(e) => {
                  const target = e.target as HTMLImageElement;
                  if (!target.src.includes('dicebear.com')) {
                    target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${participant.seed}`;
                  }
                }}
              />
              {isSpeaking && (
                <div className="absolute -bottom-1 -right-1 bg-green-500 rounded-full p-1.5 border-4 border-[#111111] shadow-lg animate-pulse">
                  <Mic className="w-4 h-4 text-white" />
                </div>
              )}
            </div>

            <div className="px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-xl flex items-center gap-2 max-w-full">
              <span className="text-white font-medium text-sm sm:text-base truncate">
                {participant.displayName} {isLocal && '(Você)'}
              </span>
              {isSpeaking ? <Volume2 className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400/80" />}
            </div>
          </div>
        </div>
      )}

      {hasVideo && (
        <div className="absolute bottom-4 left-4 z-10">
          <div
            className={`px-3 py-1.5 rounded-xl bg-black/40 backdrop-blur-md border border-white/10 shadow-lg flex items-center gap-2 max-w-full transition-all ${
              isSpeaking ? 'bg-black/60 border-green-500/30' : ''
            }`}
          >
            <span className="text-white font-medium text-xs sm:text-sm truncate drop-shadow-md">
              {participant.displayName} {isLocal && '(Você)'}
            </span>
            {isSpeaking ? <Volume2 className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5 text-red-400/80" />}
          </div>
        </div>
      )}
    </div>
  );
};

export default function CallRoom({ currentUser, conversation, callType, onEndCall }: CallRoomProps) {
  const callId = conversation._id;
  const isGroup = conversation.type === 'group';

  const {
    isConnected,
    callState,
    errorMessage,
    localStream,
    remoteStreams,
    activeScreenShares,
    startLocalStream,
    replaceVideoTrack,
    connectSocket,
    retryConnection,
    cleanup
  } = useWebRTC({
    callId,
    userId: currentUser._id,
    userName: currentUser.displayName,
    isGroup
  });

  const {
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
    refreshDevices
  } = useCallControls(callType === 'video');

  const [isFullscreen, setIsFullscreen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener('fullscreenchange', handleFullscreenChange);
    return () => document.removeEventListener('fullscreenchange', handleFullscreenChange);
  }, []);

  const toggleFullscreen = async () => {
    if (!containerRef.current) return;
    if (!document.fullscreenElement) {
      await containerRef.current.requestFullscreen().catch((err) => console.error(err));
    } else {
      await document.exitFullscreen().catch((err) => console.error(err));
    }
  };

  const isFirstMount = useRef(true);

  // Initial call setup: acquire media and register RTDB presence
  useEffect(() => {
    let mounted = true;
    const init = async () => {
      try {
        await startLocalStream(
          callType === 'video',
          {
            deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined,
            noiseSuppression: noiseSuppression,
            echoCancellation: true,
            autoGainControl: audioQuality !== 'lossless',
            sampleRate: audioQuality === 'low' ? 16000 : 48000
          },
          audioQuality
        );

        if (!mounted) return;

        // Connect to Firebase RTDB signaling
        connectSocket();

        // Refresh devices to obtain hardware labels now that permission is granted
        refreshDevices();

        import('../services/soundService')
          .then((s) => s.soundService.playCallEnter())
          .catch(() => {});
      } catch (err: any) {
        console.error('[CallRoom] Initialization error:', err);
      }
    };
    init();

    // Register active participant in conversation call status
    const myCallRef = dbRef(rtdb, `conversations/${callId}/callStatus/participants/${currentUser._id}`);
    set(myCallRef, true);
    onDisconnect(myCallRef).remove();

    return () => {
      mounted = false;
      if (screenStreamRef.current) {
        screenStreamRef.current.getTracks().forEach((t) => t.stop());
        screenStreamRef.current = null;
      }
      cleanup();
      set(myCallRef, null).catch(() => {});
      import('../services/soundService')
        .then((s) => s.soundService.playCallLeave())
        .catch(() => {});
    };
  }, [callId, callType, currentUser._id]);

  // React to microphone or audio quality changes
  useEffect(() => {
    if (isFirstMount.current) {
      isFirstMount.current = false;
      return;
    }
    const applyChanges = async () => {
      try {
        await startLocalStream(
          hasVideo,
          {
            deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined,
            noiseSuppression: noiseSuppression,
            echoCancellation: true,
            autoGainControl: audioQuality !== 'lossless',
            sampleRate: audioQuality === 'low' ? 16000 : 48000
          },
          audioQuality
        );

        if (localStream) {
          localStream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
          localStream.getVideoTracks().forEach((t) => (t.enabled = hasVideo));
        }
      } catch (err) {
        console.error('[CallRoom] Failed applying track changes:', err);
      }
    };
    applyChanges();
  }, [selectedMic, noiseSuppression, audioQuality]);

  // Screen sharing with system audio capture
  const handleToggleScreenShare = async () => {
    if (isSharingScreen && screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach((t) => t.stop());
      screenStreamRef.current = null;
      setIsSharingScreen(false);

      const stream = await startLocalStream(
        hasVideo,
        {
          deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined,
          noiseSuppression: noiseSuppression,
          echoCancellation: true,
          autoGainControl: audioQuality !== 'lossless',
          sampleRate: audioQuality === 'low' ? 16000 : 48000
        },
        audioQuality
      );

      if (stream) {
        stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
        stream.getVideoTracks().forEach((t) => (t.enabled = hasVideo));
      }
    } else {
      try {
        const displayStream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true // Solicits system / tab audio
        });
        screenStreamRef.current = displayStream;
        setIsSharingScreen(true);

        const videoTrack = displayStream.getVideoTracks()[0];
        const audioTracks = displayStream.getAudioTracks();
        const systemAudioTrack = audioTracks.length > 0 ? audioTracks[0] : null;

        if (!systemAudioTrack) {
          toast.info('Compartilhando tela (áudio do sistema não incluído)');
        } else {
          toast.success('Compartilhando tela com áudio do sistema');
        }

        // Auto revert when user stops sharing via the browser bar
        videoTrack.onended = () => {
          if (screenStreamRef.current) {
            screenStreamRef.current.getTracks().forEach((t) => t.stop());
            screenStreamRef.current = null;
          }
          setIsSharingScreen(false);
          startLocalStream(
            hasVideo,
            {
              deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined,
              noiseSuppression: noiseSuppression,
              echoCancellation: true
            },
            audioQuality
          ).then((stream) => {
            if (stream) {
              stream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
              stream.getVideoTracks().forEach((t) => (t.enabled = hasVideo));
            }
          });
        };

        await replaceVideoTrack(videoTrack, systemAudioTrack, 2500000, 'detail');
      } catch (err: any) {
        if (err.name !== 'NotAllowedError') {
          console.error('[CallRoom] Screen share error:', err);
          toast.error('Não foi possível compartilhar a tela');
        }
        setIsSharingScreen(false);
      }
    }
  };

  // Sync mute state with local audio tracks
  useEffect(() => {
    if (localStream) {
      localStream.getAudioTracks().forEach((t) => (t.enabled = !isMuted));
    }
  }, [isMuted, localStream]);

  // Sync video toggle and camera device changes
  useEffect(() => {
    if (localStream && !isSharingScreen) {
      const applyVideo = async () => {
        try {
          if (hasVideo) {
            const stream = await navigator.mediaDevices.getUserMedia({
              video: { deviceId: selectedCamera !== 'default' ? { exact: selectedCamera } : undefined }
            });
            const vTrack = stream.getVideoTracks()[0];
            await replaceVideoTrack(vTrack);
            localStream.getVideoTracks().forEach((t) => {
              if (t !== vTrack) {
                t.stop();
                localStream.removeTrack(t);
              }
            });
            localStream.addTrack(vTrack);
          } else {
            await replaceVideoTrack(null);
            localStream.getVideoTracks().forEach((t) => {
              t.stop();
              localStream.removeTrack(t);
            });
          }
        } catch (e) {
          console.error('[CallRoom] Camera switch error:', e);
          toast.error('Erro ao alternar câmera');
        }
      };
      applyVideo();
    }
  }, [hasVideo, selectedCamera]);

  const remoteParticipants = Object.keys(remoteStreams).map((id) => {
    let participantData = null;
    if (isGroup) {
      participantData = conversation.participants?.find((p: any) => p._id === id);
    } else {
      participantData = conversation.participants?.find((p: any) => p._id === id) || conversation;
    }

    return {
      id,
      stream: remoteStreams[id],
      displayName: participantData?.displayName || 'Participante',
      avatarUrl: participantData?.avatarUrl,
      seed: participantData?.username || id,
      bannerUrl: participantData?.bannerUrl
    };
  });

  const getCallStatusLabel = () => {
    switch (callState) {
      case 'connected':
        return 'Conectado';
      case 'connecting':
        return 'Conectando...';
      case 'reconnecting':
        return 'Reconectando...';
      case 'signaling':
        return 'Sinalizando...';
      case 'capturing':
        return 'Capturando mídia...';
      case 'requesting-permission':
        return 'Solicitando permissão...';
      case 'failed':
        return 'Falha na conexão';
      case 'disconnected':
        return 'Desconectado';
      default:
        return 'Aguardando';
    }
  };

  const getCallStatusColor = () => {
    switch (callState) {
      case 'connected':
        return 'bg-green-400 text-green-400 shadow-[0_0_8px_rgba(74,222,128,0.8)]';
      case 'failed':
        return 'bg-red-400 text-red-400';
      case 'reconnecting':
      case 'connecting':
      case 'signaling':
        return 'bg-yellow-400 text-yellow-400';
      default:
        return 'bg-zinc-400 text-zinc-400';
    }
  };

  return (
    <div ref={containerRef} className="absolute inset-0 bg-[#0a0a0a] z-[100] flex flex-col overflow-hidden font-sans text-white h-[100dvh]">
      {/* Top Bar */}
      <div className="h-16 shrink-0 border-b border-white/5 bg-[#111111]/80 backdrop-blur-xl flex items-center justify-between px-4 sm:px-6 z-20 relative shadow-[0_4px_30px_rgba(0,0,0,0.5)]">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500/20 to-purple-500/20 flex items-center justify-center shrink-0 border border-white/10 shadow-inner">
            {isGroup ? <User className="w-5 h-5 text-indigo-400" /> : <Phone className="w-5 h-5 text-indigo-400" />}
          </div>
          <div className="min-w-0">
            <h2 className="text-white font-semibold text-sm sm:text-base truncate tracking-wide">
              {isGroup ? conversation.name || 'Grupo' : conversation.displayName || conversation.name}
            </h2>
            <div className="flex items-center gap-1.5 mt-0.5">
              <span className={`w-1.5 h-1.5 rounded-full animate-pulse ${getCallStatusColor().split(' ')[0]}`} />
              <span className={`text-[11px] font-medium tracking-widest uppercase ${getCallStatusColor().split(' ')[1]}`}>
                {getCallStatusLabel()}
              </span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {callState === 'failed' && (
            <button
              onClick={retryConnection}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-red-500/20 hover:bg-red-500/30 text-red-300 rounded-full border border-red-500/40 text-xs font-semibold transition-all hover:scale-105 active:scale-95"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              Reconectar
            </button>
          )}

          {isConnected && (
            <div className="hidden sm:flex items-center gap-1.5 px-3 py-1.5 bg-green-500/10 text-green-400 rounded-full border border-green-500/20 shadow-[0_0_15px_rgba(34,197,94,0.1)]">
              <Wifi className="w-3.5 h-3.5" />
              <span className="text-xs font-semibold uppercase tracking-wider">Qualidade Estável</span>
            </div>
          )}

          <button
            onClick={() => setShowSettings(!showSettings)}
            className={`w-10 h-10 flex items-center justify-center rounded-full transition-all duration-300 ${
              showSettings ? 'bg-indigo-500 text-white shadow-[0_0_15px_rgba(99,102,241,0.4)]' : 'bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white'
            }`}
            title="Configurações de Áudio e Vídeo"
          >
            <Settings2 className="w-5 h-5" />
          </button>

          <button
            onClick={toggleFullscreen}
            className="w-10 h-10 hidden sm:flex items-center justify-center rounded-full bg-white/5 hover:bg-white/10 text-zinc-300 hover:text-white transition-all duration-300"
            title={isFullscreen ? 'Sair da Tela Cheia' : 'Tela Cheia'}
          >
            {isFullscreen ? <Minimize className="w-5 h-5" /> : <Maximize className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Error alert banner */}
      {errorMessage && (
        <div className="bg-red-500/10 border-b border-red-500/20 px-4 py-2 flex items-center justify-between text-xs text-red-300 z-20">
          <div className="flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-red-400 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={retryConnection} className="underline hover:text-white font-medium ml-2 shrink-0">
            Tentar novamente
          </button>
        </div>
      )}

      {/* Main Grid */}
      <div className="flex-1 relative overflow-hidden bg-black/40">
        <div className="absolute inset-0 bg-gradient-to-b from-[#111111]/50 to-[#0a0a0a] pointer-events-none" />

        <div
          className={`absolute inset-0 p-4 sm:p-6 grid gap-4 transition-all duration-500 ${
            remoteParticipants.length === 0
              ? 'grid-cols-1'
              : remoteParticipants.length === 1 && !hasVideo && !activeScreenShares.size
              ? 'grid-cols-1 sm:grid-cols-2'
              : remoteParticipants.length === 1
              ? 'grid-cols-1 sm:grid-cols-2'
              : remoteParticipants.length === 2
              ? 'grid-cols-1 sm:grid-cols-2 md:grid-cols-3'
              : remoteParticipants.length <= 4
              ? 'grid-cols-2'
              : 'grid-cols-2 sm:grid-cols-3 md:grid-cols-4'
          }`}
        >
          {/* Remote Participants */}
          {remoteParticipants.map((rp) => (
            <div key={rp.id} className="w-full h-full min-h-[150px]">
              <ParticipantView
                participant={rp}
                volume={audioVolume}
                selectedSpeaker={selectedSpeaker}
                isDeafened={isDeafened}
              />
            </div>
          ))}

          {/* Local Participant */}
          <div
            className={`w-full h-full min-h-[150px] transition-all duration-500 ${
              remoteParticipants.length === 1 && hasVideo ? 'sm:col-span-1' : ''
            }`}
          >
            <ParticipantView
              isLocal
              participant={{
                id: currentUser._id,
                displayName: currentUser.displayName,
                avatarUrl: currentUser.avatarUrl,
                seed: currentUser.username,
                bannerUrl: currentUser.bannerUrl,
                stream: localStream
              }}
            />
          </div>
        </div>
      </div>

      {/* Bottom Controls */}
      <div className="shrink-0 bg-gradient-to-t from-[#0a0a0a] via-[#111111]/90 to-transparent pt-8 pb-6 px-4 flex flex-col items-center gap-4 relative z-30">
        {showSettings && (
          <div className="w-full max-w-2xl bg-[#1a1a1a]/95 backdrop-blur-xl border border-white/10 rounded-2xl p-5 shadow-2xl mb-2 animate-in slide-in-from-bottom-4 fade-in duration-300">
            <div className="flex justify-between items-center mb-5 pb-3 border-b border-white/5">
              <h3 className="font-semibold text-white/90 text-sm tracking-wide uppercase">Configurações de Áudio e Vídeo</h3>
              <button onClick={() => setShowSettings(false)} className="text-zinc-500 hover:text-white transition-colors">
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-5">
              {/* Mic Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Microfone</label>
                <div className="relative">
                  <select
                    value={selectedMic}
                    onChange={(e) => setSelectedMic(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all hover:bg-black/60"
                  >
                    {devices.filter((d) => d.kind === 'audioinput').length === 0 && <option value="default">Microfone Padrão</option>}
                    {devices
                      .filter((d) => d.kind === 'audioinput')
                      .map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || 'Microfone Desconhecido'}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Speaker Selection */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Saída de Áudio</label>
                  {!sinkIdSupported && <span className="text-[10px] text-amber-400/80">Padrão do SO</span>}
                </div>
                <div className="relative">
                  <select
                    value={selectedSpeaker}
                    onChange={(e) => setSelectedSpeaker(e.target.value)}
                    disabled={!sinkIdSupported && devices.filter((d) => d.kind === 'audiooutput').length === 0}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all hover:bg-black/60 disabled:opacity-60"
                  >
                    {devices.filter((d) => d.kind === 'audiooutput').length === 0 && <option value="default">Padrão do Sistema</option>}
                    {devices
                      .filter((d) => d.kind === 'audiooutput')
                      .map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || 'Saída Desconhecida'}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Camera Selection */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Câmera</label>
                <div className="relative">
                  <select
                    value={selectedCamera}
                    onChange={(e) => setSelectedCamera(e.target.value)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all hover:bg-black/60"
                  >
                    {devices.filter((d) => d.kind === 'videoinput').length === 0 && <option value="default">Câmera Padrão</option>}
                    {devices
                      .filter((d) => d.kind === 'videoinput')
                      .map((d) => (
                        <option key={d.deviceId} value={d.deviceId}>
                          {d.label || 'Câmera Desconhecida'}
                        </option>
                      ))}
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Master Volume */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1 flex items-center justify-between">
                  Volume Geral
                  <span className="text-indigo-400">{Math.round(audioVolume * 100)}%</span>
                </label>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  value={audioVolume}
                  onChange={(e) => setAudioVolume(parseFloat(e.target.value))}
                  className="w-full accent-indigo-500 h-2 bg-white/10 rounded-full appearance-none cursor-pointer mt-2"
                />
              </div>

              {/* Audio Quality */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Qualidade de Áudio</label>
                <div className="relative">
                  <select
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(e.target.value as any)}
                    className="w-full bg-black/40 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-white/90 appearance-none focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500/50 transition-all hover:bg-black/60"
                  >
                    <option value="low">Baixa (Economia de Dados - 16 kbps)</option>
                    <option value="normal">Padrão (32 kbps)</option>
                    <option value="ultra">Alta (64 kbps)</option>
                    <option value="lossless">Estúdio (128 kbps)</option>
                  </select>
                  <ChevronDown className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-zinc-500 pointer-events-none" />
                </div>
              </div>

              {/* Noise Suppression Toggle */}
              <div className="space-y-2">
                <label className="text-[11px] font-bold text-zinc-400 uppercase tracking-wider ml-1">Supressão de Ruído</label>
                <button
                  type="button"
                  onClick={() => setNoiseSuppression(!noiseSuppression)}
                  className={`w-full py-2.5 px-3 rounded-xl border text-sm font-medium transition-all flex items-center justify-center gap-2 ${
                    noiseSuppression
                      ? 'bg-indigo-600/30 border-indigo-500/50 text-indigo-200'
                      : 'bg-black/40 border-white/10 text-zinc-400'
                  }`}
                >
                  <span>{noiseSuppression ? 'Ativada (Filtro IA)' : 'Desativada (Som Natural)'}</span>
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Action Buttons Bar */}
        <div className="flex items-center gap-3 sm:gap-5">
          {/* Mute Mic */}
          <button
            onClick={toggleMute}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isMuted
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5 backdrop-blur-md'
            }`}
            title={isMuted ? 'Desmutar Microfone' : 'Mutar Microfone'}
          >
            {isMuted ? <MicOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Mic className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Deafen (Mute Incoming Audio) */}
          <button
            onClick={toggleDeafen}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              isDeafened
                ? 'bg-amber-500/20 text-amber-400 border-2 border-amber-500/50 hover:bg-amber-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5 backdrop-blur-md'
            }`}
            title={isDeafened ? 'Reativar Áudio Recebido' : 'Silenciar Chamada (Ensurdecer)'}
          >
            {isDeafened ? <VolumeX className="w-5 h-5 sm:w-6 sm:h-6" /> : <Volume2 className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Toggle Camera */}
          <button
            onClick={toggleVideo}
            className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl ${
              !hasVideo
                ? 'bg-red-500/20 text-red-400 border-2 border-red-500/50 hover:bg-red-500/30'
                : 'bg-white/10 text-white hover:bg-white/20 border border-white/5 backdrop-blur-md'
            }`}
            title={hasVideo ? 'Desligar Câmera' : 'Ligar Câmera'}
          >
            {!hasVideo ? <CameraOff className="w-5 h-5 sm:w-6 sm:h-6" /> : <Camera className="w-5 h-5 sm:w-6 sm:h-6" />}
          </button>

          {/* Screen Share (Desktop / Supported browsers) */}
          {typeof navigator !== 'undefined' && typeof navigator.mediaDevices?.getDisplayMedia === 'function' && (
            <button
              onClick={handleToggleScreenShare}
              className={`w-12 h-12 sm:w-14 sm:h-14 rounded-full flex items-center justify-center transition-all duration-300 shadow-xl hidden md:flex ${
                isSharingScreen
                  ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.5)]'
                  : 'bg-white/10 text-white hover:bg-white/20 border border-white/5 backdrop-blur-md'
              }`}
              title={isSharingScreen ? 'Parar Compartilhamento de Tela' : 'Compartilhar Tela com Áudio'}
            >
              <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
            </button>
          )}

          {/* End Call */}
          <button
            onClick={onEndCall}
            className="w-16 h-16 sm:w-20 sm:h-20 bg-red-600 hover:bg-red-500 text-white rounded-full flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 shadow-[0_0_25px_rgba(220,38,38,0.4)] ml-2 sm:ml-4 border-4 border-[#0a0a0a]"
            title="Encerrar Chamada"
          >
            <PhoneOff className="w-6 h-6 sm:w-8 sm:h-8" />
          </button>
        </div>
      </div>
    </div>
  );
}
