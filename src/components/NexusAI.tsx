import React, { useEffect, useRef, useState } from 'react';
import {
  LiveKitRoom,
  RoomAudioRenderer,
  StartAudio,
  BarVisualizer,
  useVoiceAssistant,
  useConnectionState,
  useTracks,
  VideoTrack,
  useChat,
  TrackToggle,
} from '@livekit/components-react';
import { ConnectionState, Track } from 'livekit-client';
import '@livekit/components-styles';
import { Bot, X, Loader2, Check, ExternalLink } from 'lucide-react';
import { toast } from 'sonner';
import { parseNexusAgentAction, type NexusAgentAction } from '../services/nexusAgentProtocol';

type Props = {
  currentUser: any;
  onClose: () => void;
  onNavigate?: (route: NonNullable<NexusAgentAction['route']>) => void;
};

export default function NexusAI({ currentUser, onClose, onNavigate }: Props) {
  const [token, setToken] = useState<string | null>(null);
  const [errorState, setErrorState] = useState(false);
  const [url, setUrl] = useState<string | null>(null);
  const isConnecting = useRef(false);

  const connectToAI = async () => {
    if (isConnecting.current) return;
    isConnecting.current = true;
    setErrorState(false);
    try {
      const room = `nexus-ai-${currentUser._id}`;
      const res = await fetch(`/api/livekit/token?room=${encodeURIComponent(room)}&name=${encodeURIComponent(currentUser.username)}`);
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Falha ao conectar');
      setToken(data.token);
      setUrl(data.url);
    } catch (err: any) {
      toast.error(err.message || 'Erro ao conectar ao Agente AI');
      setErrorState(true);
    } finally {
      isConnecting.current = false;
    }
  };

  useEffect(() => { void connectToAI(); }, []);

  return (
    <div className="flex flex-col h-full relative w-full bg-zinc-950 z-[100] md:z-10 min-w-0 min-h-0">
      <div className="flex justify-between items-center p-3 md:p-4 border-b border-zinc-800/80 bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-gradient-to-r from-purple-600 to-indigo-600 flex items-center justify-center shadow-lg shadow-purple-500/20"><Bot className="w-6 h-6 text-white" /></div>
          <div><h2 className="text-xl font-display font-bold text-white tracking-tight">Nexus AI</h2><p className="text-xs text-indigo-400 font-medium">SAC & Triagem por Voz</p></div>
        </div>
        <button onClick={onClose} className="text-zinc-400 hover:text-white p-2 md:hidden" aria-label="Fechar"><X className="w-6 h-6" /></button>
      </div>
      <div className="flex-1 relative flex flex-col items-center justify-center p-2 md:p-4 min-h-0 overflow-hidden">
        {errorState ? (
          <div className="flex flex-col items-center text-zinc-400 gap-4"><p className="font-medium text-sm text-red-400">Falha na conexão com o servidor.</p><button onClick={connectToAI} className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 rounded-lg text-white font-medium text-sm">Tentar Novamente</button></div>
        ) : !token || !url ? (
          <div className="flex flex-col items-center text-zinc-400 gap-4"><Loader2 className="w-8 h-8 animate-spin text-purple-500" /><p className="font-medium text-sm">Conectando ao núcleo de IA...</p></div>
        ) : (
          <LiveKitRoom token={token} serverUrl={url} connect audio video={false} className="w-full h-full flex flex-col min-h-0"
            onError={(err: any) => { console.error('LiveKit Error:', err); toast.error('Falha na conexão com o servidor AI.'); setToken(null); setErrorState(true); }}
            onDisconnected={() => { setToken(null); onClose(); }}>
            <RoomAudioRenderer />
            <StartAudio label="Ativar áudio do Nexus AI" className="mx-auto mb-2 rounded-lg bg-indigo-600 px-3 py-2 text-sm text-white" />
            <AgentInterface onClose={onClose} onNavigate={onNavigate} />
          </LiveKitRoom>
        )}
      </div>
    </div>
  );
}

function AgentInterface({ onClose, onNavigate }: { onClose: () => void; onNavigate?: Props['onNavigate'] }) {
  const { state, audioTrack } = useVoiceAssistant();
  const connectionState = useConnectionState();
  const tracks = useTracks([Track.Source.Camera]);
  const agentVideoTrack = tracks.find((t) => t.participant.isAgent);
  const getStatusText = () => {
    if (connectionState === ConnectionState.Connecting) return 'Conectando...';
    if (state === 'initializing') return 'Inicializando Agente...';
    if (state === 'listening') return 'Ouvindo...';
    if (state === 'speaking') return 'Respondendo...';
    if (state === 'thinking') return 'Pensando...';
    return 'Aguardando...';
  };
  return (
    <div className="flex flex-col md:flex-row items-center justify-start md:justify-center w-full max-w-5xl gap-4 md:gap-10 h-full p-2 overflow-y-auto custom-scrollbar">
      <div className="flex flex-col items-center justify-center w-full md:w-1/2 flex-shrink-0">
        <div className="relative w-32 h-32 sm:w-48 sm:h-48 md:w-64 md:h-64 shrink-0 rounded-full overflow-hidden border border-zinc-700/50 shadow-2xl flex items-center justify-center bg-zinc-900/50">
          <div className={`absolute inset-0 bg-gradient-to-br from-purple-500/10 to-indigo-500/10 ${state === 'speaking' ? 'animate-pulse' : ''}`} />
          {agentVideoTrack ? <VideoTrack trackRef={agentVideoTrack} className="w-full h-full object-cover rounded-full z-10 relative" /> : audioTrack ? <BarVisualizer state={state} barCount={5} trackRef={audioTrack} className="w-full h-24 z-10 mix-blend-screen opacity-90" options={{ minHeight: 12 }} /> : <Bot className={`w-16 h-16 md:w-20 md:h-20 text-zinc-700 ${state === 'thinking' ? 'animate-bounce text-purple-500' : ''}`} />}
          <div className={`absolute inset-0 rounded-full border border-transparent ${state === 'speaking' ? 'border-purple-500/30 scale-[1.02] transition-all duration-300' : ''}`} />
        </div>
        <div className="text-center mt-4 md:mt-6"><h3 className="text-lg md:text-xl font-semibold text-white mb-1">Assistente de Voz</h3><p className="text-xs md:text-sm text-zinc-400 capitalize font-medium">{getStatusText()}</p><p className="hidden md:block text-xs text-zinc-500 mt-2 max-w-[250px] mx-auto">Fale naturalmente pelo microfone ou use o chat ao lado.</p></div>
        <div className="w-full flex justify-center mt-4 md:mt-6"><div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 shadow-lg"><TrackToggle source={Track.Source.Microphone} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full text-white" /><button onClick={onClose} className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full font-medium">Desconectar</button></div></div>
      </div>
      <div className="w-full md:w-1/2 flex flex-col items-center justify-start md:justify-center h-[350px] md:h-[500px] mb-4 md:mb-0 shrink-0"><div className="w-full h-full max-w-sm border border-zinc-800/80 rounded-xl overflow-hidden bg-zinc-900/80 flex flex-col shadow-xl"><CustomChat onNavigate={onNavigate} /></div></div>
    </div>
  );
}

function ActionCard({ action, onNavigate, onSend }: { action: NexusAgentAction; onNavigate?: Props['onNavigate']; onSend: (message: string) => void }) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [confirmed, setConfirmed] = useState(false);
  const submit = () => {
    if (action.type === 'navigate' && action.route) { onNavigate?.(action.route); return; }
    if (action.type === 'form') { onSend(`NEXUS_FORM_RESULT:${JSON.stringify({ id: action.id, values })}`); setConfirmed(true); return; }
    if (action.type === 'confirm') { onSend(`NEXUS_CONFIRM_RESULT:${JSON.stringify({ id: action.id, confirmed: true })}`); setConfirmed(true); }
  };
  return <div className="rounded-xl border border-indigo-500/30 bg-indigo-950/30 p-3 mt-2 space-y-3"><div className="font-medium text-white">{action.title || 'Ação do Nexus AI'}</div>{action.message && <p className="text-sm text-zinc-300">{action.message}</p>}{action.fields?.map(field => <label key={field.name} className="block text-xs text-zinc-300">{field.label}<input required={field.required} type={field.type} value={values[field.name] || ''} onChange={e => setValues(v => ({ ...v, [field.name]: e.target.value }))} className="mt-1 w-full rounded-lg bg-zinc-900 border border-zinc-700 px-2 py-1.5 text-sm text-white" /></label>)}{confirmed ? <div className="flex items-center gap-2 text-emerald-400 text-sm"><Check className="w-4 h-4" /> Enviado ao agente</div> : <button onClick={submit} className="inline-flex items-center gap-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 px-3 py-2 text-sm text-white">{action.type === 'navigate' ? <ExternalLink className="w-4 h-4" /> : <Check className="w-4 h-4" />} {action.type === 'confirm' ? 'Confirmar' : action.type === 'navigate' ? 'Abrir' : 'Enviar'}</button>}</div>;
}

function CustomChat({ onNavigate }: { onNavigate?: Props['onNavigate'] }) {
  const { chatMessages, send, isSending } = useChat();
  const [input, setInput] = useState('');
  const [sendError, setSendError] = useState<string | null>(null);
  const sendText = async (text: string) => {
    const value = text.trim();
    if (!value || isSending) return false;
    setSendError(null);
    try {
      await send(value);
      return true;
    } catch (error: any) {
      console.error('LiveKit chat send failed:', error);
      setSendError(error?.message || 'Não foi possível enviar a mensagem.');
      toast.error('Não foi possível enviar a mensagem ao agente.');
      return false;
    }
  };
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (await sendText(input)) setInput('');
  };
  return <div className="flex flex-col h-full min-h-0 w-full bg-zinc-900/80"><div className="p-3 border-b border-zinc-800 font-medium text-white bg-zinc-900">Mensagens e ações</div><div className="flex-1 min-h-0 overflow-y-auto p-4 flex flex-col gap-3 custom-scrollbar" aria-live="polite">{chatMessages.length === 0 && <div className="text-center text-zinc-500 text-sm mt-4">Nenhuma mensagem ainda.</div>}{chatMessages.map((msg, i) => { const messageText = typeof msg.message === 'string' ? msg.message : ''; const action = parseNexusAgentAction(messageText); const isAgent = Boolean(msg.from && !msg.from.isLocal); return <div key={`${msg.timestamp || 'message'}-${i}`} className={`max-w-[90%] rounded-xl px-3 py-2 text-sm break-words ${isAgent ? 'bg-zinc-800 text-zinc-200 self-start' : 'bg-indigo-600 text-white self-end'}`}>{action ? <ActionCard action={action} onNavigate={onNavigate} onSend={sendText} /> : messageText || 'Mensagem sem conteúdo'}</div>; })}</div>{sendError && <div className="px-3 py-1 text-xs text-red-300 bg-red-950/40" role="alert">{sendError}</div>}<form onSubmit={handleSend} className="p-3 border-t border-zinc-800 flex gap-2"><input type="text" value={input} onChange={e => setInput(e.target.value)} placeholder="Digite uma mensagem..." aria-label="Mensagem para o Nexus AI" className="flex-1 min-w-0 bg-zinc-800 border border-zinc-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500" /><button type="submit" disabled={isSending || !input.trim()} className="shrink-0 bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm font-medium">Enviar</button></form></div>;
}
