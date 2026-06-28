import { useState, useEffect, useRef } from "react";

export default function ChatBox({ deal, onCloseDeal }) {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const messagesEndRef = useRef(null);

  useEffect(() => {
    // In a real app, fetch from /api/deals/[deal.id]/messages
    // For now, simulate loading history
    setMessages([
      { id: 1, sender: 'buyer', body: 'Hi, I am interested in viewing this property. Are there any available schedules this week?', timestamp: new Date(Date.now() - 1000 * 60 * 60).toISOString() },
    ]);
  }, [deal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || deal.status === 'closed') return;

    setIsSubmitting(true);
    
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 500));
    
    setMessages([
      ...messages,
      { id: Date.now(), sender: 'me', body: input, timestamp: new Date().toISOString() }
    ]);
    
    setInput("");
    setIsSubmitting(false);
  };

  const handleEndConversation = async () => {
    // In a real app, call /api/deals/[deal.id]/close
    onCloseDeal(deal.id);
    setShowConfirmClose(false);
  };

  // Calculate days left for expiration warning
  const daysLeft = deal.expires_at ? Math.ceil((new Date(deal.expires_at) - new Date()) / (1000 * 60 * 60 * 24)) : 14;

  return (
    <div className="flex flex-col h-full relative">
      
      {/* Chat Header */}
      <div className="p-4 border-b border-surface-variant flex justify-between items-center bg-[#121212]">
        <div>
          <h3 className="font-working-title text-md text-on-surface">
            {deal.other_party}
          </h3>
          <p className="text-xs text-text-secondary">
            Inquiry for <strong>{deal.property_title}</strong>
          </p>
        </div>
        {deal.status !== 'closed' && (
          <button 
            onClick={() => setShowConfirmClose(true)}
            className="border border-error/50 text-error px-3 py-1.5 rounded text-xs font-mono uppercase tracking-widest hover:bg-error/10 transition-colors"
          >
            End Conversation
          </button>
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
        <div className="bg-[#1a1a1a] p-2 text-center text-xs text-text-secondary border-b border-surface-variant">
          Chat auto-closes in {daysLeft} days or after 72 hours of inactivity.
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4">
        {messages.map((msg) => {
          const isMe = msg.sender === 'me';
          return (
            <div key={msg.id} className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}>
              <div 
                className={`max-w-[75%] p-3 rounded-lg text-sm ${
                  isMe 
                    ? 'bg-gold-accent text-background rounded-tr-none' 
                    : 'bg-surface-variant text-on-surface rounded-tl-none border border-white/5'
                }`}
              >
                {msg.body}
              </div>
              <span className="text-[10px] text-text-muted mt-1 px-1">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="p-4 border-t border-surface-variant bg-[#121212]">
        <form onSubmit={handleSend} className="flex gap-2">
          <input
            type="text"
            className="flex-1 bg-background border border-surface-variant rounded px-4 py-2 text-sm text-on-surface focus:outline-none focus:border-gold-accent/50 disabled:opacity-50"
            placeholder={deal.status === 'closed' ? "This chat is closed." : "Type your message..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={deal.status === 'closed' || isSubmitting}
          />
          <button
            type="submit"
            disabled={deal.status === 'closed' || isSubmitting || !input.trim()}
            className="bg-gold-accent text-background px-6 py-2 rounded text-sm font-working-title disabled:opacity-50 hover:bg-[#F7C64E] transition-colors"
          >
            {isSubmitting ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* End Conversation Modal */}
      {showConfirmClose && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-10 flex items-center justify-center p-6">
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

    </div>
  );
}
