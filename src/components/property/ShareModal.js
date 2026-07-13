import React, { useState } from 'react';
import { Share2, Copy, Check, Globe, MessageSquare, Mail, X } from 'lucide-react';

export default function ShareModal({ isOpen, onClose, shareText, propertyUrl }) {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareText);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const encodedUrl = encodeURIComponent(propertyUrl || (typeof window !== 'undefined' ? window.location.href : ''));
  const encodedText = encodeURIComponent(shareText);
  const encodedTitle = encodeURIComponent("ScoutIt Market Intelligence Briefing");

  const socialLinks = [
    {
      name: 'Facebook',
      icon: <Globe size={18} />,
      url: `https://www.facebook.com/sharer/sharer.php?u=${encodedUrl}`,
      color: 'hover:text-blue-500'
    },
    {
      name: 'LinkedIn',
      icon: <Globe size={18} />,
      url: `https://www.linkedin.com/sharing/share-offsite/?url=${encodedUrl}`,
      color: 'hover:text-blue-400'
    },
    {
      name: 'X',
      icon: <MessageSquare size={18} />,
      url: `https://twitter.com/intent/tweet?text=${encodedText}&url=${encodedUrl}`,
      color: 'hover:text-gray-300'
    },
    {
      name: 'Email',
      icon: <Mail size={18} />,
      url: `mailto:?subject=${encodedTitle}&body=${encodedText}`,
      color: 'hover:text-[#E8AE3C]'
    }
  ];

  return (
    <div className="fixed inset-0 z-[9999] flex items-end sm:items-center justify-center p-4 sm:p-0 pointer-events-none">
      {/* Backdrop */}
      <div 
        className="absolute inset-0 bg-black/60 backdrop-blur-sm pointer-events-auto transition-opacity"
        onClick={onClose}
      />

      {/* Modal */}
      <div 
        className="relative w-full max-w-md bg-[#0a0a0a] border border-[#E8AE3C]/20 sm:rounded-xl rounded-t-2xl shadow-2xl pointer-events-auto transform transition-transform duration-300 ease-out-quint translate-y-0 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        
        {/* Header */}
        <div className="flex items-center justify-between p-5 border-b border-white/5">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-full bg-[#E8AE3C]/10 flex items-center justify-center text-[#E8AE3C]">
              <Share2 size={16} strokeWidth={2} />
            </div>
            <h3 className="text-lg font-serif text-white">Share Briefing</h3>
          </div>
          <button 
            onClick={onClose}
            aria-label="Close share modal"
            className="w-8 h-8 flex items-center justify-center rounded-full text-white/50 hover:text-white hover:bg-white/5 transition-colors"
          >
            <X size={18} />
          </button>
        </div>

        {/* Content */}
        <div className="p-5">
          <p className="text-sm text-white/60 mb-4">
            Share this property's market intelligence with your network or clients.
          </p>

          {/* Social Links */}
          <div className="grid grid-cols-4 gap-3 mb-6">
            {socialLinks.map((social) => (
              <a
                key={social.name}
                href={social.url}
                target="_blank"
                rel="noopener noreferrer"
                className={`flex flex-col items-center justify-center gap-2 py-3 rounded-lg bg-white/5 border border-white/5 text-white/70 transition-all hover:bg-white/10 ${social.color}`}
              >
                {social.icon}
                <span className="text-[10px] uppercase tracking-wider font-medium">{social.name}</span>
              </a>
            ))}
          </div>

          <div className="relative">
            <div className="absolute -top-3 left-3 px-2 bg-[#0a0a0a] text-[10px] uppercase tracking-wider text-[#E8AE3C] font-mono">
              Raw Briefing Text
            </div>
            <textarea 
              readOnly 
              className="w-full h-28 bg-[#121212] border border-white/10 rounded-lg p-4 pt-5 text-[13px] text-white/80 font-mono resize-none focus:outline-none focus:border-[#E8AE3C]/50 transition-colors custom-scrollbar"
              value={shareText || ''}
            />
          </div>
        </div>

        {/* Footer */}
        <div className="p-5 pt-0">
          <button 
            onClick={handleCopy}
            className={`w-full flex items-center justify-center gap-2 py-3 rounded-lg font-medium text-sm transition-all duration-300 ${
              copied 
                ? 'bg-green-500/10 text-green-400 border border-green-500/20'
                : 'bg-[#E8AE3C] text-black hover:bg-[#F7C64E]'
            }`}
          >
            {copied ? (
              <>
                <Check size={16} strokeWidth={3} />
                <span>Copied to Clipboard</span>
              </>
            ) : (
              <>
                <Copy size={16} />
                <span>Copy Raw Text</span>
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}
