const fs = require('fs');
const file = 'src/components/NexusAI.tsx';
let code = fs.readFileSync(file, 'utf8');

// Replace VoiceAssistantControlBar and Chat imports with primitives
if (!code.includes('useChat')) {
  code = code.replace(
    /VoiceAssistantControlBar,\s*BarVisualizer,\s*useVoiceAssistant,\s*useConnectionState,\s*useTracks,\s*VideoTrack,\s*Chat/g,
    'BarVisualizer,\n  useVoiceAssistant,\n  useConnectionState,\n  useTracks,\n  VideoTrack,\n  useChat,\n  DisconnectButton,\n  TrackToggle'
  );

  const customComponents = `
function CustomControlBar() {
  return (
    <div className="flex items-center gap-4 bg-zinc-900 border border-zinc-800 rounded-full px-4 py-2 shadow-lg">
      <TrackToggle source={Track.Source.Microphone} className="p-3 bg-zinc-800 hover:bg-zinc-700 rounded-full transition-colors text-white" />
      <DisconnectButton className="p-3 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-full transition-colors font-medium flex items-center gap-2">
         Desconectar
      </DisconnectButton>
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
             <div key={msg.id || i} className={\`max-w-[85%] rounded-xl px-3 py-2 text-sm \${isAgent ? 'bg-zinc-800 text-zinc-200 self-start' : 'bg-indigo-600 text-white self-end'}\`}>
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
`;

  code = code + customComponents;

  code = code.replace(
    /<VoiceAssistantControlBar \/>/g,
    '<CustomControlBar />'
  );

  code = code.replace(
    /<Chat className="w-full h-full text-zinc-300 flex-1 overflow-hidden" messageFormatter=\{\(text\) => text\} \/>/g,
    '<CustomChat />'
  );

  fs.writeFileSync(file, code);
  console.log("NexusAI custom UI injected.");
}
