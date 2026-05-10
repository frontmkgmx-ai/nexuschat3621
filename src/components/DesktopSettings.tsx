import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Settings, Monitor, BellRing, Shield, Zap, ArrowLeft, LogOut, DownloadCloud } from 'lucide-react';
import { SettingToggle } from './Sidebar'; // we can export it or copy it

export default function DesktopSettings({ onLogout }: { onLogout: () => void }) {
  const [view, setView] = useState<"MENU" | "GENERAL" | "NOTIFICATIONS" | "PERFORMANCE">("MENU");

  const [settings, setSettings] = useState({
    startOnBoot: true,
    hardwareAccel: true,
    nativeNotifications: true,
    backgroundRun: true,
    autoUpdate: true,
  });

  const toggle = (key: keyof typeof settings) => {
    setSettings(prev => ({ ...prev, [key]: !prev[key] }));
  };

  return (
    <div className="flex-1 flex flex-col h-full bg-[#111214]">
      <div className="flex items-center gap-3 px-6 py-6 border-b border-zinc-800/80 bg-[#111214] sticky top-0 z-10">
        {view !== "MENU" && (
          <button onClick={() => setView("MENU")} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-zinc-400" />
          </button>
        )}
        <h2 className="text-2xl font-display font-bold text-zinc-100 tracking-tight">
          {view === "MENU" ? "Configurações (Windows)" :
           view === "GENERAL" ? "Geral & Sistema" :
           view === "NOTIFICATIONS" ? "Notificações Nativas" :
           view === "PERFORMANCE" ? "Performance & Motor" : ""}
        </h2>
      </div>

      <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
        <AnimatePresence mode="wait">
          {view === "MENU" && (
            <motion.div key="menu" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} className="space-y-3">
              <button onClick={() => setView("GENERAL")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-blue-500/20 flex items-center justify-center text-blue-400"><Monitor className="w-5 h-5" /></div>
                  <div className="text-left"><h3 className="text-zinc-100 font-medium">Geral & Integração</h3><p className="text-xs text-zinc-500">Inicialização, Minimizar para bandeja</p></div>
                </div>
              </button>

              <button onClick={() => setView("NOTIFICATIONS")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-rose-500/20 flex items-center justify-center text-rose-400"><BellRing className="w-5 h-5" /></div>
                  <div className="text-left"><h3 className="text-zinc-100 font-medium">Notificações Nativas</h3><p className="text-xs text-zinc-500">Sons do sistema, Insígnias na barra de tarefas</p></div>
                </div>
              </button>

              <button onClick={() => setView("PERFORMANCE")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-10 h-10 rounded-full bg-yellow-500/20 flex items-center justify-center text-yellow-400"><Zap className="w-5 h-5" /></div>
                  <div className="text-left"><h3 className="text-zinc-100 font-medium">Motor WebView2</h3><p className="text-xs text-zinc-500">Aceleração de hardware, Limpeza de cache</p></div>
                </div>
              </button>

              <div className="pt-6 px-2">
                <button onClick={onLogout} className="w-full flex flex-col items-center justify-center gap-1 bg-red-500/10 text-red-400 py-4 px-2 rounded-xl font-bold tracking-wider text-[11px] uppercase border border-red-500/20 hover:bg-red-500/20 transition-all shadow-sm text-center">
                  <div className="flex items-center gap-2"><LogOut className="w-4 h-4" /> Sair do Aplicativo</div>
                  <span className="text-[9px] font-medium opacity-80 normal-case tracking-normal">Encerrar sessão segura local</span>
                </button>
              </div>
            </motion.div>
          )}

          {view === "GENERAL" && (
            <motion.div key="general" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
              <div className="space-y-3">
                <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Integração com o Sistema</h3>
                <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                   <SettingToggle label="Iniciar com o Windows" checked={settings.startOnBoot} onChange={() => toggle("startOnBoot")} />
                   <SettingToggle label="Rodar em 2º plano (Bandeja)" checked={settings.backgroundRun} onChange={() => toggle("backgroundRun")} />
                   <SettingToggle label="Baixar atualizações automáticas" checked={settings.autoUpdate} onChange={() => toggle("autoUpdate")} />
                </div>
              </div>
            </motion.div>
          )}

          {view === "NOTIFICATIONS" && (
            <motion.div key="notifications" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
              <div className="space-y-3">
                <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Notificações</h3>
                <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                   <SettingToggle label="Usar notificações nativas do Windows" checked={settings.nativeNotifications} onChange={() => toggle("nativeNotifications")} />
                   <SettingToggle label="Tocar sons de sistema" checked={true} onChange={() => {}} />
                </div>
              </div>
            </motion.div>
          )}

          {view === "PERFORMANCE" && (
            <motion.div key="performance" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} className="space-y-6">
              <div className="space-y-3">
                <h3 className="px-2 text-xs font-bold uppercase tracking-widest text-zinc-500">Otimização</h3>
                <div className="bg-zinc-950/40 border border-zinc-800/60 rounded-2xl overflow-hidden divide-y divide-zinc-800/60">
                   <SettingToggle label="Ativar Aceleração de Hardware (GPU)" checked={settings.hardwareAccel} onChange={() => toggle("hardwareAccel")} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}

function SettingToggle({ label, checked, onChange, disabled }: { label: string, checked: boolean, onChange: (val: boolean) => void, disabled?: boolean }) {
  return (
    <div className={`flex items-center justify-between p-3 rounded-xl transition-colors ${disabled ? "opacity-50 pointer-events-none" : "hover:bg-zinc-800/50"}`}>
      <span className="text-sm font-medium text-zinc-300">{label}</span>
      <button 
        onClick={() => onChange(!checked)}
        className={`w-10 h-6 rounded-full p-1 transition-all flex items-center shadow-inner ${checked ? "bg-indigo-500" : "bg-zinc-700"}`}
      >
        <div className={`w-4 h-4 rounded-full bg-white shadow-sm transition-all duration-300 ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
