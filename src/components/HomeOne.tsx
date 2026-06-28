import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, Monitor, Smartphone, Globe, ShieldCheck, Zap, MessageSquare, Video, FileText, CheckCircle2, Lock, Cpu, Sparkles, ChevronRight, Download } from 'lucide-react';

export default function HomeOne() {
  const [downloadingOS, setDownloadingOS] = useState<string | null>(null);
  const [downloadProgress, setDownloadProgress] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (downloadingOS) {
      setDownloadProgress(0);
      interval = setInterval(() => {
        setDownloadProgress((prev) => {
          if (prev >= 100) {
            clearInterval(interval);
            setTimeout(() => setDownloadingOS(null), 1000);
            return 100;
          }
          return prev + Math.floor(Math.random() * 15) + 5;
        });
      }, 300);
    }
    return () => clearInterval(interval);
  }, [downloadingOS]);

  const handleDownload = (os: string) => {
    if (downloadingOS) return;
    setDownloadingOS(os);
  };

  return (
    <div className="min-h-screen bg-[#050505] text-zinc-100 font-sans selection:bg-indigo-500/30 selection:text-indigo-200 overflow-x-hidden relative">
      {/* Dynamic Background */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] opacity-[0.03]" />
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/20 blur-[150px] rounded-full" />
        <div className="absolute bottom-[-20%] right-[-10%] w-[50%] h-[50%] bg-purple-600/10 blur-[150px] rounded-full" />
      </div>

      {/* Navbar */}
      <nav className="fixed top-0 w-full border-b border-white/5 bg-[#050505]/60 backdrop-blur-2xl z-50">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <ShieldCheck className="w-6 h-6 text-white" />
            </div>
            <span className="font-bold text-2xl tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-zinc-400">Nexus</span>
          </div>
          <div className="flex items-center gap-4">
            <a href="#download" className="hidden sm:block px-4 py-2 text-sm font-medium text-zinc-400 hover:text-white transition-colors">
              Download
            </a>
            <a href="/" className="px-6 py-2.5 text-sm font-bold bg-white text-black hover:bg-zinc-200 rounded-full transition-colors flex items-center gap-2">
              Acessar Web <ArrowRight className="w-4 h-4" />
            </a>
          </div>
        </div>
      </nav>

      <main className="relative z-10 pt-32">
        {/* Hero Section */}
        <section className="pb-32 px-6 relative">
          <div className="max-w-5xl mx-auto text-center">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.8, ease: "easeOut" }}
            >
              <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-sm font-bold tracking-wide mb-8 backdrop-blur-md">
                <Sparkles className="w-4 h-4" />
                A nova era da comunicação
              </div>
              <h1 className="text-6xl md:text-8xl font-black tracking-tighter mb-8 leading-[1.1]">
                Conexões reais, <br />
                <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
                  sem fronteiras.
                </span>
              </h1>
              <p className="text-xl md:text-2xl text-zinc-400 mb-12 max-w-3xl mx-auto leading-relaxed font-medium">
                O Nexus combina chat instantâneo, chamadas de vídeo em 4K e criptografia de ponta a ponta em uma experiência unificada e inovadora.
              </p>

              <div className="flex flex-col sm:flex-row items-center justify-center gap-6">
                <a href="#download" className="w-full sm:w-auto px-8 py-4 bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl font-bold text-lg transition-all shadow-[0_0_40px_rgba(79,70,229,0.4)] hover:shadow-[0_0_60px_rgba(79,70,229,0.6)] flex items-center justify-center gap-3 group relative overflow-hidden">
                  <span className="relative z-10 flex items-center gap-2">Baixar Aplicativo <Download className="w-5 h-5 group-hover:translate-y-1 transition-transform" /></span>
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 to-transparent pointer-events-none" />
                </a>
                <a href="/" className="w-full sm:w-auto px-8 py-4 bg-white/5 hover:bg-white/10 text-white rounded-2xl font-bold text-lg transition-colors border border-white/10 flex items-center justify-center gap-2">
                  Abrir no Navegador
                </a>
              </div>
            </motion.div>
          </div>
        </section>

        {/* Bento Grid Features */}
        <section className="py-32 px-6 bg-zinc-950/50 border-y border-white/5 relative">
          <div className="max-w-7xl mx-auto">
            <div className="mb-20">
              <h2 className="text-4xl md:text-5xl font-bold mb-6 tracking-tight">Projetado para o futuro.</h2>
              <p className="text-xl text-zinc-400 max-w-2xl">Não é apenas um chat. É uma plataforma completa para colaboração e conexão, com tecnologias de ponta.</p>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Feature 1 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                className="md:col-span-2 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 p-10 rounded-[32px] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-500/10 blur-[80px] rounded-full group-hover:bg-indigo-500/20 transition-colors" />
                <Lock className="w-10 h-10 text-indigo-400 mb-6" />
                <h3 className="text-3xl font-bold mb-4">Privacidade Absoluta</h3>
                <p className="text-lg text-zinc-400 max-w-md">Criptografia ponta a ponta e infraestrutura descentralizada. Seus dados pertencem apenas a você, sempre.</p>
              </motion.div>

              {/* Feature 2 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.1 }}
                className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 p-10 rounded-[32px] relative overflow-hidden group"
              >
                <Zap className="w-10 h-10 text-yellow-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Velocidade da Luz</h3>
                <p className="text-zinc-400">Sincronização em tempo real via WebSockets globais. Sem delays.</p>
              </motion.div>

              {/* Feature 3 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.2 }}
                className="bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 p-10 rounded-[32px] relative overflow-hidden group"
              >
                <Cpu className="w-10 h-10 text-pink-400 mb-6" />
                <h3 className="text-2xl font-bold mb-4">Baixo Consumo</h3>
                <p className="text-zinc-400">Arquitetura otimizada para economizar bateria e usar menos RAM.</p>
              </motion.div>

              {/* Feature 4 */}
              <motion.div 
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: 0.3 }}
                className="md:col-span-2 bg-gradient-to-br from-zinc-900 to-black border border-zinc-800/80 p-10 rounded-[32px] relative overflow-hidden group"
              >
                <div className="absolute top-0 right-0 w-64 h-64 bg-emerald-500/10 blur-[80px] rounded-full group-hover:bg-emerald-500/20 transition-colors" />
                <Video className="w-10 h-10 text-emerald-400 mb-6" />
                <h3 className="text-3xl font-bold mb-4">WebRTC de Alta Fidelidade</h3>
                <p className="text-lg text-zinc-400 max-w-md">Chamadas de vídeo em grupo com qualidade 4K nativa, supressão de ruído IA e baixa latência.</p>
              </motion.div>
            </div>
          </div>
        </section>

        {/* Downloads Section */}
        <section id="download" className="py-32 px-6 relative">
          <div className="max-w-6xl mx-auto text-center relative z-10">
            <h2 className="text-5xl font-black mb-6 tracking-tight">Experimente o Nexus.</h2>
            <p className="text-xl text-zinc-400 mb-16 max-w-2xl mx-auto">Disponível em todas as plataformas com sincronização perfeita. Comece sua jornada agora.</p>

            <div className="grid md:grid-cols-3 gap-8">
              {/* Windows */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-10 rounded-[40px] flex flex-col items-center hover:border-indigo-500/50 transition-all hover:bg-zinc-900/60 group relative overflow-hidden shadow-2xl">
                <div className="w-20 h-20 rounded-3xl bg-blue-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Monitor className="w-10 h-10 text-blue-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Windows</h3>
                <p className="text-zinc-500 mb-8 text-center leading-relaxed">Experiência desktop nativa, notificações em tempo real e atalhos globais.</p>
                
                <div className="mt-auto w-full relative h-[60px]">
                  <AnimatePresence mode="wait">
                    {downloadingOS === 'windows' ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-zinc-800 rounded-2xl overflow-hidden shadow-inner flex items-center"
                      >
                         <motion.div 
                           className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-blue-600 to-indigo-500"
                           initial={{ width: "0%" }}
                           animate={{ width: `${downloadProgress}%` }}
                         />
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 mix-blend-overlay animate-[slide_1s_linear_infinite]" />
                         <span className="relative z-10 w-full text-center font-bold text-sm text-white drop-shadow-md">
                           {downloadProgress === 100 ? "Concluído!" : `Baixando... ${downloadProgress}%`}
                         </span>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="btn"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => handleDownload('windows')}
                        className="absolute inset-0 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl font-bold transition-all w-full flex items-center justify-center gap-2 group-hover:bg-blue-600 group-hover:border-blue-500 group-hover:text-white"
                      >
                        Baixar x64 <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Android */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-10 rounded-[40px] flex flex-col items-center hover:border-emerald-500/50 transition-all hover:bg-zinc-900/60 group relative overflow-hidden shadow-2xl">
                <div className="w-20 h-20 rounded-3xl bg-emerald-500/10 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Smartphone className="w-10 h-10 text-emerald-400" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Android</h3>
                <p className="text-zinc-500 mb-8 text-center leading-relaxed">App otimizado, leve e rápido com suporte a PIP para chamadas de vídeo.</p>
                
                <div className="mt-auto w-full relative h-[60px]">
                  <AnimatePresence mode="wait">
                    {downloadingOS === 'android' ? (
                      <motion.div
                        key="loading"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        className="absolute inset-0 bg-zinc-800 rounded-2xl overflow-hidden shadow-inner flex items-center"
                      >
                         <motion.div 
                           className="absolute top-0 left-0 bottom-0 bg-gradient-to-r from-emerald-600 to-green-500"
                           initial={{ width: "0%" }}
                           animate={{ width: `${downloadProgress}%` }}
                         />
                         <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/diagonal-stripes.png')] opacity-20 mix-blend-overlay animate-[slide_1s_linear_infinite]" />
                         <span className="relative z-10 w-full text-center font-bold text-sm text-white drop-shadow-md">
                           {downloadProgress === 100 ? "Concluído!" : `Baixando APK... ${downloadProgress}%`}
                         </span>
                      </motion.div>
                    ) : (
                      <motion.button
                        key="btn"
                        initial={{ opacity: 0, scale: 0.9 }}
                        animate={{ opacity: 1, scale: 1 }}
                        exit={{ opacity: 0, scale: 0.9 }}
                        onClick={() => handleDownload('android')}
                        className="absolute inset-0 bg-emerald-600/10 text-emerald-400 hover:bg-emerald-600 hover:text-white border border-emerald-500/20 hover:border-emerald-500 rounded-2xl font-bold transition-all w-full flex items-center justify-center gap-2 group-hover:bg-emerald-600 group-hover:text-white"
                      >
                        Baixar APK <Download className="w-4 h-4 opacity-0 group-hover:opacity-100 -translate-y-2 group-hover:translate-y-0 transition-all" />
                      </motion.button>
                    )}
                  </AnimatePresence>
                </div>
              </div>

              {/* Web */}
              <div className="bg-zinc-900/40 backdrop-blur-xl border border-zinc-800/60 p-10 rounded-[40px] flex flex-col items-center hover:border-white/20 transition-all hover:bg-zinc-900/60 group relative overflow-hidden shadow-2xl">
                <div className="w-20 h-20 rounded-3xl bg-zinc-800 flex items-center justify-center mb-8 group-hover:scale-110 transition-transform duration-500">
                  <Globe className="w-10 h-10 text-zinc-300" />
                </div>
                <h3 className="text-2xl font-bold mb-3">Navegador</h3>
                <p className="text-zinc-500 mb-8 text-center leading-relaxed">Acesso instantâneo sem instalação. Funciona em qualquer navegador moderno.</p>
                
                <div className="mt-auto w-full h-[60px]">
                  <a href="/" className="h-full bg-white text-black hover:bg-zinc-200 rounded-2xl font-bold transition-all w-full flex items-center justify-center gap-2">
                    Acessar Web <ChevronRight className="w-4 h-4" />
                  </a>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="py-12 px-6 border-t border-white/5 relative z-10 bg-black/50">
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-zinc-600" />
            <span className="font-bold text-zinc-600">Nexus</span>
          </div>
          <p className="text-zinc-600 text-sm font-medium">
            © {new Date().getFullYear()} Nexus Inc. Projetado para a revolução.
          </p>
          <div className="flex gap-4 text-zinc-600">
            <a href="#" className="hover:text-zinc-300 transition-colors">Termos</a>
            <a href="#" className="hover:text-zinc-300 transition-colors">Privacidade</a>
          </div>
        </div>
      </footer>
    </div>
  );
}

