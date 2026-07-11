"use client";

import { useState, useRef, useEffect } from "react";
import { Sparkles, X, Send, Command, Loader2 } from "lucide-react";

export default function ConciergeAI() {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef(null);

  const [messages, setMessages] = useState([
    {
      id: "1",
      role: "ai",
      content: "Welcome to Scout AI. I have synchronized with your Spatial Vault. How can I assist your real estate strategy today?",

      timestamp: new Date().toISOString()
    }
  ]);

  const QUICK_PROMPTS = [
    "Analyze my saved properties",
    "Find off-market deals in BGC",
    "What is the average yield in Makati?"
  ];

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [messages, isOpen, isTyping]);

  const handleSend = (text) => {
    const userMsg = text || input;
    if (!userMsg.trim()) return;

    // Add user message
    const newMsg = {
      // eslint-disable-next-line react-hooks/purity
      id: Date.now().toString(),
      role: "user",
      content: userMsg,
      timestamp: new Date().toISOString()
    };
    
    setMessages(prev => [...prev, newMsg]);
    setInput("");
    setIsTyping(true);

    // Mock AI Response
    setTimeout(() => {
      let aiResponse = "";
      
      if (userMsg.toLowerCase().includes("analyze my saved")) {
        aiResponse = "I've analyzed the 3 properties in your Spatial Vault. They are all clustered around **Salcedo Village, Makati** with an average asking price of ₱280,000/sqm. Would you like me to scout similar assets with a higher projected yield?";
      } else if (userMsg.toLowerCase().includes("bgc")) {
        aiResponse = "Off-market activity in **Bonifacio Global City** is currently heavily skewed towards High Street South. I am tracking 4 unlisted premium commercial spaces. Should I alert our verified brokers to pitch them to you?";
      } else if (userMsg.toLowerCase().includes("yield")) {
        aiResponse = "Current data indicates average gross rental yields in Makati CBD stand at **5.8% to 6.2%** for premium residential, and **6.5% to 7.1%** for Grade A commercial.";
      } else {
        aiResponse = "I am tracking that request. Our ecosystem is vast, and I am continuously parsing market data to provide you with the most accurate spatial intelligence. What else do you need?";
      }

      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: "ai",
        content: aiResponse,
        timestamp: new Date().toISOString()
      }]);
      setIsTyping(false);
    }, 1500);
  };

  return (
    <>
      {/* Floating Action Button */}
      <div className={`fixed z-[1000] bottom-[88px] left-5 right-auto md:bottom-6 md:left-auto md:right-6 transition-transform duration-500 ${isOpen ? 'scale-0 opacity-0 pointer-events-none' : 'scale-100 opacity-100'}`}>
        <button
          onClick={() => setIsOpen(true)}
          className="relative group w-14 h-14 bg-[#121110] border border-gold-accent/50 rounded-full flex items-center justify-center shadow-[0_0_20px_rgba(232,174,60,0.2)] hover:shadow-[0_0_30px_rgba(232,174,60,0.4)] transition-all hover:scale-105"
        >
          {/* Rotating glow */}
          <div className="absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent,rgba(232,174,60,0.5),transparent)] animate-[spin_4s_linear_infinite] opacity-50"></div>
          <div className="absolute inset-1 rounded-full bg-[#121110] flex items-center justify-center z-10">
            <Sparkles className="text-gold-accent group-hover:animate-pulse" size="1.5em" strokeWidth={1.5} />
          </div>
        </button>
      </div>

      {/* Chat Modal / Sidebar */}
      <div className={`fixed inset-y-0 right-0 z-[1000] w-full sm:w-[400px] bg-[#0d0d0d]/95 backdrop-blur-xl border-l border-surface-variant shadow-2xl transform transition-transform duration-500 ease-[cubic-bezier(0.16,1,0.3,1)] flex flex-col ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        
        {/* Header */}
        <div className="h-16 border-b border-surface-variant px-6 flex items-center justify-between shrink-0 bg-gradient-to-b from-[#1a1814] to-transparent">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded bg-gold-accent/10 border border-gold-accent/30 flex items-center justify-center text-gold-accent">
              <Sparkles size="1em" strokeWidth={1.5} />
            </div>
            <div>
              <h3 className="font-headline-editorial text-lg text-on-surface leading-none">Scout AI</h3>
              <span className="font-label-caps text-[9px] tracking-widest text-gold-accent uppercase">VIP Concierge Active</span>
            </div>
          </div>
          <button 
            onClick={() => setIsOpen(false)}
            aria-label="Close"
            className="w-8 h-8 flex items-center justify-center text-text-secondary hover:text-error transition-colors rounded-full hover:bg-surface-variant"
          >
            <X size="1.2em" />
          </button>
        </div>

        {/* Messages Area */}
        <div className="flex-1 overflow-y-auto p-6 flex flex-col gap-6 custom-scrollbar">
          {messages.map((msg) => (
            <div key={msg.id} className={`flex flex-col max-w-[85%] ${msg.role === 'user' ? 'self-end items-end' : 'self-start items-start'}`}>
              <span className="font-label-caps text-[9px] tracking-widest text-text-muted uppercase mb-1">
                {msg.role === 'user' ? 'You' : 'Scout AI'}
              </span>
              <div className={`p-4 rounded-2xl text-sm leading-relaxed font-body ${
                msg.role === 'user' 
                  ? 'bg-surface-variant text-on-surface rounded-br-sm' 
                  : 'bg-[#121110] border border-gold-accent/20 text-text-secondary rounded-bl-sm shadow-[0_4px_15px_rgba(232,174,60,0.05)]'
              }`}>
                {/* Parse basic markdown bold for mock responses */}
                {msg.content.split('**').map((part, i) => i % 2 === 1 ? <strong key={i} className="text-on-surface font-working-title">{part}</strong> : part)}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="self-start max-w-[85%] flex flex-col items-start">
              <span className="font-label-caps text-[9px] tracking-widest text-gold-accent uppercase mb-1 animate-pulse">
                Processing Logic
              </span>
              <div className="p-4 rounded-2xl bg-[#121110] border border-gold-accent/20 rounded-bl-sm flex items-center gap-2">
                <Loader2 size="1.2em" className="text-gold-accent animate-spin" />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Quick Prompts */}
        {messages.length === 1 && !isTyping && (
          <div className="px-6 pb-2 flex flex-col gap-2 shrink-0">
            {QUICK_PROMPTS.map((prompt, idx) => (
              <button
                key={idx}
                onClick={() => handleSend(prompt)}
                className="text-left text-xs font-working-title text-text-secondary border border-surface-variant rounded-lg p-3 hover:border-gold-accent hover:text-gold-accent transition-colors bg-surface/50 backdrop-blur-md"
              >
                {prompt}
              </button>
            ))}
          </div>
        )}

        {/* Input Area */}
        <div className="p-4 shrink-0 bg-surface-alt border-t border-surface-variant">
          <form 
            onSubmit={(e) => { e.preventDefault(); handleSend(); }}
            className="relative flex items-center"
          >
            <Command className="absolute left-4 text-text-muted" size="1.2em" />
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Command the AI..."
              className="w-full bg-[#121110] border border-surface-variant rounded-full pl-11 pr-12 py-3 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition-colors placeholder:text-text-muted font-working-title"
              disabled={isTyping}
            />
            <button
              type="submit"
              disabled={!input.trim() || isTyping}
              className="absolute right-2 w-8 h-8 rounded-full bg-gold-accent flex items-center justify-center text-background disabled:opacity-50 disabled:bg-surface-variant disabled:text-text-muted transition-colors hover:bg-gold-accent-bright"
            >
              <Send size="1em" className={input.trim() && !isTyping ? "translate-x-[1px] translate-y-[-1px]" : ""} />
            </button>
          </form>
        </div>
      </div>

      {/* Backdrop for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-background/60 backdrop-blur-sm z-[90] sm:hidden"
          onClick={() => setIsOpen(false)}
        ></div>
      )}
    </>
  );
}
