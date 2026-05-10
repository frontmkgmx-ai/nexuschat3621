import React, { useState, useEffect } from 'react';
import { Activity, Server, Wifi, Video, Mic, Share, ShieldCheck } from 'lucide-react';

export default function DiagnosticPanel() {
  const [apiStatus, setApiStatus] = useState<string>("Verificando...");
  const [socketStatus, setSocketStatus] = useState<string>("Aguardando conexão...");
  const [webRtcStatus, setWebRtcStatus] = useState<string>("Pendente");
  
  const API_URL = import.meta.env.VITE_CALL_API_URL || 'Padrão Interno';
  const WS_URL = import.meta.env.VITE_CALL_WS_URL || 'Padrão Interno';
  const SOCKET_PATH = import.meta.env.VITE_CALL_SOCKET_PATH || '/socket.io';

  const [testResults, setTestResults] = useState({
    mic: 'Pendente',
    cam: 'Pendente',
    screen: 'Pendente'
  });

  useEffect(() => {
    // Test API Health
    fetch(`${API_URL}/health`)
      .then(res => res.json())
      .then(data => {
        if (data.ok) setApiStatus("Online (Saudável)");
        else setApiStatus("Com resposta, mas com erro");
      })
      .catch((e) => {
        setApiStatus(`Offline ou inacessível (${e.message})`);
      });

  }, [API_URL]);

  const testMic = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
      setTestResults(prev => ({ ...prev, mic: 'Sucesso' }));
    } catch {
      setTestResults(prev => ({ ...prev, mic: 'Falha ou Negado' }));
    }
  };

  const testCam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setTestResults(prev => ({ ...prev, cam: 'Sucesso' }));
    } catch {
      setTestResults(prev => ({ ...prev, cam: 'Falha ou Negado' }));
    }
  };

  const testScreen = async () => {
    try {
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: true });
      stream.getTracks().forEach(t => t.stop());
      setTestResults(prev => ({ ...prev, screen: 'Sucesso' }));
    } catch {
      setTestResults(prev => ({ ...prev, screen: 'Falha ou Negado' }));
    }
  };

  return (
    <div className="bg-zinc-950 p-6 rounded-2xl border border-zinc-800 space-y-6 text-sm text-zinc-300 shadow-xl max-w-2xl w-full">
      <div className="flex items-center gap-3 border-b border-zinc-800 pb-4">
        <Activity className="w-5 h-5 text-indigo-400" />
        <h2 className="text-lg font-bold text-white">Painel de Diagnóstico Nexus Calls</h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-2 font-semibold text-white">
            <Server className="w-4 h-4 text-emerald-400" /> Servidor API
          </div>
          <div className="space-y-1">
            <p><span className="text-zinc-500">URL:</span> <span className="font-mono text-xs">{API_URL}</span></p>
            <p><span className="text-zinc-500">Status:</span> {apiStatus}</p>
          </div>
        </div>

        <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
          <div className="flex items-center gap-2 mb-2 font-semibold text-white">
            <Wifi className="w-4 h-4 text-blue-400" /> Socket.IO
          </div>
          <div className="space-y-1">
            <p><span className="text-zinc-500">URL WS:</span> <span className="font-mono text-xs">{WS_URL}</span></p>
            <p><span className="text-zinc-500">Path:</span> <span className="font-mono text-xs">{SOCKET_PATH}</span></p>
            <p><span className="text-zinc-500">Nota:</span> Use o módulo de chamada para testar a conexão realtime real.</p>
          </div>
        </div>
      </div>

      <div className="bg-zinc-900/50 p-4 rounded-xl border border-zinc-800">
        <div className="flex items-center gap-2 mb-2 font-semibold text-white">
          <ShieldCheck className="w-4 h-4 text-indigo-400" /> Testes Locais de Permissão (WebRTC)
        </div>
        
        <div className="flex flex-col gap-3 mt-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Mic className="w-4 h-4 text-zinc-400" /> Microfone
              <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full">{testResults.mic}</span>
            </div>
            <button onClick={testMic} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition">Testar</button>
          </div>
          
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Video className="w-4 h-4 text-zinc-400" /> Câmera
              <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full">{testResults.cam}</span>
            </div>
            <button onClick={testCam} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition">Testar</button>
          </div>

          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Share className="w-4 h-4 text-zinc-400" /> Compartilhamento
              <span className="text-xs px-2 py-0.5 bg-zinc-800 rounded-full">{testResults.screen}</span>
            </div>
            <button onClick={testScreen} className="px-3 py-1 bg-indigo-600 hover:bg-indigo-500 text-white rounded text-xs transition">Testar</button>
          </div>
        </div>
      </div>
      
      <p className="text-xs text-zinc-500 pt-2 text-center">Nenhum endereço de IP sensível interno ou token é exibido neste painel.</p>
    </div>
  );
}
