"use client";

import { useState, useRef, useEffect, useCallback } from "react";

function formatAudioTime(seconds) {
  if (isNaN(seconds) || seconds === null || seconds === undefined) return "00:00";
  const mins = Math.floor(seconds / 60);
  const secs = Math.floor(seconds % 60);
  return `${mins.toString().padStart(2, "0")}:${secs.toString().padStart(2, "0")}`;
}

export default function VoiceNotePlayer({
  src,
  name = "Voice Memo",
  duration = null,
  size = null,
  className = "",
}) {
  const audioRef = useRef(null);
  const progressBarRef = useRef(null);

  const [isPlaying, setIsPlaying] = useState(false);
  const [currentTime, setCurrentTime] = useState(0);
  const [audioDuration, setAudioDuration] = useState(duration || 0);
  const [playbackRate, setPlaybackRate] = useState(1);
  const [loadError, setLoadError] = useState(false);

  // Sync duration prop if provided
  useEffect(() => {
    if (duration && !audioDuration) {
      setAudioDuration(duration);
    }
  }, [duration, audioDuration]);

  // Clean up audio on unmount
  useEffect(() => {
    const audio = audioRef.current;
    return () => {
      if (audio) {
        audio.pause();
        audio.src = "";
      }
    };
  }, []);

  const togglePlay = useCallback(() => {
    if (!audioRef.current || loadError) return;
    if (isPlaying) {
      audioRef.current.pause();
      setIsPlaying(false);
    } else {
      audioRef.current.play().then(() => {
        setIsPlaying(true);
      }).catch((err) => {
        console.warn("Audio playback failed:", err);
        setLoadError(true);
      });
    }
  }, [isPlaying, loadError]);

  const handleTimeUpdate = () => {
    if (audioRef.current) {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => {
    if (audioRef.current && (!audioDuration || audioDuration === 0)) {
      if (Number.isFinite(audioRef.current.duration) && audioRef.current.duration > 0) {
        setAudioDuration(audioRef.current.duration);
      }
    }
  };

  const handleEnded = () => {
    setIsPlaying(false);
    setCurrentTime(0);
  };

  const cyclePlaybackRate = () => {
    if (!audioRef.current) return;
    const rates = [1, 1.5, 2];
    const currentIndex = rates.indexOf(playbackRate);
    const nextRate = rates[(currentIndex + 1) % rates.length];
    audioRef.current.playbackRate = nextRate;
    setPlaybackRate(nextRate);
  };

  const handleSeek = (e) => {
    if (!audioRef.current || !progressBarRef.current) return;
    const rect = progressBarRef.current.getBoundingClientRect();
    const clickX = e.clientX - rect.left;
    const width = rect.width;
    const effectiveDuration = audioDuration || audioRef.current.duration || 1;
    const seekTime = Math.max(0, Math.min(effectiveDuration, (clickX / width) * effectiveDuration));
    
    audioRef.current.currentTime = seekTime;
    setCurrentTime(seekTime);
  };

  const effectiveDuration = audioDuration || 0;
  const progressPercent = effectiveDuration > 0
    ? Math.min(100, Math.max(0, (currentTime / effectiveDuration) * 100))
    : 0;

  // Format file size string (e.g. 145 KB)
  const formattedSize = size
    ? size > 1024 * 1024
      ? `${(size / (1024 * 1024)).toFixed(1)} MB`
      : `${Math.round(size / 1024)} KB`
    : null;

  return (
    <div
      className={`relative w-full max-w-[320px] rounded-xl border border-gold-accent/25 bg-surface/90 p-3 shadow-[0_8px_20px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all ${className}`}
    >
      <audio
        ref={audioRef}
        src={src}
        preload="metadata"
        onTimeUpdate={handleTimeUpdate}
        onLoadedMetadata={handleLoadedMetadata}
        onEnded={handleEnded}
        onError={() => setLoadError(true)}
      />

      {/* Header: Memo Badge & Size */}
      <div className="flex items-center justify-between pb-2 mb-2 border-b border-surface-variant/60">
        <div className="flex items-center gap-1.5">
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="text-gold-accent">
            <path d="M12 2a3 3 0 0 0-3 3v7a3 3 0 0 0 6 0V5a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
            <line x1="12" y1="19" x2="12" y2="22" />
          </svg>
          <span className="font-mono text-[12px] font-semibold uppercase tracking-wider text-gold-bright">
            Voice Memo
          </span>
        </div>
        <div className="flex items-center gap-2">
          {formattedSize && (
            <span className="font-mono text-[12px] text-text-muted">
              {formattedSize}
            </span>
          )}
          <a
            href={src}
            download={name}
            target="_blank"
            rel="noopener noreferrer"
            title="Download / Open Audio"
            className="text-text-muted hover:text-gold-accent transition-colors"
          >
            <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
              <polyline points="7 10 12 15 17 10" />
              <line x1="12" y1="15" x2="12" y2="3" />
            </svg>
          </a>
        </div>
      </div>

      {loadError ? (
        <div className="py-2 text-center text-xs font-mono text-error">
          Audio unavailable or expired
        </div>
      ) : (
        <div className="flex items-center gap-3">
          {/* Play/Pause Button */}
          <button
            type="button"
            onClick={togglePlay}
            aria-label={isPlaying ? "Pause voice note" : "Play voice note"}
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-gold-accent/40 bg-gold-accent/15 text-gold-bright shadow-[0_0_12px_rgba(var(--accent-rgb),0.15)] transition-all duration-200 hover:bg-gold-accent/25 hover:border-gold-bright active:scale-95"
          >
            {isPlaying ? (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor">
                <rect x="6" y="4" width="4" height="16" rx="1" />
                <rect x="14" y="4" width="4" height="16" rx="1" />
              </svg>
            ) : (
              <svg width="16" height="16" viewBox="0 0 24 24" fill="currentColor" className="ml-0.5">
                <polygon points="5 3 19 12 5 21 5 3" />
              </svg>
            )}
          </button>

          {/* Scrubber & Waveform */}
          <div className="flex-1 min-w-0 flex flex-col gap-1.5">
            <div
              ref={progressBarRef}
              onClick={handleSeek}
              className="relative h-4 flex items-center cursor-pointer group"
              role="progressbar"
              aria-valuenow={progressPercent}
              aria-valuemin="0"
              aria-valuemax="100"
            >
              {/* Background track */}
              <div className="h-1.5 w-full rounded-full bg-surface-variant overflow-hidden">
                {/* Active progress fill */}
                <div
                  className="h-full bg-gradient-to-r from-gold-accent to-gold-bright transition-all duration-100 ease-linear"
                  style={{ width: `${progressPercent}%` }}
                />
              </div>

              {/* Scrubber Knob */}
              <div
                className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 h-3.5 w-3.5 rounded-full border border-gold-bright bg-background shadow-md opacity-0 group-hover:opacity-100 transition-opacity"
                style={{ left: `${progressPercent}%` }}
              />
            </div>

            {/* Time Stamp & Rate Control */}
            <div className="flex items-center justify-between text-[12px] font-mono text-text-secondary">
              <span>
                {formatAudioTime(currentTime)} / {formatAudioTime(effectiveDuration)}
              </span>

              <button
                type="button"
                onClick={cyclePlaybackRate}
                className="rounded border border-surface-variant bg-surface-variant/40 px-1.5 py-0.5 text-[12px] font-bold text-gold-accent hover:border-gold-accent/40 hover:text-gold-bright transition-colors"
                title="Playback Speed"
              >
                {playbackRate}x
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
