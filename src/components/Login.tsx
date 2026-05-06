import React, { useState, useEffect } from "react";
import { parsePhoneNumber, getCountries, getCountryCallingCode, CountryCode } from "libphonenumber-js";
import { Camera } from "lucide-react";
import { db, auth } from "../lib/firebase";
import { collection, query, where, getDocs, setDoc, doc } from "firebase/firestore";
import { GoogleAuthProvider, signInWithPopup } from "firebase/auth";

type LoginStep = "PHONE" | "OTP" | "PROFILE";

import { sanitizeUrl } from "../services/fileApi";
import { CALL_API_BASE } from "../services/callApi";

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

  useEffect(() => {
    // Attempt to auto-detect country
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code) setCountryCode(data.country_code as CountryCode);
      })
      .catch(() => {});
  }, []);

  const handlePhoneSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setGoogleLinked(false);
    setGoogleEmail(null);
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
        
        if (isAIStudio) {
          // Instead of skipping entirely, let's go to OTP if they want to simulate or use Google
          setStep("OTP");
        } else {
          setStep("OTP");
        }
      } else {
        setError("Invalid phone number for the selected country.");
      }
    } catch (err) {
      setError("Please enter a valid phone number.");
    }
  };

  const proceedToProfile = () => {
    setStep("PROFILE");
  };

  const handleGoogleLogin = async () => {
    setError("");
    setLoading(true);
    try {
      const scope = "email profile";
      const action = "login";
      
      const urlRes = await fetch(`${CALL_API_BASE}/api/auth/google/url?action=${action}&scope=${encodeURIComponent(scope)}`);
      const { url } = await urlRes.json();
      
      const authWindow = window.open(url, "google_auth", "width=500,height=600");
      if (!authWindow) {
         setLoading(false);
         setError("O bloqueador de pop-ups bloqueou a janela. Por favor, permita popups ou abra o aplicativo em uma nova aba usando o botão no canto superior direito.");
         return;
      }

      const handleMessage = async (event: MessageEvent) => {
         if (event.data?.type !== 'GOOGLE_AUTH_SUCCESS' && event.data?.type !== 'GOOGLE_AUTH_ERROR') return;
         if (event.data?.type === 'GOOGLE_AUTH_ERROR') {
            setLoading(false);
            if (event.data.error !== 'access_denied') {
               setError("Erro ao autenticar: " + event.data.error);
            }
            window.removeEventListener('message', handleMessage);
         } else if (event.data?.type === 'GOOGLE_AUTH_SUCCESS' && event.data.action === 'login') {
            window.removeEventListener('message', handleMessage);
            const userEmail = event.data.user?.email;
            
            if (googleLinked && googleEmail === userEmail) {
              setLoading(false);
              proceedToProfile();
            } else {
              setLoading(false);
              setError("O email retornado pelo Google não corresponde ao email vinculado a esta conta.");
            }
         }
      };
      window.addEventListener('message', handleMessage);
    } catch (e: any) {
      console.error(e);
      setError("Erro ao iniciar autenticação com o Google.");
      setLoading(false);
    }
  };

  const handleOtpSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (otp.length < 4) {
      setError("Please enter a valid code.");
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

      if (!isExistingProfile && userId) {
        await setDoc(doc(db, "users", userId), userData);
      } else if (userId) {
        await setDoc(doc(db, "users", userId), userData, { merge: true });
      }

      onLogin(userData);
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
      setError(`Failed to save profile: ${err.message || 'Unknown error'}`);
      throw new Error(JSON.stringify(firestoreError));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[100dvh] bg-zinc-950 flex flex-col items-center justify-center relative font-sans p-4">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(99,102,241,0.08)_0%,transparent_100%)] z-0 pointer-events-none"></div>
      
      <div className="text-center z-10 mb-8">
        <div className="w-16 h-16 bg-indigo-600/20 border border-indigo-500/50 rounded-2xl mx-auto flex items-center justify-center mb-4">
          <div className="w-8 h-8 bg-indigo-500 rounded-lg transform rotate-45 flex items-center justify-center shadow-[0_0_20px_rgba(99,102,241,0.5)]">
            <div className="w-3 h-3 bg-zinc-950 transform -rotate-45" />
          </div>
        </div>
        <h1 className="text-3xl font-display font-bold tracking-tight text-zinc-100">CHAT</h1>
        <p className="text-zinc-500 text-sm font-medium tracking-widest uppercase mt-1">Encrypted Comms</p>
      </div>

      <div className="bg-zinc-900 border border-zinc-800 rounded-3xl shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 w-full max-w-md p-8 sm:p-10 relative overflow-hidden backdrop-blur-xl">
        
        {step === "PHONE" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-display font-semibold text-zinc-100 mb-2">Initialize Link</h2>
              <p className="text-zinc-400 text-sm">Nós enviaremos um código de verificação para autenticar sua sessão.</p>
            </div>

            <form onSubmit={handlePhoneSubmit} className="space-y-6">
              <div className="flex flex-col gap-4">
                 <select 
                   value={countryCode} 
                   onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                   className="w-full bg-zinc-950 border border-zinc-800 py-3 px-4 outline-none focus:border-indigo-500 rounded-xl text-zinc-100 transition-colors text-sm"
                 >
                   {getCountries().map((c) => (
                      <option key={c} value={c}>
                        {c} (+{getCountryCallingCode(c)})
                      </option>
                   ))}
                 </select>

                <div className="flex gap-3">
                  <div className="w-20 bg-zinc-950 border border-zinc-800 rounded-xl py-3 text-zinc-400 flex items-center justify-center text-sm font-medium">
                    +{getCountryCallingCode(countryCode)}
                  </div>
                  <input
                    type="tel"
                    required
                    className="flex-1 bg-zinc-950 border border-zinc-800 rounded-xl py-3 px-4 outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors text-sm"
                    placeholder="communication id"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                  />
                </div>
              </div>

              {error && <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 border border-red-400/20 py-2 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={!phoneNumber}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 font-display mt-2"
              >
                Next
              </button>
            </form>
          </>
        )}

        {step === "OTP" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-display font-semibold text-zinc-100 mb-2">Awaiting Cipher</h2>
              <p className="text-zinc-400 text-sm">
                Intercepting signal for
                <span className="font-semibold text-indigo-400 block mt-1">+{getCountryCallingCode(countryCode)} {phoneNumber}</span>
              </p>
              <p className="text-xs text-zinc-500 mt-2 cursor-pointer hover:text-zinc-300 transition-colors" onClick={() => setStep("PHONE")}>Abort and retry?</p>
            </div>

            <form onSubmit={handleOtpSubmit} className="space-y-6">
              <div className="flex justify-center">
                <input
                  type="text"
                  required
                  maxLength={6}
                  className="w-32 bg-transparent text-center text-2xl tracking-widest border-b-2 border-zinc-700 py-2 outline-none focus:border-indigo-500 text-indigo-400 transition-colors"
                  placeholder="- - - - - -"
                  value={otp}
                  onChange={(e) => setOtp(e.target.value)}
                />
              </div>

              <p className="text-xs text-zinc-600 text-center uppercase tracking-widest">Simulation Mode Active</p>
              
              {error && <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 border border-red-400/20 py-2 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading || otp.length < 4}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 font-display mt-2"
              >
                {loading ? "Verifying..." : "Verify"}
              </button>
            </form>

            {googleLinked && (
              <div className="mt-6 pt-6 border-t border-zinc-800">
                <p className="text-zinc-400 text-xs text-center mb-4">Ou faça login com a conta vinculada</p>
                <button
                  onClick={handleGoogleLogin}
                  disabled={loading}
                  className="w-full flex items-center justify-center gap-3 bg-white text-zinc-900 py-3 px-4 rounded-xl font-medium hover:bg-zinc-100 transition-all font-display"
                >
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                    <path fill="none" d="M1 1h22v22H1z" />
                  </svg>
                  Login com Google
                </button>
              </div>
            )}
          </>
        )}

        {step === "PROFILE" && (
          <>
            <div className="text-center mb-8">
              <h2 className="text-xl font-display font-semibold text-zinc-100 mb-2">Configure Operator</h2>
              <p className="text-zinc-400 text-sm">Establish your identity on the network.</p>
            </div>

            <form onSubmit={handleProfileSubmit} className="space-y-6">
              <div className="flex flex-col items-center gap-6">
                
                <div className="relative group cursor-pointer w-full text-center flex flex-col items-center">
                  <div className="w-24 h-24 rounded-2xl bg-zinc-950 border border-zinc-800 overflow-hidden flex items-center justify-center transition-colors shadow-inner">
                    {avatarUrl ? (
                      <img src={sanitizeUrl(avatarUrl)} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center bg-zinc-900 text-zinc-600">
                        {username.charAt(0).toUpperCase() || "?"}
                      </div>
                    )}
                  </div>
                </div>

                <div className="w-full space-y-4">
                  <div>
                    <label className="text-[10px] text-zinc-500 uppercase tracking-widest font-bold mb-2 block text-center">Callsign</label>
                    <input
                      type="text"
                      required={!isExistingProfile}
                      className="w-full bg-zinc-950 border border-zinc-800 py-3 outline-none focus:border-indigo-500 text-zinc-100 placeholder-zinc-600 transition-colors text-center text-sm rounded-xl font-display"
                      placeholder="@username"
                      value={username}
                      onChange={(e) => setUsername(e.target.value)}
                    />
                  </div>
                </div>
              </div>

              {error && <p className="text-red-400 text-xs text-center font-medium bg-red-400/10 border border-red-400/20 py-2 rounded-lg">{error}</p>}

              <button
                type="submit"
                disabled={loading || (!username && !isExistingProfile)}
                className="w-full bg-indigo-600 text-white py-3 px-4 rounded-xl font-medium hover:bg-indigo-500 transition-all shadow-[0_0_20px_rgba(99,102,241,0.3)] disabled:opacity-50 font-display mt-2"
              >
                {loading ? "Saving..." : (isExistingProfile ? "Confirm Identity" : "Initialize")}
              </button>
            </form>
          </>
        )}

      </div>
    </div>
  );
}

