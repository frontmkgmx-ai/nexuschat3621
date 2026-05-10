import React from 'react';
import { Monitor, Download, ArrowRight, ShieldCheck, Zap, Sparkles } from 'lucide-react';

export default function WindowsAppView() {
  return (
    <div className="flex flex-col h-full bg-zinc-900 border-r border-zinc-800 relative z-20">
      <div className="flex items-center justify-between px-6 py-4 border-b border-zinc-800 bg-zinc-900/50 backdrop-blur-md sticky top-0 z-10 shrink-0">
        <h2 className="text-xl font-display font-black tracking-wider text-zinc-100 flex items-center gap-2">
          <Monitor className="w-6 h-6 text-indigo-400" />
          Windows App (Edge WebView2)
        </h2>
      </div>
      <div className="flex-1 overflow-y-auto custom-scrollbar p-6">
        <div className="max-w-2xl mx-auto space-y-8">
          
          <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/20 rounded-3xl p-8 relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 rounded-full blur-3xl -translate-y-1/2 translate-x-1/3 pointer-events-none" />
            <div className="relative z-10">
              <span className="bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-4 inline-block">
                Versão Mais Recente Instalada
              </span>
              <h3 className="text-3xl font-display font-black text-white mb-3">Nexus for Windows</h3>
              <p className="text-zinc-400 text-sm leading-relaxed mb-6 max-w-md">
                Você está usando a melhor versão do Nexus! Feito nativamente com Edge WebView2 para maior performance e integração profunda com o Windows.
              </p>
              <div className="flex items-center gap-3">
                <button className="bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2.5 px-5 rounded-xl transition-colors flex items-center gap-2 shadow-lg">
                  <Download className="w-5 h-5" /> Buscar Atualizações
                </button>
              </div>
            </div>
          </div>

          <div>
            <h4 className="text-sm uppercase tracking-widest font-bold text-zinc-500 mb-4 px-2">Novidades desta Versão</h4>
            <div className="grid gap-4">
              <div className="bg-zinc-950/50 border border-zinc-800/80 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center shrink-0">
                  <Zap className="w-5 h-5 text-yellow-400" />
                </div>
                <div>
                  <h5 className="font-bold text-zinc-200 mb-1">Performance Extrema</h5>
                  <p className="text-sm text-zinc-400 leading-relaxed">Inicialização até 40% mais rápida e menor consumo de RAM usando as novas otimizações de cache local do Edge Runtime.</p>
                </div>
              </div>
              
              <div className="bg-zinc-950/50 border border-zinc-800/80 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center shrink-0">
                  <ShieldCheck className="w-5 h-5 text-green-400" />
                </div>
                <div>
                  <h5 className="font-bold text-zinc-200 mb-1">Privacidade Aprimorada</h5>
                  <p className="text-sm text-zinc-400 leading-relaxed">Conexões isoladas pelo App Container do Windows para garantir total segurança de seus chats criptografados ponta a ponta.</p>
                </div>
              </div>

              <div className="bg-zinc-950/50 border border-zinc-800/80 p-5 rounded-2xl flex items-start gap-4">
                <div className="w-10 h-10 rounded-full bg-zinc-800/50 flex items-center justify-center shrink-0">
                  <Sparkles className="w-5 h-5 text-purple-400" />
                </div>
                <div>
                  <h5 className="font-bold text-zinc-200 mb-1">Acesso Desconectado Dinâmico</h5>
                  <p className="text-sm text-zinc-400 leading-relaxed">Login e reconexão instatânea através de pareamento transparente (QR auto-reconhecido via token seguro da máquina).</p>
                </div>
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
