import React, { useState, useEffect } from "react";
import { parsePhoneNumber, getCountries, getCountryCallingCode, CountryCode } from "libphonenumber-js";
import { Camera, ShieldCheck, Loader2, Phone as PhoneIcon, KeyRound, ArrowLeft, ArrowRight, User, QrCode } from "lucide-react";
import { db, auth, rtdb } from "../lib/firebase";
import { collection, query, where, getDocs, setDoc, doc, getDoc, arrayUnion, updateDoc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { ref, onValue, set, remove } from "firebase/database";
import { motion, AnimatePresence } from "motion/react";
import { sanitizeUrl } from "../services/fileApi";
import { useNexusNative } from "../hooks/useNexusNative";
import { QRCodeSVG } from "qrcode.react";

type LoginStep = "PHONE" | "OTP" | "PROFILE" | "QR_LOGIN";

export default function Login({ onLogin }: { onLogin: (user: any) => void }) {
  const [step, setStep] = useState<LoginStep>("PHONE");
  const [countryCode, setCountryCode] = useState<CountryCode>("BR");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [otp, setOtp] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  
  // Profile state
  const [userId, setUserId] = useState<string | null>(null);
  const [username, setUsername] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");
  const [isExistingProfile, setIsExistingProfile] = useState(false);
  
  // Google Auth state
  const [googleLinked, setGoogleLinked] = useState(false);
  const [googleEmail, setGoogleEmail] = useState<string | null>(null);

  const { isNative } = useNexusNative();
  const [qrSessionId, setQrSessionId] = useState<string>("");
  const [qrDataStr, setQrDataStr] = useState<string>("");

  useEffect(() => {
    // Attempt to auto-detect country
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code) setCountryCode(data.country_code as CountryCode);
      })
      .catch(() => {});
  }, []);

  useEffect(() => {
    // Determine initial login step: desktop = QR by default
    const isDesktop = isNative || !/Mobi|Android/i.test(navigator.userAgent);
    if (isDesktop && step === "PHONE") {
      setStep("QR_LOGIN");
    }
  }, [isNative, step]);

  useEffect(() => {
    let unsub: () => void;
    let timerId: any;
    
    const fetchQr = async () => {
       try {
         const deviceName = isNative ? "Nexus Desktop App" : /Edg/.test(navigator.userAgent) ? "Edge Browser" : /Chrome/.test(navigator.userAgent) ? "Chrome Browser" : "Desktop Browser";
         const res = await fetch(`/api/auth/qr?device=${encodeURIComponent(deviceName)}`);
         const data = await res.json();
         setQrSessionId(data.sessionId);
         setQrDataStr(data.qrData);

         // Sub to RTDB for the new sessionId
         if (unsub) unsub();
         const sessionRef = ref(rtdb, `qrLogins/${data.sessionId}`);
         set(sessionRef, { status: "waiting", timestamp: Date.now() });

         unsub = onValue(sessionRef, async (snapshot) => {
           const val = snapshot.val();
           if (val && val.status === "success" && val.userId) {
             try {
               const userSnap = await getDoc(doc(db, "users", val.userId));
               if (userSnap.exists()) {
                  await remove(sessionRef); // clean up
                  onLogin({ ...userSnap.data(), sessionId: data.sessionId });
               }
             } catch(e) {
                console.error("Erro ao buscar usario logado no QR", e);
                setError("Erro ao autenticar. Tente de novo.");
             }
           }
         });

       } catch (err) {
         console.error("Falha ao gerar QR", err);
       }
    };

    if (step === "QR_LOGIN") {
       fetchQr();
       timerId = setInterval(fetchQr, 5000);
    }

    return () => {
      if (unsub) unsub();
      if (timerId) clearInterval(timerId);
    }
  }, [step, isNative]);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGoogleLinked(false);
    setGoogleEmail(null);
    setLoading(true);
    try {
      const input = `+${getCountryCallingCode(countryCode)}${phoneNumber}`;
      const parsed = parsePhoneNumber(input);
      if (parsed?.isValid()) {
        const fullPhone = `+${getCountryCallingCode(countryCode)}${phoneNumber.replace(/\D/g, "")}`;
        
        // Query Firestore for this phone number
        const q = query(collection(db, "users"), where("phoneNumber", "==", fullPhone));
        const querySnapshot = await getDocs(q);
        
        if (!querySnapshot.empty) {
          const userDoc = querySnapshot.docs[0];
          const userData = userDoc.data();
          setUserId(userDoc.id);
          setIsExistingProfile(true);
          setUsername(userData.username || "");
          setAvatarUrl(userData.avatarUrl || "");
          if (userData.googleLinked) {
            setGoogleLinked(true);
            setGoogleEmail(userData.googleEmail);
          }
        } else {
          // Create new fake user ID
          const dummyId = "usr_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
          setUserId(dummyId);
          setIsExistingProfile(false);
        }

        const isAIStudio = window.location.hostname.includes("run.app") || window.location.hostname.includes("google") || window.location.hostname.includes("localhost");
        
        if (document.activeElement instanceof HTMLElement) {
          document.activeElement.blur();
        }

        if (isAIStudio) {
          // Instead of skipping entirely, let's go to OTP if they want to simulate or use Google
          setStep("OTP");
        } else {
          setStep("OTP");
        }
      } else {
        setError("Número de telefone inválido para o país selecionado.");
      }
    } catch (err) {
      setError("Por favor, informe um número de telefone válido.");
    } finally {
      setLoading(false);
    }
  };

  const proceedToProfile = () => {
    if (document.activeElement instanceof HTMLElement) {
      document.activeElement.blur();
    }
    setStep("PROFILE");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      
      // Check if trying to login to an existing linked account via the phone step
      if (googleLinked && googleEmail) {
        if (googleEmail === userEmail) {
           setLoading(false);
           proceedToProfile();
        } else {
           setLoading(false);
           setError("O email retornado pelo Google não corresponde ao email vinculado a esta conta.");
           await auth.signOut();
        }
      } else {
        // Direct login via Google without phone check first
        const q = query(collection(db, "users"), where("googleEmail", "==", userEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
           const userDoc = querySnapshot.docs[0];
           const userData = userDoc.data();
           setUserId(userDoc.id);
           setIsExistingProfile(true);
           setUsername(userData.username || "");
           setAvatarUrl(userData.avatarUrl || "");
           setGoogleLinked(true);
           setGoogleEmail(userData.googleEmail);
           setLoading(false);
           proceedToProfile();
        } else {
           const dummyId = result.user.uid;
           setUserId(dummyId);
           setIsExistingProfile(false);
           setUsername(result.user.displayName || "");
           setAvatarUrl(result.user.photoURL || "");
           setGoogleLinked(true);
           setGoogleEmail(userEmail);
           setLoading(false);
           proceedToProfile();
        }
      }
    } catch (e: any) {
      console.error(e);
      if (e.code !== 'auth/popup-closed-by-user') {
        setError("Erro ao autenticar com o Google.");
      }
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 6) {
      setError("Por favor, informe um código de 6 dígitos.");
      return;
    }

    setLoading(true);
    setError("");
    // Simulate SMS check
    setTimeout(() => {
      setLoading(false);
      proceedToProfile();
    }, 1000);
  };

  const handleProfileSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim() && !isExistingProfile) return;

    setLoading(true);
    try {
      const finalAvatar = avatarUrl.trim() || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${username.trim() || userId}`;
      const fullPhone = `+${getCountryCallingCode(countryCode)}${phoneNumber.replace(/\D/g, "")}`;
      
      const userData = {
        _id: userId,
        phoneNumber: fullPhone,
        username: username.trim() || "User",
        avatarUrl: finalAvatar,
      };

      const newSessionId = "sess_" + Date.now().toString(36) + Math.random().toString(36).substring(2);
      const deviceInfo = {
        id: newSessionId,
        device: isNative ? "Nexus Desktop App" : /Mobi|Android/i.test(navigator.userAgent) ? "Mobile Browser" : "Desktop Browser",
        lastActive: Date.now()
      };

      if (!isExistingProfile && userId) {
        await setDoc(doc(db, "users", userId), { ...userData, activeSessions: [deviceInfo] });
      } else if (userId) {
        await setDoc(doc(db, "users", userId), userData, { merge: true });
        await updateDoc(doc(db, "users", userId), {
          activeSessions: arrayUnion(deviceInfo)
        });
      }

      onLogin({ ...userData, sessionId: newSessionId });
    } catch (err: any) {
      console.error("Profile save error:", err);
      const firestoreError = {
         error: err.message,
         operationType: "write",
         path: "users",
         authInfo: {
            userId: userId,
            email: null
         }
      };
      setError(`Falha ao salvar o perfil: ${err.message || 'Unknown error'}`);
      throw new Error(JSON.stringify(firestoreError));
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
          {step === "PHONE" && (
            <motion.div
              key="PHONE"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="mb-6 flex flex-col items-start text-left">
                <h2 className="text-xl font-display font-bold text-zinc-100 mb-1.5 flex items-center gap-2">
                  <PhoneIcon className="w-5 h-5 text-indigo-400" /> Acesso ao Nexus
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">Insira seu número de telefone para receber o código de autenticação da sessão.</p>
              </div>

              <form onSubmit={handlePhoneSubmit} className="space-y-5">
                <div className="flex flex-col gap-3">
                  <div className="relative">
                    <select 
                      value={countryCode} 
                      onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                      className="w-full bg-zinc-950/50 border border-zinc-800 py-3 px-4 outline-none focus:border-indigo-500 rounded-xl text-zinc-200 transition-colors text-sm appearance-none cursor-pointer focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
                    >
                      {getCountries().map((c) => (
                         <option key={c} value={c}>
                           {c} (+{getCountryCallingCode(c)})
                         </option>
                      ))}
                    </select>
                    <div className="absolute right-4 top-1/2 -translate-y-1/2 pointer-events-none">
                      <ArrowRight className="w-4 h-4 text-zinc-500 rotate-90" />
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <div className="w-[88px] bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 text-zinc-400 flex items-center justify-center text-sm font-semibold shadow-inner shrink-0">
                      +{getCountryCallingCode(countryCode)}
                    </div>
                    <input
                      type="tel"
                      required
                      className="flex-1 min-w-0 bg-zinc-950/50 border border-zinc-800 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors text-sm focus:ring-1 focus:ring-indigo-500/50 shadow-inner"
                      placeholder="Número de celular"
                      value={phoneNumber}
                      onChange={(e) => setPhoneNumber(e.target.value)}
                    />
                  </div>
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-red-400 text-xs text-center font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={!phoneNumber || loading}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-4"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Conectando...</>
                  ) : (
                    <>Continuar <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>

              { (isNative || window.innerWidth > 768) && (
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <p className="text-zinc-500 text-xs text-center mb-4 font-medium uppercase tracking-wider">Acesso Simplificado</p>
                  <button
                    onClick={() => setStep("QR_LOGIN")}
                    className="w-full flex items-center justify-center gap-3 bg-[#111214] text-zinc-200 border border-zinc-800 py-3 px-4 rounded-xl font-medium hover:bg-[#1e1f22] transition-colors"
                  >
                    <QrCode className="w-5 h-5 text-indigo-400" />
                    Fazer Login Escaneando QR Code
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === "QR_LOGIN" && (
            <motion.div
              key="QR_LOGIN"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
              className="flex flex-col items-center pb-2"
            >
              <div className="w-full mb-6 flex flex-col items-start text-left">
                <button 
                  onClick={() => setStep("PHONE")}
                  className="p-1 -ml-1 mb-3 text-zinc-500 hover:text-white transition-colors bg-zinc-800/30 rounded-lg hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-display font-bold text-zinc-100 mb-1.5 flex items-center gap-2">
                  <QrCode className="w-5 h-5 text-indigo-400" /> Login Rápido
                </h2>
                <p className="text-zinc-400 text-sm leading-relaxed">
                  Abra o Nexus Mobile, vá em Configurações &gt; Scan QR e aponte para a tela.
                </p>
              </div>

              {qrSessionId && qrDataStr ? (
                <div className="bg-white p-4 rounded-2xl shadow-xl">
                  <QRCodeSVG value={qrDataStr} size={200} />
                </div>
              ) : (
                <div className="w-[200px] h-[200px] flex items-center justify-center">
                  <Loader2 className="w-8 h-8 animate-spin text-zinc-500" />
                </div>
              )}

              {error && (
                <motion.p 
                  initial={{ opacity: 0, height: 0 }} 
                  animate={{ opacity: 1, height: 'auto' }} 
                  className="mt-6 w-full text-red-400 text-xs text-center font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl"
                >
                  {error}
                </motion.p>
              )}
            </motion.div>
          )}

          {step === "OTP" && (
            <motion.div
              key="OTP"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="mb-6 flex flex-col items-start text-left">
                <button 
                  onClick={() => setStep("PHONE")}
                  className="p-1 -ml-1 mb-3 text-zinc-500 hover:text-white transition-colors bg-zinc-800/30 rounded-lg hover:bg-zinc-800"
                >
                  <ArrowLeft className="w-5 h-5" />
                </button>
                <h2 className="text-xl font-display font-bold text-zinc-100 mb-1.5 flex items-center gap-2">
                  <KeyRound className="w-5 h-5 text-indigo-400" /> Autenticação
                </h2>
                <div className="bg-zinc-950/50 border border-zinc-800 rounded-lg py-2 px-3 inline-block mt-1 w-full bg-indigo-500/5 border-indigo-500/20 shadow-inner">
                  <p className="text-zinc-400 text-xs">Código enviado para:</p>
                  <p className="font-semibold text-indigo-400 mt-0.5 tracking-wider">+{getCountryCallingCode(countryCode)} {phoneNumber}</p>
                </div>
              </div>

              <form onSubmit={handleOtpSubmit} className="space-y-6">
                <div>
                  <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block">Código de 6 dígitos</label>
                  <div className="flex justify-center bg-zinc-950/50 border border-zinc-800 rounded-xl py-4 shadow-inner focus-within:border-indigo-500/60 transition-colors">
                    <input
                      type="text"
                      inputMode="numeric"
                      required
                      maxLength={6}
                      pattern="\d*"
                      className="w-40 bg-transparent text-center text-2xl tracking-[0.4em] font-mono outline-none text-white transition-colors placeholder:text-zinc-700 font-bold"
                      placeholder="000000"
                      value={otp}
                      onChange={(e) => setOtp(e.target.value.replace(/\D/g, ''))}
                    />
                  </div>
                </div>

                <div className="flex items-center gap-2 justify-center mt-2 opacity-70">
                  <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" />
                  <p className="text-xs text-zinc-400 font-medium tracking-wide">Ambiente de Simulação Ativo</p>
                </div>
                
                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-red-400 text-xs text-center font-medium bg-red-500/10 border border-red-500/20 py-2.5 px-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading || otp.length < 6}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Verificando...</>
                  ) : (
                    <>Verificar Identidade</>
                  )}
                </button>
              </form>

              {googleLinked && (
                <div className="mt-8 pt-6 border-t border-zinc-800/80">
                  <p className="text-zinc-500 text-xs text-center mb-4 font-medium uppercase tracking-wider">Métodos Alternativos</p>
                  <button
                    onClick={handleGoogleLogin}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-3 bg-[#111214] text-zinc-200 border border-zinc-800 py-3 px-4 rounded-xl font-medium hover:bg-[#1e1f22] transition-colors"
                  >
                    <svg className="w-5 h-5" viewBox="0 0 24 24">
                      <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                      <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                      <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                      <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                      <path fill="none" d="M1 1h22v22H1z" />
                    </svg>
                    Acessar via Google Autenticado
                  </button>
                </div>
              )}
            </motion.div>
          )}

          {step === "PROFILE" && (
            <motion.div
              key="PROFILE"
              variants={variants}
              initial="initial"
              animate="animate"
              exit="exit"
              transition={{ duration: 0.2, ease: "easeOut" }}
            >
              <div className="mb-6 flex flex-col items-center justify-center text-center">
                <h2 className="text-xl font-display font-bold text-zinc-100 mb-1.5 flex items-center justify-center gap-2">
                  <User className="w-5 h-5 text-indigo-400" /> Perfil Final
                </h2>
                <p className="text-zinc-400 text-sm">Quase lá. Configure a sua identidade na rede.</p>
              </div>

              <form onSubmit={handleProfileSubmit} className="space-y-6">
                <div className="flex flex-col items-center gap-6">
                  <div className="relative group w-24 h-24 rounded-3xl bg-zinc-950/80 border-2 border-zinc-800 overflow-hidden flex items-center justify-center shadow-lg transition-transform hover:scale-105">
                    {avatarUrl ? (
                      <img src={sanitizeUrl(avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center bg-zinc-900 border border-zinc-800 text-zinc-600">
                        <Camera className="w-8 h-8 mb-1 opacity-50" />
                      </div>
                    )}
                    <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                       <span className="text-xs font-bold text-white tracking-widest uppercase">Mudar</span>
                    </div>
                  </div>

                  <div className="w-full space-y-4">
                    <div>
                      <label className="text-[11px] uppercase tracking-widest text-zinc-500 font-bold mb-2 block text-center">Nome de Usuário</label>
                      <input
                        type="text"
                        required={!isExistingProfile}
                        className="w-full bg-zinc-950/50 border border-zinc-800 py-3 px-4 outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors text-center text-sm rounded-xl focus:ring-1 focus:ring-indigo-500/50 shadow-inner font-semibold"
                        placeholder="Seu nome no Nexus"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>
                  </div>
                </div>

                {error && (
                  <motion.p 
                    initial={{ opacity: 0, height: 0 }} 
                    animate={{ opacity: 1, height: 'auto' }} 
                    className="text-red-400 text-xs text-center font-medium bg-red-400/10 border border-red-400/20 py-2.5 px-3 rounded-xl"
                  >
                    {error}
                  </motion.p>
                )}

                <button
                  type="submit"
                  disabled={loading || (!username && !isExistingProfile)}
                  className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-semibold hover:bg-indigo-500 transition-all shadow-[0_4px_20px_rgba(99,102,241,0.25)] hover:shadow-[0_4px_25px_rgba(99,102,241,0.4)] disabled:opacity-50 disabled:shadow-none flex items-center justify-center gap-2 mt-2"
                >
                  {loading ? (
                    <><Loader2 className="w-5 h-5 animate-spin" /> Salvando...</>
                  ) : (
                    <>{isExistingProfile ? "Confirmar Identidade" : "Inicializar Conta"} <ArrowRight className="w-4 h-4" /></>
                  )}
                </button>
              </form>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <div className="absolute bottom-6 text-center text-xs text-zinc-600 flex items-center gap-2 mt-auto">
        <ShieldCheck className="w-4 h-4" /> Comunicação criptografada ponta-a-ponta
      </div>
    </div>
  );
}

