import { useState, useRef } from 'react';
import { uploadPropertyPhoto } from '../../lib/storage';

export default function PhotoUploader({ photos, onChange, onSetImage, isPro = false }) {
  const [uploadingIndex, setUploadingIndex] = useState(null);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [dragOverIndex, setDragOverIndex] = useState(null);
  const [error, setError] = useState(null);
  const fileInputRefs = useRef([]);

  const MAX_FREE_PHOTOS = 7;
  const currentPhotos = photos || ["", "", "", "", ""];
  const maxReached = !isPro && currentPhotos.length >= MAX_FREE_PHOTOS;

  const handleUpload = async (index, file) => {
    if (!file) return;
    
    setError(null);
    setUploadingIndex(index);
    setUploadProgress(0);
    
    const progressInterval = setInterval(() => {
      setUploadProgress(prev => {
        const next = prev + Math.floor(Math.random() * 10) + 5;
        return next >= 90 ? 90 : next;
      });
    }, 300);

    try {
      const url = await uploadPropertyPhoto(file);
      clearInterval(progressInterval);
      setUploadProgress(100);
      
      setTimeout(() => {
        const newPhotos = [...(photos || ["", "", "", "", ""])];
        newPhotos[index] = url;
        onChange(newPhotos);
        if (index === 0 && onSetImage) {
          onSetImage(url); // First photo is the primary image
        }
        setUploadingIndex(null);
        setUploadProgress(0);
      }, 500);
    } catch (err) {
      clearInterval(progressInterval);
      console.error("Photo upload failed:", err);
      setError(err.message);
      setUploadingIndex(null);
      setUploadProgress(0);
    }
  };

  const handleRemove = (index) => {
    const newPhotos = (photos || ["", "", "", "", ""]).filter((_, i) => i !== index);
    onChange(newPhotos);
    if (index === 0 && onSetImage) {
      onSetImage(newPhotos[0] || "");
    }
  };

  const onDragOver = (e, index) => {
    e.preventDefault();
    setDragOverIndex(index);
  };
  
  const onDragLeave = (e) => {
    e.preventDefault();
    setDragOverIndex(null);
  };

  const onDrop = (e, index) => {
    e.preventDefault();
    setDragOverIndex(null);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleUpload(index, e.dataTransfer.files[0]);
    }
  };

  const currentPhotos = photos || ["", "", "", "", ""];

  return (
    <div id="field-photos" className="flex flex-col gap-3 w-full">
      {error && <div className="text-error text-[10px] font-mono bg-error/10 border border-error/20 p-2 rounded uppercase tracking-wider">{error}</div>}
      
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {currentPhotos.map((photoUrl, index) => (
          <div 
            key={index} 
            className={`relative aspect-video bg-surface-alt border rounded overflow-hidden group flex flex-col items-center justify-center cursor-pointer transition-all duration-300 ${
              dragOverIndex === index 
                ? 'border-gold-accent border-2 bg-gold-accent/5 scale-[1.02] shadow-[0_0_15px_rgba(232,174,60,0.2)] z-10' 
                : 'border-surface-variant hover:border-gold-accent/50'
            }`}
            onClick={() => {
              if (uploadingIndex === null) {
                fileInputRefs.current[index]?.click();
              }
            }}
            onDragOver={(e) => onDragOver(e, index)}
            onDragLeave={onDragLeave}
            onDrop={(e) => onDrop(e, index)}
          >
            <input 
              type="file" 
              accept="image/jpeg, image/png"
              className="hidden"
              ref={el => fileInputRefs.current[index] = el}
              onChange={(e) => {
                if (e.target.files && e.target.files[0]) {
                  handleUpload(index, e.target.files[0]);
                }
                // Reset value so same file can be uploaded again if needed
                e.target.value = '';
              }}
            />
            
            {uploadingIndex === index ? (
              <div className="flex flex-col items-center justify-center h-full w-full bg-background/80 backdrop-blur-sm text-gold-accent z-20">
                <div className="relative w-10 h-10 flex items-center justify-center mb-3">
                  <svg className="animate-spin absolute inset-0 w-full h-full opacity-20" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2"></circle>
                  </svg>
                  <svg className="animate-spin absolute inset-0 w-full h-full" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <path fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  <span className="absolute text-[9px] font-mono font-bold">{uploadProgress}%</span>
                </div>
                <div className="w-2/3 bg-surface-variant rounded-full h-1 mb-2 overflow-hidden">
                  <div className="bg-gold-accent h-1 rounded-full transition-all duration-300 ease-out" style={{ width: `${uploadProgress}%` }}></div>
                </div>
                <span className="text-[9px] uppercase tracking-widest font-mono animate-pulse">Uploading...</span>
              </div>
            ) : photoUrl && typeof photoUrl === 'string' && photoUrl.trim() !== "" ? (
              <>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={photoUrl} alt={`Property view ${index + 1}`} className="object-cover w-full h-full" />
                <div className="absolute inset-0 bg-background/80 opacity-0 group-hover:opacity-100 transition-opacity flex flex-col items-center justify-center gap-2">
                  <span className="text-white text-[10px] font-mono bg-black/50 px-2 py-1 rounded backdrop-blur border border-white/20">CLICK TO REPLACE</span>
                  <button 
                    className="text-white text-[10px] font-mono bg-error/80 hover:bg-error px-2 py-1 rounded backdrop-blur border border-white/20 transition-colors"
                    onClick={(e) => {
                      e.stopPropagation();
                      const newPhotos = [...currentPhotos];
                      newPhotos[index] = ""; // Clear content, keep slot
                      onChange(newPhotos);
                      if (index === 0 && onSetImage) onSetImage("");
                    }}
                  >
                    CLEAR SLOT
                  </button>
                </div>
                {currentPhotos.length > 5 && (
                  <button 
                    className="absolute top-2 right-2 bg-error text-white rounded-full w-5 h-5 flex items-center justify-center shadow hover:scale-110 transition-transform z-10 text-xs"
                    onClick={(e) => { e.stopPropagation(); handleRemove(index); }}
                    title="Remove Photo Slot"
                  >
                    ✕
                  </button>
                )}
                {index === 0 && (
                  <div className="absolute bottom-2 left-2 bg-gold-accent text-background text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider shadow">
                    Primary
                  </div>
                )}
              </>
            ) : (
              <div className="flex flex-col items-center justify-center w-full h-full p-2 group-hover:text-gold-accent transition-colors">
                <div className="flex flex-col items-center justify-center flex-1 transition-transform group-hover:-translate-y-1">
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="mb-2">
                    <rect x="3" y="3" width="18" height="18" rx="2" ry="2"/>
                    <circle cx="8.5" cy="8.5" r="1.5"/>
                    <polyline points="21 15 16 10 5 21"/>
                  </svg>
                  <span className="text-[10px] uppercase tracking-widest font-mono text-center px-2">
                    {index === 0 ? "Upload Primary" : "Upload Photo"}
                  </span>
                </div>
              </div>
            )}
          </div>
        ))}
      </div>
      
      {maxReached ? (
        <button 
          className="mt-2 py-3 bg-gradient-to-r from-gold-accent to-[#F7C64E] text-background hover:scale-[1.01] rounded text-xs font-bold tracking-widest uppercase transition-transform shadow-lg"
          onClick={() => alert("Upgrade to PRO to unlock more photo slots!")}
        >
          🔒 UPGRADE TO PRO FOR MORE PHOTOS
        </button>
      ) : (
        <button 
          className="mt-2 py-2 border border-dashed border-gold-accent/50 text-gold-accent hover:bg-gold-accent/10 rounded text-sm font-label-caps tracking-widest uppercase transition-colors"
          onClick={() => onChange([...currentPhotos, ""])}
        >
          + Add Another Slot
        </button>
      )}
    </div>
  );
}
