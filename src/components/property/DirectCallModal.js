"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { X, Phone, PhoneOff, MessageSquare, Volume2, VolumeX, ShieldCheck } from "lucide-react";
import GlassPanel from "../ui/GlassPanel";
import { ImpeccableButton } from "../ui/ImpeccableButton";
import { stillBackdropVariants, stillPanelVariants, instantDialogTransition } from "@/components/ui/reducedDialogMotion";
import useModalDialog from "@/components/ui/useModalDialog";

const backdropVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1 }
};

const modalVariants = {
  hidden: { y: 20, scale: 0.95, opacity: 0 },
  visible: { y: 0, scale: 1, opacity: 1 },
  exit: { y: 15, scale: 0.95, opacity: 0 }
};

const modalTransition = { type: "spring", stiffness: 320, damping: 28 };
const backdropTransition = { duration: 0.2, ease: "easeOut" };

export default function DirectCallModal({
  isOpen,
  onClose,
  operatorDisplayName,
  unitName,
  propertyTitle,
  onLeaveMessage
}) {
  const reduceMotion = useReducedMotion();
  const [callState, setCallState] = useState("dialing"); // "dialing", "ringing", "unanswered"
  const [seconds, setSeconds] = useState(0);
  const [isMuted, setIsMuted] = useState(false);
  const dialogRef = useRef(null);
  const audioContextRef = useRef(null);
  const ringIntervalRef = useRef(null);
  const timerRef = useRef(null);

  useModalDialog(dialogRef, { active: isOpen, onClose });

  const stopAudio = useCallback(() => {
    if (ringIntervalRef.current) {
      clearInterval(ringIntervalRef.current);
      ringIntervalRef.current = null;
    }
    if (audioContextRef.current) {
      try {
        audioContextRef.current.close();
      } catch {
        // no-op if already closed
      }
      audioContextRef.current = null;
    }
  }, []);

  const playRingBurst = useCallback(() => {
    if (isMuted || typeof window === "undefined") return;
    try {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (!AudioCtx) return;
      if (!audioContextRef.current || audioContextRef.current.state === "closed") {
        audioContextRef.current = new AudioCtx();
      }
      const ctx = audioContextRef.current;
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      // Realistic telephone ring cadence (440Hz + 480Hz dual-frequency burst)
      const now = ctx.currentTime;
      const osc1 = ctx.createOscillator();
      const osc2 = ctx.createOscillator();
      const gain = ctx.createGain();

      osc1.frequency.value = 440;
      osc2.frequency.value = 480;

      // Soft volume envelope
      gain.gain.setValueAtTime(0.0001, now);
      gain.gain.exponentialRampToValueAtTime(0.04, now + 0.05);
      gain.gain.setValueAtTime(0.04, now + 1.2);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + 1.4);

      osc1.connect(gain);
      osc2.connect(gain);
      gain.connect(ctx.destination);

      osc1.start(now);
      osc2.start(now);
      osc1.stop(now + 1.5);
      osc2.stop(now + 1.5);
    } catch {
      // Audio autoplay policy fallback
    }
  }, [isMuted]);

  useEffect(() => {
    if (!isOpen) {
      stopAudio();
      setCallState("dialing");
      setSeconds(0);
      return;
    }

    setCallState("dialing");
    setSeconds(0);

    const ringTimer = setTimeout(() => {
      setCallState("ringing");
      playRingBurst();
      ringIntervalRef.current = setInterval(() => {
        playRingBurst();
      }, 3500);
    }, 1500);

    timerRef.current = setInterval(() => {
      setSeconds((prev) => {
        const next = prev + 1;
        // Unanswered fallback after 18 seconds
        if (next >= 18) {
          setCallState("unanswered");
          stopAudio();
          clearInterval(timerRef.current);
        }
        return next;
      });
    }, 1000);

    return () => {
      clearTimeout(ringTimer);
      if (timerRef.current) clearInterval(timerRef.current);
      stopAudio();
    };
  }, [isOpen, playRingBurst, stopAudio]);

  const handleEndCall = () => {
    stopAudio();
    onClose();
  };

  const handleGoToMessage = () => {
    stopAudio();
    if (onLeaveMessage) {
      onLeaveMessage();
    } else {
      onClose();
    }
  };

  const formatTimer = (s) => {
    const mins = Math.floor(s / 60);
    const secs = s % 60;
    return `${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  };

  const targetLabel = operatorDisplayName || "Unit Operator";

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="fixed inset-0 z-[9999] flex items-center justify-center p-4 md:p-6 backdrop-blur-sm"
          style={{ background: "var(--modal-scrim)" }}
          variants={reduceMotion ? stillBackdropVariants : backdropVariants}
          initial="hidden"
          animate="visible"
          exit="hidden"
          transition={reduceMotion ? instantDialogTransition : backdropTransition}
          onClick={handleEndCall}
        >
          <motion.div
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Hotline call to ${targetLabel}`}
            onClick={(e) => e.stopPropagation()}
            className="w-full max-w-[480px]"
            variants={reduceMotion ? stillPanelVariants : modalVariants}
            initial="hidden"
            animate="visible"
            exit="exit"
            transition={reduceMotion ? instantDialogTransition : modalTransition}
          >
            <GlassPanel
              className="relative p-6 md:p-8 rounded-2xl contact-lens-modal border border-white/[0.08]"
              style={{
                boxShadow: "0 24px 48px -12px var(--shadow-xl), 0 0 20px rgba(var(--accent-rgb),0.12)",
                background: "linear-gradient(180deg, var(--surface) 0%, var(--bg) 100%)"
              }}
            >
              <button
                className="absolute top-4 right-4 text-text-secondary hover:text-text-primary transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center p-2 rounded-full hover:bg-white/10 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]"
                onClick={handleEndCall}
                aria-label="Close call modal"
              >
                <X size={18} />
              </button>

              <div className="flex items-center gap-2 mb-6">
                <span className="w-2 h-2 rounded-full bg-gold-accent animate-pulse" />
                <span className="font-mono text-[12px] tracking-[0.12em] uppercase text-gold-accent">
                  Direct Operator Hotline · Web Audio Connect
                </span>
              </div>

              {callState !== "unanswered" ? (
                <div className="flex flex-col items-center text-center">
                  {/* Operator Avatar and Sound Pulse */}
                  <div className="relative mb-6">
                    <div className="w-24 h-24 rounded-full bg-surface/80 border border-gold-accent/30 flex items-center justify-center relative z-10 shadow-[0_0_24px_rgba(var(--accent-rgb),0.15)]">
                      <span className="font-serif text-3xl text-gold-accent font-semibold">
                        {targetLabel[0]}
                      </span>
                    </div>

                    {!reduceMotion && (
                      <>
                        <motion.div
                          className="absolute inset-0 rounded-full border border-gold-accent/30"
                          animate={{ scale: [1, 1.4, 1.6], opacity: [0.6, 0.2, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, ease: "easeOut" }}
                        />
                        <motion.div
                          className="absolute inset-0 rounded-full border border-gold-accent/20"
                          animate={{ scale: [1, 1.8, 2.1], opacity: [0.4, 0.1, 0] }}
                          transition={{ repeat: Infinity, duration: 2.2, delay: 0.6, ease: "easeOut" }}
                        />
                      </>
                    )}
                  </div>

                  {/* Identification */}
                  <h3 className="font-serif text-2xl text-text-primary font-normal mb-1">
                    {targetLabel}
                  </h3>
                  <div className="text-xs font-mono text-text-secondary tracking-wider uppercase mb-1">
                    {unitName} · {propertyTitle}
                  </div>

                  {/* Status Indicator */}
                  <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/[0.03] border border-white/10 my-3">
                    <Phone size={12} className="text-gold-accent animate-bounce" />
                    <span className="text-xs font-mono text-gold-accent">
                      {callState === "dialing" ? "Connecting secure channel…" : "Ringing branch operations desk…"}
                    </span>
                    <span className="text-xs font-mono text-text-muted">
                      ({formatTimer(seconds)})
                    </span>
                  </div>

                  {/* Security Badge */}
                  <div className="flex items-center gap-1.5 text-[12px] text-text-muted mt-2 mb-8">
                    <ShieldCheck size={14} className="text-gold-accent/70" />
                    <span>Direct line to the property operations desk. Live voice communication without bots.</span>
                  </div>

                  {/* Controls */}
                  <div className="flex items-center justify-center gap-4 w-full">
                    <button
                      type="button"
                      onClick={() => setIsMuted(!isMuted)}
                      className="min-w-[44px] min-h-[44px] p-3 rounded-full bg-white/[0.04] border border-white/10 hover:border-gold-accent/40 text-text-secondary hover:text-text-primary transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-95 touch-manipulation flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
                      title={isMuted ? "Unmute ringtone" : "Mute ringtone"}
                      aria-label={isMuted ? "Unmute ringtone" : "Mute ringtone"}
                    >
                      {isMuted ? <VolumeX size={18} /> : <Volume2 size={18} />}
                    </button>

                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="min-h-[44px] flex items-center justify-center gap-2 px-6 py-3 rounded-full bg-error/15 border border-error/30 hover:bg-error/25 text-error font-mono text-xs uppercase tracking-wider transition-[transform,background-color,border-color] duration-150 ease-out active:scale-95 touch-manipulation shadow-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-error"
                    >
                      <PhoneOff size={16} />
                      <span>End Call</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleGoToMessage}
                      className="min-h-[44px] flex items-center justify-center gap-2 px-4 py-3 rounded-full bg-white/[0.04] border border-white/10 hover:border-gold-accent/40 text-text-secondary hover:text-gold-accent font-mono text-xs uppercase tracking-wider transition-[transform,background-color,border-color,color] duration-150 ease-out active:scale-95 touch-manipulation focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold-accent"
                      title="Leave message instead"
                    >
                      <MessageSquare size={16} />
                      <span className="hidden sm:inline">Message</span>
                    </button>
                  </div>
                </div>
              ) : (
                /* Unanswered Fallback State */
                <div className="flex flex-col items-center text-center py-3">
                  <div className="w-16 h-16 rounded-full bg-error/10 border border-error/30 text-error flex items-center justify-center mb-4">
                    <PhoneOff size={28} />
                  </div>

                  <h3 className="font-serif text-2xl text-text-primary font-normal mb-2">
                    Hotline Unanswered
                  </h3>

                  <p className="text-sm text-text-secondary leading-relaxed max-w-sm mb-2">
                    <strong className="text-white font-medium">{targetLabel}</strong> was unavailable or busy assisting on-site guests.
                  </p>

                  <p className="text-xs text-text-muted leading-relaxed max-w-sm mb-6">
                    Your inquiry is saved. Leave a message with your preferred call time, and the operations team will follow up directly.
                  </p>

                  <div className="flex flex-col sm:flex-row gap-3 w-full">
                    <ImpeccableButton
                      type="button"
                      onClick={handleGoToMessage}
                      className="w-full flex-1 min-h-[44px]"
                    >
                      Leave Priority Message →
                    </ImpeccableButton>

                    <button
                      type="button"
                      onClick={handleEndCall}
                      className="min-h-[44px] px-4 py-2.5 rounded-lg border border-white/10 hover:border-white/20 text-text-secondary hover:text-text-primary font-mono text-xs uppercase tracking-wider transition-[transform,border-color,color] duration-150 ease-out active:scale-95 touch-manipulation inline-flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-white/40"
                    >
                      Close
                    </button>
                  </div>
                </div>
              )}
            </GlassPanel>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
