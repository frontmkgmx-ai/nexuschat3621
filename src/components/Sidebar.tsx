import { toast } from 'sonner';
import React, { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import { 
  MessageCircle, 
  Search, 
  LogOut, 
  Check, 
  CheckCheck, 
  ArrowLeft, 
  UserPlus, 
  Camera, 
  Settings, 
  Users, 
  Users2,
  PhoneCall, 
  Shield,
  CircleDashed,
  Globe,
  Newspaper,
  ChevronRight,
  User,
  Video,
  HardDrive,
  X,
  ChevronDown,
  Plus,
  Phone,
  Edit2,
  Edit3,
  CheckCircle2,
  Loader2,
  MessageSquare,
  Trash2, Archive, Download, FileText, UserPlus as AddUserIcon, MoreVertical, BadgeCheck, QrCode, Monitor
} from "lucide-react";
import { format } from "date-fns";
import { parsePhoneNumber, getCountryCallingCode, CountryCode, getCountries } from "libphonenumber-js";
import { AnimatePresence, motion } from "motion/react";
import { db, auth, rtdb } from "../lib/firebase";
import { collection, query, where, onSnapshot, getDocs, doc, setDoc, updateDoc, serverTimestamp, addDoc, getDoc, writeBatch } from "firebase/firestore";
import { ref as dbRef, onValue } from "firebase/database";
import { CALL_API_BASE } from "../services/callApi";
import { GoogleAuthProvider, linkWithPopup, unlink, signInWithPopup } from "firebase/auth";
import { uploadProfilePhoto, sanitizeUrl } from "../services/storageService";
import NewsView from "./NewsView";
import Inpage from "./Inpage";
import TermsAndPrivacy from "./TermsAndPrivacy";
import CommunitiesTab from "./CommunitiesTab";
import ScanQRCodeView from "./ScanQRCodeView";
import { useNexusNative } from "../hooks/useNexusNative";
import DesktopSettings from "./DesktopSettings";

import WindowsAppView from './WindowsAppView';

type InternalTab = "CHATS" | "CONTACTS" | "GROUPS" | "SETTINGS" | "PROFILE" | "INPAGE" | "COMMUNITIES" | "NEWS" | "QRCODE" | "WINDOWS_APP";

import ConfirmModal from "./ConfirmModal";

export default function Sidebar({
  currentUser,
  selectedConvo,
  onSelectConvo,
  onLogout,
  isMobileHidden,
  onOpenProfile,
}: {
  currentUser: any;
  selectedConvo: any;
  onSelectConvo: (convo: any) => void;
  onLogout: () => void;
  isMobileHidden?: boolean;
  onOpenProfile?: (userId: string) => void;
}) {
  const { isNative } = useNexusNative();
  const [activeTab, setActiveTab] = useState<InternalTab>("CHATS");
  const [settingsView, setSettingsView] = useState<"MENU" | "ACCOUNT" | "PRIVACY" | "AUDIO_VIDEO" | "BACKUPS" | "TERMS">("MENU");
  const [confirmState, setConfirmState] = useState<{isOpen: boolean, title: string, message: string, onConfirm: () => void}>({
    isOpen: false, title: "", message: "", onConfirm: () => {}
  });
  const [search, setSearch] = useState("");
  const [showAddContact, setShowAddContact] = useState(false);
  const [newContactName, setNewContactName] = useState("");
  const [newContactPhone, setNewContactPhone] = useState("");
  const [countryCode, setCountryCode] = useState<CountryCode>("BR");
  
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [chatOrderLayout, setChatOrderLayout] = useState<string[]>(() => {
    try {
      return JSON.parse(localStorage.getItem(`chatOrder_${currentUser._id}`) || "[]");
    } catch {
      return [];
    }
  });

  useEffect(() => {
    localStorage.setItem(`chatOrder_${currentUser._id}`, JSON.stringify(chatOrderLayout));
  }, [chatOrderLayout, currentUser._id]);
  
  const [profileName, setProfileName] = useState(currentUser.username);
  const [profileAvatar, setProfileAvatar] = useState(currentUser.avatarUrl ? sanitizeUrl(currentUser.avatarUrl) : "");
  const [profileBanner, setProfileBanner] = useState(currentUser.bannerUrl ? sanitizeUrl(currentUser.bannerUrl) : "");
  const [avatarUploadProgress, setAvatarUploadProgress] = useState<number | null>(null);
  const [bannerUploadProgress, setBannerUploadProgress] = useState<number | null>(null);
  const [linkedProviders, setLinkedProviders] = useState<string[]>([]);
  const [isLinkingProvider, setIsLinkingProvider] = useState(false);
  const [isEditingProfile, setIsEditingProfile] = useState(false);
  const [showContactPicker, setShowContactPicker] = useState(false);
  const [isSyncingContacts, setIsSyncingContacts] = useState(false);

  const [syncState, setSyncState] = useState({ isSyncing: true, progress: 0 });

  const updateUserSetting = async (key: string, value: boolean) => {
    try {
      await updateDoc(doc(db, "users", currentUser._id), {
        [`settings.${key}`]: value
      });
    } catch (e) {
      console.error("Error updating setting", e);
    }
  };

  useEffect(() => {
    let unmounted = false;
    const initialSync = async () => {
      // Run only on mobile context as requested
      if (window.innerWidth > 768) {
        setSyncState({ isSyncing: false, progress: 100 });
        return;
      }
      
      try {
        setSyncState({ isSyncing: true, progress: 5 });
        const qConv = query(collection(db, "conversations"), where("participants", "array-contains", currentUser._id));
        const snapConv = await getDocs(qConv);
        const convos = snapConv.docs.map(d => ({ _id: d.id, ...d.data() } as any));
        
        let loaded = 0;
        const otherUserIds = Array.from(new Set(
          convos
            .filter(c => !c.isGroup)
            .map(c => c.participants?.find((p: string) => p !== currentUser._id))
            .filter(Boolean)
        )) as string[];
        
        const qCont = query(collection(db, "users", currentUser._id, "contacts"));
        const snapCont = await getDocs(qCont);

        const totalSteps = otherUserIds.length + snapCont.docs.length;

        setSyncState({ isSyncing: true, progress: 30 });
        
        if (totalSteps > 0) {
          // now pre-fetch the users
          for (const uid of otherUserIds) {
             await getDoc(doc(db, "users", uid));
             loaded++;
             if (!unmounted) setSyncState({ isSyncing: true, progress: 30 + Math.floor((loaded / totalSteps) * 70) });
          }
          
          for (const c of snapCont.docs) {
             const cData = c.data();
             if (cData.registeredUserId) {
                await getDoc(doc(db, "users", cData.registeredUserId));
             }
             loaded++;
             if (!unmounted) setSyncState({ isSyncing: true, progress: 30 + Math.floor((loaded / totalSteps) * 70) });
          }
        }
        
        // Finalize
        setTimeout(() => {
           if (!unmounted) setSyncState({ isSyncing: false, progress: 100 });
        }, 500);
      } catch (err) {
        if (!unmounted) setSyncState({ isSyncing: false, progress: 100 });
      }
    };
    initialSync();
    return () => { unmounted = true; };
  }, [currentUser._id]);

  useEffect(() => {
    // Check if the current user profile in firestore has googleLink
    const unsub = onSnapshot(doc(db, "users", currentUser._id), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        if (data.googleLinked) {
          setLinkedProviders(['google.com']);
        } else {
          setLinkedProviders([]);
        }
      }
    });
    return () => unsub();
  }, [currentUser._id]);

  useEffect(() => {
    if (activeTab !== "SETTINGS") {
      setSettingsView("MENU");
    }
  }, [activeTab]);

  useEffect(() => {
    setProfileName(currentUser.username);
    if (currentUser.avatarUrl) {
      setProfileAvatar(sanitizeUrl(currentUser.avatarUrl));
    }
  }, [currentUser.username, currentUser.avatarUrl]);

  const [chatContextMenu, setChatContextMenu] = useState<{ x: number, y: number, convo: any } | null>(null);
  const [showArchived, setShowArchived] = useState(false);
  const [showAddConvoMembers, setShowAddConvoMembers] = useState<any | null>(null);

  const [myConvos, setMyConvos] = useState<any[]>([]);
  const [usersInfo, setUsersInfo] = useState<{[key: string]: any}>({});
  const [savedContacts, setSavedContacts] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<{[convoId: string]: boolean}>({});

  useEffect(() => {
    // Listen to conversations
    const q = query(
      collection(db, "conversations"),
      where("participants", "array-contains", currentUser._id)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const convos = snapshot.docs.map(d => ({ _id: d.id, ...d.data() } as any));
      convos.sort((a, b) => ((b.updatedAt || 0) as number) - ((a.updatedAt || 0) as number));
      setMyConvos(convos);
    });
    return () => unsubscribe();
  }, [currentUser._id]);

  useEffect(() => {
    if (myConvos.length === 0) return;
    const processDelivery = async () => {
      myConvos.forEach(async (convo) => {
        if (
          convo.lastMessage && 
          convo.lastMessage.senderId !== currentUser._id && 
          convo.lastMessage.status === "sent"
        ) {
          const qMsgs = query(
            collection(db, "messages"),
            where("conversationId", "==", convo._id),
            where("status", "==", "sent")
          );
          const qSnap = await getDocs(qMsgs);
          if (!qSnap.empty) {
            const batch = writeBatch(db);
            let hasUpdates = false;
            qSnap.forEach(d => {
               if (d.data().senderId !== currentUser._id) {
                 batch.update(d.ref, { status: "delivered" });
                 hasUpdates = true;
               }
            });
            if (hasUpdates) {
               await batch.commit();
               await updateDoc(doc(db, "conversations", convo._id), {
                 "lastMessage.status": "delivered"
               }).catch(() => {});
            }
          }
        }
      });
    };
    processDelivery();
  }, [myConvos, currentUser._id]);

  // Read typing status for all active conversations
  useEffect(() => {
    if (myConvos.length === 0) return;
    const unsubs: (() => void)[] = [];
    myConvos.forEach(convo => {
      if (document.hidden) return; // Don't subscribe to typing if tab isn't open? No, let's just listen.
      const typingRef = dbRef(rtdb, `conversations/${convo._id}/typing`);
      const unsub = onValue(typingRef, (snapshot) => {
         const val = snapshot.val();
         let isTyping = false;
         if (val) {
            Object.keys(val).forEach(k => {
               if (k !== currentUser._id && val[k] === true) {
                 isTyping = true;
               }
            });
         }
         setTypingUsers(prev => ({...prev, [convo._id]: isTyping}));
      });
      unsubs.push(() => unsub());
    });
    return () => unsubs.forEach(u => u());
  }, [myConvos.map(c => c._id).join(','), currentUser._id]);

  useEffect(() => {
    // Listen to all users involved in conversations
    if (myConvos.length === 0) return;
    
    const allParticipantIds = Array.from(new Set(
      myConvos
        .flatMap(c => c.participants || [])
    )).filter(id => id !== currentUser._id) as string[];

    const unsubs = allParticipantIds.map(uid => 
      onSnapshot(doc(db, "users", uid), (snap) => {
        if (snap.exists()) {
          setUsersInfo(prev => ({ ...prev, [uid]: { _id: snap.id, ...snap.data() } }));
        }
      })
    );

    return () => unsubs.forEach(unsub => unsub());
  }, [myConvos.map(c => c._id).join(',')]);

  useEffect(() => {
    // Listen to current user's contacts list
    const q = query(collection(db, "users", currentUser._id, "contacts"));
    const unsubscribe = onSnapshot(q, async (snapshot) => {
      const myContactsDocs = snapshot.docs.map(d => ({ _id: d.id, ...d.data() }));
      
      const populated = await Promise.all(myContactsDocs.map(async (c: any) => {
        if (c.registeredUserId) {
          const uDoc = await getDoc(doc(db, "users", c.registeredUserId));
          if (uDoc.exists()) {
            return { ...c, userProfile: { _id: uDoc.id, ...uDoc.data() } };
          }
        }
        return c;
      }));
      
      setSavedContacts(populated);
    });
    return () => unsubscribe();
  }, [currentUser._id]);
  
  const contacts = savedContacts.map(c => ({
    _id: c._id,
    name: c.name,
    phoneNumber: c.phoneNumber,
    userProfile: c.userProfile || null,
    registeredUserId: c.registeredUserId || null
  }));

  useEffect(() => {
    fetch("https://ipapi.co/json/")
      .then((res) => res.json())
      .then((data) => {
        if (data.country_code) setCountryCode(data.country_code as CountryCode);
      })
      .catch(() => {});
  }, []);

  const filteredConvos = myConvos.map(c => {
    const otherId = c.participants?.find((p: string) => p !== currentUser._id);
    return { ...c, otherUser: otherId ? usersInfo[otherId] : null };
  }).filter(c => {
    if (c.deletedBy?.[currentUser._id] === true) return false;
    if (c.isCommunityChannel) return false;

    const isArchived = c.archivedBy?.[currentUser._id] === true;
    if (showArchived && !isArchived) return false;
    if (!showArchived && isArchived) return false;

    const nameMatch = c.isGroup 
      ? c.name?.toLowerCase().includes(search.toLowerCase())
      : c.otherUser?.username?.toLowerCase().includes(search.toLowerCase());
    const phoneMatch = !c.isGroup && c.otherUser?.phoneNumber?.includes(search);
    return nameMatch || phoneMatch;
  });

  const sortedFilteredConvos = [...filteredConvos].sort((a, b) => {
    const idxA = chatOrderLayout.indexOf(a._id);
    const idxB = chatOrderLayout.indexOf(b._id);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return 0; // maintain original `updatedAt` order for ones not in layout
  });

  const handleDrop = (e: React.DragEvent, targetConvoId: string) => {
    e.preventDefault();
    if (!draggedId || draggedId === targetConvoId) return;
    
    // Construct current full id list from all filtered (both customized and default)
    const currentOrder = sortedFilteredConvos.map(c => c._id);
    const fromIndex = currentOrder.indexOf(draggedId);
    const toIndex = currentOrder.indexOf(targetConvoId);
    
    if (fromIndex !== -1 && toIndex !== -1) {
       const newOrder = [...currentOrder];
       const [removed] = newOrder.splice(fromIndex, 1);
       newOrder.splice(toIndex, 0, removed);
       setChatOrderLayout(newOrder);
    }
    setDraggedId(null);
  };

  const handleArchiveConvo = async (convo: any) => {
    try {
      const isArchived = convo.archivedBy?.[currentUser._id] === true;
      await updateDoc(doc(db, "conversations", convo._id), {
         [`archivedBy.${currentUser._id}`]: !isArchived
      });
      setChatContextMenu(null);
    } catch (e) {
      console.error(e);
    }
  };

  const handleExportConvo = async (convo: any) => {
    try {
      setChatContextMenu(null);
      const msgsSnap = await getDocs(query(collection(db, `conversations/${convo._id}/messages`)));
      let text = `Conversa Exportada - ${convo.isGroup ? convo.name : convo.otherUser?.username || "Chat"}\n\n`;
      const msgs = msgsSnap.docs.map(d => d.data());
      msgs.sort((a,b) => (a.createdAt || 0) - (b.createdAt || 0));
      msgs.forEach(m => {
         const date = m.createdAt ? new Date(m.createdAt).toLocaleString() : "Data Desconhecida";
         const sender = m.senderId === currentUser._id ? 'Você' : (usersInfo[m.senderId]?.username || 'Outro');
         text += `[${date}] ${sender}: ${m.text || (m.fileUrl ? '(Mídia/Arquivo)' : '')}\n`;
      });
      const blob = new Blob([text], {type: "text/plain;charset=utf-8"});
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `chat_export_${convo._id}.txt`;
      a.click();
      window.URL.revokeObjectURL(url);
    } catch(e) { console.error(e); }
  };

  const handleDeleteConvo = async (convo: any) => {
    setConfirmState({
      isOpen: true,
      title: "Excluir Conversa",
      message: "Tem certeza que deseja excluir esta conversa para você? (O histórico será perdido)",
      onConfirm: async () => {
        try {
          setChatContextMenu(null);
          // Soft delete for current user
          await updateDoc(doc(db, "conversations", convo._id), {
             [`deletedBy.${currentUser._id}`]: true
          });
          if(selectedConvo?._id === convo._id) {
             onSelectConvo(null);
          }
        } catch(e) { console.error(e); }
      }
    });
  };

  const [longPressTimer, setLongPressTimer] = useState<NodeJS.Timeout | null>(null);

  const handleTouchStart = (e: React.TouchEvent, convo: any) => {
    const touch = e.touches[0];
    const timer = setTimeout(() => {
      setChatContextMenu({ x: touch.clientX, y: touch.clientY, convo });
    }, 500);
    setLongPressTimer(timer);
  };
  const handleTouchEnd = () => {
    if (longPressTimer) clearTimeout(longPressTimer);
  };
  const filteredContacts = contacts.filter(c => c.name.toLowerCase().includes(search.toLowerCase()) || c.phoneNumber.includes(search));

  const handleStartConvo = async (otherUserId: string) => {
    // Check if convo exists
    const q1 = query(collection(db, "conversations"), where("participants", "array-contains", currentUser._id));
    const snapshot = await getDocs(q1);
    let convoId = null;
    
    for (const d of snapshot.docs) {
      const data = d.data();
      if (data.participants.includes(otherUserId) && data.participants.length === 2 && !data.isGroup) {
        convoId = d.id;
        break;
      }
    }

    if (!convoId) {
      const newDoc = await addDoc(collection(db, "conversations"), {
        participants: [currentUser._id, otherUserId],
        isGroup: false,
        updatedAt: Date.now()
      });
      convoId = newDoc.id;
    }
    
    setActiveTab("CHATS");
    setTimeout(() => {
      onSelectConvo({ 
        _id: convoId, 
        participants: [currentUser._id, otherUserId],
        isGroup: false,
        otherUser: { _id: otherUserId } 
      }); 
    }, 100);
  };

  const [newContactIdentifierType, setNewContactIdentifierType] = useState<"phone" | "email">("phone");
  const [newContactEmail, setNewContactEmail] = useState("");

  const handleAddContact = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      let registeredUserId = null;
      let finalPhoneNumber = "";
      let finalEmail = "";

      if (newContactIdentifierType === "phone") {
        const input = `+${getCountryCallingCode(countryCode)}${newContactPhone.replace(/\D/g, "")}`;
        const parsed = parsePhoneNumber(input);
        if (!parsed?.isValid()) {
           toast.error("Número de telefone inválido.");
           return;
        }
        finalPhoneNumber = parsed.number;

        const q = query(collection(db, "users"), where("phoneNumber", "==", finalPhoneNumber));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          registeredUserId = querySnapshot.docs[0].id;
        }
      } else {
        const inputEmail = newContactEmail.trim().toLowerCase();
        if (!inputEmail.includes("@")) {
          toast.error("E-mail inválido.");
          return;
        }
        finalEmail = inputEmail;

        const q = query(collection(db, "users"), where("googleEmail", "==", finalEmail));
        const querySnapshot = await getDocs(q);
        if (!querySnapshot.empty) {
          registeredUserId = querySnapshot.docs[0].id;
          finalPhoneNumber = querySnapshot.docs[0].data().phoneNumber || "";
        }
      }
      
      await addDoc(collection(db, "users", currentUser._id, "contacts"), {
        name: newContactName,
        phoneNumber: finalPhoneNumber,
        email: finalEmail,
        registeredUserId: registeredUserId,
        createdAt: Date.now()
      });
      
      setNewContactName("");
      setNewContactPhone("");
      setNewContactEmail("");
      setShowAddContact(false);
    } catch (err: any) {
      toast.error(err.message || "Falha ao adicionar contato");
    }
  };

  const handleUpdateProfile = async () => {
    try {
      await updateDoc(doc(db, "users", currentUser._id), {
        username: profileName,
      });
      setIsEditingProfile(false);
      toast.success("Perfil atualizado!");
    } catch (e) {
      toast.error("Falha ao atualizar perfil");
    }
  };

  const handleLinkGoogle = async () => {
    setIsLinkingProvider(true);
    try {
      const provider = new GoogleAuthProvider();
      const result = await signInWithPopup(auth, provider);
      const userEmail = result.user.email;
      const userId = result.user.uid;
      
      try {
        await updateDoc(doc(db, "users", currentUser._id), {
          googleLinked: true,
          googleEmail: userEmail,
          googleUid: userId,
        });
        toast.success("Conta Google vinculada com sucesso!");
      } catch (err: any) {
        toast.error("Erro ao salvar vinculação no banco de dados.");
        console.error(err);
      } finally {
        setIsLinkingProvider(false);
      }
    } catch (error: any) {
      console.error("Error linking Google:", error);
      if (error.code !== 'auth/popup-closed-by-user') {
        toast.error("Erro ao iniciar a vinculação com o Google.");
      }
      setIsLinkingProvider(false);
    }
  };

  const handleUnlinkGoogle = async () => {
    setIsLinkingProvider(true);
    try {
      await updateDoc(doc(db, "users", currentUser._id), {
        googleLinked: false,
        googleEmail: null,
        googleUid: null,
      });
      
      if (auth.currentUser) {
        try {
          await unlink(auth.currentUser, 'google.com');
        } catch(e) {}
      }
      
      toast.success("Conta Google desvinculada com sucesso!");
    } catch (error: any) {
      console.error("Error unlinking Google:", error);
      toast.error("Erro ao desvincular conta: " + error.message);
    } finally {
      setIsLinkingProvider(false);
    }
  };

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setAvatarUploadProgress(0);
      const result = await uploadProfilePhoto({
        userId: currentUser._id,
        file,
        onProgress: (p) => setAvatarUploadProgress(p)
      });

      const profilePhoto = {
        path: result.file.path,
        url: result.file.url,
        mimeType: result.file.mimeType,
        size: result.file.size,
        updatedAt: result.file.createdAt,
      };

      await updateDoc(doc(db, "users", currentUser._id), {
        avatarUrl: result.file.url,
        profilePhoto,
      });
      setProfileAvatar(sanitizeUrl(result.file.url));
      setAvatarUploadProgress(null);
    } catch (error) {
       console.error("Failed to upload photo", error);
       setAvatarUploadProgress(null);
       toast.error("Falha ao enviar foto de perfil");
    }
  };

  const handleBannerChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    try {
      setBannerUploadProgress(0);
      const result = await uploadProfilePhoto({
        userId: currentUser._id,
        file,
        onProgress: (p) => setBannerUploadProgress(p)
      });

      await updateDoc(doc(db, "users", currentUser._id), {
        bannerUrl: result.file.url,
      });
      setProfileBanner(sanitizeUrl(result.file.url));
      setBannerUploadProgress(null);
    } catch (error) {
       console.error("Failed to upload banner", error);
       setBannerUploadProgress(null);
       toast.error("Falha ao enviar foto de fundo");
    }
  };

  const renderNav = () => (
    <>
      <div className="hidden md:flex w-[68px] md:w-[80px] bg-zinc-950 border-r border-zinc-800/80 flex-col items-center py-4 md:py-6 sm:mt-0 pt-6 pb-4 flex-shrink-0 z-20">
        <div 
          onClick={() => setActiveTab("PROFILE")}
          className="relative group cursor-pointer mb-6 md:mb-8"
        >
          <div className={`w-12 h-12 rounded-2xl overflow-hidden border-2 transition-all duration-300 ${activeTab === "PROFILE" ? "border-indigo-500 scale-105 shadow-[0_0_15px_rgba(99,102,241,0.4)]" : "border-zinc-800 group-hover:border-zinc-600"}`}>
            <img 
              src={sanitizeUrl(currentUser.avatarUrl) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser._id}`}
              alt="Avatar" 
              loading="lazy" 
              decoding="async" 
              className="w-full h-full object-cover" 
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('dicebear.com/7.x/initials')) {
                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.username}`;
                }
              }}
            />
          </div>
        </div>

        <div className="flex-1 flex flex-col gap-4 w-full px-3">
          <NavRailItem icon={<MessageCircle className="w-6 h-6" />} label="Chats" active={activeTab === "CHATS"} onClick={() => setActiveTab("CHATS")} />
          <NavRailItem icon={<Users className="w-6 h-6" />} label="Contatos" active={activeTab === "CONTACTS"} onClick={() => setActiveTab("CONTACTS")} />
          <NavRailItem icon={<CircleDashed className="w-6 h-6" />} label="Status" active={activeTab === "INPAGE"} onClick={() => setActiveTab("INPAGE")} />
          <NavRailItem icon={<Globe className="w-6 h-6" />} label="Communities" active={activeTab === "COMMUNITIES"} onClick={() => setActiveTab("COMMUNITIES")} />
          <NavRailItem icon={<Newspaper className="w-6 h-6" />} label="News" active={activeTab === "NEWS"} onClick={() => setActiveTab("NEWS")} />
          {isNative && (
            <NavRailItem icon={<Monitor className="w-6 h-6" />} label="Windows" active={activeTab === "WINDOWS_APP"} onClick={() => setActiveTab("WINDOWS_APP")} />
          )}
        </div>

        <div className="flex flex-col gap-4 w-full px-3 mt-auto">
          {(!isNative && window.innerWidth <= 768) && (
            <NavRailItem icon={<QrCode className="w-6 h-6" />} label="Scan QR" active={activeTab === "QRCODE"} onClick={() => setActiveTab("QRCODE")} />
          )}
          <NavRailItem icon={<Settings className="w-6 h-6" />} label="Settings" active={activeTab === "SETTINGS"} onClick={() => setActiveTab("SETTINGS")} />
        </div>
      </div>

      <div className="md:hidden flex items-center justify-between bg-zinc-950 border-b border-zinc-800/80 px-4 pt-6 pb-3 flex-shrink-0 z-20">
        <div 
          onClick={() => setActiveTab("PROFILE")}
          className="flex items-center gap-3 cursor-pointer"
        >
          <div className={`w-9 h-9 sm:w-10 sm:h-10 rounded-xl overflow-hidden border-2 transition-all duration-300 shrink-0 ${activeTab === "PROFILE" ? "border-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.4)]" : "border-zinc-800"}`}
          >
            <img 
              src={sanitizeUrl(currentUser.avatarUrl) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser._id}`}
              alt="Avatar" 
              loading="lazy" 
              decoding="async" 
              className="w-full h-full object-cover"
              onError={(e) => {
                const target = e.target as HTMLImageElement;
                if (!target.src.includes('dicebear.com/7.x/initials')) {
                  target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${currentUser.username}`;
                }
              }}
            />
          </div>
          <span className="text-zinc-200 font-semibold text-sm truncate max-w-[120px]">{currentUser.username}</span>
        </div>
        
        <div className="flex items-center justify-end gap-0.5 sm:gap-2 flex-1">
          <MobileNavItem icon={<MessageCircle className="w-5 h-5" />} active={activeTab === "CHATS"} onClick={() => setActiveTab("CHATS")} />
          <MobileNavItem icon={<Users className="w-5 h-5" />} active={activeTab === "CONTACTS"} onClick={() => setActiveTab("CONTACTS")} />
          <MobileNavItem icon={<CircleDashed className="w-5 h-5" />} active={activeTab === "INPAGE"} onClick={() => setActiveTab("INPAGE")} />
          <MobileNavItem icon={<Globe className="w-5 h-5" />} active={activeTab === "COMMUNITIES"} onClick={() => setActiveTab("COMMUNITIES")} />
          <MobileNavItem icon={<Newspaper className="w-5 h-5" />} active={activeTab === "NEWS"} onClick={() => setActiveTab("NEWS")} />
          {isNative && (
            <MobileNavItem icon={<Monitor className="w-5 h-5" />} active={activeTab === "WINDOWS_APP"} onClick={() => setActiveTab("WINDOWS_APP")} />
          )}
          {(!isNative && window.innerWidth <= 768) && (
            <MobileNavItem icon={<QrCode className="w-5 h-5" />} active={activeTab === "QRCODE"} onClick={() => setActiveTab("QRCODE")} />
          )}
          <MobileNavItem icon={<Settings className="w-5 h-5" />} active={activeTab === "SETTINGS"} onClick={() => setActiveTab("SETTINGS")} />
        </div>
      </div>
    </>
  );

  return (
    <div 
      className={`${isMobileHidden ? "hidden md:flex" : "flex"} w-full md:w-[380px] lg:w-[420px] bg-zinc-900 md:border-r border-zinc-800/80 h-full relative overflow-hidden flex-col md:flex-row shadow-2xl`}
      style={{ WebkitTransform: "translate3d(0,0,0)", transform: "translate3d(0,0,0)" }}
    >
      {renderNav()}

      {syncState.isSyncing && (
        <div className="w-full bg-zinc-950 h-1 md:hidden">
          <div className="bg-indigo-500 h-1 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.8)]" style={{ width: `${syncState.progress}%` }} />
        </div>
      )}

      {syncState.isSyncing && window.innerWidth <= 768 ? (
        <div className="flex-1 flex flex-col items-center justify-center p-6 bg-zinc-900 text-center">
          <svg className="w-10 h-10 text-indigo-500 animate-spin mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
          <div className="text-zinc-100 font-display font-bold text-lg mb-1">Sincronizando Nuvem</div>
          <p className="text-zinc-500 text-sm">Preparando mensagens criptografadas...</p>
        </div>
      ) : (
      <div className="flex-1 flex flex-col h-full bg-zinc-900 relative overflow-hidden">
        <AnimatePresence mode="popLayout">
          {activeTab === "CHATS" && (
            <motion.div 
              key="chats"
              initial={{ x: -20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: -20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full absolute inset-0 w-full"
            >
              <div className="px-5 py-4 shrink-0 mt-2 md:mt-0 flex justify-between items-center">
                <h2 className="text-2xl font-display font-bold text-zinc-100 tracking-tight">{showArchived ? "Arquivados" : "Messages"}</h2>
                <button onClick={() => setShowArchived(!showArchived)} className={`p-2 rounded-full transition-colors ${showArchived ? 'bg-indigo-500 text-white' : 'text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800'}`}>
                   <Archive className="w-5 h-5" />
                </button>
              </div>
              <div className="px-4 pb-3 shrink-0">
                <div className="bg-zinc-950/50 flex items-center px-4 rounded-xl h-11 border border-zinc-800/80 focus-within:border-indigo-500/50 focus-within:bg-zinc-950 transition-all shadow-inner">
                  <Search className="w-4 h-4 text-zinc-500 mr-3" />
                  <input
                    type="text"
                    placeholder="Search messages..."
                    className="bg-transparent border-none focus:outline-none w-full text-sm text-zinc-200 placeholder-zinc-500"
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                  />
                </div>
              </div>
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                {filteredConvos.length === 0 && search === "" && (
                  <div className="flex flex-col items-center justify-center h-full text-zinc-500 p-8 text-center pb-20">
                    <MessageCircle className="w-12 h-12 mb-4 opacity-50 text-indigo-400" />
                    <p className="mb-4 text-sm font-medium">No active communications.</p>
                    <button 
                      onClick={() => setActiveTab("CONTACTS")}
                      className="bg-indigo-600/10 text-indigo-400 border border-indigo-500/30 px-5 py-2.5 rounded-xl text-sm font-medium hover:bg-indigo-500 hover:text-white transition-all shadow-lg shadow-indigo-500/10 font-display"
                    >
                      Establish Link
                    </button>
                  </div>
                )}
                {sortedFilteredConvos.map((convo) => {
                  const otherUser = convo.otherUser;
                  const displayName = convo.isGroup ? (convo.name || "Grupo") : (otherUser?.username || otherUser?.phoneNumber || "Usuário");
                  const avatar = convo.isGroup 
                    ? (sanitizeUrl(convo.avatarUrl) || `https://api.dicebear.com/7.x/shapes/svg?seed=${convo._id}`) 
                    : (sanitizeUrl(otherUser?.avatarUrl) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${otherUser?._id || otherUser?.phoneNumber || convo._id}`);

                  return (
                    <motion.div
                      draggable
                      onDragStart={(e) => {
                         setDraggedId(convo._id);
                         if(e.dataTransfer) e.dataTransfer.effectAllowed = "move";
                      }}
                      onDragOver={(e) => {
                         e.preventDefault();
                         if(e.dataTransfer) e.dataTransfer.dropEffect = "move";
                      }}
                      onDrop={(e) => handleDrop(e as unknown as React.DragEvent, convo._id)}
                      onDragEnd={() => setDraggedId(null)}
                      whileHover={{ backgroundColor: "rgba(39, 39, 42, 0.4)" }}
                      whileTap={{ scale: 0.98 }}
                      key={convo._id}
                      onClick={() => onSelectConvo(convo)}
                      onContextMenu={(e) => {
                         e.preventDefault();
                         setChatContextMenu({ x: e.clientX, y: e.clientY, convo });
                      }}
                      onTouchStart={(e) => handleTouchStart(e, convo)}
                      onTouchEnd={handleTouchEnd}
                      onTouchMove={handleTouchEnd}
                      className={`flex items-center mx-2 px-3 py-3 md:py-3.5 my-0.5 rounded-2xl cursor-pointer transition-colors relative ${
                        draggedId === convo._id ? 'opacity-40' : ''
                      } ${
                        selectedConvo?._id === convo._id ? "bg-zinc-800/80 shadow-sm" : ""
                      }`}
                    >
                      <div className="relative shrink-0 mr-4">
                        <img 
                          src={avatar} 
                          className="w-12 h-12 md:w-14 md:h-14 rounded-2xl object-cover border border-zinc-700/50 shadow-sm" 
                          alt="Avatar" 
                          loading="lazy" 
                          decoding="async" 
                          onClick={(e) => {
                             if (!convo.isGroup && otherUser?._id && onOpenProfile) {
                                e.stopPropagation();
                                onOpenProfile(otherUser._id);
                             }
                          }}
                          onError={(e) => {
                            const target = e.target as HTMLImageElement;
                            if (!target.src.includes('dicebear.com/7.x/initials')) {
                              target.src = `https://api.dicebear.com/7.x/initials/svg?seed=${displayName}`;
                            }
                          }}
                        />
                        {!convo.isGroup && (
                          <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-zinc-900 rounded-full shadow-sm z-10 ${otherUser?.status === 'online' ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.4)]' : otherUser?.status === 'idle' ? 'bg-amber-400' : 'bg-zinc-600'}`} />
                        )}
                      </div>
                      
                      <div className="flex-1 overflow-hidden pointer-events-none">
                        <div className="flex justify-between items-center mb-1">
                          <div className="flex items-center gap-1.5 truncate pr-2">
                             <span className="text-zinc-100 font-semibold truncate text-[15px]">{displayName}</span>
                             {((convo.isGroup && convo.isVerified) || (!convo.isGroup && (otherUser?.role === 'admin' || otherUser?.role === 'AdminUser'))) && (
                                <BadgeCheck className="w-4 h-4 text-indigo-400 shrink-0" />
                             )}
                          </div>
                          {convo.updatedAt && (
                            <span className="text-xs font-medium text-zinc-500 whitespace-nowrap">{format(convo.updatedAt, "HH:mm")}</span>
                          )}
                        </div>
                        <div className="flex items-center text-sm text-zinc-400">
                          {typingUsers[convo._id] ? (
                             <span className="text-indigo-400 font-medium italic animate-pulse">Digitando...</span>
                          ) : (
                             <>
                              {convo.lastMessage?.senderId === currentUser._id && (
                                <span className="mr-1.5 flex-shrink-0">
                                  {convo.lastMessage.status === "read" ? (
                                    <CheckCheck className="w-4 h-4 text-indigo-400" />
                                  ) : convo.lastMessage.status === "delivered" ? (
                                    <CheckCheck className="w-4 h-4 text-zinc-500" />
                                  ) : (
                                    <Check className="w-4 h-4 text-zinc-500" />
                                  )}
                                </span>
                              )}
                              <span className="truncate">{convo.lastMessage?.type === 'image' ? '📸 Imagem' : convo.lastMessage?.type === 'video' ? '🎬 Vídeo' : convo.lastMessage?.type === 'audio' || convo.lastMessage?.type === 'voice' ? '🎵 Áudio' : convo.lastMessage?.type === 'document' ? '📄 Documento' : convo.lastMessage?.text || "Sem mensagens"}</span>
                             </>
                          )}
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>
              <div className="absolute bottom-6 right-6 z-50">
                <button 
                  onClick={() => setShowContactPicker(true)}
                  className="w-14 h-14 rounded-full bg-indigo-600 text-white flex items-center justify-center shadow-lg shadow-indigo-600/30 hover:bg-indigo-500 transition-all hover:scale-105 active:scale-95"
                >
                   <Plus className="w-8 h-8" />
                </button>
              </div>

              {showContactPicker && (
                <div className="absolute inset-0 z-[60] flex items-center justify-center p-4">
                  <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" onClick={() => setShowContactPicker(false)} />
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.9 }}
                    className="bg-[#111214] border border-[#2B2D31] rounded-2xl w-full max-w-sm overflow-hidden shadow-2xl relative z-10 p-5"
                  >
                    <div className="flex justify-between items-center mb-5">
                       <h3 className="text-lg font-bold text-white">Nova Conversa</h3>
                       <button onClick={() => setShowContactPicker(false)} className="text-zinc-500 hover:text-white transition-colors">
                          <X className="w-5 h-5" />
                       </button>
                    </div>
                    <div className="max-h-[60vh] overflow-y-auto custom-scrollbar space-y-1">
                      {contacts.map((contact) => (
                        <div 
                           key={contact._id}
                           onClick={() => {
                             if (contact.registeredUserId) {
                               handleStartConvo(contact.registeredUserId);
                               setShowContactPicker(false);
                             } else {
                               toast.error("Usuário não cadastrado.");
                             }
                           }}
                           className="flex items-center gap-3 p-3 rounded-xl hover:bg-[#2B2D31] cursor-pointer transition-colors"
                        >
                          <img 
                             src={sanitizeUrl(contact.userProfile?.avatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`} 
                             className="w-10 h-10 rounded-full object-cover" 
                             onClick={(e) => {
                               if (contact.registeredUserId && onOpenProfile) {
                                  e.stopPropagation();
                                  onOpenProfile(contact.registeredUserId);
                               }
                             }}
                          />
                          <div>
                            <p className="text-white font-medium text-sm">{contact.name}</p>
                            <p className="text-zinc-500 text-xs">{contact.phoneNumber}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "CONTACTS" && (
            <motion.div 
              key="contacts"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full absolute inset-0 w-full pt-2"
            >
              {!showAddContact ? (
                 <>
                  <div className="px-5 py-4 shrink-0 flex items-center justify-between mt-2 md:mt-0">
                    <h2 className="text-2xl font-display font-bold text-zinc-100 tracking-tight">Contatos</h2>
                    <div className="flex gap-2">
                      <button 
                        onClick={async () => {
                           try {
                              setIsSyncingContacts(true);
                              
                              const provider = new GoogleAuthProvider();
                              provider.addScope('https://www.googleapis.com/auth/contacts.readonly');
                              const result = await signInWithPopup(auth, provider);
                              
                              const credential = GoogleAuthProvider.credentialFromResult(result);
                              const token = credential?.accessToken;
                              
                              if (!token) {
                                 throw new Error("Não foi possível obter o token de acesso de contatos do Google.");
                              }

                              const res = await fetch("https://people.googleapis.com/v1/people/me/connections?personFields=names,emailAddresses,phoneNumbers&pageSize=1000", {
                                 headers: {
                                    "Authorization": `Bearer ${token}`,
                                    "Accept": "application/json"
                                 }
                              });
                              
                              if (!res.ok) {
                                 const errData = await res.json().catch(() => null);
                                 let errMsg = "Erro ao sincronizar contatos na API";
                                 if (errData && errData.error) {
                                    const errDetails = typeof errData.error === 'string' ? errData.error : JSON.stringify(errData.error);
                                    console.error("Erro completo da People API:", errDetails);
                                    
                                    if (errDetails.includes("403") || errDetails.includes("not enabled")) {
                                       errMsg = "A 'People API' não está ativada no projeto correto do Google Cloud (projeto 931423602853). Clique no link nos logs do console ou verifique o projeto correto e ative-a. Se já ativou, pode demorar até 10 minutos para funcionar.";
                                    } else {
                                       errMsg += ". Verifique o console do navegador para mais detalhes.";
                                    }
                                 }
                                 throw new Error(errMsg);
                              }
                              
                              const data = await res.json();
                              if (data && data.connections) {
                                 let addedCount = 0;
                                 for (const person of data.connections) {
                                    const name = person.names?.[0]?.displayName || "";
                                    const email = person.emailAddresses?.[0]?.value || "";
                                    let phone = person.phoneNumbers?.[0]?.value || "";
                                    
                                    if (!name && !email && !phone) continue;
                                    if (phone) phone = phone.replace(/[^0-9+]/g, '');
                                    
                                    const exists = contacts.find(c => (phone && c.phoneNumber === phone) || (email && c.email === email));
                                    if (!exists) {
                                       await addDoc(collection(db, "users", currentUser._id, "contacts"), {
                                           name: name || email || phone,
                                           phoneNumber: phone,
                                           email: email,
                                           registeredUserId: null, 
                                           createdAt: Date.now()
                                       });
                                       addedCount++;
                                    }
                                 }
                                 toast.success(`${addedCount} contatos Google sincronizados com sucesso.`);
                              } else {
                                 toast.error("Nenhum contato encontrado no Google.");
                              }

                           } catch(e: any) {
                              toast.error("Erro ao iniciar sincronização: " + e.message);
                              setIsSyncingContacts(false);
                           }
                        }}
                        className="w-8 h-8 rounded-full bg-blue-600/20 text-blue-400 flex items-center justify-center hover:bg-blue-500 hover:text-white transition-all shadow-sm"
                        title="Sincronizar Google Workspace"
                      >
                        {isSyncingContacts ? <Loader2 className="w-4 h-4 animate-spin" /> : <svg className="w-4 h-4" viewBox="0 0 24 24"><path fill="currentColor" d="M12.48 10.92v3.28h7.84c-.24 1.84-.853 3.187-1.787 4.133-1.147 1.147-2.933 2.4-6.053 2.4-4.827 0-8.6-3.893-8.6-8.72s3.773-8.72 8.6-8.72c2.6 0 4.507 1.027 5.907 2.347l2.307-2.307C18.747 1.44 16.133 0 12.48 0 5.867 0 .307 5.387.307 12s5.56 12 12.173 12c3.573 0 6.267-1.173 8.373-3.36 2.16-2.16 2.84-5.213 2.84-7.667 0-.76-.053-1.467-.173-2.053H12.48z"/></svg>}
                      </button>
                      <button 
                        onClick={() => setShowAddContact(true)}
                        className="w-8 h-8 rounded-full bg-indigo-600/20 text-indigo-400 flex items-center justify-center hover:bg-indigo-500 hover:text-white transition-all shadow-sm"
                      >
                        <UserPlus className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                  <div className="px-4 pb-3 shrink-0">
                    <div className="bg-zinc-950/50 flex items-center px-4 rounded-xl h-11 border border-zinc-800/80 focus-within:border-indigo-500/50 focus-within:bg-zinc-950 transition-all shadow-inner">
                      <Search className="w-4 h-4 text-zinc-500 mr-3" />
                      <input
                        type="text"
                        placeholder="Pesquisar contatos..."
                        className="bg-transparent border-none focus:outline-none w-full text-sm text-zinc-200 placeholder-zinc-500"
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                      />
                    </div>
                  </div>
                  
                  <div className="flex-1 overflow-y-auto custom-scrollbar pb-20">
                    <div className="px-5 pt-2 pb-1 text-[11px] font-bold text-zinc-500 uppercase tracking-wider">Todos os Contatos</div>
                    {filteredContacts.length === 0 && search === "" && (
                      <div className="text-zinc-600 p-8 text-center text-sm font-medium">Nenhum contato encontrado.</div>
                    )}
                    {filteredContacts.map((contact) => (
                      <motion.div
                        whileHover={{ backgroundColor: "rgba(39, 39, 42, 0.4)" }}
                        whileTap={{ scale: 0.98 }}
                        key={contact._id}
                        onClick={() => {
                          if (contact.registeredUserId) {
                            handleStartConvo(contact.registeredUserId);
                          } else {
                            toast.error("Usuário não cadastrado.");
                          }
                        }}
                        className="flex items-center mx-2 px-3 py-3 my-0.5 rounded-2xl cursor-pointer transition-colors"
                      >
                        <div className="relative shrink-0 mr-4">
                          <img 
                            src={sanitizeUrl(contact.userProfile?.avatarUrl) || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`} 
                            className="w-12 h-12 rounded-2xl object-cover border border-zinc-700/50 shadow-sm" 
                            loading="lazy" 
                            decoding="async" 
                            onClick={(e) => {
                              if (contact.registeredUserId && onOpenProfile) {
                                e.stopPropagation();
                                onOpenProfile(contact.registeredUserId);
                              }
                            }}
                          />
                          {contact.userProfile?.status && (
                            <div className={`absolute -bottom-1 -right-1 w-4 h-4 border-2 border-zinc-900 rounded-full shadow-sm z-10 ${contact.userProfile.status === 'online' ? 'bg-emerald-500' : contact.userProfile.status === 'idle' ? 'bg-amber-400' : 'bg-transparent'}`} />
                          )}
                        </div>
                        <div className="flex-1 overflow-hidden">
                          <div className="flex justify-between items-center mb-0.5">
                            <div className="flex items-center gap-1.5 truncate">
                               <span className="text-zinc-100 font-semibold text-[15px] truncate">{contact.name}</span>
                               {(contact.userProfile?.role === 'admin' || contact.userProfile?.role === 'AdminUser') && <BadgeCheck className="w-4 h-4 text-indigo-400 shrink-0" />}
                            </div>
                            {!contact.userProfile && (
                              <span className="text-[9px] text-indigo-400 font-bold uppercase px-2 py-0.5 bg-indigo-500/10 border border-indigo-500/20 rounded-md">Convite</span>
                            )}
                          </div>
                          <div className="text-xs text-zinc-500 truncate font-medium">
                            {contact.email || contact.phoneNumber}
                          </div>
                        </div>
                      </motion.div>
                    ))}
                  </div>
                 </>
              ) : (
                <div className="flex flex-col h-full w-full">
                  <div className="px-5 py-4 shrink-0 flex items-center gap-3 mt-2 md:mt-0 pb-6">
                    <button 
                      onClick={() => setShowAddContact(false)}
                      className="w-8 h-8 rounded-full bg-zinc-800 text-zinc-400 flex items-center justify-center hover:bg-zinc-700 hover:text-zinc-200 transition-colors"
                    >
                      <ArrowLeft className="w-4 h-4" />
                    </button>
                    <h2 className="text-xl font-display font-bold text-zinc-100 tracking-tight">Adicionar Contato</h2>
                  </div>
                  
                  <div className="px-5 flex-1">
                    <form onSubmit={handleAddContact} className="flex flex-col gap-6 bg-zinc-950/50 p-6 rounded-3xl border border-zinc-800/80 shadow-xl relative overflow-hidden">
                      <div className="absolute top-0 right-0 p-4 opacity-5 pointer-events-none">
                        <UserPlus className="w-32 h-32 text-indigo-500" />
                      </div>
                      
                      <div className="relative z-10">
                        <label className="text-[11px] text-indigo-400 font-bold uppercase tracking-wider mb-2 block">Nome</label>
                        <input
                          required
                          type="text"
                          placeholder="Nome do contato"
                          className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 outline-none focus:border-indigo-500 transition-colors text-sm shadow-inner"
                          value={newContactName}
                          onChange={e => setNewContactName(e.target.value)}
                        />
                      </div>
                      
                      <div className="relative z-10">
                        <div className="flex gap-4 mb-3">
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                            <input 
                              type="radio" 
                              checked={newContactIdentifierType === "phone"} 
                              onChange={() => setNewContactIdentifierType("phone")} 
                              className="text-indigo-500 focus:ring-indigo-500 bg-zinc-800 border-zinc-700"
                            />
                            Telefone
                          </label>
                          <label className="flex items-center gap-2 cursor-pointer text-sm text-zinc-300">
                            <input 
                              type="radio" 
                              checked={newContactIdentifierType === "email"} 
                              onChange={() => setNewContactIdentifierType("email")}
                              className="text-indigo-500 focus:ring-indigo-500 bg-zinc-800 border-zinc-700" 
                            />
                            E-mail
                          </label>
                        </div>
                        
                        {newContactIdentifierType === "phone" ? (
                          <div className="flex gap-2">
                            <div className="relative w-24 bg-zinc-900 border border-zinc-800 rounded-xl text-zinc-400 text-sm shadow-inner group">
                              <select 
                                className="absolute inset-x-0 w-full h-full opacity-0 cursor-pointer"
                                value={countryCode}
                                onChange={(e) => setCountryCode(e.target.value as CountryCode)}
                              >
                                {getCountries().map((c) => (
                                  <option key={c} value={c}>{c} (+{getCountryCallingCode(c)})</option>
                                ))}
                              </select>
                              <div className="absolute inset-y-0 flex items-center justify-center w-full pointer-events-none group-focus-within:text-indigo-400 transition-colors">
                                {countryCode} +{getCountryCallingCode(countryCode)}
                              </div>
                            </div>
                            <input
                              type="tel"
                              required
                              className="flex-1 bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 outline-none focus:border-indigo-500 transition-colors text-sm shadow-inner tracking-wider"
                              placeholder="Somente números"
                              value={newContactPhone}
                              onChange={(e) => setNewContactPhone(e.target.value)}
                            />
                          </div>
                        ) : (
                          <input
                            type="email"
                            required
                            className="w-full bg-zinc-900 border border-zinc-800 rounded-xl px-4 py-3.5 text-zinc-100 outline-none focus:border-indigo-500 transition-colors text-sm shadow-inner"
                            placeholder="exemplo@email.com"
                            value={newContactEmail}
                            onChange={(e) => setNewContactEmail(e.target.value)}
                          />
                        )}
                      </div>
                      <div className="mt-2 relative z-10">
                        <button 
                          type="submit" 
                          disabled={!newContactName || (newContactIdentifierType === "phone" ? !newContactPhone : !newContactEmail)}
                          className="w-full bg-indigo-600 text-white py-3.5 rounded-xl font-semibold tracking-wide hover:bg-indigo-500 disabled:opacity-50 transition-all shadow-[0_0_20px_rgba(99,102,241,0.2)]"
                        >
                          Salvar Contato
                        </button>
                      </div>
                    </form>
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "PROFILE" && (
            <motion.div 
              key="profile"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full absolute inset-0 w-full bg-[#111214] z-50 overflow-hidden"
            >
              <div className="flex-1 overflow-y-auto custom-scrollbar pb-20 relative">
                 {/* Back button */}
                 <div className="absolute top-4 left-4 z-20 flex gap-2">
                   <button onClick={() => setActiveTab("CHATS")} className="bg-black/40 hover:bg-black/60 transition-colors p-2 rounded-full text-white backdrop-blur-md">
                     <ArrowLeft size={20} />
                   </button>
                 </div>
                 <div className="absolute top-4 right-4 z-20 flex gap-2">
                   <button onClick={() => setActiveTab("SETTINGS")} className="bg-black/40 hover:bg-black/60 transition-colors p-2 rounded-full text-white backdrop-blur-md">
                     <Settings size={20} />
                   </button>
                 </div>

                 {/* Banner */}
                 <div className="w-full h-[200px] relative mt-0 bg-indigo-600/20 group">
                    {profileBanner ? (
                        <img src={profileBanner} alt="Banner" className={`w-full h-full object-cover ${bannerUploadProgress !== null ? 'opacity-50' : ''}`} />
                    ) : (
                        <div className="w-full h-full bg-indigo-900/40" />
                    )}
                    {isEditingProfile && (
                        <label className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity cursor-pointer z-10 backdrop-blur-sm">
                            <input type="file" className="hidden" accept="image/*, image/gif" onChange={handleBannerChange} />
                            <Camera className="w-8 h-8 text-white" />
                        </label>
                    )}
                    {bannerUploadProgress !== null && (
                        <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20">
                            <span className="text-white font-bold text-sm tracking-widest">{bannerUploadProgress}%</span>
                        </div>
                    )}
                 </div>

                 <div className="px-5 relative -mt-[48px] pb-10">
                    <div className="flex items-end gap-3 mb-5">
                       {/* Avatar */}
                       <div className="relative group select-none">
                          <label className={`relative block ${isEditingProfile ? 'cursor-pointer' : 'cursor-default'}`}>
                             {isEditingProfile && <input type="file" className="hidden" accept="image/*, image/gif" onChange={handleAvatarChange} />}
                             <div className="w-[110px] h-[110px] rounded-[30px] overflow-hidden border-[6px] border-[#111214] bg-zinc-800 relative z-10 hover:opacity-90 transition-opacity">
                                {avatarUploadProgress !== null && (
                                   <div className="absolute inset-0 bg-black/60 flex items-center justify-center backdrop-blur-sm z-20 transition-all">
                                      <span className="text-white font-bold text-xs tracking-widest">{avatarUploadProgress}%</span>
                                   </div>
                                )}
                                <img
                                  src={profileAvatar || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentUser._id}`}
                                  alt="Avatar"
                                  className={`w-full h-full object-cover transition-all ${isEditingProfile ? 'group-hover:scale-105' : ''}`}
                                />
                                {isEditingProfile && (
                                   <div className="absolute inset-0 bg-black/50 opacity-0 group-hover:opacity-100 transition-all flex items-center justify-center backdrop-blur-sm z-10">
                                      <Camera className="w-7 h-7 text-white" />
                                   </div>
                                )}
                             </div>
                             {/* Status Badge */}
                             <div className="absolute bottom-1 right-1 w-[26px] h-[26px] border-[4px] border-[#111214] bg-[#111214] rounded-full flex items-center justify-center z-20 pointer-events-none">
                                <div className="w-full h-full rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.5)]" />
                             </div>
                          </label>
                       </div>

                       {/* Status Bubble */}
                       <div className="bg-[#2B2D31] rounded-full px-4 py-2 text-xs font-semibold text-zinc-300 border border-[#1e1f22] cursor-pointer mb-[16px] flex items-center gap-2 hover:bg-[#313338] transition-colors shadow-sm ml-2">
                          <Plus size={15} className="text-zinc-400" /> Atualizar status
                       </div>
                    </div>

                    <div className="mb-5 bg-[#2B2D31]/40 rounded-2xl p-4 border border-zinc-800/50">
                       <h2 className="text-2xl font-bold text-white flex items-center gap-2 mb-1">
                         {currentUser.username} <ChevronDown size={20} className="text-zinc-500 cursor-pointer"/>
                       </h2>
                       <p className="text-zinc-400 text-sm font-medium">@{currentUser.username.toLowerCase().replace(/\s+/g, '')}</p>
                    </div>

                    {isEditingProfile ? (
                       <div className="mb-6 space-y-3 bg-[#2B2D31] p-5 rounded-2xl shadow-lg border border-zinc-800/80">
                         <div>
                            <label className="text-[10px] uppercase font-bold text-zinc-500 tracking-widest pl-1 mb-2 block">Nome de exibição</label>
                            <input type="text" className="w-full bg-[#111214] border border-[#1e1f22] text-zinc-100 outline-none rounded-xl p-3 text-sm focus:border-indigo-500 transition-all font-medium" value={profileName} onChange={e => setProfileName(e.target.value)} />
                         </div>
                         <div className="flex gap-3 pt-3">
                             <button onClick={handleUpdateProfile} className="flex-1 bg-indigo-600 hover:bg-indigo-500 shadow-[0_0_15px_rgba(99,102,241,0.2)] text-white font-bold py-3 rounded-xl transition-all text-sm uppercase tracking-wider">
                                Salvar
                             </button>
                             <button onClick={() => {
                               setIsEditingProfile(false);
                               setProfileName(currentUser.username);
                             }} className="flex-1 bg-zinc-800 hover:bg-zinc-700 text-zinc-300 font-bold py-3 rounded-xl transition-all text-sm uppercase tracking-wider">
                                Cancelar
                             </button>
                         </div>
                       </div>
                    ) : (
                       <button onClick={() => setIsEditingProfile(true)} className="w-full bg-indigo-600/10 text-indigo-400 hover:bg-indigo-600 hover:text-white font-bold py-3 rounded-2xl mb-7 flex items-center justify-center gap-2 transition-all text-sm shadow-[inset_0_0_0_1px_rgba(99,102,241,0.2)]">
                          <Edit2 size={16} /> Editar perfil
                       </button>
                    )}

                    {/* Tabs */}
                    <div className="flex border-b border-[#2B2D31] mb-6 px-2 gap-4">
                       <button className="px-2 py-3 border-b-[3px] border-indigo-400 text-zinc-100 font-bold whitespace-nowrap text-sm tracking-wide">Sobre Mim</button>
                    </div>

                    {/* Cards */}
                    <div className="space-y-4 text-left">
                       {/* Date */}
                       <div className="bg-[#2B2D31] rounded-2xl p-5 border border-zinc-800/40">
                           <h3 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 mb-3 pl-1">Membro desde</h3>
                           <div className="flex items-center gap-3 text-zinc-200 font-bold text-sm bg-[#111214] rounded-xl p-3">
                              <div className="w-8 h-8 rounded-lg bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                                 <MessageSquare size={18} />
                              </div>
                              {new Date(currentUser.createdAt || Date.now()).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </div>
                       </div>

                       {/* Conexões (Phone + Google) */}
                       <div className="bg-[#2B2D31] rounded-2xl p-5 border border-zinc-800/40">
                           <h3 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 mb-3 pl-1">Integrações da Conta</h3>
                           <div className="space-y-3">
                              <div className="flex items-center gap-3 text-zinc-200 font-medium text-sm bg-[#111214] rounded-xl p-3">
                                 <div className="w-8 h-8 rounded-lg bg-[#2B2D31] flex items-center justify-center border border-zinc-800">
                                    <Phone size={16} className="text-zinc-400" />
                                 </div>
                                 <span className="flex-1 truncate">{currentUser.phoneNumber || "Telefone não cadastrado"}</span>
                                 <CheckCircle2 size={18} className={`shrink-0 ${currentUser.phoneNumber ? 'text-white fill-emerald-500' : 'text-zinc-600'}`} />
                              </div>
                              
                              {currentUser?.googleLinked && currentUser?.googleEmail && (
                                 <div className="flex items-center gap-3 text-zinc-200 font-medium text-sm bg-[#111214] rounded-xl p-3">
                                    <div className="w-8 h-8 rounded-lg bg-[#2B2D31] flex items-center justify-center border border-zinc-800">
                                       <svg viewBox="0 0 24 24" className="w-5 h-5"><path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4"/><path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853"/><path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05"/><path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335"/></svg>
                                    </div>
                                    <span className="flex-1 truncate">{currentUser.googleEmail}</span>
                                    <CheckCircle2 size={18} className="text-white fill-emerald-500 shrink-0" />
                                 </div>
                              )}
                           </div>
                       </div>
                       
                       {/* Note */}
                       <div className="bg-[#2B2D31] rounded-2xl p-5 border border-zinc-800/40">
                           <div className="flex items-center justify-between mb-2">
                               <h3 className="text-[11px] uppercase tracking-widest font-bold text-zinc-500 pl-1">Nota (visível apenas para você)</h3>
                               <Edit3 size={14} className="text-zinc-500" />
                           </div>
                           <div className="bg-[#111214] rounded-xl p-3 cursor-pointer">
                              <p className="text-sm text-zinc-500 font-medium">Clique para adicionar uma nota para você se lembrar depois</p>
                           </div>
                       </div>
                    </div>
                 </div>
              </div>
            </motion.div>
          )}

          {activeTab === "SETTINGS" && (
            isNative ? (
              <motion.div
                key="settings-native"
                initial={{ x: 20, opacity: 0 }}
                animate={{ x: 0, opacity: 1 }}
                exit={{ x: 20, opacity: 0 }}
                transition={{ duration: 0.2 }}
                className="flex flex-col h-full absolute inset-0 w-full pt-4 bg-zinc-900"
              >
                <DesktopSettings onLogout={onLogout} />
              </motion.div>
            ) : (
            <motion.div 
              key="settings"
              initial={{ x: 20, opacity: 0 }}
              animate={{ x: 0, opacity: 1 }}
              exit={{ x: 20, opacity: 0 }}
              transition={{ duration: 0.2 }}
              className="flex flex-col h-full absolute inset-0 w-full pt-4 bg-zinc-900"
            >
              <div className="px-5 py-4 shrink-0 mt-2 md:mt-0 border-b border-zinc-800/50 flex items-center gap-3">
                {settingsView !== "MENU" && (
                  <button onClick={() => setSettingsView("MENU")} className="p-2 hover:bg-zinc-800 rounded-full transition-colors">
                    <ArrowLeft className="w-5 h-5 text-zinc-400" />
                  </button>
                )}
                <h2 className="text-2xl font-display font-bold text-zinc-100 tracking-tight">
                  {settingsView === "MENU" ? "Configurações" :
                   settingsView === "ACCOUNT" ? "Conta" :
                   settingsView === "PRIVACY" ? "Privacidade" :
                   settingsView === "AUDIO_VIDEO" ? "Áudio/Vídeo" :
                   settingsView === "BACKUPS" ? "Backups" : "Configurações"}
                </h2>
              </div>
              
              <div className="flex-1 overflow-y-auto p-4 pb-20 custom-scrollbar">
                <AnimatePresence mode="wait">
                  {settingsView === "MENU" && (
                    <motion.div
                      key="menu"
                      initial={{ opacity: 0, x: -10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: -10 }}
                      className="space-y-2"
                    >
                      <button onClick={() => setSettingsView("ACCOUNT")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-indigo-500/20 flex items-center justify-center text-indigo-400">
                            <User className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-zinc-100 font-medium">Configuração de Conta</h3>
                            <p className="text-xs text-zinc-500">Privacidade, segurança, mudar número</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>

                      <button onClick={() => setSettingsView("PRIVACY")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-emerald-500/20 flex items-center justify-center text-emerald-400">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-zinc-100 font-medium">Configuração de Privacidade</h3>
                            <p className="text-xs text-zinc-500">Bloqueios, visto por último, criptografia</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>

                      <button onClick={() => setSettingsView("AUDIO_VIDEO")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-amber-500/20 flex items-center justify-center text-amber-400">
                            <Video className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-zinc-100 font-medium">Configuração de Áudio/Vídeo</h3>
                            <p className="text-xs text-zinc-500">Qualidade, economia de dados, câmera</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>

                      <button onClick={() => setSettingsView("BACKUPS")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-cyan-500/20 flex items-center justify-center text-cyan-400">
                            <HardDrive className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-zinc-100 font-medium">Ajustes de Backups</h3>
                            <p className="text-xs text-zinc-500">Nuvem, vídeos, frequência automática</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>

                      <button onClick={() => setSettingsView("TERMS")} className="w-full flex items-center justify-between p-4 bg-zinc-950/50 hover:bg-zinc-800 border border-zinc-800/80 rounded-2xl transition-colors">
                        <div className="flex items-center gap-4">
                          <div className="w-10 h-10 rounded-full bg-purple-500/20 flex items-center justify-center text-purple-400">
                            <Shield className="w-5 h-5" />
                          </div>
                          <div className="text-left">
                            <h3 className="text-zinc-100 font-medium">Termos e Condições</h3>
                            <p className="text-xs text-zinc-500">Leia nossas políticas de uso</p>
                          </div>
                        </div>
                        <ChevronRight className="w-5 h-5 text-zinc-500" />
                      </button>

                      <div className="pt-6 px-2">
                        <button onClick={onLogout} className="w-full flex flex-col items-center justify-center gap-1 bg-red-500/10 text-red-400 py-4 px-2 rounded-xl font-bold tracking-wider text-[11px] uppercase border border-red-500/20 hover:bg-red-500/20 transition-all shadow-sm text-center">
                          <div className="flex items-center gap-2">
                            <LogOut className="w-4 h-4" />
                            Sair
                          </div>
                          <span className="text-[9px] font-medium opacity-80 normal-case tracking-normal">Encerrar sessões ativas e excluir dados em cache</span>
                        </button>
                        <p className="text-center text-[10px] text-zinc-600 mt-4 font-mono">LINK DE COMUNICAÇÃO v1.0.4</p>
                      </div>
                    </motion.div>
                  )}

                  {settingsView === "ACCOUNT" && (
                    <motion.div
                      key="account"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 pl-2">Perfil Público</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Mostrar Número/Email" checked={currentUser.settings?.showContactInfo ?? false} onChange={(v) => updateUserSetting('showContactInfo', v)} />
                          <SettingToggle label="Visibilidade do Perfil" checked={currentUser.settings?.profileVisible ?? true} onChange={(v) => updateUserSetting('profileVisible', v)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 pl-2">Segurança da Conta</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Autenticação em Duas Etapas" checked={currentUser.settings?.twoFactorAuth ?? true} onChange={(v) => updateUserSetting('twoFactorAuth', v)} />
                          <SettingToggle label="Alertas de Segurança" checked={currentUser.settings?.securityAlerts ?? true} onChange={(v) => updateUserSetting('securityAlerts', v)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-indigo-400 pl-2">Contas Vinculadas</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner space-y-1">
                          
                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 transition-colors">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-white flex items-center justify-center">
                                <svg className="w-4 h-4" viewBox="0 0 24 24">
                                  <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
                                  <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
                                  <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
                                  <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
                                  <path fill="none" d="M1 1h22v22H1z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-zinc-200">Google</span>
                            </div>
                            {linkedProviders.includes('google.com') ? (
                              <button onClick={handleUnlinkGoogle} disabled={isLinkingProvider} className="px-3 py-1.5 rounded-lg bg-red-500/10 text-red-400 text-xs font-bold uppercase tracking-wider hover:bg-red-500/20 transition-colors">
                                Desvincular
                              </button>
                            ) : (
                              <button onClick={handleLinkGoogle} disabled={isLinkingProvider} className="px-3 py-1.5 rounded-lg bg-indigo-500 text-white text-xs font-bold uppercase tracking-wider hover:bg-indigo-600 transition-colors">
                                Vincular
                              </button>
                            )}
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 transition-colors opacity-60">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-[#5865F2] flex items-center justify-center">
                                <svg className="w-4 h-4 text-white" fill="currentColor" viewBox="0 0 24 24">
                                  <path d="M20.317 4.3698a19.7913 19.7913 0 00-4.8851-1.5152.0741.0741 0 00-.0785.0371c-.211.3753-.4447.8648-.6083 1.2495-1.8447-.2762-3.68-.2762-5.4868 0-.1636-.3933-.4058-.8742-.6177-1.2495a.077.077 0 00-.0785-.037 19.7363 19.7363 0 00-4.8852 1.515.0699.0699 0 00-.0321.0277C.5334 9.0458-.319 13.5799.0992 18.0578a.0824.0824 0 00.0312.0561c2.0528 1.5076 4.0413 2.4228 5.9929 3.0294a.0777.0777 0 00.0842-.0276c.4616-.6304.8731-1.2952 1.226-1.9942a.076.076 0 00-.0416-.1057c-.6528-.2476-1.2743-.5495-1.8722-.8923a.077.077 0 01-.0076-.1277c.1258-.0943.2517-.1923.3718-.2914a.0743.0743 0 01.0776-.0105c3.9278 1.7933 8.18 1.7933 12.0614 0a.0739.0739 0 01.0785.0095c.1202.099.246.1981.3728.2924a.077.077 0 01-.0066.1276 12.2986 12.2986 0 01-1.873.8914.0766.0766 0 00-.0407.1067c.3604.698.7719 1.3628 1.225 1.9932a.076.076 0 00.0842.0286c1.961-.6067 3.9495-1.5219 6.0023-3.0294a.077.077 0 00.0313-.0552c.5004-5.177-.8382-9.6739-3.5485-13.6604a.061.061 0 00-.0312-.0286zM8.02 15.3312c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9555-2.4189 2.157-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.9555 2.4189-2.1569 2.4189zm7.9748 0c-1.1825 0-2.1569-1.0857-2.1569-2.419 0-1.3332.9554-2.4189 2.1569-2.4189 1.2108 0 2.1757 1.0952 2.1568 2.419 0 1.3332-.946 2.4189-2.1568 2.4189z" />
                                </svg>
                              </div>
                              <span className="text-sm font-medium text-zinc-200">Discord</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium px-2">Indisponível</span>
                          </div>

                          <div className="flex items-center justify-between p-3 rounded-xl hover:bg-zinc-900/50 transition-colors opacity-60">
                            <div className="flex items-center gap-3">
                              <div className="w-8 h-8 rounded-full bg-zinc-800 flex items-center justify-center border border-zinc-700">
                                <Shield className="w-4 h-4 text-emerald-400" />
                              </div>
                              <span className="text-sm font-medium text-zinc-200">MK Secure</span>
                            </div>
                            <span className="text-xs text-zinc-500 font-medium px-2">Indisponível</span>
                          </div>

                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsView === "PRIVACY" && (
                    <motion.div
                      key="privacy"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 pl-2">Mensagens</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Criptografia de Ponta a Ponta" checked={true} onChange={() => {}} disabled />
                          <SettingToggle label="Recibos de Leitura" checked={currentUser.settings?.readReceipts ?? true} onChange={(v) => updateUserSetting('readReceipts', v)} />
                          <SettingToggle label="Status de Última Vez Online" checked={currentUser.settings?.lastSeen ?? true} onChange={(v) => updateUserSetting('lastSeen', v)} />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-emerald-400 pl-2">Contatos</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Grupos (Quem pode adicionar)" checked={currentUser.settings?.groupInvites ?? false} onChange={(v) => updateUserSetting('groupInvites', v)} />
                          <SettingToggle label="Contatos Bloqueados" checked={currentUser.settings?.blockUnknown ?? false} onChange={(v) => updateUserSetting('blockUnknown', v)} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsView === "AUDIO_VIDEO" && (
                    <motion.div
                      key="av"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 pl-2">Qualidade e Desempenho</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Iniciar chamadas com vídeo" checked={currentUser.settings?.startWithVideo ?? false} onChange={(v) => updateUserSetting('startWithVideo', v)} />
                          <SettingToggle label="Ajustar qualidade à rede" checked={currentUser.settings?.adaptiveQuality ?? true} onChange={(v) => updateUserSetting('adaptiveQuality', v)} />
                          <SettingToggle label="Aceleração de Hardware" checked={true} onChange={() => {}} disabled />
                        </div>
                      </div>
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-amber-400 pl-2">Microfone e Áudio</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Supressão de Ruído Avançada" checked={currentUser.settings?.noiseSuppression ?? true} onChange={(v) => updateUserSetting('noiseSuppression', v)} />
                          <SettingToggle label="Isolamento de Voz" checked={currentUser.settings?.voiceIsolation ?? true} onChange={(v) => updateUserSetting('voiceIsolation', v)} />
                        </div>
                      </div>
                    </motion.div>
                  )}

                  {settingsView === "BACKUPS" && (
                    <motion.div
                      key="backups"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-cyan-400 pl-2">Backup de Conversas</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl p-2 shadow-inner">
                          <SettingToggle label="Backup Automático via Nuvem" checked={currentUser.settings?.autoBackup ?? true} onChange={(v) => updateUserSetting('autoBackup', v)} />
                          <SettingToggle label="Incluir vídeos no backup" checked={currentUser.settings?.includeVideosBackup ?? false} onChange={(v) => updateUserSetting('includeVideosBackup', v)} />
                          <SettingToggle label="Backup Criptografado de Ponta a Ponta" checked={currentUser.settings?.e2eBackup ?? true} onChange={(v) => updateUserSetting('e2eBackup', v)} />
                        </div>
                      </div>
                      <button className="w-full bg-zinc-800 text-zinc-100 py-4 rounded-2xl font-bold uppercase tracking-wider text-xs border border-zinc-700 hover:bg-zinc-700 transition">
                        Fazer Backup Agora
                      </button>
                    </motion.div>
                  )}

                  {settingsView === "TERMS" && (
                    <motion.div
                      key="terms"
                      initial={{ opacity: 0, x: 10 }}
                      animate={{ opacity: 1, x: 0 }}
                      exit={{ opacity: 0, x: 10 }}
                      className="space-y-6"
                    >
                      <div className="space-y-3">
                        <h3 className="text-xs font-bold uppercase tracking-widest text-purple-400 pl-2">Termos e Condições e Política de Privacidade</h3>
                        <div className="bg-zinc-950/50 border border-zinc-800/80 rounded-2xl shadow-inner h-[60vh] overflow-y-auto custom-scrollbar">
                           <TermsAndPrivacy />
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            </motion.div>
            )
          )}

          {activeTab === "NEWS" && (
            <NewsView />
          )}

          {activeTab === "INPAGE" && (
            <Inpage currentUser={currentUser} />
          )}

          {activeTab === "COMMUNITIES" && (
            <CommunitiesTab currentUser={currentUser} onSelectConvo={onSelectConvo} />
          )}

          {activeTab === "WINDOWS_APP" && isNative && (
            <WindowsAppView />
          )}

          {activeTab === "QRCODE" && (!isNative && window.innerWidth <= 768) && (
            <ScanQRCodeView currentUser={currentUser} />
          )}
        </AnimatePresence>
      </div>
      )}

      {chatContextMenu && createPortal(
        <>
          <div className="fixed inset-0 z-50 bg-black/20" onClick={() => setChatContextMenu(null)} onContextMenu={(e) => { e.preventDefault(); setChatContextMenu(null); }} />
          <motion.div 
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="fixed z-50 bg-[#1e1f22] border border-zinc-800 rounded-xl shadow-2xl py-1 w-56 flex flex-col"
            style={{ 
               top: Math.min(chatContextMenu.y, window.innerHeight - 200), 
               left: Math.min(chatContextMenu.x, window.innerWidth - 224) 
            }}
          >
             <button onClick={() => { setShowAddConvoMembers(chatContextMenu.convo); setChatContextMenu(null); }} className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
                <AddUserIcon className="w-4 h-4" /> Adicionar Pessoas
             </button>
             <button onClick={() => handleArchiveConvo(chatContextMenu.convo)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
                <Archive className="w-4 h-4" /> {chatContextMenu.convo.archivedBy?.[currentUser._id] ? "Desarquivar Chat" : "Arquivar Chat"}
             </button>
             <button onClick={() => handleExportConvo(chatContextMenu.convo)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-zinc-300 hover:bg-zinc-800 hover:text-white transition-colors w-full text-left">
                <FileText className="w-4 h-4" /> Exportar (TXT)
             </button>
             <div className="h-px bg-zinc-800 my-1 mx-2" />
             <button onClick={() => handleDeleteConvo(chatContextMenu.convo)} className="flex items-center gap-3 px-4 py-2.5 text-sm text-red-500 hover:bg-red-500/10 transition-colors w-full text-left">
                <Trash2 className="w-4 h-4" /> Excluir Chat
             </button>
          </motion.div>
        </>, document.body
      )}

      {showAddConvoMembers && createPortal(
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
           <motion.div 
             initial={{ opacity: 0, y: 20, scale: 0.95 }}
             animate={{ opacity: 1, y: 0, scale: 1 }}
             className="bg-[#111214] w-full max-w-sm rounded-[24px] border border-zinc-800/50 shadow-2xl p-5 flex flex-col max-h-[80vh]"
           >
              <div className="flex justify-between items-center mb-4">
                 <h3 className="text-zinc-100 font-bold text-lg">Adicionar ao Chat</h3>
                 <button onClick={() => setShowAddConvoMembers(null)} className="p-2 -mr-2 text-zinc-400 hover:text-white bg-zinc-900 hover:bg-zinc-800 rounded-full transition-colors">
                    <X className="w-5 h-5" />
                 </button>
              </div>

              <div className="flex-1 overflow-y-auto mb-4 border border-zinc-800 rounded-xl p-2 bg-zinc-900/50 space-y-1">
                 <p className="text-xs text-zinc-500 px-2 py-1">Um chat pode ter até 5 pessoas.</p>
                 {contacts.filter(c => !showAddConvoMembers.participants.includes(c.registeredUserId)).length === 0 ? (
                    <div className="text-center p-4 text-zinc-500 text-sm">Nenhum novo contato para adicionar.</div>
                 ) : contacts.filter(c => !showAddConvoMembers.participants.includes(c.registeredUserId)).map(contact => (
                    <button 
                      key={contact._id} 
                      onClick={async () => {
                         const currentCount = showAddConvoMembers.participants?.length || 0;
                         if (currentCount >= 5) {
                            toast.error("Este chat atingiu o limite de 5 pessoas.");
                            return;
                         }
                         if (!contact.registeredUserId) {
                            toast.error("Contato não possui conta vinculada.");
                            return;
                         }
                         try {
                            const newParticipants = [...showAddConvoMembers.participants, contact.registeredUserId];
                            await updateDoc(doc(db, "conversations", showAddConvoMembers._id), {
                               participants: newParticipants,
                               isGroup: true,
                               isVerified: currentUser.role === 'admin' || currentUser.role === 'AdminUser',
                               name: showAddConvoMembers.name || showAddConvoMembers.otherUser?.username || "Novo Grupo"
                            });
                            setShowAddConvoMembers(null);
                         } catch(e) { console.error(e); }
                      }}
                      className="w-full flex items-center justify-between p-2 rounded-lg hover:bg-zinc-800 transition-colors"
                    >
                       <div className="flex items-center gap-3">
                          <img src={contact.userProfile?.avatarUrl || `https://api.dicebear.com/7.x/initials/svg?seed=${contact.name}`} className="w-10 h-10 rounded-full" />
                          <span className="text-zinc-200 text-sm">{contact.name}</span>
                       </div>
                       <Plus className="w-4 h-4 text-indigo-400" />
                    </button>
                 ))}
              </div>
           </motion.div>
        </div>, document.body
      )}

      {createPortal(
        <ConfirmModal
          isOpen={confirmState.isOpen}
          title={confirmState.title}
          message={confirmState.message}
          onConfirm={confirmState.onConfirm}
          onCancel={() => setConfirmState(prev => ({ ...prev, isOpen: false }))}
        />, document.body
      )}
    </div>
  );
}

function NavRailItem({ icon, label, active, onClick }: { icon: React.ReactNode, label: string, active: boolean, onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.95 }}
      onClick={onClick}
      className={`relative w-full aspect-square rounded-2xl flex flex-col items-center justify-center transition-all duration-300 group ${
        active 
          ? "bg-indigo-600/15 text-indigo-400" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      {active && (
        <motion.div 
          layoutId="nav_indicator"
          className="absolute left-0 w-1 bg-indigo-500 rounded-r-md inset-y-3"
          transition={{ duration: 0.3, type: "spring" }}
        />
      )}
      <motion.div 
        animate={{ rotate: active ? [0, -10, 10, 0] : 0 }} 
        transition={{ duration: 0.5, ease: "easeInOut" }}
        className={`transition-transform duration-300 ${active ? "scale-110" : "group-hover:scale-110"}`}
      >
        {icon}
      </motion.div>
      <span className="absolute left-full ml-4 bg-zinc-800 text-zinc-200 text-xs px-2 py-1 rounded-md opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap transition-opacity z-50 shadow-xl border border-zinc-700/50">
        {label}
      </span>
    </motion.button>
  );
}

function MobileNavItem({ icon, active, onClick }: { icon: React.ReactNode, active: boolean, onClick: () => void }) {
  return (
    <motion.button 
      whileHover={{ scale: 1.05 }}
      whileTap={{ scale: 0.9 }}
      onClick={onClick}
      className={`relative p-2 rounded-xl flex items-center justify-center transition-all duration-300 ${
        active 
          ? "bg-indigo-600/15 text-indigo-400" 
          : "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800/50"
      }`}
    >
      <motion.div 
        animate={{ scale: active ? [1, 1.2, 1] : 1 }}
        transition={{ duration: 0.3 }}
        className={`transition-transform duration-300`}
      >
        {icon}
      </motion.div>
    </motion.button>
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
        <div className={`w-4 h-4 bg-white rounded-full shadow-sm transition-transform ${checked ? "translate-x-4" : "translate-x-0"}`} />
      </button>
    </div>
  );
}
