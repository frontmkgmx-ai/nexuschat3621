import React, { useState, useEffect } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  BarVisualizer,
  useVoiceAssistant,
  useConnectionState,
  useTracks,
  VideoTrack,
  useChat,
  DisconnectButton,
  TrackToggle
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import '@livekit/components-styles';
import { Bot, X, Loader2, Mic } from 'lucide-react';
import { toast } from 'sonner';

export default function NexusAI({ currentUser, onClose }: { currentUser: any, onClose: () => void }) {
  const [token, setToken] = useState<string | null>(null);
  const [errorState, setErrorState] = useState<boolean>(false);
  const [url, setUrl] = useState<string | null>(null);

  const connectToAI = async () => {
    setErrorState(false);
    try {
      const res = await fetch(`/api/livekit/token?room=nexus-ai-${currentUser._id}&name=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to connect');
      
      setToken(data.token);
      setUrl(data.url);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar ao Agente AI');
      setErrorState(true);
    }
  };

  useEffect(() => {
    connectToAI();
  }, []);

  return (
    <div className="flex flex-col h-full relative w-full bg-zinc-950 z-[100] md:z-10 min-w-0 min-h-0">
      <div className="flex justify-between items-center p-3 md:p-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
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

      <div className="flex-1 relative flex flex-col items-center justify-center p-2 md:p-4 min-h-0 overflow-hidden">
        {errorState ? (
          <div className="flex flex-col items-center text-zinc-400 gap-4">
            <p className="font-medium text-sm text-red-400">Falha na conexão com o servidor.</p>
            <button onClick={connectToAI} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium text-sm transition-colors">Tentar Novamente</button>
          </div>
        ) : !token || !url ? (
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
            video={false}
            className="w-full h-full flex flex-col min-h-0"
            onError={(err: any) => { console.error("LiveKit Error:", err); if (err?.message?.includes("Client initiated disconnect") || err?.message?.includes("ParticipantDisconnected")) return; toast.error("Falha na conexão com o servidor AI."); setToken(null); setErrorState(true); }}
            onDisconnected={() => {
              setToken(null);
              onClose();
            }}
          >
            <RoomAudioRenderer />
            <AgentInterface onClose={onClose} />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}

function AgentInterface({ onClose }: { onClose: () => void }) {
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
    <div className="flex flex-col md:flex-row items-center justify-start md:justify-center w-full max-w-5xl gap-4 md:gap-10 h-full p-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 flex-shrink-0">
        <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 shrink-0 rounded-full overflow-hidden border border-zinc-700/50 shadow-2xl flex items-center justify-center bg-zinc-900/50 group">
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
                  <Bot className={`w-16 h-16 md:w-20 md:h-20 text-zinc-700 transition-all ${state === 'thinking' ? 'animate-bounce text-purple-500' : ''}`} />
               )}
             </>
          )}
          
          <div className={`absolute inset-0 rounded-full border border-transparent ${state === 'speaking' ? 'border-purple-500/30 scale-[1.02] transition-all duration-300' : ''}`} />
        </div>

        <div className="text-center mt-4 md:mt-6">
          <h3 className="text-lg md:text-xl font-semibold text-white mb-1 tracking-tight">Assistente de Voz</h3>
          <p className="text-xs md:text-sm text-zinc-400 capitalize font-medium">{getStatusText()}</p>
          <p className="hidden md:block text-xs text-zinc-500 mt-2 max-w-[250px] mx-auto text-balance">
             Fale naturalmente pelo microfone ou use o chat ao lado.
          </p>
        </div>

        <div className="w-full flex justify-center mt-4 md:mt-6">
          <CustomControlBar onClose={onClose} />
        </div>
      </div>
      
      <div className="w-full md:w-1/2 flex flex-col items-center justify-start md:justify-center h-[350px] md:h-[500px] mb-4 md:mb-0 shrink-0">
        <div className="w-full h-full max-w-sm border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/80 flex flex-col shadow-xl">
          <CustomChat />
        </div>
      </div>
    </div>
  );
}

function CustomControlBar({ onClose }: { onClose: () => void }) {
  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 shadow-lg">
      <TrackToggle source={Track.Source.Microphone} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white" />
      <button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors font-medium flex items-center gap-2">
         Desconectar
      </button>
    </div>
  );
}

function CustomChat() {
  const { chatMessages, send, isSending } = useChat();
  const [input, setInput] = useState("");
  
  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    if (input.trim() && !isSending) {
      send(input);
      setInput("");
    }
  };

  return (
    <div className="flex flex-col h-full w-full bg-zinc-900/80">
      <div className="p-3 border-b border-zinc-800 font-medium text-white flex justify-between items-center bg-zinc-900">
         Mensagens
      </div>
      <div className="flex-1 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar">
        {chatMessages.length === 0 && (
          <div className="text-center text-zinc-500 text-sm mt-4">Nenhuma mensagem ainda.</div>
        )}
        {chatMessages.map((msg, i) => {
           const isAgent = msg.from?.identity !== undefined && !msg.from?.identity.startsWith('user-');
           return (
             <div key={msg.id || i} className={`max-w-[85%] rounded-xl px-3 py-2 text-sm ${isAgent ? 'bg-zinc-800 text-zinc-200 self-start' : 'bg-indigo-600 text-white self-end'}`}>
               {msg.message}
             </div>
           );
        })}
      </div>
      <form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2">
        <input 
          type="text" 
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Digite uma mensagem..." 
          className="flex-1 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500"
        />
        <button type="submit" disabled={isSending || !input.trim()} className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors">
          Enviar
        </button>
      </form>
    </div>
  );
}
