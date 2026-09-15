import { toast } from 'sonner';
import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { Plus, Clock, X, ChevronLeft, ChevronRight, Volume2, VolumeX, Trash2 } from "lucide-react";
import CreateStatusModal from "./CreateStatusModal";
import { statusService } from "../services/statusService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sanitizeUrl } from "../services/storageService";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";
import { StatusViewer } from "./StatusViewer";

export default function Inpage({ currentUser }: { currentUser: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Viewer state
  const [viewingUserIdx, setViewingUserIdx] = useState<number | null>(null);
  const [viewingStatusIdx, setViewingStatusIdx] = useState<number>(0);

  useEffect(() => {
    // We add local expiration filter here just in case snapshot doesn't update immediately
    const checkInterval = setInterval(() => {
       setStatuses(prev => {
          const now = Date.now();
          const valid = prev.filter(s => new Date(s.expiresAt).getTime() > now);
          if (valid.length !== prev.length) return valid;
          return prev;
       });
    }, 10000); // check every 10s

    const unsub = statusService.subscribeActiveStatuses((data) => {
      setStatuses(data);
      setLoading(false);
    });
    
    return () => {
       unsub();
       clearInterval(checkInterval);
    };
  }, []);

  const groupedStatuses = useMemo(() => {
    const groups: { [key: string]: { userId: string, userName: string, userAvatar: string, statuses: any[], lastUpdated: number } } = {};
    statuses.forEach(status => {
      if (!groups[status.userId]) {
        groups[status.userId] = {
          userId: status.userId,
          userName: status.userName,
          userAvatar: status.userAvatar,
          statuses: [],
          lastUpdated: 0
        };
      }
      groups[status.userId].statuses.push(status);
      const createdAt = new Date(status.createdAt).getTime();
      if (createdAt > groups[status.userId].lastUpdated) {
        groups[status.userId].lastUpdated = createdAt;
      }
    });

    Object.values(groups).forEach(group => {
      group.statuses.sort((a, b) => new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime());
    });

    return Object.values(groups).sort((a, b) => b.lastUpdated - a.lastUpdated);
  }, [statuses]);

  const currentGroup = viewingUserIdx !== null ? groupedStatuses[viewingUserIdx] : null;
  const currentStatus = currentGroup ? currentGroup.statuses[viewingStatusIdx] : null;

  const handlePublish = async (data: any) => {
    try {
      await statusService.createStatus({ 
        ...data, 
        userId: currentUser._id, 
        userName: currentUser.username, 
        userAvatar: currentUser.avatarUrl 
      });
      const updated = await statusService.getActiveStatuses();
      setStatuses(updated);
      setIsModalOpen(false);
    } catch (e) {
      console.error("Failed to publish status:", e);
      toast.error("Failed to publish status");
    }
  };

  const handleViewStatusGroup = (groupIdx: number) => {
    setViewingUserIdx(groupIdx);
    setViewingStatusIdx(0);
  };

  const handleNextStatus = () => {
    if (viewingUserIdx === null) return;
    const group = groupedStatuses[viewingUserIdx];
    if (viewingStatusIdx < group.statuses.length - 1) {
      setViewingStatusIdx(prev => prev + 1);
    } else {
      if (viewingUserIdx < groupedStatuses.length - 1) {
        setViewingUserIdx(viewingUserIdx + 1);
        setViewingStatusIdx(0);
      } else {
        setViewingUserIdx(null);
      }
    }
  };

  const handlePrevStatus = () => {
    if (viewingUserIdx === null) return;
    if (viewingStatusIdx > 0) {
      setViewingStatusIdx(prev => prev - 1);
    } else {
      if (viewingUserIdx > 0) {
        setViewingUserIdx(viewingUserIdx - 1);
        const prevGroup = groupedStatuses[viewingUserIdx - 1];
        setViewingStatusIdx(prevGroup.statuses.length - 1);
      }
    }
  };

  const handleRemoveStatus = async (statusId: string) => {
    if (!confirm("Deseja apagar este status?")) return;
    try {
      await statusService.deleteStatus(statusId);
      const updated = await statusService.getActiveStatuses();
      setStatuses(updated);
      
      // If we are currently viewing the deleted status, we either move Next, or close Viewer if it's empty
      if (viewingUserIdx !== null) {
        // Just refresh the entire view by closing it for simplicity, or we can handle it smartly
        toast.success("Status apagado com sucesso");
        closeViewer();
      }
    } catch (e) {
      console.error("Failed to delete status:", e);
      toast.error("Falha ao apagar status");
    }
  };

  const closeViewer = () => {
    setViewingUserIdx(null);
  };

  return (
    <motion.div 
      initial={{ x: 20, opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: 20, opacity: 0 }}
      transition={{ duration: 0.2 }}
      className="flex flex-col h-full absolute inset-0 w-full pt-4 bg-zinc-900 overflow-hidden"
      style={{ WebkitTransform: "translate3d(0,0,0)", transform: "translate3d(0,0,0)" }}
    >
      <div className="pt-2 pb-3 px-5 shrink-0 flex items-end justify-between bg-zinc-900/90 backdrop-blur-md sticky top-0 z-10 border-b border-transparent mt-2 md:mt-0">
        <h2 className="text-3xl font-display font-extrabold text-zinc-100 tracking-tight leading-none">Status</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full w-8 h-8 flex items-center justify-center transition-all active:scale-95 shadow-lg shadow-indigo-500/20 mb-0.5"
        >
          <Plus className="w-5 h-5" />
        </button>
      </div>
      
      <div className="flex-1 overflow-y-auto custom-scrollbar p-5 space-y-6">
        <div>
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Meu Status</h3>
          <div className="flex items-center gap-4 group cursor-pointer" onClick={() => setIsModalOpen(true)}>
            <div className="relative">
              <div className="w-14 h-14 rounded-2xl border-2 border-dashed border-zinc-700 flex items-center justify-center group-hover:border-indigo-500 transition-colors">
                <Plus className="w-6 h-6 text-zinc-600 group-hover:text-indigo-500 transition-colors" />
              </div>
            </div>
            <div>
              <p className="text-zinc-200 font-bold text-[15px]">Adicionar Status</p>
              <p className="text-zinc-500 text-xs mt-0.5">Toque para atualizar</p>
            </div>
          </div>
        </div>

        <div className="space-y-4">
          <h3 className="text-[10px] font-bold text-zinc-500 uppercase tracking-widest mb-4">Atualizações Recentes</h3>
          
          {loading ? (
             <div className="flex items-center justify-center py-10">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-500"></div>
             </div>
          ) : groupedStatuses.length === 0 ? (
            <div className="text-center py-10">
              <Clock className="w-10 h-10 text-zinc-800 mx-auto mb-3" />
              <p className="text-zinc-600 text-sm">Nenhuma atualização recente</p>
            </div>
          ) : (
            groupedStatuses.map((group, idx) => (
              <motion.div 
                key={group.userId}
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-center gap-4 p-1 group cursor-pointer"
                onClick={() => handleViewStatusGroup(idx)}
              >
                <div className="relative p-[2px] rounded-2xl ring-2 ring-indigo-500 shadow-[0_0_10px_rgba(99,102,241,0.2)]">
                  <div className="w-14 h-14 rounded-2xl overflow-hidden border-2 border-zinc-900 bg-zinc-800">
                    <img 
                      src={sanitizeUrl(group.userAvatar) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${group.userId}`} 
                      className="w-full h-full object-cover" 
                      alt="User" 
                    />
                  </div>
                  {group.statuses.length > 1 && (
                    <div className="absolute -bottom-1 -right-1 bg-indigo-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-full border border-zinc-900">
                      {group.statuses.length}
                    </div>
                  )}
                </div>
                <div>
                  <p className="text-zinc-100 font-bold text-[15px]">{group.userName || "Usuário"}</p>
                  <p className="text-zinc-500 text-xs mt-0.5">
                    {(() => {
                      const date = new Date(group.lastUpdated);
                      return !isNaN(date.getTime()) 
                        ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR }) 
                        : "Data inválida";
                    })()}
                  </p>
                </div>
              </motion.div>
            ))
          )}
        </div>
      </div>

      <AnimatePresence>
        {isModalOpen && (
          <CreateStatusModal 
            onClose={() => setIsModalOpen(false)} 
            onPublish={handlePublish}
            currentUser={currentUser}
          />
        )}
        
        {currentStatus && currentGroup && (
          <StatusViewer 
             currentGroup={currentGroup}
             viewingStatusIdx={viewingStatusIdx}
             currentUser={currentUser}
             onNext={handleNextStatus}
             onPrev={handlePrevStatus}
             onClose={closeViewer}
             onRemove={handleRemoveStatus}
          />
        )}
      </AnimatePresence>
    </motion.div>
  );
}
