import React, { useState, useEffect } from "react";
import { ShieldCheck, Loader2, KeyRound, User, ArrowRight, Camera } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, updateDoc, arrayUnion } from "firebase/firestore";
import { motion, AnimatePresence } from "motion/react";
import { useNexusNative } from "../hooks/useNexusNative";
import { sanitizeUrl } from "../services/storageService";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [isLoginView, setIsLoginView] = useState(true);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const { isNative } = useNexusNative();

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() || !password.trim()) {
      setError("Preencha todos os campos.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const q = query(collection(db, "users"), where("username", "==", username.trim()));
      const querySnapshot = await getDocs(q);

      const deviceName = isNative ? "Nexus Desktop App" : /Mobi|Android/i.test(navigator.userAgent) ? "Mobile Browser" : "Desktop Browser";
      const newSessionId = "sess_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
      const deviceInfo = {
        id: newSessionId,
        device: deviceName,
        lastActive: Date.now()
      };

      if (isLoginView) {
        // Login
        if (querySnapshot.empty) {
          setError("Usuário não encontrado.");
          setLoading(false);
          return;
        }

        const userDoc = querySnapshot.docs[0];
        const userData = userDoc.data();

        if (userData.password !== password) {
          setError("Senha incorreta.");
          setLoading(false);
          return;
        }

        await updateDoc(doc(db, "users", userDoc.id), {
          activeSessions: arrayUnion(deviceInfo)
        });

        onLogin({ ...userData, _id: userDoc.id, sessionId: newSessionId });
      } else {
        // Register
        if (!querySnapshot.empty) {
          setError("Este nome de usuário já está em uso.");
          setLoading(false);
          return;
        }

        const newUserId = "usr_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
        const finalAvatar = avatarUrl.trim() || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username.trim()}`;
        
        const userData = {
          _id: newUserId,
          username: username.trim(),
          password: password,
          avatarUrl: finalAvatar,
          activeSessions: [deviceInfo]
        };

        await setDoc(doc(db, "users", newUserId), userData);
        onLogin({ ...userData, sessionId: newSessionId });
      }
    } catch (err: any) {
      console.error("Auth error:", err);
      setError("Erro ao autenticar. Tente novamente.");
    } finally {
      setLoading(false);
    }
  };

  const variants = {
    initial: { opacity: 0, scale: 0.98 },
    animate: { opacity: 1, scale: 1 },
    exit: { opacity: 0, scale: 0.98 }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center relative font-sans p-4 overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(99,102,241,0.15)_0%,transparent_60%)] z-0 pointer-events-none"></div>
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_bottom_left,rgba(99,102,241,0.05)_0%,transparent_50%)] z-0 pointer-events-none"></div>
      
      <div className="text-center z-10 mb-10 w-full max-w-sm">
        <div className="w-16 h-16 bg-gradient-to-tr from-indigo-600/20 to-indigo-500/10 border border-indigo-500/50 rounded-2xl mx-auto flex items-center justify-center mb-5 shadow-[0_0_30px_rgba(99,102,241,0.2)]">
          <ShieldCheck className="w-8 h-8 text-indigo-400" />
        </div>
        <h1 className="text-4xl font-display font-bold tracking-tight text-white mb-2">NEXUS</h1>
        <p className="text-zinc-400 text-xs font-semibold tracking-[0.2em] uppercase">Rede Segura</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_0_50px_rgba(0,0,0,0.8)] z-10 w-full max-w-[400px] p-6 sm:p-8 relative overflow-hidden backdrop-blur-2xl">
        <AnimatePresence mode="wait">
          <motion.div
            key={isLoginView ? "LOGIN" : "REGISTER"}
            variants={variants}
            initial="initial"
            animate="animate"
            exit="exit"
            transition={{ duration: 0.2, ease: "easeOut" }}
          >
            <div className="mb-6 flex flex-col items-start text-left">
              <h2 className="text-xl font-display font-bold text-zinc-100 mb-1.5 flex items-center gap-2">
                {isLoginView ? <KeyRound className="w-5 h-5 text-indigo-400" /> : <User className="w-5 h-5 text-indigo-400" />} 
                {isLoginView ? "Acesso ao Nexus" : "Criar Conta"}
              </h2>
              <p className="text-zinc-400 text-sm leading-relaxed">
                {isLoginView ? "Insira seu usuário e senha para entrar." : "Crie seu usuário e senha para acessar a rede."}
              </p>
            </div>

            <form onSubmit={handleAuthSubmit} className="space-y-5">
              {!isLoginView && (
                <div className="flex flex-col items-center gap-4 mb-4">
                  <div className="relative group w-20 h-20 rounded-3xl bg-zinc-950/80 border-2 border-zinc-800 overflow-hidden flex items-center justify-center shadow-lg">
                    {avatarUrl ? (
                      <img src={sanitizeUrl(avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-600">
                        <Camera className="w-6 h-6 mb-1 opacity-50" />
                      </div>
                    )}
                  </div>
                </div>
              )}

              <div className="space-y-4">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Usuário</label>
                  <input
                    type="text"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 py-3 px-4 outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors text-sm rounded-xl focus:ring-1 focus:ring-indigo-500/50 shadow-inner font-semibold"
                    placeholder="Nome de usuário"
                    value={username}
                    onChange={(e) => setUsername(e.target.value)}
                  />
                </div>
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Senha</label>
                  <input
                    type="password"
                    required
                    className="w-full bg-zinc-950/50 border border-zinc-800 py-3 px-4 outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors text-sm rounded-xl focus:ring-1 focus:ring-indigo-500/50 shadow-inner font-semibold"
                    placeholder="Sua senha secreta"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                  />
                </div>
              </div>

              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="text-red-400 text-xs text-center font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl mt-2"
                >
                  {error}
                </motion.p>
              )}

              <button
                type="submit"
                disabled={!username || !password || loading}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-4"
              >
                {loading ? (
                  <><Loader2 className="w-5 h-5 animate-spin" /> Processando...</>
                ) : (
                  <>{isLoginView ? "Entrar" : "Cadastrar"} <ArrowRight className="w-4 h-4" /></>
                )}
              </button>
            </form>

            <div className="mt-6 pt-6 border-t border-zinc-800/80 text-center">
              <p className="text-zinc-500 text-sm mb-2 font-medium">
                {isLoginView ? "Ainda não tem uma conta?" : "Já possui uma conta?"}
              </p>
              <button
                type="button"
                onClick={() => {
                  setIsLoginView(!isLoginView);
                  setError("");
                }}
                className="text-indigo-400 hover:text-indigo-300 font-semibold transition-colors text-sm"
              >
                {isLoginView ? "Criar uma conta agora" : "Entrar com conta existente"}
              </button>
            </div>
          </motion.div>
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 text-center text-xs text-zinc-600 flex items-center gap-2 mt-auto">
        <ShieldCheck className="w-4 h-4" /> Comunicação criptografada ponta-a-ponta
      </div>
    </div>
  );
}
