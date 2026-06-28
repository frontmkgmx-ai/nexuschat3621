import React, { useState } from "react";
import { X, Shield, Clock } from "lucide-react";
import { updateDoc, doc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { toast } from "sonner";
import { motion, AnimatePresence } from "motion/react";

export default function OnboardingModal({ currentUser, onClose }: { currentUser: any; onClose: () => void }) {
  const [retention, setRetention] = useState<"permanent" | "24h">("permanent");
  const [e2ee, setE2ee] = useState<boolean>(true);
  const [loading, setLoading] = useState(false);

  const handleSave = async () => {
    setLoading(true);
    try {
      await updateDoc(doc(db, "users", currentUser._id), {
        retentionPolicy: retention,
        e2eEncryptionDefault: e2ee,
        onboardingCompleted: true
      });
      toast.success("Preferências salvas com sucesso!");
      onClose();
    } catch (e) {
      toast.error("Erro ao salvar preferências.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[9999] flex items-center justify-center p-4">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="bg-[#0a0a0c] border border-zinc-800 rounded-2xl w-full max-w-md shadow-2xl overflow-hidden relative"
      >
        <div className="px-5 py-4 border-b border-white/5 flex items-center justify-between bg-[#18181b]">
          <h2 className="text-zinc-100 font-bold text-lg">Configurações de Privacidade</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-white transition-colors">
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <div className="space-y-3">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Clock className="w-4 h-4 text-indigo-400" />
              Retenção de Dados
            </h3>
            
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/20 cursor-pointer transition-colors bg-zinc-900/30">
              <input type="radio" checked={retention === 'permanent'} onChange={() => setRetention('permanent')} className="mt-1" />
              <div>
                <p className="text-sm font-medium text-white">Conta Permanente</p>
                <p className="text-xs text-zinc-500 mt-0.5">Sua conta e mensagens ficam salvas até que você decida apagá-las.</p>
              </div>
            </label>

            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/20 cursor-pointer transition-colors bg-zinc-900/30">
              <input type="radio" checked={retention === '24h'} onChange={() => setRetention('24h')} className="mt-1" />
              <div>
                <p className="text-sm font-medium text-white">Excluir em 24 horas</p>
                <p className="text-xs text-zinc-500 mt-0.5">Sua conta e mensagens serão apagadas automaticamente do servidor em 24 horas.</p>
              </div>
            </label>
          </div>

          <div className="space-y-3 pt-2 border-t border-white/5">
            <h3 className="text-sm font-semibold text-zinc-300 flex items-center gap-2">
              <Shield className="w-4 h-4 text-indigo-400" />
              Segurança
            </h3>
            
            <label className="flex items-start gap-3 p-3 rounded-xl border border-zinc-800/50 hover:bg-zinc-800/20 cursor-pointer transition-colors bg-zinc-900/30">
              <input type="checkbox" checked={e2ee} onChange={(e) => setE2ee(e.target.checked)} className="mt-1" />
              <div>
                <p className="text-sm font-medium text-white">Ativar Criptografia Ponta a Ponta</p>
                <p className="text-xs text-zinc-500 mt-0.5">Protege suas conversas para que apenas você e quem recebe possam ler.</p>
              </div>
            </label>
          </div>
        </div>

        <div className="px-6 py-4 border-t border-white/5 bg-[#18181b]">
          <button 
            onClick={handleSave} 
            disabled={loading}
            className="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-semibold py-3 rounded-xl transition-all disabled:opacity-50"
          >
            {loading ? "Salvando..." : "Confirmar e Continuar"}
          </button>
        </div>
      </motion.div>
    </div>
  );
}
