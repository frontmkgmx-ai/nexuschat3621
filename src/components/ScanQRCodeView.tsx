import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { rtdb, db } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { doc, updateDoc, arrayUnion, arrayRemove } from 'firebase/firestore';
import { toast } from 'sonner';
import { Monitor, Phone, Trash2, ShieldCheck, QrCode } from 'lucide-react';
import { format } from 'date-fns';

export default function ScanQRCodeView({ currentUser }: { currentUser: any }) {
  const [scanned, setScanned] = useState(false);

  const handleScan = async (result: any[]) => {
    if (scanned || !result.length) return;
    const data = result[0].rawValue;
    // We expect the QR code to be a JSON string like {"type":"login","sessionId":"uuid"}
    let parsed;
    try {
      parsed = JSON.parse(data);
    } catch {
      toast.error('QR Code inválido');
      return;
    }

    if (parsed.type === 'login' && parsed.sessionId) {
      setScanned(true);
      try {
        await set(ref(rtdb, `qrLogins/${parsed.sessionId}`), {
          status: 'success',
          userId: currentUser._id,
          timestamp: Date.now()
        });

        const deviceInfo = parsed.deviceInfo || {
          id: parsed.sessionId,
          device: "Navegador Desconhecido",
          lastActive: Date.now()
        };

        if (currentUser._id) {
          await updateDoc(doc(db, "users", currentUser._id), {
            activeSessions: arrayUnion(deviceInfo)
          });
        }

        toast.success('Login autorizado com sucesso no desktop!');
      } catch (e) {
        console.error(e);
        toast.error('Erro ao autorizar login. Tente novamente.');
        setScanned(false);
      }
    } else {
      toast.error('QR Code não reconhecido.');
    }
  };

  const handleRemoveSession = async (session: any) => {
    try {
      await updateDoc(doc(db, "users", currentUser._id), {
        activeSessions: arrayRemove(session)
      });
      toast.success('Sessão encerrada remotamente.');
    } catch(e) {
      toast.error('Erro ao remover sessão.');
    }
  };

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 relative z-20">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          Leitor QR Code & Sessões
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar flex flex-col items-center">
        {!scanned ? (
          <div className="w-full flex-col flex items-center">
            <p className="text-zinc-400 mb-6 text-center max-w-sm">
              Aponte a câmera para o QR Code no seu dispositivo Desktop para fazer login.
            </p>
            <div className="w-full max-w-md bg-zinc-800 p-2 rounded-2xl overflow-hidden shadow-xl aspect-square relative mb-8">
               <Scanner onScan={handleScan} />
               <div className="absolute inset-0 border-2 border-indigo-500/30 rounded-2xl pointer-events-none" />
            </div>
          </div>
        ) : (
          <div className="w-full max-w-md bg-zinc-800 p-8 rounded-2xl overflow-hidden shadow-xl flex flex-col items-center justify-center text-green-400 gap-4 mb-8">
             <ShieldCheck className="w-16 h-16" />
             <span className="font-semibold text-lg text-green-300">Acesso Autorizado!</span>
             <button onClick={() => setScanned(false)} className="mt-4 px-5 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-xl text-white font-medium transition-colors shadow-lg">Scanear Outro</button>
          </div>
        )}

        <div className="w-full max-w-md">
          <h3 className="text-zinc-100 font-semibold mb-4 flex items-center gap-2">
            <Monitor className="w-5 h-5 text-indigo-400" />
            Dispositivos Conectados
          </h3>
          <div className="space-y-3">
             {(!currentUser?.activeSessions || currentUser.activeSessions.length === 0) ? (
               <div className="bg-zinc-800/50 rounded-xl p-4 text-center text-zinc-500">
                  Nenhum outro dispositivo conectado encontrado.
               </div>
             ) : (
               currentUser.activeSessions.map((session: any) => (
                 <div key={session.id} className="flex items-center justify-between bg-zinc-800/80 p-4 rounded-xl border border-zinc-700/50">
                    <div className="flex flex-col gap-1 overflow-hidden pr-3">
                       <span className="text-zinc-200 font-medium truncate flex items-center gap-1.5">
                         {session.device?.includes("Device") || session.device?.includes("Mobi") || session.device?.includes("Android") ? <Phone className="w-4 h-4 text-zinc-400 shrink-0" /> : <Monitor className="w-4 h-4 text-zinc-400 shrink-0" />}
                         {session.device || "Dispositivo Desconhecido"}
                         {session.id === currentUser.sessionId && (
                           <span className="ml-2 text-[10px] uppercase font-bold bg-indigo-500/20 text-indigo-400 px-2 py-0.5 rounded-full whitespace-nowrap">Este App</span>
                         )}
                       </span>
                       <span className="text-zinc-500 text-xs truncate">
                         Último acesso: {session.lastActive ? format(session.lastActive, "dd/MM/yyyy HH:mm") : 'Desconhecido'}
                       </span>
                    </div>
                    {session.id !== currentUser.sessionId && (
                      <button onClick={() => handleRemoveSession(session)} className="p-2.5 bg-red-500/10 hover:bg-red-500/20 text-red-400 rounded-lg transition-colors shrink-0" title="Desconectar dispositivo">
                         <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                 </div>
               ))
             )}
          </div>
        </div>
      </div>
    </div>
  );
}
