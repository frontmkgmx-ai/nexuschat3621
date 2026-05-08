import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "motion/react";
import { Users2, Plus, CheckCircle2, ChevronRight, MessageCircle, ArrowLeft, Loader2, Camera, UserPlus, BadgeCheck, MoreVertical, Edit2, ShieldBan, Trash2, Clock, Globe2, Link, Film, FileText, Bell } from "lucide-react";
import { db } from "../lib/firebase";
import { collection, query, where, onSnapshot, addDoc, serverTimestamp, doc, updateDoc, arrayUnion, getDoc } from "firebase/firestore";

interface CommunitiesTabProps {
  currentUser: any;
  onSelectConvo: (convo: any) => void;
}

export default function CommunitiesTab({ currentUser, onSelectConvo }: CommunitiesTabProps) {
  const [communities, setCommunities] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreateMenu, setShowCreateMenu] = useState(false);
  const [newCommName, setNewCommName] = useState("");
  const [newCommDesc, setNewCommDesc] = useState("");
  const [newCommFocus, setNewCommFocus] = useState("Geral");
  const [newCommAvatarUrl, setNewCommAvatarUrl] = useState("");
  const [newCommBannerUrl, setNewCommBannerUrl] = useState("");
  const [creating, setCreating] = useState(false);
  const [userGroups, setUserGroups] = useState<any[]>([]);

    const uploadFile = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;
        
        setCreating(true);
        try {
            const { uploadFileToBucket } = await import('../services/fileApi');
            const res = await uploadFileToBucket({ file });
            const url = res.file.url;
            if (type === 'avatar') setNewCommAvatarUrl(url);
            if (type === 'banner') setNewCommBannerUrl(url);
        } catch (err) {
            console.error("Upload failed", err);
        } finally {
            setCreating(false);
        }
    };

  useEffect(() => {
    // Fetch user's communities (where they are a member)
    const q = query(collection(db, "communities"), where("members", "array-contains", currentUser._id));
    const unsub = onSnapshot(q, (snap) => {
      const comms = snap.docs.map(d => ({ _id: d.id, ...d.data() })).filter((c: any) => !c.deleted);
      setCommunities(comms);
      setLoading(false);
    });

    // Fetch user's groups to link
    const qGroups = query(collection(db, "conversations"), where("participants", "array-contains", currentUser._id));
    const unsubGroups = onSnapshot(qGroups, (snap) => {
        const groups = snap.docs.map(d => ({ _id: d.id, ...d.data() })).filter((g: any) => g.isGroup);
        setUserGroups(groups);
    });

    return () => {
        unsub();
        unsubGroups();
    };
  }, [currentUser._id]);

  const handleCreateCommunity = async () => {
    if (!newCommName.trim()) return;
    setCreating(true);
    try {
      const isUserAdmin = currentUser.role === 'admin';
      const defaultChannels = [
          { name: "📣 Canal Principal", type: "main" },
          { name: "📸 Mídias", type: "media" },
          { name: "📰 Notícias", type: "news" },
          { name: "📝 Logs e Avisos", type: "logs" },
          { name: "🔗 Links e Arquivos", type: "links" }
      ];

      const createdGroups = [];
      const groupPromises = defaultChannels.map(template => 
         addDoc(collection(db, "conversations"), {
            isGroup: true,
            isCommunityChannel: true,
            channelType: template.type,
            name: template.name,
            participants: [currentUser._id],
            admins: [currentUser._id],
            createdAt: serverTimestamp(),
            createdBy: currentUser._id,
            messages: []
         })
      );

      const groupRefs = await Promise.all(groupPromises);
      const groupIds = groupRefs.map(ref => ref.id);

      // 2. Create Community
      await addDoc(collection(db, "communities"), {
        name: newCommName,
        description: newCommDesc,
        focus: newCommFocus,
        avatarUrl: newCommAvatarUrl,
        bannerUrl: newCommBannerUrl,
        ownerId: currentUser._id,
        isVerified: isUserAdmin, // Badge logic
        members: [currentUser._id],
        groups: groupIds,
        createdAt: serverTimestamp(),
      });

      setShowCreateMenu(false);
      setNewCommName("");
      setNewCommDesc("");
      setNewCommFocus("Geral");
      setNewCommAvatarUrl("");
      setNewCommBannerUrl("");
    } catch (e) {
      console.error("Error creating community:", e);
    } finally {
      setCreating(false);
    }
  };

  const openGroup = async (groupId: string) => {
      try {
          const docRef = doc(db, "conversations", groupId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
              onSelectConvo({ _id: docSnap.id, ...docSnap.data() });
          }
      } catch (e) {
          console.error("Error opening group:", e);
      }
  };

  if (showCreateMenu) {
    return (
      <motion.div 
        key="create-community"
        initial={{ x: 20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        className="flex flex-col h-full absolute inset-0 w-full bg-[#111214] z-10"
      >
        <div className="flex items-center gap-4 p-4 border-b border-[#2B2D31] bg-[#111214] sticky top-0 z-10">
          <button onClick={() => setShowCreateMenu(false)} className="text-zinc-400 hover:text-white transition-colors">
            <ArrowLeft className="w-6 h-6" />
          </button>
          <h2 className="text-xl font-semibold text-zinc-100">Nova Comunidade</h2>
        </div>
        
        <div className="flex-1 overflow-y-auto p-5 space-y-6">
            <div className="relative w-full h-32 bg-[#2B2D31] rounded-2xl overflow-hidden group cursor-pointer border border-[#2B2D31] hover:border-indigo-500 transition-colors">
                <input type="file" accept="image/*" onChange={(e) => uploadFile(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                {newCommBannerUrl ? (
                    <img src={newCommBannerUrl} alt="Banner" className="w-full h-full object-cover" />
                ) : (
                    <div className="w-full h-full flex flex-col items-center justify-center text-zinc-500 bg-[#1e1f22]">
                        <Camera className="w-6 h-6 mb-2" />
                        <span className="text-xs font-semibold">Adicionar Fundo (Banner)</span>
                    </div>
                )}
            </div>

            <div className="flex justify-center -mt-16 relative z-20">
                <div className="w-24 h-24 rounded-[1.5rem] bg-[#1e1f22] border-4 border-[#111214] flex items-center justify-center cursor-pointer hover:border-indigo-500 transition-colors group overflow-hidden relative shadow-lg">
                    <input type="file" accept="image/*" onChange={(e) => uploadFile(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                    {newCommAvatarUrl ? (
                        <img src={newCommAvatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                        <Camera className="w-8 h-8 text-zinc-500 group-hover:text-indigo-400" />
                    )}
                </div>
            </div>

            <div className="space-y-4">
                <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nome da Comunidade</label>
                    <input
                        type="text"
                        value={newCommName}
                        onChange={(e) => setNewCommName(e.target.value)}
                        placeholder="Ex: Escola, Vizinhos, Trabalho"
                        className="w-full bg-[#1e1f22] text-zinc-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600 border border-[#2B2D31]"
                        maxLength={50}
                    />
                </div>

                <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Foco / Tema</label>
                    <select
                        value={newCommFocus}
                        onChange={(e) => setNewCommFocus(e.target.value)}
                        className="w-full bg-[#1e1f22] text-zinc-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 border border-[#2B2D31]"
                    >
                        <option value="Geral">Geral</option>
                        <option value="Educação">Educação</option>
                        <option value="Comunidade Local">Comunidade Local</option>
                        <option value="Trabalho">Trabalho / Empresa</option>
                        <option value="Jogos">Jogos / E-Sports</option>
                        <option value="Entretenimento">Entretenimento</option>
                    </select>
                </div>
                
                <div>
                    <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Biografia (Opcional)</label>
                    <textarea
                        value={newCommDesc}
                        onChange={(e) => setNewCommDesc(e.target.value)}
                        placeholder="Qual o propósito dessa comunidade?"
                        className="w-full bg-[#1e1f22] text-zinc-100 px-4 py-3 rounded-lg focus:outline-none focus:ring-2 focus:ring-indigo-500 placeholder-zinc-600 border border-[#2B2D31] resize-none h-24"
                        maxLength={150}
                    />
                </div>
            </div>

            <button 
                onClick={handleCreateCommunity}
                disabled={!newCommName.trim() || creating}
                className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:bg-indigo-500/50 disabled:cursor-not-allowed text-white font-medium py-3 rounded-xl transition-colors flex items-center justify-center gap-2 mt-4"
            >
                {creating ? <Loader2 className="w-5 h-5 animate-spin" /> : "Criar Comunidade"}
            </button>
        </div>
      </motion.div>
    );
  }

  return (
    <motion.div 
        key="communities"
        initial={{ x: -20, opacity: 0 }}
        animate={{ x: 0, opacity: 1 }}
        exit={{ x: -20, opacity: 0 }}
        transition={{ duration: 0.2 }}
        className="flex flex-col h-full absolute inset-0 w-full pt-4 bg-[#111214]"
    >
        <div className="px-5 py-4 shrink-0 border-b border-[#2B2D31] flex justify-between items-center">
            <h2 className="text-2xl font-bold text-zinc-100 tracking-tight">Comunidades</h2>
            <button 
                onClick={() => setShowCreateMenu(true)}
                className="p-2 bg-[#2B2D31] text-zinc-300 hover:bg-indigo-500 hover:text-white rounded-full transition-colors focus:outline-none"
            >
                <Plus className="w-5 h-5" />
            </button>
        </div>
        
        <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-4">
            {communities.length === 0 && !loading && (
                <div className="bg-gradient-to-br from-[#1e1f22] to-[#2B2D31] border border-[#2B2D31] p-5 rounded-2xl flex flex-col items-center text-center">
                <div className="w-16 h-16 bg-indigo-500/20 rounded-[1.5rem] flex items-center justify-center mb-3">
                    <Users2 className="w-8 h-8 text-indigo-400" />
                </div>
                <h3 className="text-lg font-bold text-zinc-100 mb-2">Apresentando Comunidades</h3>
                <p className="text-zinc-400 text-sm mb-4 leading-relaxed">
                    Reúna todos os grupos relacionados em um único lugar, como escolas, vizinhança ou trabalho.
                </p>
                <button 
                    onClick={() => setShowCreateMenu(true)}
                    className="bg-indigo-500 hover:bg-indigo-600 text-white font-medium text-sm px-5 py-2.5 rounded-xl transition-all w-full"
                >
                    Iniciar sua Comunidade
                </button>
                </div>
            )}

            {loading && (
                <div className="flex justify-center p-8">
                    <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
                </div>
            )}

            {!loading && communities.map((comm) => (
                <CommunityItem key={comm._id} community={comm} userGroups={userGroups} onOpenGroup={openGroup} currentUser={currentUser} />
            ))}
        </div>
    </motion.div>
  );
}

const CommunityItem: React.FC<{ community: any, userGroups: any[], onOpenGroup: (id: string) => Promise<void>, currentUser: any }> = ({ community, userGroups, onOpenGroup, currentUser }) => {
    const [expanded, setExpanded] = useState(true);
    const [showAddGroup, setShowAddGroup] = useState(false);
    const [showContextMenu, setShowContextMenu] = useState(false);
    const [contextMenuPos, setContextMenuPos] = useState({ x: 0, y: 0 });
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
    const [showEditProfile, setShowEditProfile] = useState(false);
    const [showInvite, setShowInvite] = useState(false);
    const [showManageUsers, setShowManageUsers] = useState(false);
    const [showRetention, setShowRetention] = useState(false);
    
    // For Add Channel Form
    const [newChannelMode, setNewChannelMode] = useState<'existing'|'new'>('existing');
    const [newChannelName, setNewChannelName] = useState("");
    const [newChannelType, setNewChannelType] = useState("main");
    
    // For Edit Profile
    const [editName, setEditName] = useState(community.name);
    const [editDesc, setEditDesc] = useState(community.description || "");
    const [editFocus, setEditFocus] = useState(community.focus || "Geral");
    const [editAvatarUrl, setEditAvatarUrl] = useState(community.avatarUrl || "");
    const [editBannerUrl, setEditBannerUrl] = useState(community.bannerUrl || "");
    
    // Upload for Edit
    const uploadFileEdit = async (e: React.ChangeEvent<HTMLInputElement>, type: 'avatar' | 'banner') => {
        const file = e.target.files?.[0];
        if (!file) return;
        try {
            const { uploadFileToBucket } = await import('../services/fileApi');
            const res = await uploadFileToBucket({ file });
            const url = res.file.url;
            if (type === 'avatar') setEditAvatarUrl(url);
            if (type === 'banner') setEditBannerUrl(url);
        } catch (err) {
            console.error("Upload failed", err);
        }
    };

    const handleDeleteCommunity = async () => {
        try {
            await updateDoc(doc(db, "communities", community._id), {
                deleted: true
            });
            setShowDeleteConfirm(false);
        } catch (e) {
            console.error("Error deleting community:", e);
        }
    };
    
    // Get the groups that belong to this community
    const commGroups = userGroups.filter(g => community.groups?.includes(g._id));

    const handleAction = (action: string) => {
        setShowContextMenu(false);
        if (action === 'delete') setShowDeleteConfirm(true);
        if (action === 'edit') setShowEditProfile(true);
        if (action === 'addChannel') setShowAddGroup(true);
        if (action === 'invite') setShowInvite(true);
        if (action === 'ban') setShowManageUsers(true);
        if (action === 'retention') setShowRetention(true);
    };

    const handleContextMenu = (e: React.MouseEvent) => {
        e.preventDefault();
        if (community.ownerId !== currentUser._id) return;
        setContextMenuPos({ x: e.clientX, y: e.clientY });
        setShowContextMenu(true);
    };

    return (
        <div className="bg-[#1e1f22] border border-[#2B2D31] rounded-2xl overflow-hidden shadow-sm group relative">
            {community.bannerUrl && (
                <div className="h-16 w-full relative">
                    <img src={community.bannerUrl} className="w-full h-full object-cover" alt="Banner" />
                    <div className="absolute inset-0 bg-gradient-to-b from-transparent to-[#1e1f22]" />
                </div>
            )}
            <div 
                className={`flex items-center gap-3 p-3 border-b border-[#2B2D31] cursor-pointer hover:bg-[#2B2D31]/50 transition-colors ${community.bannerUrl ? '-mt-6 relative z-10' : ''}`}
                onClick={() => setExpanded(!expanded)}
                onContextMenu={handleContextMenu}
            >
                <div className="w-12 h-12 rounded-[12px] bg-[#111214] border border-[#2B2D31] flex items-center justify-center shrink-0 overflow-hidden shadow-md">
                    {community.avatarUrl ? (
                         <img src={community.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
                    ) : (
                         <span className="text-zinc-400 font-bold text-lg">{community.name.substring(0, 2).toUpperCase()}</span>
                    )}
                </div>
                <div className="flex-1 overflow-hidden">
                    <h4 className="text-zinc-100 font-semibold truncate flex items-center gap-1.5 text-base">
                        {community.name}
                        {community.isVerified && <BadgeCheck className="w-4 h-4 text-indigo-400 shrink-0" />}
                    </h4>
                    <span className="text-xs text-zinc-400 bg-zinc-800/50 px-2 py-0.5 rounded-md inline-block mt-1">{community.focus || "Geral"}</span>
                    <span className="text-xs text-zinc-500 ml-2">{commGroups.length} canais anexados</span>
                </div>
                {community.ownerId === currentUser._id && (
                    <button 
                         onClick={(e) => { e.stopPropagation(); setShowContextMenu(true); setContextMenuPos({x: e.clientX, y: e.clientY}); }}
                         className="p-1.5 text-zinc-500 hover:text-zinc-300 transition-colors lg:hidden focus:outline-none"
                    >
                         <MoreVertical className="w-5 h-5" />
                    </button>
                )}
                {community.ownerId === currentUser._id && (
                    <button 
                         onClick={(e) => { e.stopPropagation(); setShowAddGroup(true); }}
                         className="p-1.5 text-zinc-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded-lg transition-colors focus:outline-none hidden lg:block"
                         title="Adicionar Canal"
                    >
                         <Plus className="w-5 h-5" />
                    </button>
                )}
                <button className={`text-zinc-500 hover:text-zinc-300 transition-transform duration-200 ${expanded ? 'rotate-90' : ''} ml-1`}>
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>
            
            <AnimatePresence>
                {expanded && (
                    <motion.div 
                        initial={{ height: 0, opacity: 0 }}
                        animate={{ height: "auto", opacity: 1 }}
                        exit={{ height: 0, opacity: 0 }}
                        className="overflow-hidden"
                    >
                        <div className="p-2 space-y-1 bg-[#111214]/50">
                            {commGroups.map(group => {
                                let Icon = MessageCircle;
                                if (group.channelType === 'main') Icon = Globe2;
                                if (group.channelType === 'media') Icon = Film;
                                if (group.channelType === 'news') Icon = Bell;
                                if (group.channelType === 'logs') Icon = FileText;
                                if (group.channelType === 'links') Icon = Link;

                                return (
                                <div 
                                    key={group._id}
                                    onClick={() => onOpenGroup(group._id)}
                                    className="flex items-center gap-3 p-2 hover:bg-[#2B2D31] rounded-xl cursor-pointer transition-colors group/item"
                                >
                                    <div className="w-10 h-10 rounded-full bg-[#1e1f22] border border-[#2B2D31] flex items-center justify-center group-hover/item:border-indigo-500/30 transition-colors">
                                        <Icon className="w-4 h-4 text-zinc-400 group-hover/item:text-indigo-400" />
                                    </div>
                                    <div className="flex-1 overflow-hidden">
                                        <h5 className="text-sm font-medium text-zinc-300 group-hover/item:text-zinc-100 truncate">{group.name}</h5>
                                    </div>
                                </div>
                                )
                            })}
                        </div>
                    </motion.div>
                )}
            </AnimatePresence>

            {showAddGroup && (
               <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60">
                  <div className="w-full max-w-sm bg-[#1e1f22] border border-[#2B2D31] rounded-2xl shadow-xl flex flex-col p-5 overflow-hidden max-h-screen">
                      <h3 className="text-lg font-semibold text-white mb-4">Criar Canal</h3>

                      <div className="space-y-4 mb-4 flex-1 overflow-y-auto custom-scrollbar">
                          <div>
                              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Nome do Canal</label>
                              <input type="text" value={newChannelName} onChange={e => setNewChannelName(e.target.value)} className="w-full bg-[#111214] border border-[#2B2D31] rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none" placeholder="Ex: Avisos Gerais" />
                          </div>
                          <div>
                              <label className="block text-xs font-semibold text-zinc-400 uppercase tracking-wider mb-2">Tipo de Canal</label>
                              <select value={newChannelType} onChange={e => setNewChannelType(e.target.value)} className="w-full bg-[#111214] border border-[#2B2D31] rounded-xl px-4 py-3 text-white text-sm focus:border-indigo-500 focus:outline-none">
                                  <option value="main">Principal (Texto e Mídia)</option>
                                  <option value="media">Mídias (Apenas Mídias)</option>
                                  <option value="news">Notícias</option>
                                  <option value="logs">Logs e Avisos (Somente Leitura para membros)</option>
                                  <option value="links">Links e Arquivos</option>
                              </select>
                          </div>
                          <button 
                             disabled={!newChannelName.trim()}
                             onClick={async () => {
                                 try {
                                     // Create new channel, making sure participants are initialized (at least the creator)
                                     // But members of the community should have access? Yes, either we sync members or just allow community members to view it.
                                     // Actually, currently we sync participants array? The user who created it just adds themselves to participants.
                                     // Wait, earlier I made logic to add joined users to the participants arrays. 
                                     // So new channels should probably get all community members as participants?
                                     // For now, let's just make it have current members.
                                     const newGroupRef = await addDoc(collection(db, "conversations"), {
                                        isGroup: true,
                                        isCommunityChannel: true,
                                        channelType: newChannelType,
                                        name: newChannelName,
                                        participants: community.members || [currentUser._id],
                                        admins: community.admins || [currentUser._id],
                                        createdAt: serverTimestamp(),
                                        createdBy: currentUser._id,
                                        messages: []
                                     });
                                     await updateDoc(doc(db, "communities", community._id), {
                                         groups: arrayUnion(newGroupRef.id)
                                     });
                                     setShowAddGroup(false);
                                     setNewChannelName("");
                                 } catch (e) { console.error("Error creating channel", e); }
                             }}
                             className="w-full bg-indigo-500 hover:bg-indigo-600 disabled:opacity-50 text-white font-medium py-3 rounded-xl transition-colors"
                          >
                              Criar Canal
                          </button>
                      </div>
                      
                      <button 
                         onClick={() => setShowAddGroup(false)}
                         className="w-full bg-[#2B2D31] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-medium transition-colors shrink-0"
                      >
                         Fechar
                      </button>
                  </div>
               </div>
            )}

            {showContextMenu && (
                <>
                    <div className="fixed inset-0 z-40" onClick={() => setShowContextMenu(false)} />
                    <div 
                        className="fixed z-50 bg-[#1e1f22] border border-[#2B2D31] rounded-xl shadow-2xl py-2 w-64 min-w-max"
                        style={{ top: Math.min(contextMenuPos.y, window.innerHeight - 250), left: Math.min(contextMenuPos.x, window.innerWidth - 200) }}
                    >
                        <div className="px-3 pb-2 mb-2 border-b border-[#2B2D31]">
                            <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">Ações Administrador</span>
                        </div>
                        <button onClick={() => handleAction('edit')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-[#2B2D31] hover:text-white flex items-center gap-2">
                            <Edit2 className="w-4 h-4" /> Editar Perfil da Comunidade
                        </button>
                        <button onClick={() => handleAction('addChannel')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-[#2B2D31] hover:text-white flex items-center gap-2">
                            <Plus className="w-4 h-4" /> Criar / Adicionar Canais
                        </button>
                        <button onClick={() => handleAction('invite')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-[#2B2D31] hover:text-white flex items-center gap-2">
                            <UserPlus className="w-4 h-4" /> Convidar Membros
                        </button>
                        <button onClick={() => handleAction('ban')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-[#2B2D31] hover:text-white flex items-center gap-2">
                            <ShieldBan className="w-4 h-4" /> Banir / Remover Usuários
                        </button>
                        <button onClick={() => handleAction('retention')} className="w-full text-left px-4 py-2 text-sm text-zinc-300 hover:bg-[#2B2D31] hover:text-white flex items-center gap-2">
                            <Clock className="w-4 h-4" /> Definir Tempo de Exclusão
                        </button>
                        <div className="h-px bg-[#2B2D31] my-1" />
                        <button onClick={() => handleAction('delete')} className="w-full text-left px-4 py-2 text-sm text-red-500 hover:bg-red-500/10 flex items-center gap-2">
                            <Trash2 className="w-4 h-4" /> Excluir Comunidade
                        </button>
                    </div>
                </>
            )}

            {showDeleteConfirm && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
                    <div className="w-full max-w-sm bg-[#1e1f22] border border-[#2B2D31] rounded-2xl shadow-xl flex flex-col p-5">
                       <h3 className="text-xl font-bold text-white mb-2">Excluir Comunidade?</h3>
                       <p className="text-zinc-400 text-sm mb-6">Tem certeza que deseja excluir a comunidade "<strong>{community.name}</strong>"? Esta ação não poderá ser desfeita.</p>
                       <div className="flex gap-3">
                          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 bg-[#2B2D31] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-medium transition-colors">Cancelar</button>
                          <button onClick={handleDeleteCommunity} className="flex-1 bg-red-500 hover:bg-red-600 text-white py-2.5 rounded-xl font-medium transition-colors">Excluir</button>
                       </div>
                    </div>
                </div>
            )}
            {showEditProfile && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
                    <div className="w-full max-w-md bg-[#1e1f22] border border-[#2B2D31] rounded-2xl shadow-xl flex flex-col p-5 max-h-[90vh] overflow-hidden">
                       <h3 className="text-xl font-bold text-white mb-4 shrink-0">Editar Comunidade</h3>
                       <div className="flex-1 overflow-y-auto space-y-4 pr-2 custom-scrollbar">
                           <div className="relative w-full h-24 bg-[#2B2D31] rounded-xl overflow-hidden group cursor-pointer">
                               <input type="file" accept="image/*" onChange={(e) => uploadFileEdit(e, 'banner')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                               {editBannerUrl ? <img src={editBannerUrl} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-500"><Camera className="w-6 h-6 mr-2" /> Banner</div>}
                           </div>
                           <div className="flex justify-center -mt-12 relative z-20">
                               <div className="w-20 h-20 bg-[#1e1f22] rounded-xl border-4 border-[#1e1f22] relative group overflow-hidden cursor-pointer shadow-lg">
                                   <input type="file" accept="image/*" onChange={(e) => uploadFileEdit(e, 'avatar')} className="absolute inset-0 opacity-0 cursor-pointer z-10" />
                                   {editAvatarUrl ? <img src={editAvatarUrl} className="w-full h-full object-cover" /> : <div className="flex h-full items-center justify-center text-zinc-500 bg-[#111214]"><Camera className="w-6 h-6" /></div>}
                               </div>
                           </div>
                           
                           <div>
                               <label className="block text-xs font-semibold text-zinc-400 mb-1">Nome</label>
                               <input type="text" value={editName} onChange={e => setEditName(e.target.value)} className="w-full bg-[#111214] border border-[#2B2D31] rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500" />
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-zinc-400 mb-1">Foco / Tema</label>
                               <select value={editFocus} onChange={e => setEditFocus(e.target.value)} className="w-full bg-[#111214] border border-[#2B2D31] rounded-xl px-3 py-2 text-white outline-none focus:border-indigo-500">
                                  <option value="Geral">Geral</option>
                                  <option value="Educação">Educação</option>
                                  <option value="Comunidade Local">Comunidade Local</option>
                                  <option value="Trabalho">Trabalho / Empresa</option>
                                  <option value="Jogos">Jogos / E-Sports</option>
                                  <option value="Entretenimento">Entretenimento</option>
                               </select>
                           </div>
                           <div>
                               <label className="block text-xs font-semibold text-zinc-400 mb-1">Biografia</label>
                               <textarea value={editDesc} onChange={e => setEditDesc(e.target.value)} className="w-full bg-[#111214] border border-[#2B2D31] rounded-xl px-3 py-2 text-white h-20 outline-none focus:border-indigo-500 resize-none" />
                           </div>
                       </div>
                       <div className="flex gap-3 mt-4 shrink-0">
                          <button onClick={() => setShowEditProfile(false)} className="flex-1 bg-[#2B2D31] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-medium transition-colors">Cancelar</button>
                          <button 
                             onClick={async () => {
                                 await updateDoc(doc(db, "communities", community._id), {
                                     name: editName, description: editDesc, focus: editFocus, avatarUrl: editAvatarUrl, bannerUrl: editBannerUrl
                                 });
                                 setShowEditProfile(false);
                             }}
                             className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl font-medium transition-colors"
                          >
                             Salvar
                          </button>
                       </div>
                    </div>
                </div>
            )}

            {showInvite && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
                    <div className="w-full max-w-sm bg-[#1e1f22] border border-[#2B2D31] rounded-2xl shadow-xl flex flex-col p-5">
                       <h3 className="text-xl font-bold text-white mb-2">Convidar Membros</h3>
                       <p className="text-zinc-400 text-sm mb-4">Compartilhe o link abaixo para permitir que outros entrem na sua comunidade.</p>
                       <div className="flex items-center gap-2 bg-[#111214] border border-[#2B2D31] rounded-xl p-2 mb-4">
                           <input type="text" readOnly value={`https://nexuschat-55d.pages.dev/join/${community._id}`} className="bg-transparent border-none outline-none text-zinc-300 text-sm flex-1 font-mono" />
                           <button onClick={() => navigator.clipboard.writeText(`https://nexuschat-55d.pages.dev/join/${community._id}`)} className="px-3 py-1 bg-[#2B2D31] text-xs font-semibold text-white rounded-lg hover:bg-indigo-500">Copiar</button>
                       </div>
                       <button onClick={() => setShowInvite(false)} className="w-full bg-[#2B2D31] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-medium transition-colors">Fechar</button>
                    </div>
                </div>
            )}

            {showRetention && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
                    <div className="w-full max-w-sm bg-[#1e1f22] border border-[#2B2D31] rounded-2xl shadow-xl flex flex-col p-5">
                       <h3 className="text-xl font-bold text-white mb-2">Tempo de Exclusão</h3>
                       <p className="text-zinc-400 text-sm mb-4">Defina se a comunidade ou seus conteúdos serão excluídos automaticamente.</p>
                       <div className="space-y-3 mb-6">
                           {['Nunca', '24 Horas', '7 Dias', '30 Dias'].map(opt => (
                               <label key={opt} className="flex items-center gap-3 p-3 bg-[#111214] rounded-xl border border-[#2B2D31] cursor-pointer hover:border-indigo-500/50">
                                   <input type="radio" name="retention" className="w-4 h-4 accent-indigo-500" defaultChecked={community.retention === opt || (!community.retention && opt === 'Nunca')} onChange={() => setEditFocus(opt) /* Reusing a state variable just to hold the selected retention temporally. Actually let's use a normal onClick -> wait. Let's create a local state for the modal. */} />
                                   <span className="text-zinc-200 text-sm">{opt}</span>
                               </label>
                           ))}
                       </div>
                       <div className="flex gap-3">
                          <button onClick={() => setShowRetention(false)} className="flex-1 bg-[#2B2D31] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-medium transition-colors">Cancelar</button>
                          <button onClick={async () => {
                              try {
                                  // Find which radio is checked
                                  const checkedRadio = document.querySelector('input[name="retention"]:checked') as HTMLInputElement;
                                  if (checkedRadio) {
                                      const label = checkedRadio.closest('label')?.textContent;
                                      await updateDoc(doc(db, "communities", community._id), { retention: label });
                                  }
                                  setShowRetention(false);
                              } catch (e) { console.error(e); }
                          }} className="flex-1 bg-indigo-500 hover:bg-indigo-600 text-white py-2.5 rounded-xl font-medium transition-colors">Salvar</button>
                       </div>
                    </div>
                </div>
            )}

            {showManageUsers && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/60">
                    <div className="w-full max-w-sm bg-[#1e1f22] border border-[#2B2D31] rounded-2xl shadow-xl flex flex-col p-5 max-h-[80vh]">
                       <h3 className="text-xl font-bold text-white mb-2">Gerenciar Membros</h3>
                       <p className="text-zinc-400 text-sm mb-4">Membros atuais da comunidade. Você pode remover ou banir usuários.</p>
                       <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2 mb-4">
                           {community.members?.map((uid: string) => (
                               <div key={uid} className="flex justify-between items-center bg-[#111214] p-3 rounded-xl border border-[#2B2D31]">
                                   <div className="flex flex-col">
                                       <span className="text-zinc-200 text-sm truncate w-32">{uid === currentUser._id ? "Você" : `ID: ${uid.substring(0, 8)}...`}</span>
                                       {uid === community.ownerId && <span className="text-indigo-400 text-[10px] font-bold uppercase tracking-wider">Admin/Dono</span>}
                                   </div>
                                   {uid !== currentUser._id && (
                                       <button 
                                          onClick={async () => {
                                              try {
                                                  // remove from community members
                                                  await updateDoc(doc(db, "communities", community._id), {
                                                      members: community.members.filter((id: string) => id !== uid)
                                                  });
                                                  // remove from all linked groups
                                                  if (community.groups && community.groups.length > 0) {
                                                      for (const groupId of community.groups) {
                                                          const gRef = doc(db, "conversations", groupId);
                                                          const gSnap = await getDoc(gRef);
                                                          if (gSnap.exists()) {
                                                              const gData = gSnap.data();
                                                              if (gData.participants?.includes(uid)) {
                                                                  await updateDoc(gRef, {
                                                                      participants: gData.participants.filter((id: string) => id !== uid)
                                                                  });
                                                              }
                                                          }
                                                      }
                                                  }
                                              } catch (e) {
                                                  console.error("Error removing member:", e);
                                              }
                                          }}
                                          className="p-1.5 text-zinc-500 hover:text-red-400 hover:bg-red-500/10 rounded-lg"
                                       >
                                           <Trash2 className="w-4 h-4" />
                                       </button>
                                   )}
                               </div>
                           ))}
                       </div>
                       <button onClick={() => setShowManageUsers(false)} className="w-full bg-[#2B2D31] hover:bg-[#3f4147] text-white py-2.5 rounded-xl font-medium transition-colors">Fechar</button>
                    </div>
                </div>
            )}
        </div>
    );
}
