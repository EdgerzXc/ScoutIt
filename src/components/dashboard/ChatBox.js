import { useState, useEffect, useRef } from "react";
import BookingModal from "./BookingModal";
import { uploadAttachment } from "../../lib/storage";

// Safe Link Parser to prevent XSS
const renderTextWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      return (
        <a 
          key={index} 
          href={part} 
          target="_blank" 
          rel="noopener noreferrer" 
          className="text-gold-accent underline hover:text-[#F7C64E] break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

export default function ChatBox({ deal, onCloseDeal }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  
  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  useEffect(() => {
    // In a real app, fetch from /api/deals/[deal.id]/messages
    setMessages([
      { 
        id: 1, 
        sender: 'buyer', 
        body: 'Hi, I am interested in viewing this property. Are there any available schedules this week?', 
        timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString(),
        attachments: []
      },
    ]);
  }, [deal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isUploading]);

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || deal.status === 'closed') return;

    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMessages([
      ...messages,
      { id: Date.now(), sender: 'me', body: input, timestamp: new Date().toISOString(), attachments: [] }
    ]);
    
    setInput("");
    setIsSubmitting(false);
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const attachment = await uploadAttachment(deal.id, file);
      
      // Immediately add the attachment to messages
      setMessages(prev => [
        ...prev,
        { 
          id: Date.now(), 
          sender: 'me', 
          body: `Attached: ${file.name}`, 
          timestamp: new Date().toISOString(),
          attachments: [attachment]
        }
      ]);
    } catch (err) {
      setUploadError(err.message);
      // Auto-hide error after 5s
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
    // reset input
    e.target.value = null;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (deal.status !== 'closed') setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (deal.status !== 'closed' && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  const handleEndConversation = async () => {
    onCloseDeal(deal.id);
    setShowConfirmClose(false);
  };

  const daysLeft = deal.expires_at ? Math.ceil((new Date(deal.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 14;

  const renderAttachment = (att) => {
    if (att.type.startsWith('image/')) {
      return (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          <img src={att.url} alt={att.name} className="max-w-[200px] max-h-[200px] rounded object-cover border border-white/10 hover:opacity-90 transition-opacity" />
        </a>
      );
    }
    if (att.type.startsWith('video/')) {
      return (
        <video src={att.url} controls className="max-w-[250px] max-h-[250px] rounded mt-2 border border-white/10" />
      );
    }
    if (att.type === 'application/pdf') {
      return (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded border border-white/10 hover:bg-black/40 transition-colors">
          <span className="text-error text-xl">📄</span>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs truncate font-working-title">{att.name}</span>
            <span className="text-[10px] text-text-muted">{(att.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </a>
      );
    }
    return null;
  };

  return (
    <div 
      className="flex flex-col h-full relative"
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >
      
      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm border-2 border-dashed border-gold-accent flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-gold-accent text-4xl mb-2">☁️</div>
            <h3 className="font-headline-editorial text-xl text-gold-accent">Drop file to attach</h3>
            <p className="text-xs text-text-secondary">PDFs, Images, or Videos up to 50MB</p>
          </div>
        </div>
      )}

      {/* Chat Header */}
      <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-[#121212]/80 backdrop-blur-md sticky top-0 z-10">
        <div>
          <h3 className="font-working-title text-md text-on-surface">
            {deal.other_party}
          </h3>
          <p className="text-xs text-text-secondary">
            Inquiry for <strong>{deal.property_title}</strong>
          </p>
        </div>
        {deal.status !== 'closed' && (
          <div className="flex gap-2">
            <button 
              onClick={() => setShowBookingModal(true)}
              className="bg-gold-accent text-background px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest hover:bg-[#F7C64E] transition-colors shadow-[0_0_10px_rgba(232,174,60,0.2)]"
            >
              Request Live Viewing
            </button>
            <button 
              onClick={() => setShowConfirmClose(true)}
              className="border border-error/50 text-error px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest hover:bg-error/10 transition-colors"
            >
              End Conversation
            </button>
          </div>
        )}
      </div>

      {/* Required Legal Disclaimer */}
      <div className="bg-surface-variant/30 border-b border-surface-variant p-3 text-center">
        <p className="text-xs text-text-muted font-mono">
          <span className="text-gold-accent mr-2">⚠️</span>
          This conversation is temporary and will be deleted when closed. ScoutIt is not a party to any agreement made here.
        </p>
      </div>

      {/* Warnings & Banners */}
      {deal.status === 'closed' ? (
        <div className="bg-error/10 text-error p-3 text-center text-xs font-mono tracking-widest uppercase border-b border-error/20">
          This conversation is closed and archived for 7 days.
        </div>
      ) : (
        <div className="bg-surface-container-low p-2 text-center text-[10px] uppercase font-mono tracking-widest text-text-secondary border-b border-surface-variant">
          Chat auto-closes in {daysLeft} days or after 72 hours of inactivity.
        </div>
      )}

      {/* Upload Error Banner */}
      {uploadError && (
        <div className="bg-error/20 border-l-4 border-error p-3 text-xs text-error animate-[fadeIn_0.3s_ease]">
          <strong>Error:</strong> {uploadError}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0d0d0d] to-[#121212]">
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'} animate-[fadeIn_0.3s_ease]`}>
              <div 
                className={`max-w-[85%] p-3.5 rounded-xl text-sm shadow-sm ${
                  isMe 
                    ? 'bg-gold-accent/90 text-background rounded-tr-sm' 
                    : 'bg-surface-variant/80 backdrop-blur-md text-on-surface rounded-tl-sm border border-white/5'
                }`}
              >
                {renderTextWithLinks(msg.body)}
                
                {/* Render Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {msg.attachments.map((att, i) => <div key={i}>{renderAttachment(att)}</div>)}
                  </div>
                )}
              </div>
              <span className="text-[10px] text-text-muted mt-1 px-1 font-mono uppercase">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}

        {isUploading && (
          <div className="flex flex-col items-end animate-[fadeIn_0.3s_ease]">
            <div className="max-w-[75%] p-3.5 rounded-xl text-sm bg-surface-variant/50 text-text-secondary rounded-tr-sm border border-white/5 flex items-center gap-2">
              <span className="animate-pulse">Uploading file...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="p-4 border-t border-surface-variant bg-[#121212]/90 backdrop-blur-md relative">
        <form onSubmit={handleSend} className="flex gap-2 items-center">
          
          <input 
            type="file" 
            ref={fileInputRef} 
            onChange={onFileChange} 
            className="hidden" 
            accept="image/jpeg,image/png,application/pdf,video/mp4" 
          />
          
          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={deal.status === 'closed' || isUploading}
            className="p-2.5 rounded-full text-text-secondary hover:text-gold-accent hover:bg-gold-accent/10 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Attach file (Max 10MB Doc/Img, 50MB Video)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>

          <input
            type="text"
            className="flex-1 bg-surface border border-surface-variant rounded-full px-5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent/50 disabled:opacity-50 transition-colors"
            placeholder={deal.status === 'closed' ? "This chat is closed." : "Type your message or drag a file here..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={deal.status === 'closed' || isSubmitting}
          />

          <button
            type="submit"
            disabled={deal.status === 'closed' || isSubmitting || (!input.trim() && !isUploading)}
            className="bg-gold-accent text-background px-6 py-2.5 rounded-full text-sm font-working-title disabled:opacity-50 hover:bg-[#F7C64E] transition-colors shadow-[0_4px_10px_rgba(232,174,60,0.1)]"
          >
            {isSubmitting ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* End Conversation Modal */}
      {showConfirmClose && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-[#121212] border border-surface-variant rounded-lg p-6 max-w-sm w-full shadow-2xl">
            <h3 className="font-working-title text-lg text-error mb-2">End Conversation?</h3>
            <p className="text-sm text-text-secondary mb-6">
              Are you sure you want to close this chat? You will not be able to message this person again unless a new Connect is spent.
            </p>
            <div className="flex gap-3 justify-end">
              <button 
                onClick={() => setShowConfirmClose(false)}
                className="px-4 py-2 rounded border border-surface-variant text-sm text-text-secondary hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button 
                onClick={handleEndConversation}
                className="px-4 py-2 rounded bg-error/20 text-error border border-error/50 text-sm font-working-title hover:bg-error/30 transition-colors"
              >
                Yes, Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal 
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        brokerName={deal.other_party}
        onSchedule={(scheduledAt) => {
          setMessages([...messages, { 
            id: Date.now(), 
            sender: 'me', 
            body: `[SYSTEM] I have requested a live viewing for: ${new Date(scheduledAt).toLocaleString()}`, 
            timestamp: new Date().toISOString() 
          }]);
          setShowBookingModal(false);
        }}
      />

    </div>
  );
}
