"use client";

import { useState, useRef, useEffect } from "react";
import { usePathname } from "next/navigation";
import { supabase } from "@/lib/supabaseClient";

export default function ConciergeChat() {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState([
    { role: "assistant", content: "Welcome to ScoutIt. I am QuestIT, your personal VIP Concierge. How may I assist you with your space search today?" }
  ]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);
  const pathname = usePathname();

  // Keep chat scrolled to bottom
  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };
  useEffect(() => { scrollToBottom(); }, [messages, isOpen]);

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const userMessage = { role: "user", content: input.trim() };
    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInput("");
    setIsLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token;

      const response = await fetch("/api/questit", {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Authorization": token ? `Bearer ${token}` : ""
        },
        body: JSON.stringify({ messages: newMessages })
      });

      const data = await response.json();
      
      if (data.error) {
        throw new Error(data.error);
      }

      setMessages([...newMessages, { role: "assistant", content: data.reply }]);
    } catch (err) {
      console.error("Concierge Error:", err);
      setMessages([...newMessages, { role: "assistant", content: "Apologies, my systems are currently experiencing quantum interference. Please try again later or check your API key." }]);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <>
      {/* Floating Action Button */}
      <button 
        className={`concierge-fab ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen(!isOpen)}
        aria-label="Toggle VIP Concierge"
      >
        <span className="fab-icon">✦</span>
      </button>

      {/* Chat HUD Overlay */}
      {isOpen && (
        <div className="concierge-hud animate-[slideUpMobile_0.3s_cubic-bezier(0.4,0,0.2,1)]">
          <div className="concierge-header">
            <div className="concierge-brand">
              <span className="brand-dot"></span>
              QuestIT Concierge
            </div>
            <button className="concierge-close" onClick={() => setIsOpen(false)}>✕</button>
          </div>
          
          <div className="concierge-body">
            {messages.map((msg, idx) => (
              <div key={idx} className={`chat-bubble ${msg.role}`}>
                <span className="bubble-text">{msg.content}</span>
              </div>
            ))}
            {isLoading && (
              <div className="chat-bubble assistant loading">
                <span className="bubble-text">
                  <span className="dot"></span><span className="dot"></span><span className="dot"></span>
                </span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          <div className="concierge-footer">
            <input
              type="text"
              className="concierge-input"
              placeholder="Ask about properties, styles, or areas..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button className="concierge-send" onClick={sendMessage} disabled={!input.trim() || isLoading}>
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <line x1="22" y1="2" x2="11" y2="13"></line>
                <polygon points="22 2 15 22 11 13 2 9 22 2"></polygon>
              </svg>
            </button>
          </div>
        </div>
      )}

      <style>{`
        .concierge-fab {
          position: fixed;
          bottom: 80px;
          right: 24px;
          width: 56px;
          height: 56px;
          border-radius: 50%;
          background: var(--brand-overlay, rgba(12, 11, 9, 0.92));
          border: 1px solid var(--accent, #E8AE3C);
          color: var(--accent, #E8AE3C);
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          z-index: 9999;
          box-shadow: 0 4px 20px rgba(0,0,0,0.4), 0 0 12px rgba(232, 174, 60,0.2);
          backdrop-filter: blur(8px);
          transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
        }
        .concierge-fab:hover {
          transform: translateY(-4px) scale(1.05);
          background: rgba(232, 174, 60, 0.1);
          box-shadow: 0 8px 24px rgba(0,0,0,0.6), 0 0 16px rgba(232, 174, 60,0.3);
        }
        .concierge-fab.open {
          transform: scale(0.8) translateY(10px);
          opacity: 0;
          pointer-events: none;
        }
        .fab-icon {
          font-size: 24px;
          line-height: 1;
          animation: pulse-glow 3s infinite alternate;
        }

        .concierge-hud {
          position: fixed;
          bottom: 80px;
          right: 24px;
          width: 380px;
          height: 500px;
          max-height: calc(100vh - 100px);
          background: rgba(14, 14, 14, 0.95);
          border: 1px solid var(--border-mid, rgba(255,255,255,0.13));
          border-radius: 12px;
          z-index: 9999;
          display: flex;
          flex-direction: column;
          box-shadow: 0 20px 40px rgba(0,0,0,0.6), 0 0 0 1px rgba(255,255,255,0.05);
          backdrop-filter: blur(20px);
          -webkit-backdrop-filter: blur(20px);
          overflow: hidden;
        }

        .concierge-header {
          padding: 16px 20px;
          border-bottom: 1px solid var(--border-solid, #262626);
          display: flex;
          justify-content: space-between;
          align-items: center;
          background: rgba(255,255,255,0.02);
        }
        .concierge-brand {
          font-family: var(--font-mono, monospace);
          font-size: 11px;
          font-weight: 600;
          letter-spacing: 0.15em;
          text-transform: uppercase;
          color: var(--text-primary, #f0ede8);
          display: flex;
          align-items: center;
          gap: 8px;
        }
        .brand-dot {
          width: 6px;
          height: 6px;
          border-radius: 50%;
          background: var(--accent, #E8AE3C);
          box-shadow: 0 0 8px var(--accent, #E8AE3C);
          animation: pulse-glow 2s infinite alternate;
        }
        .concierge-close {
          background: transparent;
          border: none;
          color: var(--text-secondary, rgba(240,237,232,0.62));
          cursor: pointer;
          font-size: 14px;
          transition: color 0.2s;
        }
        .concierge-close:hover { color: var(--text-primary, #f0ede8); }

        .concierge-body {
          flex: 1;
          padding: 20px;
          overflow-y: auto;
          display: flex;
          flex-direction: column;
          gap: 16px;
          scrollbar-width: thin;
          scrollbar-color: var(--border-mid, #333) transparent;
        }
        .concierge-body::-webkit-scrollbar { width: 4px; }
        .concierge-body::-webkit-scrollbar-thumb { background: var(--border-mid, #333); border-radius: 4px; }

        .chat-bubble {
          max-width: 85%;
          display: flex;
          flex-direction: column;
        }
        .chat-bubble.user {
          align-self: flex-end;
        }
        .chat-bubble.assistant {
          align-self: flex-start;
        }
        .bubble-text {
          padding: 12px 16px;
          border-radius: 8px;
          font-size: 14px;
          line-height: 1.5;
        }
        .chat-bubble.user .bubble-text {
          background: var(--accent, #E8AE3C);
          color: #0e0e0e;
          border-bottom-right-radius: 2px;
          font-weight: 500;
        }
        .chat-bubble.assistant .bubble-text {
          background: var(--surface, #161616);
          border: 1px solid var(--border-solid, #262626);
          color: var(--text-primary, #f0ede8);
          border-bottom-left-radius: 2px;
        }

        .chat-bubble.loading .dot {
          display: inline-block;
          width: 4px;
          height: 4px;
          margin: 0 2px;
          background: var(--accent, #E8AE3C);
          border-radius: 50%;
          animation: chat-bounce 1.4s infinite ease-in-out both;
        }
        .chat-bubble.loading .dot:nth-child(1) { animation-delay: -0.32s; }
        .chat-bubble.loading .dot:nth-child(2) { animation-delay: -0.16s; }
        
        .concierge-footer {
          padding: 16px;
          border-top: 1px solid var(--border-solid, #262626);
          background: rgba(255,255,255,0.01);
          display: flex;
          gap: 12px;
        }
        .concierge-input {
          flex: 1;
          background: var(--surface, #161616);
          border: 1px solid var(--border-mid, rgba(255,255,255,0.13));
          border-radius: 6px;
          padding: 12px 16px;
          color: #fff;
          font-size: 13px;
          font-family: var(--font-body, sans-serif);
        }
        .concierge-input:focus {
          outline: none;
          border-color: var(--accent, #E8AE3C);
        }
        .concierge-send {
          width: 44px;
          height: 44px;
          border-radius: 6px;
          background: var(--accent, #E8AE3C);
          color: #0e0e0e;
          border: none;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          transition: transform 0.2s, opacity 0.2s;
        }
        .concierge-send:disabled {
          opacity: 0.5;
          cursor: not-allowed;
        }
        .concierge-send:not(:disabled):hover {
          transform: translateY(-1px);
        }

        @keyframes pulse-glow {
          0% { opacity: 0.6; box-shadow: 0 0 8px rgba(232, 174, 60,0.5); }
          100% { opacity: 1; box-shadow: 0 0 16px rgba(232, 174, 60,1); }
        }
        @keyframes chat-bounce {
          0%, 80%, 100% { transform: scale(0); }
          40% { transform: scale(1); }
        }

        @media (max-width: 640px) {
          .concierge-fab {
            bottom: 76px;
            right: 16px;
            width: 50px;
            height: 50px;
          }
          .concierge-hud {
            bottom: 0;
            right: 0;
            left: 0;
            width: 100%;
            height: 85vh;
            max-height: none;
            border-radius: 16px 16px 0 0;
            border-left: none;
            border-right: none;
            border-bottom: none;
          }
        }
      `}</style>
    </>
  );
}
