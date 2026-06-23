"use client";

import { useState } from "react";
import Link from "next/link";
import { CheckCircle, Circle, Zap, Droplets, Wifi, Sparkles, Truck, ExternalLink } from "lucide-react";

export default function PostMoveEcosystem() {
  const [checklist, setChecklist] = useState([
    { id: 'admin', text: 'Secure Admin/HOA Clearance', done: false },
    { id: 'keys', text: 'Collect all physical and access cards', done: false },
    { id: 'plumbing', text: 'Inspect plumbing & check water pressure', done: false },
    { id: 'hvac', text: 'Clean and service AC units', done: false },
    { id: 'locks', text: 'Schedule locksmith to change main locks', done: false },
    { id: 'address', text: 'Update billing address with banks', done: false }
  ]);

  const toggleCheck = (id) => {
    setChecklist(prev => 
      prev.map(item => item.id === id ? { ...item, done: !item.done } : item)
    );
  };

  const progress = Math.round((checklist.filter(i => i.done).length / checklist.length) * 100);

  return (
    <div className="w-full flex flex-col gap-6 mt-12 animate-[fadeIn_0.5s_ease-out]">
      <div className="border-b border-surface-variant pb-2">
        <h2 className="font-headline-editorial text-2xl text-on-surface flex items-center justify-between">
          Post-Move Ecosystem
          <span className="font-label-caps tracking-widest text-[10px] text-gold-accent px-2 py-1 bg-gold-accent/10 rounded">THE WIRE</span>
        </h2>
        <p className="text-xs text-text-secondary mt-1">Settle in. Connect your utilities, track your move-in steps, and activate essential services.</p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        
        {/* Left Column: Move-In Checklist */}
        <div className="lg:col-span-5 flex flex-col gap-4">
          <div className="bg-[#121110] border border-surface-variant rounded-lg p-6 hover:border-gold-accent/50 transition-colors h-full">
            <div className="flex justify-between items-end mb-6">
              <div>
                <span className="font-label-caps text-[10px] tracking-widest uppercase text-gold-accent block mb-1">Logistics</span>
                <h3 className="font-working-title text-lg text-on-surface">Move-In Checklist</h3>
              </div>
              <div className="font-mono text-sm text-gold-accent">{progress}%</div>
            </div>

            {/* Progress Bar */}
            <div className="w-full h-1 bg-surface-alt rounded-full mb-6 overflow-hidden">
              <div 
                className="h-full bg-gold-accent transition-all duration-500 ease-out" 
                style={{ width: `${progress}%` }}
              ></div>
            </div>

            <ul className="flex flex-col gap-3">
              {checklist.map(item => (
                <li 
                  key={item.id}
                  className="flex items-center gap-3 cursor-pointer group"
                  onClick={() => toggleCheck(item.id)}
                >
                  <div className="text-gold-accent shrink-0 transition-transform group-hover:scale-110">
                    {item.done ? <CheckCircle size="1.2em" strokeWidth={1.5} /> : <Circle size="1.2em" strokeWidth={1.5} className="text-surface-variant group-hover:text-gold-accent" />}
                  </div>
                  <span className={`text-sm transition-colors ${item.done ? 'text-text-muted line-through' : 'text-on-surface group-hover:text-gold-accent'}`}>
                    {item.text}
                  </span>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Right Column: Utilities CTA */}
        <div className="lg:col-span-7 flex flex-col justify-center">
          <Link href="/layer/crust#wire" className="relative overflow-hidden bg-surface-alt border border-surface-variant rounded-lg p-8 flex flex-col md:flex-row items-center justify-between gap-6 hover:border-gold-accent group transition-all h-full min-h-[220px]">
            <div className="absolute inset-0 bg-gradient-to-br from-gold-accent/10 to-transparent pointer-events-none opacity-0 group-hover:opacity-100 transition-opacity duration-500"></div>
            
            <div className="flex flex-col gap-3 relative z-10 w-full max-w-sm">
              <span className="font-label-caps text-[10px] tracking-widest uppercase text-gold-accent block">The Wire</span>
              <h3 className="font-headline-editorial text-2xl text-on-surface group-hover:text-gold-accent transition-colors">Access the Utilities Hub</h3>
              <p className="text-sm text-text-secondary leading-relaxed">
                Connect your fiber internet, transfer Meralco power accounts, setup water supply, and hire logistics guilds directly from our public Trust layer.
              </p>
            </div>
            
            <div className="relative z-10 shrink-0 mt-4 md:mt-0">
              <div className="w-14 h-14 rounded-full bg-[#121110] border border-surface-variant flex items-center justify-center text-on-surface group-hover:border-gold-accent group-hover:bg-gold-accent group-hover:text-[#121110] transition-all shadow-xl group-hover:scale-110">
                <ExternalLink size="1.2em" strokeWidth={1.5} />
              </div>
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
