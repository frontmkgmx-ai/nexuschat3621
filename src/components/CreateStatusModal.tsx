import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "motion/react";
import { X, Image as ImageIcon, Video, Type, Palette, Upload, Crop } from "lucide-react";
import { uploadFileToBucket } from "../services/fileApi";
import Cropper from 'react-easy-crop';
import { getCroppedImg } from "../lib/cropImage";

interface CreateStatusModalProps {
  onClose: () => void;
  onPublish: (data: any) => void;
}

const COLORS = [
  "bg-indigo-600",
  "bg-rose-500",
  "bg-emerald-500",
  "bg-amber-500",
  "bg-fuchsia-600",
  "bg-sky-500",
  "bg-zinc-800"
];

export default function CreateStatusModal({ onClose, onPublish }: CreateStatusModalProps) {
  const [text, setText] = useState("");
  const [bgColor, setBgColor] = useState(COLORS[0]);
  const [mediaFile, setMediaFile] = useState<File | null>(null);
  const [mediaPreview, setMediaPreview] = useState<string | null>(null);
  const [mediaType, setMediaType] = useState<"image" | "video" | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cropper states
  const [isMobile, setIsMobile] = useState(false);
  const [showCropper, setShowCropper] = useState(false);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  useEffect(() => {
    const checkMobile = () => setIsMobile(window.innerWidth < 768);
    checkMobile();
    window.addEventListener("resize", checkMobile);
    return () => window.removeEventListener("resize", checkMobile);
  }, []);

  const onCropComplete = useCallback((croppedArea: any, croppedAreaPixels: any) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleApplyCrop = async () => {
    if (mediaPreview && croppedAreaPixels) {
      try {
        const croppedFile = await getCroppedImg(mediaPreview, croppedAreaPixels);
        if (croppedFile) {
          setMediaFile(croppedFile);
          setMediaPreview(URL.createObjectURL(croppedFile));
          setShowCropper(false);
        }
      } catch (e) {
        console.error(e);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (file.type.startsWith("image/")) {
      setMediaType("image");
      if (isMobile) {
        // We defer preview setup slightly to open cropper
        setMediaPreview(URL.createObjectURL(file));
        setShowCropper(true);
      } else {
        setMediaFile(file);
        setMediaPreview(URL.createObjectURL(file));
      }
    } else if (file.type.startsWith("video/")) {
      setMediaType("video");
      setMediaFile(file);
      setMediaPreview(URL.createObjectURL(file));
    } else {
      alert("Formato não suportado");
      return;
    }
  };

  const handlePublishClick = async () => {
    if (mediaFile) {
      setIsUploading(true);
      try {
        const response = await uploadFileToBucket({ file: mediaFile, onProgress: (progress) => {
          setUploadProgress(progress);
        }});
        const publicUrl = response.file.url;
        onPublish({ type: mediaType, url: publicUrl, text, bgColor });
      } catch (err: any) {
        alert(err.message || "Erro ao fazer upload da mídia");
      } finally {
        setIsUploading(false);
      }
    } else {
      onPublish({ type: "text", text, bgColor });
    }
  };

  if (showCropper && mediaPreview) {
    return (
       <div className="fixed inset-0 z-50 bg-black flex flex-col pt-16">
         <div className="absolute top-0 inset-x-0 p-4 flex justify-between items-center z-50 bg-black/50 backdrop-blur-md">
           <button onClick={() => { setShowCropper(false); setMediaFile(null); setMediaPreview(null); }} className="text-white p-2">
             <X className="w-6 h-6" />
           </button>
           <h3 className="text-white font-bold text-lg">Cortar Imagem</h3>
           <button onClick={handleApplyCrop} className="bg-indigo-600 text-white font-bold py-1.5 px-4 rounded-full text-sm">
             Aplicar
           </button>
         </div>
         <div className="flex-1 relative">
           <Cropper
             image={mediaPreview}
             crop={crop}
             zoom={zoom}
             aspect={9 / 16}
             onCropChange={setCrop}
             onCropComplete={onCropComplete}
             onZoomChange={setZoom}
             classes={{ containerClassName: "bg-black" }}
           />
         </div>
       </div>
    );
  }

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/90 z-40 flex items-center justify-center md:p-4 backdrop-blur-md"
        onClick={onClose}
      >
        <motion.div
          initial={{ scale: 0.9, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.95, opacity: 0, y: 10 }}
          className="bg-zinc-900 w-full h-[100dvh] md:h-[85vh] md:max-w-5xl md:border md:border-zinc-800 md:rounded-3xl shadow-2xl flex flex-col md:flex-row overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header Mobile / Close Desktop */}
          <div className="absolute top-4 left-4 right-4 flex justify-between items-center z-20 md:hidden pointer-events-none">
            <h3 className="text-xl font-bold text-zinc-100 font-display tracking-tight drop-shadow-md pointer-events-auto">Criar Status</h3>
            <button onClick={onClose} className="p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition pointer-events-auto">
              <X className="w-5 h-5" />
            </button>
          </div>
          
          <button onClick={onClose} className="hidden md:flex absolute top-4 left-4 p-2 bg-black/50 backdrop-blur-md rounded-full text-white hover:bg-black/70 transition z-20">
            <X className="w-5 h-5" />
          </button>

          {/* Left Side: Preview Area */}
          <div className="flex-1 bg-black relative flex items-center justify-center p-0 md:p-8 overflow-hidden">
            <div className={`relative w-full h-full md:h-auto md:max-h-full md:aspect-[9/16] md:rounded-2xl flex flex-col items-center justify-center transition-colors duration-500 overflow-hidden shadow-2xl ${!mediaPreview ? bgColor : 'bg-black'}`}>
              
              {mediaPreview ? (
                <>
                  {mediaType === "image" ? (
                    <img src={mediaPreview} alt="Preview" className="absolute inset-0 w-full h-full object-contain" />
                  ) : (
                    <video src={mediaPreview} className="absolute inset-0 w-full h-full object-contain" controls autoPlay muted loop playsInline />
                  )}
                  {/* Overlay shadow for text visibility */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent pointer-events-none" />
                </>
              ) : null}

              <textarea
                className={`w-full bg-transparent text-center placeholder-white/60 font-bold text-2xl resize-none outline-none focus:ring-0 relative z-10 p-6 ${mediaPreview ? 'text-white absolute bottom-[10%] md:bottom-[5%] shadow-black drop-shadow-lg' : 'text-white'}`}
                placeholder={mediaPreview ? "Adicione uma legenda..." : "No que está pensando?"}
                rows={mediaPreview ? 2 : 5}
                value={text}
                onChange={(e) => setText(e.target.value)}
                maxLength={150}
              />
              
              {!mediaPreview && (
                 <div className="absolute bottom-6 md:bottom-4 right-6 md:right-4 text-white/50 text-sm font-mono">{text.length}/150</div>
              )}

              {mediaPreview && (
                <div className="absolute top-20 md:top-4 right-4 flex flex-col gap-3 z-30">
                  <button 
                    onClick={() => {
                      setMediaFile(null);
                      setMediaPreview(null);
                      setMediaType(null);
                      if (fileInputRef.current) fileInputRef.current.value = "";
                    }}
                    className="p-3 md:p-2 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors border border-white/10"
                    title="Remover mídia"
                  >
                    <X className="w-5 h-5 md:w-4 md:h-4" />
                  </button>
                  {mediaType === "image" && isMobile && (
                    <button 
                      onClick={() => setShowCropper(true)}
                      className="p-3 md:p-2 bg-black/60 hover:bg-black/80 rounded-full text-white backdrop-blur-md transition-colors border border-white/10"
                      title="Cortar imagem"
                    >
                      <Crop className="w-5 h-5 md:w-4 md:h-4" />
                    </button>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Right Side / Bottom: Controls Area */}
          <div className="w-full md:w-[380px] bg-zinc-900 border-t md:border-t-0 md:border-l border-zinc-800 p-6 flex flex-col shrink-0 z-20 rounded-t-3xl md:rounded-none -mt-6 md:mt-0 relative">
            <h3 className="hidden md:block text-xl font-bold text-zinc-100 font-display tracking-tight mb-8">Opções do Status</h3>
            
            <div className="flex-1 space-y-8">
              <div>
                <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 block">Mídia</label>
                <div className="flex gap-4 items-center">
                  <button 
                    onClick={() => fileInputRef.current?.click()}
                    className="flex-1 h-14 rounded-xl bg-zinc-800 border border-zinc-700 flex items-center justify-center text-zinc-300 hover:text-white transition hover:bg-zinc-700 focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <div className="flex flex-col items-center gap-1">
                      <ImageIcon className="w-5 h-5" />
                      <span className="text-[10px] uppercase font-bold tracking-wider">Galeria</span>
                    </div>
                    <input 
                      type="file" 
                      className="hidden" 
                      ref={fileInputRef} 
                      accept="image/*,video/*"
                      onChange={handleFileChange}
                    />
                  </button>
                </div>
              </div>

              {!mediaPreview && (
                <div>
                  <label className="text-xs font-bold text-zinc-400 uppercase tracking-wider mb-4 block">Fundo</label>
                  <div className="flex flex-wrap gap-3">
                    {COLORS.slice(0, 6).map(color => (
                      <button 
                        key={color} 
                        onClick={() => setBgColor(color)}
                        className={`w-10 h-10 rounded-full ${color} border-2 transition-transform shadow-inner ${bgColor === color ? 'border-white scale-110 shadow-[0_0_15px_rgba(255,255,255,0.3)]' : 'border-zinc-800 hover:scale-105'}`}
                      />
                    ))}
                    <button 
                      onClick={() => setBgColor(COLORS[Math.floor(Math.random() * COLORS.length)])}
                      className="w-10 h-10 rounded-full bg-zinc-800 border bg-zinc-700/50 flex items-center justify-center text-zinc-400 hover:text-white transition hover:bg-zinc-700"
                    >
                      <Palette className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              )}
            </div>

            <div className="mt-6 pt-6 border-t border-zinc-800">
              {isUploading ? (
                <div className="w-full bg-zinc-800 rounded-xl overflow-hidden h-14 flex relative">
                   <div className="absolute inset-y-0 left-0 bg-indigo-600 transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }} />
                   <div className="absolute inset-0 flex items-center justify-center text-white text-sm font-bold tracking-wide shadow-sm">
                     Enviando {uploadProgress}%
                   </div>
                </div>
              ) : (
                <button 
                  disabled={!text.trim() && !mediaFile}
                  className="w-full bg-white text-black font-bold py-4 rounded-xl transition-all disabled:opacity-50 hover:bg-zinc-200 active:scale-95 shadow-[0_0_20px_rgba(255,255,255,0.1)] flex items-center justify-center gap-2 text-sm tracking-wide uppercase disabled:hover:scale-100 disabled:cursor-not-allowed"
                  onClick={handlePublishClick}
                >
                  <Upload className="w-4 h-4" />
                  Publicar Status
                </button>
              )}
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}

