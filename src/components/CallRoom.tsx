import { toast } from 'sonner';
import React, { useEffect, useRef, useState } from 'react';
import { PhoneOff, Mic, MicOff, Camera, CameraOff, MonitorUp, ChevronDown, Volume2, MessageSquare, Phone, User, Settings2, Activity, Wifi, X } from 'lucide-react';
import { useWebRTC } from '../hooks/useWebRTC';
import { useCallControls } from '../hooks/useCallControls';
import { sanitizeUrl } from '../services/fileApi';

interface CallRoomProps {
  currentUser: any;
  conversation: any;
  callType: 'audio' | 'video';
  onEndCall: () => void;
}

const ParticipantView: React.FC<{ participant: any, isLocal?: boolean, volume?: number }> = ({ participant, isLocal, volume = 1 }) => {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [hasVideo, setHasVideo] = useState(false);

  useEffect(() => {
    if (videoRef.current) {
      if (isLocal) {
        videoRef.current.volume = 0;
      } else {
        videoRef.current.volume = volume;
      }
    }
  }, [volume, isLocal]);

  useEffect(() => {
    if (participant.stream && videoRef.current) {
      videoRef.current.srcObject = participant.stream;
    }
  }, [participant.stream]);

  useEffect(() => {
    if (!participant.stream) return;
    
    // Check if video is active
    const checkVideo = () => {
      const videoTracks = participant.stream.getVideoTracks();
      setHasVideo(videoTracks.length > 0 && videoTracks.some((t: any) => t.enabled && t.readyState === 'live'));
    };
    checkVideo();

    const interval = setInterval(checkVideo, 1000);
    return () => clearInterval(interval);
  }, [participant.stream]);

  useEffect(() => {
    if (!participant.stream || !participant.stream.getAudioTracks().length) return;
    
    let audioContext: AudioContext;
    let analyser: AnalyserNode;
    let microphone: MediaStreamAudioSourceNode;
    let rafId: number;

    try {
      audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
      analyser = audioContext.createAnalyser();
      
      // Local stream needs to be handled carefully to not cause feedback, but Web Audio API is just reading
      microphone = audioContext.createMediaStreamSource(participant.stream);
      microphone.connect(analyser);
      
      analyser.fftSize = 256;
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkVolume = () => {
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
       console.warn("Could not start audio context", e);
    }

    return () => {
      if (rafId) cancelAnimationFrame(rafId);
      if (microphone) microphone.disconnect();
      if (analyser) analyser.disconnect();
      if (audioContext && audioContext.state !== 'closed') audioContext.close();
    };
  }, [participant.stream]);

  return (
    <div className={`relative w-full h-full rounded-2xl sm:rounded-3xl overflow-hidden bg-[#111111] border-[3px] transition-all duration-300 shadow-lg ${isSpeaking ? 'border-green-500 shadow-[0_0_30px_rgba(34,197,94,0.15)] ring-2 ring-green-500/50' : 'border-[#2d2d2d]'}`}>
      <video 
        autoPlay 
        playsInline 
        muted={isLocal} 
        className={`absolute inset-0 w-full h-full object-contain transition-opacity duration-500 ${hasVideo ? 'opacity-100' : 'opacity-0'}`} 
        ref={videoRef} 
      />
      
      {!hasVideo && (
        <div className="absolute inset-0 flex items-center justify-center bg-[#111111] overflow-hidden">
          {participant.bannerUrl && (
            <img src={sanitizeUrl(participant.bannerUrl)} alt="Background" className="absolute inset-0 w-full h-full object-cover opacity-[0.25] blur-[8px] scale-110 pointer-events-none" />
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-[#111111] via-transparent to-transparent opacity-80" />
          
          <div className="relative flex flex-col items-center gap-4 z-10 w-full px-4">
            <div className={`relative rounded-full transition-all duration-300 ${isSpeaking ? 'scale-105' : 'scale-100'}`}>
              <img 
                src={participant.avatarUrl ? sanitizeUrl(participant.avatarUrl) : `https://api.dicebear.com/7.x/initials/svg?seed=${participant.seed}`}
                alt={participant.displayName}
                className={`w-24 h-24 sm:w-32 sm:h-32 rounded-full object-cover border-[3px] transition-colors duration-300 shadow-2xl ${isSpeaking ? 'border-green-500' : 'border-zinc-700'}`}
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
            
            {/* Show name nicely when no video */}
            <div className={`px-4 py-1.5 rounded-full bg-black/40 backdrop-blur-md border border-white/5 shadow-xl flex items-center gap-2 max-w-full`}>
               <span className="text-white font-medium text-sm sm:text-base truncate">{participant.displayName} {isLocal && "(Você)"}</span>
               {isSpeaking ? <Volume2 className="w-4 h-4 text-green-400" /> : <MicOff className="w-4 h-4 text-red-400/80" />}
            </div>
          </div>
        </div>
      )}

      {hasVideo && (
        <div className="absolute bottom-4 left-4 bg-black/60 backdrop-blur-md px-3 py-1.5 rounded-lg border border-white/10 text-white font-medium text-sm flex items-center gap-2 shadow-lg">
           {participant.displayName} {isLocal && "(Você)"}
           {isSpeaking ? <Mic className="w-3.5 h-3.5 text-green-400" /> : <MicOff className="w-3.5 h-3.5 text-red-500" />}
        </div>
      )}
    </div>
  );
}

export default function CallRoom({ currentUser, conversation, callType, onEndCall }: CallRoomProps) {
  const callId = conversation._id;
  const { 
    isConnected, 
    localStream, 
    remoteStreams, 
    startLocalStream,
    replaceVideoTrack,
    connectSocket, 
    cleanup,
    pcMap
  } = useWebRTC({
    callId,
    userId: currentUser._id,
    userName: currentUser.username,
    isGroup: conversation.isGroup,
  });

  const controls = useCallControls(callId);

  const [isMuted, setIsMuted] = useState(false);
  const [hasVideo, setHasVideo] = useState(callType === 'video');
  const [isScreenSharing, setIsScreenSharing] = useState(false);
  const [isMinimized, setIsMinimized] = useState(false);
  
  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const [audioQuality, setAudioQuality] = useState<'low' | 'normal' | 'ultra' | 'lossless'>('normal');
  const [noiseSuppression, setNoiseSuppression] = useState(true);
  const [callVolume, setCallVolume] = useState(1);
  const [selectedMic, setSelectedMic] = useState<string>('default');
  const [selectedSpeaker, setSelectedSpeaker] = useState<string>('default');
  const [availableDevices, setAvailableDevices] = useState<MediaDeviceInfo[]>([]);
  const [networkQuality, setNetworkQuality] = useState<'Excelente'|'Boa'|'Ruim'>('Boa');

  const localVideoRef = useRef<HTMLVideoElement>(null);
  const screenStreamRef = useRef<MediaStream | null>(null);

  useEffect(() => {
    navigator.mediaDevices.enumerateDevices().then(devices => {
      setAvailableDevices(devices);
    }).catch(console.error);
  }, []);

  useEffect(() => {
    // 1. Initialize Stream
    const init = async () => {
      try {
        const stream = await startLocalStream(callType === 'video', {
           deviceId: selectedMic !== 'default' ? { exact: selectedMic } : undefined,
           noiseSuppression: noiseSuppression,
           echoCancellation: audioQuality !== 'lossless',
           autoGainControl: audioQuality !== 'lossless',
           sampleRate: audioQuality === 'low' ? 16000 : 48000
        });
        if (localVideoRef.current && callType === 'video') {
          localVideoRef.current.srcObject = stream;
        }
        connectSocket();
        
        // Play enter sound
        import("../services/soundService").then(s => s.soundService.playCallEnter());
      } catch (err: any) {
        console.error(err);
      }
    };
    init();

    return () => {
      cleanup();
      // Play leave sound
      import("../services/soundService").then(s => s.soundService.playCallLeave());
    };
  }, [callId, callType, startLocalStream, connectSocket, cleanup, selectedMic, noiseSuppression, audioQuality]);

  useEffect(() => {
    // Quality monitor
    const interval = setInterval(async () => {
      let maxPacketLoss = 0;
      let totalRTT = 0;
      let statsCount = 0;
      
      for (const pc of Object.values(pcMap) as RTCPeerConnection[]) {
         if (pc.signalingState === 'closed') continue;
         try {
           const stats = await pc.getStats();
           stats.forEach(report => {
             if (report.type === 'inbound-rtp' && report.kind === 'audio') {
                const lossRate = report.packetsLost / (report.packetsReceived + report.packetsLost || 1);
                maxPacketLoss = Math.max(maxPacketLoss, lossRate);
             }
             if (report.type === 'candidate-pair' && report.state === 'succeeded') {
                totalRTT += report.currentRoundTripTime || 0;
                statsCount++;
             }
           });
         } catch (err: any) {
           // Ignorar falha no pc.getStats caso caia ou a conexão feche rápido demais
         }
      }

      if (statsCount > 0) {
         const avgRTT = totalRTT / statsCount;
         if (maxPacketLoss > 0.05 || avgRTT > 0.3) setNetworkQuality('Ruim');
         else if (maxPacketLoss > 0.01 || avgRTT > 0.1) setNetworkQuality('Boa');
         else setNetworkQuality('Excelente');
      }
    }, 2000);

    return () => clearInterval(interval);
  }, [pcMap]);

  const toggleMute = async () => {
    if (localStream) {
      localStream.getAudioTracks().forEach(t => t.enabled = !t.enabled);
      const muted = !localStream.getAudioTracks()[0]?.enabled;
      setIsMuted(muted);
      if (muted) await controls.muteAudio();
      else await controls.unmuteAudio();
      
      // Play mute click
      import("../services/soundService").then(s => s.soundService.playCallMute());
    }
  };

  const toggleVideo = async () => {
    if (localStream) {
      if (hasVideo) {
         // Disable video
         localStream.getVideoTracks().forEach(t => t.stop());
         replaceVideoTrack(null);
         setHasVideo(false);
         await controls.disableVideo();
      } else {
         // Enable video
         const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
         const newVideoTrack = newStream.getVideoTracks()[0];
         if (localVideoRef.current) {
            localVideoRef.current.srcObject = new MediaStream([newVideoTrack, ...localStream.getAudioTracks()]);
         }
         replaceVideoTrack(newVideoTrack);
         setHasVideo(true);
         await controls.enableVideo();
      }
    }
  };

  const toggleScreenShare = async () => {
    if (!isScreenSharing) {
      if (!navigator.mediaDevices || !navigator.mediaDevices.getDisplayMedia) {
        toast.error("Screen sharing is not supported.");
        return;
      }
      try {
        const screenStream = await navigator.mediaDevices.getDisplayMedia({ 
          video: { width: { ideal: 1920 }, height: { ideal: 1080 }, frameRate: { ideal: 60 } },
          audio: true
        });
        screenStreamRef.current = screenStream;
        
        screenStream.getVideoTracks()[0].onended = () => {
          stopScreenShare();
        };

        if (localVideoRef.current) {
          localVideoRef.current.srcObject = screenStream;
        }
        
        replaceVideoTrack(screenStream.getVideoTracks()[0]);
        await controls.startScreenShare();
        setIsScreenSharing(true);
      } catch (err: any) {
        console.error('Error sharing screen', err);
      }
    } else {
      stopScreenShare();
    }
  };

  const stopScreenShare = async () => {
    if (screenStreamRef.current) {
      screenStreamRef.current.getTracks().forEach(t => t.stop());
      screenStreamRef.current = null;
    }
    
    // Resume camera if had video
    if (hasVideo) {
       const newStream = await navigator.mediaDevices.getUserMedia({ video: true });
       const newVideoTrack = newStream.getVideoTracks()[0];
       replaceVideoTrack(newVideoTrack);
       if (localVideoRef.current && localStream) {
         localVideoRef.current.srcObject = new MediaStream([newVideoTrack, ...localStream.getAudioTracks()]);
       }
    } else {
       replaceVideoTrack(null);
    }

    await controls.stopScreenShare();
    setIsScreenSharing(false);
  };


  const endCall = async () => {
    await controls.endCall();
    cleanup();
    onEndCall();
  };

  const getUserInfo = (userId: string) => {
    if (conversation.isGroup && conversation.participants) {
      return conversation.participants.find((p: any) => p._id === userId);
    }
    if (!conversation.isGroup && conversation.otherUser?._id === userId) {
      return conversation.otherUser;
    }
    return null;
  };

  const remoteUsers = Object.entries(remoteStreams).map(([id, stream]) => {
    const user = getUserInfo(id);
    return {
      id,
      stream,
      displayName: user ? (user.username || user.phoneNumber) : `Remote ${id.substring(0,4)}`,
      avatarUrl: user?.avatarUrl,
      bannerUrl: user?.bannerUrl,
      seed: user ? (user.username || user.phoneNumber || user._id) : id
    };
  });

  const localUser = {
    id: currentUser._id,
    stream: isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStream,
    displayName: "Me",
    avatarUrl: currentUser.avatarUrl,
    bannerUrl: currentUser.bannerUrl,
    seed: currentUser.username || currentUser._id
  };

  const participants = [...remoteUsers, localUser];

  useEffect(() => {
    if (isMinimized && localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = isScreenSharing && screenStreamRef.current ? screenStreamRef.current : localStream;
    }
  }, [isMinimized, localStream, isScreenSharing]);

  if (isMinimized) {
    return (
      <div 
        onClick={() => setIsMinimized(false)}
        className="fixed bottom-24 right-6 w-24 h-32 sm:w-32 sm:h-40 bg-zinc-900 rounded-2xl border-2 border-indigo-500 shadow-[0_0_20px_rgba(99,102,241,0.3)] overflow-hidden cursor-pointer z-50 flex items-center justify-center hover:scale-105 transition-transform group"
      >
         <video muted autoPlay playsInline ref={localVideoRef} className="absolute inset-0 w-full h-full object-contain" />
      </div>
    );
  }

  let gridCols = 'grid-cols-1';
  let gridRows = 'grid-rows-1';
  
  if (participants.length === 1) {
    gridCols = 'grid-cols-1';
    gridRows = 'grid-rows-1';
  } else if (participants.length === 2) {
    gridCols = 'grid-cols-1 md:grid-cols-2';
    gridRows = 'grid-rows-2 md:grid-rows-1';
  } else if (participants.length <= 4) {
    gridCols = 'grid-cols-2';
    gridRows = 'grid-rows-2';
  } else if (participants.length <= 6) {
    gridCols = 'grid-cols-2 md:grid-cols-3';
    gridRows = 'grid-rows-3 md:grid-rows-2';
  } else if (participants.length <= 8) {
    gridCols = 'grid-cols-2 md:grid-cols-4';
    gridRows = 'grid-rows-4 md:grid-rows-2';
  } else {
    gridCols = 'grid-cols-3 md:grid-cols-4';
    gridRows = 'grid-rows-4 md:grid-rows-3';
  }

  return (
    <div className="fixed inset-0 z-50 bg-[#0A0A0A] flex flex-col font-sans">
      <div className="flex items-center justify-between px-6 py-4 sm:py-6 text-white absolute top-0 inset-x-0 z-50 bg-gradient-to-b from-[#0A0A0A] to-transparent">
        <button onClick={() => setIsMinimized(true)} className="p-2 -ml-2 rounded-full hover:bg-white/10 transition backdrop-blur-md">
          <ChevronDown className="w-7 h-7" />
        </button>
        <div className="text-lg font-semibold flex items-center gap-2 drop-shadow-md">
           {conversation.name || 'Ligação'}
           <span className="text-xs font-bold uppercase tracking-wider bg-indigo-500/20 text-indigo-300 px-2.5 py-0.5 rounded-full border border-indigo-500/30">
             {isConnected ? 'Conectado' : 'Conectando...'}
           </span>
           {networkQuality !== 'Boa' && (
             <span className={`text-[10px] font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border flex items-center gap-1 ${networkQuality === 'Excelente' ? 'bg-green-500/20 text-green-400 border-green-500/30' : 'bg-red-500/20 text-red-400 border-red-500/30'}`}>
               <Wifi className="w-3 h-3" /> {networkQuality}
             </span>
           )}
        </div>
        <div className="flex gap-3">
          <button onClick={() => setShowSettings(true)} className="p-2 rounded-full hover:bg-white/10 transition text-zinc-300 backdrop-blur-md">
            <Settings2 className="w-5 h-5" />
          </button>
        </div>
      </div>

      <div className={`flex-1 w-full mx-auto flex items-center justify-center pt-20 sm:pt-24 pb-32 sm:pb-36 px-4`}>
        <div className={`w-full max-w-[1920px] h-full lg:w-[80%] lg:h-[80%] grid ${gridCols} ${gridRows} gap-4 sm:gap-6 overflow-hidden`}>
          {remoteUsers.map((p, i) => (
            <ParticipantView key={p.id} participant={p} volume={callVolume} />
          ))}
          <ParticipantView participant={localUser} isLocal={true} />
        </div>
      </div>

      <div className="absolute bottom-6 sm:bottom-10 left-1/2 -translate-x-1/2 z-50">
        <div className="bg-[#1C1C1E]/80 backdrop-blur-2xl border border-white/10 rounded-full px-6 py-3 sm:py-4 flex items-center justify-center gap-4 sm:gap-6 shadow-[0_0_40px_rgba(0,0,0,0.5)]">
           <button onClick={toggleVideo} className={`p-3.5 sm:p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${hasVideo ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-red-500/20 text-red-500 hover:bg-red-500/30'}`}>
               {hasVideo ? <Camera className="w-5 h-5 sm:w-6 sm:h-6" /> : <CameraOff className="w-5 h-5 sm:w-6 sm:h-6" />}
           </button>
           <button onClick={toggleMute} className={`p-3.5 sm:p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${!isMuted ? 'bg-white/10 text-white hover:bg-white/20' : 'bg-white text-black shadow-lg'}`}>
               {!isMuted ? <Mic className="w-5 h-5 sm:w-6 sm:h-6" /> : <MicOff className="w-5 h-5 sm:w-6 sm:h-6" />}
           </button>
           <button onClick={toggleScreenShare} className={`p-3.5 sm:p-4 rounded-full transition-all flex items-center justify-center hover:scale-105 active:scale-95 ${isScreenSharing ? 'bg-indigo-500 text-white shadow-[0_0_20px_rgba(99,102,241,0.4)]' : 'bg-white/10 text-white hover:bg-white/20'}`}>
               <MonitorUp className="w-5 h-5 sm:w-6 sm:h-6" />
           </button>
           
           <div className="w-px h-8 sm:h-10 bg-white/10 mx-1 sm:mx-2" />
           
           <button onClick={endCall} className="px-5 py-3.5 sm:px-8 sm:py-4 rounded-full bg-red-500 hover:bg-red-600 text-white transition-all flex items-center justify-center shadow-[0_0_20px_rgba(239,68,68,0.4)] hover:scale-105 active:scale-95 group">
              <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6 fill-current group-hover:-rotate-12 transition-transform" />
           </button>
        </div>
      </div>

      {showSettings && (
        <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-0 sm:p-4 animate-in fade-in.">
          <div className="w-full sm:w-[400px] bg-zinc-900 border border-zinc-800 rounded-t-3xl sm:rounded-3xl p-6 relative">
             <button onClick={() => setShowSettings(false)} className="absolute right-4 top-4 p-2 text-zinc-400 hover:text-white rounded-full bg-zinc-800/50">
               <X className="w-5 h-5" />
             </button>
             <h2 className="text-xl font-bold text-white mb-6">Configurações da Chamada</h2>
             
             <div className="space-y-5">
               <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Microfone</label>
                  <select 
                    value={selectedMic} 
                    onChange={e => setSelectedMic(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="default">Padrão do Sistema</option>
                    {availableDevices.filter(d => d.kind === 'audioinput').map(d => (
                       <option key={d.deviceId} value={d.deviceId}>{d.label || 'Microfone'}</option>
                    ))}
                  </select>
               </div>
               
               <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Saída de Áudio</label>
                  <select 
                    value={selectedSpeaker} 
                    onChange={e => setSelectedSpeaker(e.target.value)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="default">Padrão do Sistema</option>
                    {availableDevices.filter(d => d.kind === 'audiooutput').map(d => (
                       <option key={d.deviceId} value={d.deviceId}>{d.label || 'Alto-falante'}</option>
                    ))}
                  </select>
               </div>

               <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Volume da Chamada ({Math.round(callVolume * 100)}%)</label>
                  <input 
                    type="range" 
                    min="0" max="2" step="0.1" 
                    value={callVolume} 
                    onChange={e => setCallVolume(parseFloat(e.target.value))}
                    className="w-full h-1 bg-zinc-800 rounded-lg appearance-none cursor-pointer" 
                  />
               </div>

               <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-2 block">Qualidade de Áudio</label>
                  <select 
                    value={audioQuality} 
                    onChange={e => setAudioQuality(e.target.value as any)}
                    className="w-full bg-zinc-950 border border-zinc-800 rounded-xl p-3 text-sm text-zinc-100 outline-none focus:border-indigo-500"
                  >
                    <option value="low">Baixa</option>
                    <option value="normal">Normal</option>
                    <option value="ultra">Ultra (Alta Fidelidade)</option>
                    <option value="lossless">Sem Perdas (Estéreo Raw)</option>
                  </select>
               </div>

               <div className="flex items-center justify-between pt-2">
                 <div>
                   <p className="text-sm font-semibold text-zinc-100">Supressão de Ruído</p>
                   <p className="text-xs text-zinc-500 mt-0.5">Filtra sons de fundo</p>
                 </div>
                 <button 
                    onClick={() => setNoiseSuppression(!noiseSuppression)}
                    className={`w-11 h-6 rounded-full transition-colors relative ${noiseSuppression ? 'bg-indigo-500' : 'bg-zinc-700'}`}
                 >
                    <span className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform ${noiseSuppression ? 'translate-x-5' : 'translate-x-0'}`} />
                 </button>
               </div>
             </div>
          </div>
        </div>
      )}
    </div>
  );
}
