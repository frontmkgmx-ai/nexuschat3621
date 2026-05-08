import { useState, useEffect } from "react";
import Login from "./components/Login";
import Sidebar from "./components/Sidebar";
import ChatWindow from "./components/ChatWindow";
import Terms from "./components/Terms";
import { rtdb, db, auth } from "./lib/firebase";
import { ref, set, onDisconnect, onValue } from "firebase/database";
import { doc, getDoc, setDoc, updateDoc, onSnapshot, collection, query, orderBy, limit, arrayUnion } from "firebase/firestore";
import { requestNotificationPermission, setupForegroundMessages, showBrowserNotification } from "./services/fcm";

import { Toaster, toast } from 'sonner';

export default function App() {
  const [currentUser, setCurrentUser] = useState<any>(() => {
    const saved = sessionStorage.getItem("chat_user");
    return saved ? JSON.parse(saved) : null;
  });
  const [selectedConvo, setSelectedConvo] = useState<any>(null);
  const [isFirebaseReady, setIsFirebaseReady] = useState(false);

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
            username: currentUser.username || currentUser.phoneNumber,
            phoneNumber: currentUser.phoneNumber,
            avatarUrl: currentUser.avatarUrl || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser.phoneNumber}`,
            status: "online",
            lastSeen: Date.now()
          });
        }

        // Keep current user updated in real-time
        unsubscribeUser = onSnapshot(userRef, (docSnap) => {
          if (docSnap.exists()) {
            setCurrentUser((prev: any) => {
              const updated = { ...prev, ...docSnap.data() };
              sessionStorage.setItem("chat_user", JSON.stringify(updated));
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

        const roleRef = ref(rtdb, `users/${currentUser._id}/role`);
        onValue(roleRef, (snapshot) => {
          const role = snapshot.val();
          if (role) {
            updateDoc(doc(db, "users", currentUser._id), { role }).catch(() => {});
          }
        });

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

  const handleLogin = (user: any) => {
    sessionStorage.setItem("chat_user", JSON.stringify(user));
    setCurrentUser(user);
  };

  const handleLogout = async () => {
    try {
      await auth.signOut();
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
      className="h-[100dvh] w-full bg-zinc-950 flex flex-col items-center justify-center p-0 md:p-4 overflow-hidden relative"
    >
      <Toaster position="top-center" theme="dark" richColors />
      <div 
        className="flex w-full h-full max-w-[1600px] bg-zinc-900 md:border md:border-zinc-800 shadow-2xl md:rounded-2xl z-10 overflow-hidden relative"
        style={{ WebkitTransform: "translate3d(0,0,0)", transform: "translate3d(0,0,0)" }}
      >
        <Sidebar
          currentUser={currentUser}
          selectedConvo={selectedConvo}
          onSelectConvo={setSelectedConvo}
          onLogout={handleLogout}
          isMobileHidden={!!selectedConvo}
        />
        <ChatWindow 
          currentUser={currentUser} 
          conversation={selectedConvo} 
          isMobileHidden={!selectedConvo}
          onBack={() => setSelectedConvo(null)}
        />
      </div>
    </div>
  );
}
