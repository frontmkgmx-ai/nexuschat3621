import React, { useState, useEffect } from 'react';
import { ExternalLink } from 'lucide-react';

export default function LinkPreviewCard({ url }: { url: string }) {
  const [preview, setPreview] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    (async () => {
      try {
        setLoading(true);
        // Using a free public API for link previews (microlink)
        const res = await fetch(`https://api.microlink.io/?url=${encodeURIComponent(url)}`);
        const data = await res.json();
        
        if (isMounted && data.status === 'success') {
          setPreview({
            title: data.data.title,
            description: data.data.description,
            image: data.data.image?.url,
            domain: data.data.publisher || new URL(url).hostname
          });
        }
      } catch (err) {
        console.error('Link preview failed', err);
      } finally {
        if (isMounted) setLoading(false);
      }
    })();
    return () => { isMounted = false; };
  }, [url]);

  if (loading) return null;
  if (!preview?.title) return null;

  return (
    <a href={url} target="_blank" rel="noreferrer" className="flex flex-col mt-2 max-w-xs sm:max-w-sm rounded-[12px] overflow-hidden bg-black/20 hover:bg-black/30 border border-white/10 transition-colors pointer-events-auto">
      {preview.image && (
        <div className="w-full h-32 overflow-hidden bg-black/20">
          <img src={preview.image} alt={preview.title} className="w-full h-full object-cover" />
        </div>
      )}
      <div className="p-3">
        <h3 className="text-[13px] font-semibold text-white/90 line-clamp-1 mb-1 leading-tight">{preview.title}</h3>
        <p className="text-[11px] text-white/50 line-clamp-2 leading-snug mb-1">{preview.description}</p>
        <span className="text-[10px] uppercase tracking-wider text-indigo-400 font-semibold flex items-center gap-1">
          <ExternalLink className="w-3 h-3" /> {preview.domain}
        </span>
      </div>
    </a>
  );
}
