import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import BookingModal from "./BookingModal";
import { uploadAttachment } from "../../lib/storage";
import { getSession } from "../../lib/authClient";

// Safe Link Parser to prevent XSS
const renderTextWithLinks = (text) => {
  if (!text) return null;
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      let safeUrl = "#";
      try {
        const parsed = new URL(part);
        if (["http:", "https:"].includes(parsed.protocol)) {
          safeUrl = parsed.href;
        }
      } catch (e) {}

      return (
        <a
          key={index}
          href={safeUrl}
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

// Attachment messages are sent through the same plain-text deal_messages.body
// column as regular text (no separate attachments table/column) -- encoded
// as a small JSON envelope with a recognizable prefix so it round-trips
// through the real API instead of only living in local state.
const ATTACHMENT_PREFIX = "__scoutit_attachment__:";
const encodeAttachment = (att) => `${ATTACHMENT_PREFIX}${JSON.stringify(att)}`;
const decodeAttachment = (body) => {
  if (!body || !body.startsWith(ATTACHMENT_PREFIX)) return null;
  try {
    return JSON.parse(body.slice(ATTACHMENT_PREFIX.length));
  } catch {
    return null;
  }
};

// Resolves { token, mockOwnerId, userId } for API calls -- real Supabase
// session first, falling back to the dev toolbox's "master-dev" localStorage
// convention (see FloatingToolbox.js) when there's no real session, matching
// the same pattern InquiryModal/UnitInquiryModal/OperatorRequestModal use.
async function resolveAuth() {
  const { data: { session } } = await getSession();
  if (session?.access_token) {
    return { token: session.access_token, mockOwnerId: null, userId: session.user.id };
  }
  try {
    const raw = localStorage.getItem("scoutit_user");
    const u = raw ? JSON.parse(raw) : null;
    if (u?.id) return { token: null, mockOwnerId: u.id, userId: u.id };
  } catch {}
  return { token: null, mockOwnerId: null, userId: null };
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

export default function ChatBox({ deal, onCloseDeal, onOfferHandshake, onAcceptHandshake }) {
  console.log("ChatBox rendering deal:", deal);
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [showConfirmReport, setShowConfirmReport] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  const [showConfirmHandshake, setShowConfirmHandshake] = useState(false);
  const [isPitchExpanded, setIsPitchExpanded] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  const mapMessage = useCallback((m, currentUserId) => {
    const attachment = decodeAttachment(m.body);
    return {
      id: m.id,
      sender: m.sender_id === currentUserId ? "me" : m.sender_role,
      body: attachment ? "" : m.body,
      timestamp: m.created_at,
      attachments: attachment ? [attachment] : [],
    };
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { token, mockOwnerId, userId } = await resolveAuth();
      if (!userId) {
        setLoadError("Please log in to view this conversation.");
        setLoading(false);
        return;
      }
      setMyUserId(userId);
      const qs = mockOwnerId ? `?mockOwnerId=${mockOwnerId}` : "";
      const res = await fetch(`/api/deals/${deal.id}/messages${qs}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Couldn't load this conversation.");
        setLoading(false);
        return;
      }
      setMessages((data.messages || []).map((m) => mapMessage(m, userId)));

      // Mark incoming messages read now that the conversation is open.
      fetch(`/api/deals/${deal.id}/messages${qs}`, {
        method: "PATCH",
        headers: authHeaders(token),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to load messages", err);
      setLoadError("Couldn't load this conversation — check your connection.");
    } finally {
      setLoading(false);
    }
  }, [deal.id, mapMessage]);

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isUploading]);

  const sendMessageBody = async (body) => {
    const { token, mockOwnerId, userId } = await resolveAuth();
    if (!userId) throw new Error("Please log in to send a message.");
    const res = await fetch(`/api/deals/${deal.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ body, role: deal.myRole || "buyer", mockOwnerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't send your message.");
    setMessages((prev) => [...prev, mapMessage(data.message, userId)]);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    if (!input.trim() || deal.status === 'closed') return;

    setIsSubmitting(true);
    setUploadError(null);
    try {
      await sendMessageBody(input.trim());
      setInput("");
    } catch (err) {
      setUploadError(err.message);
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const attachment = await uploadAttachment(deal.id, file);
      await sendMessageBody(encodeAttachment(attachment));
    } catch (err) {
      setUploadError(err.message);
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
    try {
      const { token, mockOwnerId } = await resolveAuth();
      await fetch(`/api/deals/${deal.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ mockOwnerId }),
      });
    } catch (err) {
      console.error("Failed to close deal", err);
    }
    onCloseDeal(deal.id);
    setShowConfirmClose(false);
  };

  const handleReportConversation = async () => {
    try {
      const { token, mockOwnerId } = await resolveAuth();
      await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ status: "reported", mockOwnerId }),
      });
    } catch (err) {
      console.error("Failed to report deal", err);
    }
    onCloseDeal(deal.id);
    setShowConfirmReport(false);
  };

  const daysLeft = deal.expires_at ? Math.ceil((new Date(deal.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 14;

  const renderAttachment = (att) => {
    if (att.type.startsWith('image/')) {
      return (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
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

      {/* Handshake Animation Overlay -- Verified Advisor Flow */}
      {deal.handshakeState === 'linked' && (
        <div className="absolute inset-0 z-50 bg-black/90 backdrop-blur-md flex flex-col items-center justify-center animate-[fadeIn_0.5s_ease]">
          <div className="text-6xl mb-6 animate-bounce">🛡️</div>
          <h2 className="text-3xl font-headline-editorial text-gold-accent mb-2">Verified Advisor Linked</h2>
          <p className="text-text-secondary max-w-md text-center">
            The property is now active in the Verified Advisory Portfolio. This temporary chat will close permanently.
          </p>
        </div>
      )}

      {/* Handshake Confirmation Modal */}
      {showConfirmHandshake && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface-alt border border-gold-accent/50 p-6 rounded-lg max-w-sm text-center shadow-[0_0_30px_rgba(232,174,60,0.15)]">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-headline-editorial text-gold-accent mb-2">Exchange Contact Info?</h3>
            <p className="text-sm text-text-secondary mb-6">
              Before you shake hands, make sure you have exchanged private contact info.
              <strong> Once linked, this chat will be deleted forever.</strong>
            </p>
            <div className="flex gap-3 justify-center">
              <button
                onClick={() => setShowConfirmHandshake(false)}
                className="px-4 py-2 border border-surface-variant text-text-secondary rounded hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={() => {
                  setShowConfirmHandshake(false);
                  onOfferHandshake();
                }}
                className="px-4 py-2 bg-gold-accent text-black font-bold rounded hover:bg-[#F7C64E]"
              >
                Offer Handshake
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secure Connection SVG Line */}
      <div className="w-full h-1 overflow-hidden relative bg-black">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-accent to-transparent opacity-50"
          animate={{ x: ["-100%", "100%"] }}
          transition={{ duration: 2, repeat: Infinity, ease: "linear" }}
        />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="2" x2="100%" y2="2" stroke="rgba(232, 174, 60, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

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
        {deal.status !== 'closed' && deal.status !== 'accepted' && (
          <div className="flex gap-2 items-center">
            {deal.handshakeState === 'offered' ? (
              <button
                onClick={onAcceptHandshake}
                className="bg-success text-white px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest hover:bg-success/80 transition-colors animate-pulse"
              >
                Accept Handshake
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmHandshake(true)}
                className="border border-gold-accent text-gold-accent px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest hover:bg-gold-accent/10 transition-colors"
              >
                Offer Handshake 🤝
              </button>
            )}

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
            <button
              onClick={() => setShowConfirmReport(true)}
              className="text-error/70 hover:text-error px-2 py-1.5 rounded text-xs transition-colors"
              title="Report / Unmatch"
            >
              🚩
            </button>
          </div>
        )}
      </div>

      {/* Pitch Drawer */}
      {deal.pitch_message && (
        <div className="bg-[#1a1a1a] border-b border-surface-variant flex flex-col z-0">
          <button 
            className="w-full flex justify-between items-center px-4 py-2 text-xs font-mono tracking-widest uppercase text-text-secondary hover:text-on-surface hover:bg-white/5 transition-colors"
            onClick={() => setIsPitchExpanded(!isPitchExpanded)}
          >
            <span className="flex items-center gap-2">
              <span className="text-gold-accent">📄</span> Original Pitch Terms
            </span>
            <span>{isPitchExpanded ? '▲' : '▼'}</span>
          </button>
          {isPitchExpanded && (
            <div className="px-6 py-4 border-t border-white/5 text-sm text-text-muted bg-[#121212] animate-[fadeIn_0.2s_ease]">
              <p className="whitespace-pre-wrap font-serif italic border-l-2 border-gold-accent/30 pl-4">{deal.pitch_message}</p>
            </div>
          )}
        </div>
      )}

      {/* Required Legal Disclaimer */}
      <div className="bg-surface-variant/30 border-b border-surface-variant p-3 text-center">
        <p className="text-xs text-text-muted font-mono">
          <span className="text-gold-accent mr-2">⚠️</span>
          This conversation is temporary and will be deleted when closed. ScoutIt is not a party to any agreement made here.
        </p>
      </div>

      {/* Warnings & Banners */}
      {deal.status === 'accepted' ? (
        <div className="bg-[#121212] border-b border-surface-variant p-6 flex flex-col items-center">
          <div className="max-w-md w-full bg-gradient-to-br from-[#1a1a1a] to-[#0d0d0d] border border-gold-accent/30 rounded-xl p-6 shadow-[0_10px_40px_rgba(232,174,60,0.05)] flex flex-col items-center animate-[fadeIn_0.5s_ease]">
            <span className="text-3xl mb-3">🛡️</span>
            <span className="font-label-caps text-[10px] tracking-widest uppercase text-success bg-success/10 px-2 py-1 rounded mb-4">Verified Advisor Active</span>
            
            <h3 className="text-2xl font-headline-editorial text-on-surface mb-1">{deal.other_party_contact?.name || deal.other_party}</h3>
            <p className="text-sm text-text-secondary font-mono mb-4">{deal.other_party_contact?.email || 'verified@advisory.network'}</p>
            <p className="text-sm text-gold-accent font-data-tabular">{deal.other_party_contact?.phone || '+63 917 000 0000'}</p>
            
            <div className="w-full h-px bg-surface-variant my-5"></div>
            
            <div className="flex flex-wrap gap-2 justify-center w-full">
              <a href={`https://wa.me/${(deal.other_party_contact?.phone || '').replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3 py-2 rounded text-center text-xs font-working-title hover:bg-[#25D366]/30 transition-colors">
                WhatsApp
              </a>
              <button onClick={() => setShowBookingModal(true)} className="flex-1 min-w-[120px] bg-gold-accent/20 text-gold-accent border border-gold-accent/30 px-3 py-2 rounded text-xs font-working-title hover:bg-gold-accent/30 transition-colors">
                Schedule Call
              </button>
              <button className="flex-1 min-w-[120px] bg-surface-variant text-text-secondary border border-white/10 px-3 py-2 rounded text-xs font-working-title hover:text-white transition-colors" onClick={() => alert("Vault access coming soon.")}>
                📂 Open Vault
              </button>
            </div>
          </div>
        </div>
      ) : deal.status === 'closed' ? (
        <div className="bg-error/10 text-error p-3 text-center text-xs font-mono tracking-widest uppercase border-b border-error/20">
          This conversation is closed and archived for 7 days.
        </div>
      ) : deal.status === 'reported' ? (
        <div className="bg-error/20 text-error p-4 text-center text-sm font-working-title border-b border-error/30">
          <span className="mr-2">🚩</span> This conversation was reported and permanently closed. Our Trust & Safety team is reviewing the interaction.
        </div>
      ) : (
        <div className="bg-surface-container-low p-2 text-center text-[10px] uppercase font-mono tracking-widest text-text-secondary border-b border-surface-variant">
          Chat auto-closes in {daysLeft} days or after 72 hours of inactivity.
        </div>
      )}

      {/* Upload/Send Error Banner */}
      {uploadError && (
        <div className="bg-error/20 border-l-4 border-error p-3 text-xs text-error animate-[fadeIn_0.3s_ease]">
          <strong>Error:</strong> {uploadError}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-[#0d0d0d] to-[#121212]">
        {loading && (
          <p className="text-center text-xs text-text-secondary font-mono uppercase tracking-widest">Loading conversation…</p>
        )}
        {loadError && (
          <p className="text-center text-xs text-error font-mono">{loadError}</p>
        )}
        {!loading && !loadError && messages.map((msg, index) => {
          const isMe = msg.sender === 'me';
          return (
            <motion.div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.3 }}
            >
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
            </motion.div>
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
            disabled={['closed', 'accepted', 'reported'].includes(deal.status) || isUploading}
            className="p-2.5 rounded-full text-text-secondary hover:text-gold-accent hover:bg-gold-accent/10 transition-colors disabled:opacity-50 flex items-center justify-center"
            title="Attach file (Max 10MB Doc/Img, 50MB Video)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>

          <input
            type="text"
            className="flex-1 bg-surface border border-surface-variant rounded-full px-5 py-2.5 text-sm text-on-surface focus:outline-none focus:border-gold-accent/50 disabled:opacity-50 transition-colors"
            placeholder={['closed', 'accepted', 'reported'].includes(deal.status) ? "This chat is closed." : "Type your message or drag a file here..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={['closed', 'accepted', 'reported'].includes(deal.status) || isSubmitting}
          />

          <button
            type="submit"
            disabled={['closed', 'accepted', 'reported'].includes(deal.status) || isSubmitting || (!input.trim() && !isUploading)}
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

      {/* Report Modal */}
      {showConfirmReport && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-[#121212] border border-error/50 rounded-lg p-6 max-w-sm w-full shadow-[0_0_40px_rgba(255,0,0,0.1)]">
            <h3 className="font-working-title text-lg text-error mb-2 flex items-center gap-2">
              <span>🚩</span> Report & Unmatch
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              This will permanently close the chat and flag the user. Connects will be reviewed by our Trust & Safety team. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReport(false)}
                className="px-4 py-2 rounded border border-surface-variant text-sm text-text-secondary hover:text-on-surface transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={handleReportConversation}
                className="px-4 py-2 rounded bg-error text-white text-sm font-working-title hover:bg-error/80 transition-colors"
              >
                Report User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal -- still local-only (viewing_appointments table exists
          but this modal was never wired to it; out of scope for this pass) */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        brokerName={deal.other_party}
        dealId={deal.id}
        onSchedule={(scheduledAt) => {
          sendMessageBody(`[SYSTEM] I have requested a live viewing for: ${new Date(scheduledAt).toLocaleString()}`).catch((err) => {
            setUploadError(err.message);
            setTimeout(() => setUploadError(null), 5000);
          });
          setShowBookingModal(false);
        }}
      />

    </div>
  );
}
