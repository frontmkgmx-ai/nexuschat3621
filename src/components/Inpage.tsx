import React, { useState, useEffect, useMemo, useRef } from "react";
import { motion, AnimatePresence, useAnimationControls } from "motion/react";
import { Plus, Clock, X, ChevronLeft, ChevronRight, Volume2, VolumeX } from "lucide-react";
import CreateStatusModal from "./CreateStatusModal";
import { statusService } from "../services/statusService";
import { formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { sanitizeUrl } from "../services/fileApi";
import { TransformWrapper, TransformComponent } from "react-zoom-pan-pinch";

export default function Inpage({ currentUser }: { currentUser: any }) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [statuses, setStatuses] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  
  // Viewer state
  const [viewingUserIdx, setViewingUserIdx] = useState<number | null>(null);
  const [viewingStatusIdx, setViewingStatusIdx] = useState<number>(0);
  const [isPaused, setIsPaused] = useState(false);
  const [isMuted, setIsMuted] = useState(true);
  const [statusDuration, setStatusDuration] = useState(5);
  const videoRef = useRef<HTMLVideoElement>(null);

  useEffect(() => {
    const unsub = statusService.subscribeActiveStatuses((data) => {
      setStatuses(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  useEffect(() => {
    if (videoRef.current) {
      if (isPaused) {
        videoRef.current.pause();
      } else {
        videoRef.current.play().catch(e => console.error("Video play error:", e));
      }
    }
  }, [isPaused, viewingUserIdx, viewingStatusIdx]);

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

  useEffect(() => {
    if (currentStatus) {
      if (currentStatus.type !== "video") {
        setStatusDuration(5);
      } else if (videoRef.current && videoRef.current.readyState >= 1) {
        setStatusDuration(videoRef.current.duration);
      }
    }
  }, [currentStatus]);

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
      alert("Failed to publish status");
    }
  };

  const handleViewStatusGroup = (groupIdx: number) => {
    setViewingUserIdx(groupIdx);
    setViewingStatusIdx(0);
    setIsPaused(false);
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

  const closeViewer = () => {
    setViewingUserIdx(null);
    setIsPaused(false);
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
      <div className="px-5 py-4 shrink-0 mt-2 md:mt-0 border-b border-zinc-800/50 flex items-center justify-between z-10 bg-zinc-900/50 backdrop-blur-md">
        <h2 className="text-2xl font-display font-bold text-zinc-100 tracking-tight">Status</h2>
        <button 
          onClick={() => setIsModalOpen(true)}
          className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-full p-2 transition-all active:scale-95 shadow-lg shadow-indigo-500/20"
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
          />
        )}
        
        {currentStatus && currentGroup && (
          <motion.div
             initial={{ opacity: 0, scale: 0.95 }}
             animate={{ opacity: 1, scale: 1 }}
             exit={{ opacity: 0, scale: 0.95 }}
             className="fixed inset-0 z-50 bg-black flex flex-col touch-none select-none"
             onPointerDown={() => setIsPaused(true)}
             onPointerUp={() => setIsPaused(false)}
             onPointerLeave={() => setIsPaused(false)}
             onContextMenu={(e) => e.preventDefault()}
          >
             {/* Progress Bars */}
             <div className="absolute top-0 inset-x-0 w-full flex gap-1 p-2 pt-4 px-2 z-30 bg-gradient-to-b from-black/80 to-transparent pointer-events-none">
               {currentGroup.statuses.map((_, index) => (
                 <div key={index} className="h-1 flex-1 bg-white/30 rounded-full overflow-hidden">
                   <div 
                     className="h-full bg-white rounded-full origin-left"
                     style={{
                       width: index < viewingStatusIdx ? "100%" : (index === viewingStatusIdx ? "100%" : "0%"),
                       transition: index === viewingStatusIdx ? `width ${statusDuration}s linear` : 'none',
                       transitionPlayState: isPaused ? 'paused' : 'running',
                       animationPlayState: isPaused ? 'paused' : 'running'
                     }}
                     onTransitionEnd={() => {
                        if (index === viewingStatusIdx && !isPaused) {
                          handleNextStatus();
                        }
                     }}
                   />
                 </div>
               ))}
             </div>

             <div className="absolute top-6 inset-x-0 p-4 pt-6 flex items-center justify-between z-20 pointer-events-none">
                <div className="flex items-center gap-3 drop-shadow-md">
                   <img 
                      src={sanitizeUrl(currentGroup.userAvatar) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${currentGroup.userId}`} 
                      className="w-10 h-10 rounded-full border-2 border-white/20 object-cover" 
                   />
                   <div>
                     <h4 className="text-white font-bold">{currentGroup.userName}</h4>
                     <p className="text-white/80 text-xs shadow-black drop-shadow-md">
                        {(() => {
                          const date = new Date(currentStatus.createdAt);
                          return !isNaN(date.getTime()) 
                            ? formatDistanceToNow(date, { addSuffix: true, locale: ptBR }) 
                            : "Data inválida";
                        })()}
                     </p>
                   </div>
                </div>
                <div className="flex items-center gap-3 pointer-events-auto">
                   {currentStatus.type === "video" && (
                     <button onClick={(e) => { e.stopPropagation(); setIsMuted(!isMuted); }} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors">
                        {isMuted ? <VolumeX className="w-5 h-5" /> : <Volume2 className="w-5 h-5" />}
                     </button>
                   )}
                   <button onClick={(e) => { e.stopPropagation(); closeViewer(); }} className="p-2 rounded-full bg-black/40 hover:bg-black/60 text-white backdrop-blur-sm transition-colors">
                      <X className="w-5 h-5" />
                   </button>
                </div>
             </div>

             <motion.div 
               drag="x"
               dragConstraints={{ left: 0, right: 0 }}
               dragElastic={0.2}
               onDragEnd={(e, { offset, velocity }) => {
                 const swipe = offset.x;
                 if (swipe < -50) {
                   handleNextStatus();
                 } else if (swipe > 50) {
                   handlePrevStatus();
                 }
               }}
               className={`flex-1 flex items-center justify-center p-0 md:p-6 w-full h-full relative ${!currentStatus.url ? (currentStatus.bgColor || 'bg-zinc-800') : 'bg-black'}`}
             >
               {currentStatus.type === "image" && currentStatus.url && (
                 <TransformWrapper
                   initialScale={1}
                   minScale={1}
                   maxScale={4}
                   centerOnInit
                   wheel={{ activationKeys: ["Control"] }}
                   panning={{ disabled: false }}
                   doubleClick={{ step: 0.5 }}
                 >
                   <TransformComponent wrapperClass="w-full h-full" contentClass="w-full h-full flex items-center justify-center">
                     <img src={currentStatus.url} className="w-full h-full object-contain pointer-events-none" alt="Status" />
                   </TransformComponent>
                 </TransformWrapper>
               )}
               {currentStatus.type === "video" && currentStatus.url && (
                 <video 
                   ref={videoRef}
                   src={currentStatus.url} 
                   className="absolute inset-0 w-full h-full object-contain" 
                   autoPlay 
                   muted={isMuted} 
                   playsInline
                   onLoadedMetadata={(e) => {
                     if (e.currentTarget.duration) {
                       setStatusDuration(e.currentTarget.duration);
                     }
                   }}
                 />
               )}
               
               {/* Click areas for Next/Prev inside drag layer for tap detection */}
               <div className="absolute inset-y-0 left-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); handlePrevStatus(); }} />
               <div className="absolute inset-y-0 right-0 w-1/4 z-10" onClick={(e) => { e.stopPropagation(); handleNextStatus(); }} />

               {/* Always show overlay if there is text and media */}
               {currentStatus.url && currentStatus.text && (
                 <div className="absolute inset-x-0 bottom-0 top-2/3 bg-gradient-to-t from-black/90 to-transparent pointer-events-none" />
               )}

               {currentStatus.text && (
                  <p className={`relative z-10 pointer-events-none text-white font-bold text-center leading-tight max-w-3xl drop-shadow-[0_2px_4px_rgba(0,0,0,0.8)] ${currentStatus.url ? 'text-xl md:text-2xl mt-auto pb-12 px-6' : 'text-3xl md:text-5xl px-6'}`}>
                    {currentStatus.text}
                  </p>
               )}
             </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  );
}
