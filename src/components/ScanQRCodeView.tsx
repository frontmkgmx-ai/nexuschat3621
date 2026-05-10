import React, { useState } from 'react';
import { Scanner } from '@yudiel/react-qr-scanner';
import { rtdb } from '../lib/firebase';
import { ref, set } from 'firebase/database';
import { toast } from 'sonner';

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

  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 relative z-20">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h2 className="text-xl font-semibold text-zinc-100 flex items-center gap-2">
          Leitor QR Code
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto overflow-x-hidden p-6 custom-scrollbar flex flex-col items-center">
        <p className="text-zinc-400 mb-6 text-center max-w-sm">
          Aponte a câmera para o QR Code no seu dispositivo Desktop para fazer login.
        </p>
        <div className="w-full max-w-md bg-zinc-800 p-2 rounded-2xl overflow-hidden shadow-xl aspect-square">
           {!scanned ? (
              <Scanner onScan={handleScan} />
           ) : (
              <div className="w-full h-full flex flex-col items-center justify-center text-green-400 gap-4">
                 <svg className="w-16 h-16" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" /></svg>
                 <span className="font-semibold text-lg">Autorizado!</span>
                 <button onClick={() => setScanned(false)} className="mt-4 px-4 py-2 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-white">Scanear Novamente</button>
              </div>
           )}
        </div>
      </div>
    </div>
  );
}
