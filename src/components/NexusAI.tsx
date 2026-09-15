import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  VoiceAssistantControlBar,
  BarVisualizer,
  useVoiceAssistant,
  useConnectionState,
  useTracks,
  VideoTrack,
  Chat
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import '@livekit/components-styles';
import { Bot, X, Loader2, Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function NexusAI({ currentUser, onClose }: { currentUser: any, onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [url, setUrl] = useState<string | null>(null);

  const connectToAI = async () => {
    try {
      const res = await fetch(`/api/livekit/token?room=nexus-ai-${currentUser._id}&name=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      
      setToken(data.token);
      setUrl(data.url);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar ao Agente AI');
    }
  };

  useEffect(() => {
    connectToAI();
  }, []);

  return (
    <div className="flex flex-col h-full absolute inset-0 w-full bg-zinc-950 z-[100] md:z-10">
      <div className="flex justify-between items-center p-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20">
            <Bot className="w-6 h-6 text-white" />
          </div>
          <div>
            <h2 className="text-xl font-display font-bold text-white tracking-tight">Nexus AI</h2>
            <p className="text-xs text-indigo-400 font-medium">SAC & Triagem por Voz</p>
          </div>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 md:hidden">
          <X className="w-6 h-6" />
        </button>
      </div>

      <div className="flex-1 relative flex flex-col items-center justify-center p-4">
        {!token || !url ? (
          <div className="flex flex-col items-center text-zinc-400 gap-4">
            <Loader2 className="w-8 h-8 animate-spin text-purple-500" />
            <p className="font-medium text-sm">Conectando ao núcleo de IA...</p>
          </div>
        ) : (
          <LiveKitRoom
            token={token}
            serverUrl={url}
            connect={true}
            audio={true}
            video={true}
            className="w-full h-full flex flex-col items-center justify-center"
            onDisconnected={() => {
              setToken(null);
            }}
          >
            <RoomAudioRenderer />
            <AgentInterface />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}

function AgentInterface() {
  const { state, audioTrack } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const tracks = useTracks([Track.Source.Camera]);
  const agentVideoTrack = tracks.find((t) => t.participant.isAgent);

  const getStatusText = () => {
    if (connectionState === ConnectionState.Connecting) return "Conectando...";
    if (state === 'initializing') return "Inicializando Agente...";
    if (state === 'listening') return "Ouvindo...";
    if (state === 'speaking') return "Respondendo...";
    if (state === 'thinking') return "Pensando...";
    return "Aguardando...";
  };

  return (
    <div className="flex flex-col md:flex-row items-stretch justify-center w-full max-w-5xl gap-10">
      <div className="flex flex-col items-center justify-center w-full md:w-1/2">
        <div className="relative w-48 h-48 sm:w-64 sm:h-64 rounded-full overflow-hidden border border-zinc-700/50 shadow-2xl flex items-center justify-center bg-zinc-900/50 group">
          <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 ${state === 'speaking' ? 'animate-pulse' : ''}`} />
          
          {agentVideoTrack ? (
             <VideoTrack 
               trackRef={agentVideoTrack} 
               className="w-full h-full object-cover rounded-full z-10 relative" 
             />
          ) : (
             <>
               {audioTrack ? (
                  <BarVisualizer
                    state={state}
                    barCount={5}
                    trackRef={audioTrack}
                    className="w-full h-24 z-10 mix-blend-screen opacity-90"
                    options={{ minHeight: 12 }}
                  />
               ) : (
                  <Bot className={`w-20 h-20 text-zinc-700 transition-all ${state === 'thinking' ? 'animate-bounce text-purple-500' : ''}`} />
               )}
             </>
          )}
          
          <div className={`absolute inset-0 rounded-full border border-transparent ${state === 'speaking' ? 'border-purple-500/30 scale-[1.02] transition-all duration-300' : ''}`} />
        </div>

        <div className="text-center mt-6">
          <h3 className="text-xl font-semibold text-white mb-1 tracking-tight">Assistente de Voz</h3>
          <p className="text-sm text-zinc-400 capitalize font-medium">{getStatusText()}</p>
          <p className="text-xs text-zinc-500 mt-2 max-w-[250px] mx-auto text-balance">
             Fale naturalmente pelo microfone ou use o chat ao lado.
          </p>
        </div>

        <div className="w-full flex justify-center mt-6">
          <VoiceAssistantControlBar />
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex flex-col items-center justify-center min-h-[400px]">
        <div className="w-full h-full max-w-sm border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/80 flex flex-col">
          <Chat className="w-full h-full text-zinc-300" messageFormatter={(text) => text} />
        </div>
      </div>
    </div>
  );
}
