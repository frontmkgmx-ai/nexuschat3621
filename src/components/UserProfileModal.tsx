import React, { useState, useEffect } from 'react';
import { X, MessageCircle, Mail, Phone, Calendar, ShieldCheck, Gamepad2, Monitor, Trophy } from 'lucide-react';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '../lib/firebase';
import { sanitizeUrl } from '../services/fileApi';
import { format } from 'date-fns';

export default function UserProfileModal({ userId, onClose, currentUserId }: { userId: string, onClose: () => void, currentUserId: string }) {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUser = async () => {
      try {
        const docRef = doc(db, 'users', userId);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setUser(docSnap.data());
        }
      } catch (e) {
        console.error(e);
      } finally {
        setLoading(false);
      }
    };
    fetchUser();
  }, [userId]);

  if (loading) {
     return (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="animate-spin w-10 h-10 border-4 border-indigo-500 border-t-transparent rounded-full"></div>
       </div>
     );
  }

  if (!user) {
    return (
       <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={onClose}>
          <div className="bg-[#111214] p-6 rounded-2xl border border-zinc-800 text-white max-w-sm w-full text-center">
             <h3 className="text-lg font-bold mb-2">Usuário não encontrado</h3>
             <p className="text-zinc-400 mb-6 text-sm">Este usuário não existe mais ou os dados são privados.</p>
             <button onClick={onClose} className="bg-zinc-800 hover:bg-zinc-700 py-2 px-6 rounded-xl transition-colors font-medium text-sm text-white">Fechar</button>
          </div>
       </div>
    );
  }

  const avatar = sanitizeUrl(user.avatarUrl) || `https://api.dicebear.com/7.x/pixel-art/svg?seed=${user._id}`;
  const banner = sanitizeUrl(user.bannerUrl) || `https://images.unsplash.com/photo-1534972195531-d756b9bfa9f2?w=800&q=80`;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-sm">
      <div className="absolute inset-0 z-0" onClick={onClose}></div>
      <div className="bg-[#1e1f22] w-full max-w-2xl rounded-3xl overflow-hidden shadow-2xl border border-[#2B2D31] relative z-10 flex flex-col max-h-[90vh]">
         {/* Banner */}
         <div className="h-32 sm:h-48 relative shrink-0">
             <div className="absolute top-4 right-4 z-10">
                 <button onClick={onClose} className="p-2 bg-black/40 hover:bg-black/60 rounded-full backdrop-blur-md transition-colors text-white">
                    <X className="w-5 h-5" />
                 </button>
             </div>
             <img src={banner} alt="Banner" className="w-full h-full object-cover" />
             <div className="absolute inset-0 bg-gradient-to-t from-[#1e1f22] to-transparent"></div>
         </div>

         <div className="px-6 pb-6 pt-0 relative flex-1 overflow-y-auto custom-scrollbar">
             <div className="flex justify-between items-end -mt-16 sm:-mt-20 mb-4 relative z-10">
                 <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-3xl border-4 border-[#1e1f22] overflow-hidden bg-zinc-900 shadow-xl">
                    <img src={avatar} alt="Avatar" className="w-full h-full object-cover" />
                 </div>
                 {user._id !== currentUserId && (
                   <button className="bg-indigo-500 hover:bg-indigo-600 text-white p-3 rounded-2xl shadow-lg transition-transform hover:scale-105" title="Enviar Mensagem">
                      <MessageCircle className="w-5 h-5" />
                   </button>
                 )}
             </div>

             <div className="bg-[#111214] rounded-2xl p-5 border border-[#2B2D31] mb-6 shadow-inner">
                <div className="flex items-center gap-2 mb-1">
                   <h2 className="text-2xl font-bold text-white">{user.username}</h2>
                   {(user.settings?.twoFactorAuth || user._id === currentUserId) && (
                       <ShieldCheck className="w-5 h-5 text-indigo-400" title="Conta Verificada" />
                   )}
                </div>
                <p className="text-zinc-400 text-sm font-medium">{user.status || "Nenhum status no momento."}</p>
                
                <div className="flex flex-wrap gap-4 mt-6">
                   <div className="flex items-center gap-2 text-sm text-zinc-300">
                      <Calendar className="w-4 h-4 text-zinc-500" />
                      Membro desde {user.createdAt ? format(new Date(user.createdAt), "MMMM 'de' yyyy") : "Há algum tempo"}
                   </div>
                </div>
             </div>

             <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                 <div className="bg-[#111214] rounded-2xl p-5 border border-[#2B2D31]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Sobre mim</h3>
                    <p className="text-sm text-zinc-300 leading-relaxed">
                       {user.bio || "Este usuário prefere manter o mistério."}
                    </p>
                 </div>

                 <div className="bg-[#111214] rounded-2xl p-5 border border-[#2B2D31]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Conexões</h3>
                    <div className="space-y-3">
                        <div className="flex items-center gap-3 p-3 bg-[#1e1f22] rounded-xl border border-[#2B2D31]">
                            <Gamepad2 className="w-5 h-5 text-emerald-400" />
                            <span className="text-sm text-zinc-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Discord Não Vinculado</span>
                        </div>
                        <div className="flex items-center gap-3 p-3 bg-[#1e1f22] rounded-xl border border-[#2B2D31]">
                            <Monitor className="w-5 h-5 text-orange-400" />
                            <span className="text-sm text-zinc-200 font-medium whitespace-nowrap overflow-hidden text-ellipsis">Steam Não Vinculada</span>
                        </div>
                    </div>
                 </div>
             </div>
             
             {user.settings?.showContactInfo && (
                <div className="mt-4 bg-[#111214] rounded-2xl p-5 border border-[#2B2D31]">
                    <h3 className="text-xs font-bold uppercase tracking-widest text-zinc-500 mb-4">Informação de Contato</h3>
                    <div className="space-y-3">
                        {user.email && (
                            <div className="flex items-center gap-3 p-3 bg-[#1e1f22] rounded-xl border border-[#2B2D31]">
                                <Mail className="w-5 h-5 text-zinc-400" />
                                <span className="text-sm text-zinc-200 font-medium select-all">{user.email}</span>
                            </div>
                        )}
                        {user.phoneNumber && (
                           <div className="flex items-center gap-3 p-3 bg-[#1e1f22] rounded-xl border border-[#2B2D31]">
                               <Phone className="w-5 h-5 text-zinc-400" />
                               <span className="text-sm text-zinc-200 font-medium select-all">{user.phoneNumber}</span>
                           </div>
                        )}
                    </div>
                </div>
             )}
         </div>
      </div>
    </div>
  );
}
