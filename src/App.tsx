import { useState, useEffect } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import Terms from "./components/Terms";
import UserProfileModal from "./components/UserProfileModal";
import OnboardingModal from "./components/OnboardingModal";
import { rtdb, db, auth } from "./lib/firebase";
import { ref, set, onDisconnect, onValue } from "firebase/database";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, arrayUnion, where, getDocs, addDoc } from "firebase/firestore";
import { requestNotificationPermission, setupForegroundMessages, showBrowserNotification } from "./services/fcm";
import { useNexusNative } from "./hooks/useNexusNative";

import { Toaster, toast } from 'sonner';

export default function App() {
  const { isNative } = useNexusNative();
  const [currentUser, setCurrentUser] = useState<any>(() => {
    try {
      const saved = localStorage.getItem("chat_user_v2");
      if (saved) {
        const parsed = JSON.parse(saved);
        if (parsed.expiresAt && Date.now() < parsed.expiresAt) {
          return parsed.user;
        } else {
          localStorage.removeItem("chat_user_v2");
        }
      }
    } catch (e) {}
    
    // Fallback for old session users
    const oldSaved = sessionStorage.getItem("chat_user");
    if (oldSaved) {
       const user = JSON.parse(oldSaved);
       const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000;
       localStorage.setItem("chat_user_v2", JSON.stringify({ user, expiresAt }));
       sessionStorage.removeItem("chat_user");
       return user;
    }
    return null;
  });

  const [showOnboarding, setShowOnboarding] = useState(false);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

  const saveUserLocally = (user: any) => {
    const expiresAt = Date.now() + 7 * 24 * 60 * 60 * 1000; // 7 days
    localStorage.setItem("chat_user_v2", JSON.stringify({ user, expiresAt }));
  };
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [publicProfileUser, setPublicProfileUser] = useState<any>(null);

  useEffect(() => {
    if (!currentUser) return;

    const checkJoinLink = async () => {
        const path = window.location.pathname;
        if (path.startsWith('/join/')) {
            const commId = path.split('/')[2];
            if (commId) {
                try {
                    const commRef = doc(db, "communities", commId);
                    const commSnap = await getDoc(commRef);
                    if (commSnap.exists()) {
                        const commData = commSnap.data();
                        // Add user to community members
                        if (!commData.members?.includes(currentUser._id)) {
                             await updateDoc(commRef, { members: arrayUnion(currentUser._id) });
                        }
                        // Add user to all groups of this community as normal participant
                        if (commData.groups?.length > 0) {
                            for (const gId of commData.groups) {
                                const gRef = doc(db, "conversations", gId);
                                const gSnap = await getDoc(gRef);
                                if (gSnap.exists()) {
                                    const gData = gSnap.data();
                                    if (!gData.participants?.includes(currentUser._id)) {
                                        await updateDoc(gRef, { participants: arrayUnion(currentUser._id) });
                                    }
                                }
                            }
                        }
                        toast.success(`Você entrou na comunidade: ${commData.name}`);
                    } else {
                        toast.error("Comunidade não encontrada.");
                    }
                } catch (e) {
                    console.error("Error joining community", e);
                }
                window.history.replaceState({}, '', '/');
            }
        }
    };
    checkJoinLink();

    let timeout: NodeJS.Timeout;
    let unsubscribeUser: () => void;

    const setupFirebaseUser = async () => {
      try {
        // Ensure user exists in Firestore
        const userRef = doc(db, "users", currentUser._id);
        const userSnap = await getDoc(userRef);
        
        if (!userSnap.exists()) {
          await setDoc(userRef, {
            _id: currentUser._id,
            username: currentUser.username || "User",
            phoneNumber: currentUser.phoneNumber || null,
            avatarUrl: currentUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.username || 'user'}`,
            status: "online",
            lastSeen: Date.now()
          });
        }

        // Keep current user updated in real-time
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            const data = docSnap.data();

            // session validation
            setCurrentUser((prev: any) => {
              if (prev && prev.sessionId) {
                // If the doc doesn't have activeSessions or we're not in it
                const isValid = Array.isArray(data.activeSessions) && data.activeSessions.some((s: any) => s.id === prev.sessionId);
                if (!isValid) {
                   toast.error("Sua sessão foi encerrada por outro dispositivo.");
                   if (auth.currentUser) {
                      auth.signOut().catch(() => {});
                   }
                   localStorage.clear();
                   sessionStorage.clear();
                   setTimeout(() => {
                     window.location.reload();
                   }, 500);
                   return null; // Force unmount by making user null
                }
              }

              const updated = { ...prev, ...data };
              saveUserLocally(updated);
              return updated;
            });
          }
        });
        
        setIsFirebaseReady(true);
        
        const myConnectionsRef = ref(rtdb, `users/${currentUser._id}/connections`);
        const lastOnlineRef = ref(rtdb, `users/${currentUser._id}/lastOnline`);
        const statusRef = ref(rtdb, `users/${currentUser._id}/status`);

        const setOnline = () => {
          setCurrentUser((prev: any) => ({ ...prev, status: "online" }));
          set(statusRef, "online");
          set(lastOnlineRef, Date.now());
          updateDoc(doc(db, "users", currentUser._id), { status: "online", lastSeen: Date.now() }).catch(() => {});
        };
        const setIdle = () => {
          setCurrentUser((prev: any) => ({ ...prev, status: "idle" }));
          set(statusRef, "idle");
          updateDoc(doc(db, "users", currentUser._id), { status: "idle" }).catch(() => {});
        };
        
        setOnline();

        // Setup disconnect behavior
        onDisconnect(statusRef).set("offline");
        onDisconnect(lastOnlineRef).set(Date.now());

        const resetIdleTimer = () => {
          clearTimeout(timeout);
          setOnline();
          timeout = setTimeout(setIdle, 5 * 60 * 1000); // 5 mins idle
        };

        window.addEventListener("mousemove", resetIdleTimer);
        window.addEventListener("keydown", resetIdleTimer);
        window.addEventListener("touchstart", resetIdleTimer);
        window.addEventListener("focus", setOnline);
        window.addEventListener("blur", setIdle);
        
        // FCM Initialization
        requestNotificationPermission(currentUser._id).then(granted => {
           if (granted) setupForegroundMessages();
        });
      } catch(e) {
        console.error("Firebase auth error:", e);
        // Fallback: still show the UI even if realtime db/presence failed
        setIsFirebaseReady(true);
      }
    };

    setupFirebaseUser();

    // Nexus Notifify Setup
    const q = query(collection(db, "appUpdates"), orderBy("createdAt", "desc"), limit(1));
    const unsubUpdates = onSnapshot(q, (snapshot) => {
       snapshot.docChanges().forEach(change => {
           if (change.type === "added") {
              const data = change.doc.data();
              // Prevent showing notification for very old data when first loading
              if (data.createdAt && data.createdAt > Date.now() - 30000) {
                 toast.success(`Nexus Notifify: Nova versão ${data.version}!`, {
                    description: data.title
                 });
                 showBrowserNotification(`Nova versão do App: ${data.version}`, {
                     body: data.title
                 });
              }
           }
       });
    });

    const handleUnload = () => {
      // sessionStorage.removeItem("chat_user");
    };
    window.addEventListener("beforeunload", handleUnload);

    return () => {
      clearTimeout(timeout);
      if (unsubscribeUser) unsubscribeUser();
      unsubUpdates();
      window.removeEventListener("beforeunload", handleUnload);
    };
  }, [currentUser?._id]);

  const handleLogin = (user: any, isNewUser: boolean = false) => {
    saveUserLocally(user);
    setCurrentUser(user);
    if (isNewUser) {
      setShowOnboarding(true);
    }
  };

  const handleLogout = async () => {
    try {
      if (auth.currentUser) {
        await auth.signOut();
      }
      localStorage.clear();
      sessionStorage.clear();
      setCurrentUser(null);
      setSelectedConvo(null);
      setIsFirebaseReady(false);
      window.location.reload(); // Refresh to clear all states/listeners
    } catch (err) {
      console.error("Error during logout:", err);
      // Fallback
      localStorage.clear();
      sessionStorage.clear();
      window.location.reload();
    }
  };

  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault();
    };
    document.addEventListener('contextmenu', handleContextMenu);
    return () => {
      document.removeEventListener('contextmenu', handleContextMenu);
    };
  }, []);

  if (window.location.pathname === '/terms') {
    return <Terms />;
  }

  if (!currentUser) {
    return <Login onLogin={handleLogin} />;
  }

  if (!isFirebaseReady) {
    return <div className="h-[100dvh] w-full bg-zinc-950 flex items-center justify-center text-zinc-500">Initializing Secure Link...</div>;
  }

  return (
    <div 
      className={`h-[100dvh] w-full bg-zinc-950 flex flex-col items-center justify-center overflow-hidden relative ${isNative ? 'p-0' : 'p-0 md:p-4'}`}
    >
      <Toaster position="top-center" theme="dark" richColors />
      <div 
        className={`flex w-full h-full bg-zinc-900 z-10 overflow-hidden relative ${isNative ? 'max-w-none border-none rounded-none' : 'max-w-[1600px] md:border md:border-zinc-800 shadow-2xl md:rounded-2xl'}`}
        style={{ WebkitTransform: "translate3d(0,0,0)", transform: "translate3d(0,0,0)" }}
      >
        <Sidebar
          currentUser={currentUser}
          selectedConvo={selectedConvo}
          onSelectConvo={setSelectedConvo}
          onLogout={handleLogout}
          isMobileHidden={!!selectedConvo}
          onOpenProfile={setPublicProfileUser}
        />
        <ChatWindow 
          currentUser={currentUser} 
          conversation={selectedConvo} 
          isMobileHidden={!selectedConvo}
          onBack={() => setSelectedConvo(null)}
          onOpenProfile={setPublicProfileUser}
        />
         {publicProfileUser && (
           <UserProfileModal 
              userId={publicProfileUser} 
              currentUserId={currentUser._id} 
              onClose={() => setPublicProfileUser(null)} 
              onMessage={async () => {
                 setPublicProfileUser(null);
                 const q1 = query(collection(db, "conversations"), where("participants", "array-contains", currentUser._id));
                 const snapshot = await getDocs(q1);
                 let convoId = null;
                 for (const d of snapshot.docs) {
                    const data = d.data();
                    if (data.participants.includes(publicProfileUser) && data.participants.length === 2 && !data.isGroup) {
                       convoId = d.id;
                       break;
                    }
                 }
                 if (!convoId) {
                    const newDoc = await addDoc(collection(db, "conversations"), {
                       participants: [currentUser._id, publicProfileUser],
                       isGroup: false,
                       updatedAt: Date.now()
                    });
                    convoId = newDoc.id;
                 }
                 setSelectedConvo({
                    _id: convoId,
                    participants: [currentUser._id, publicProfileUser],
                    isGroup: false,
                    otherUser: { _id: publicProfileUser }
                 });
              }}
           />
        )}
        
        {showOnboarding && (
           <OnboardingModal currentUser={currentUser} onClose={() => setShowOnboarding(false)} />
        )}
      </div>
    </div>
  );
}
