"use client";

import React, { useRef, useState, useEffect } from "react";
import { Download, Copy, Check, Sparkles, QrCode, FileText } from "lucide-react";
import { extractFacts, factSpecs, buildMessagingDispatch } from "@/lib/shareBriefing";
import { generateQrMatrix, generateQrSvg } from "@/lib/qrCodeGenerator";

export default function LuxuryStoryStudio({ property, shareUrl, onClose }) {
  const canvasRef = useRef(null);
  const [copiedMsg, setCopiedMsg] = useState(null);
  const [isGeneratingPng, setIsGeneratingPng] = useState(false);

  const facts = extractFacts(property);
  const specs = factSpecs(facts);
  const qrSvg = generateQrSvg(shareUrl, { color: "rgb(232, 174, 60)", background: "#121212", padding: 2 });

  const handleCopyDispatch = async (platform) => {
    const text = buildMessagingDispatch(property, shareUrl, { platform });
    try {
      await navigator.clipboard.writeText(text);
      setCopiedMsg(platform);
      setTimeout(() => setCopiedMsg(null), 2500);
    } catch {
      // fallback
    }
  };

  const handleDownloadStoryCard = async () => {
    setIsGeneratingPng(true);
    try {
      const canvas = document.createElement("canvas");
      canvas.width = 1080;
      canvas.height = 1920;
      const ctx = canvas.getContext("2d");

      // Background - Deep Luxury Black
      ctx.fillStyle = "#0d0d0d";
      ctx.fillRect(0, 0, 1080, 1920);

      // Gold Perimeter Hairline
      ctx.strokeStyle = "rgba(232, 174, 60, 0.4)";
      ctx.lineWidth = 4;
      ctx.strokeRect(40, 40, 1000, 1840);

      // Inner Frame
      ctx.strokeStyle = "rgba(232, 174, 60, 0.15)";
      ctx.lineWidth = 1;
      ctx.strokeRect(60, 60, 960, 1800);

      // Header Tag
      ctx.fillStyle = "rgb(232, 174, 60)";
      ctx.font = "bold 28px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText("SCOUTIT · SPACE INTELLIGENCE", 540, 140);

      ctx.fillStyle = "#888888";
      ctx.font = "22px 'Courier New', monospace";
      ctx.fillText(shareUrl && shareUrl.includes("/via/") ? "VERIFIED VIA PARTNER DOSSIER" : "VERIFIED SPACE DOSSIER", 540, 180);

      // Hero Image or Fallback Luxury Graphic
      let heroY = 230;
      let heroHeight = 650;
      const photoUrl = property?.image || (property?.photos && property?.photos[0]) || null;

      if (photoUrl) {
        try {
          const img = new Image();
          img.crossOrigin = "anonymous";
          await new Promise((resolve, reject) => {
            img.onload = resolve;
            img.onerror = reject;
            img.src = photoUrl;
          });
          ctx.save();
          ctx.beginPath();
          ctx.rect(80, heroY, 920, heroHeight);
          ctx.clip();
          ctx.drawImage(img, 80, heroY, 920, heroHeight);
          ctx.restore();

          // Subtle Dark Vignette gradient over image bottom
          const grad = ctx.createLinearGradient(0, heroY + 400, 0, heroY + heroHeight);
          grad.addColorStop(0, "rgba(13, 13, 13, 0)");
          grad.addColorStop(1, "rgba(13, 13, 13, 0.95)");
          ctx.fillStyle = grad;
          ctx.fillRect(80, heroY, 920, heroHeight);
        } catch {
          // Fallback box
          ctx.fillStyle = "#181818";
          ctx.fillRect(80, heroY, 920, heroHeight);
        }
      } else {
        ctx.fillStyle = "#161616";
        ctx.fillRect(80, heroY, 920, heroHeight);
      }

      // Category Pill
      ctx.fillStyle = "rgba(232, 174, 60, 0.15)";
      ctx.fillRect(80, 930, 240, 48);
      ctx.strokeStyle = "rgb(232, 174, 60)";
      ctx.strokeRect(80, 930, 240, 48);
      ctx.fillStyle = "rgb(232, 174, 60)";
      ctx.font = "bold 22px 'Courier New', monospace";
      ctx.textAlign = "left";
      ctx.fillText(String(facts.category).toUpperCase(), 105, 962);

      // Property Title
      ctx.fillStyle = "#F5F1E8";
      ctx.font = "bold 56px 'Times New Roman', serif";
      ctx.fillText(facts.title.slice(0, 32), 80, 1050);

      // Location
      ctx.fillStyle = "#A0A0A0";
      ctx.font = "32px 'Courier New', monospace";
      ctx.fillText(facts.location ? String(facts.location).toUpperCase() : "PHILIPPINES", 80, 1110);

      // Specification Bullet Box
      ctx.fillStyle = "rgba(255, 255, 255, 0.03)";
      ctx.fillRect(80, 1160, 920, 280);
      ctx.strokeStyle = "rgba(255, 255, 255, 0.1)";
      ctx.strokeRect(80, 1160, 920, 280);

      ctx.fillStyle = "rgb(232, 174, 60)";
      ctx.font = "bold 26px 'Courier New', monospace";
      ctx.fillText("VERIFIED SPECIFICATIONS", 120, 1215);

      ctx.fillStyle = "#E0E0E0";
      ctx.font = "28px system-ui, -apple-system, sans-serif";
      let specY = 1265;
      specs.slice(0, 4).forEach((spec) => {
        ctx.fillText(`• ${spec.charAt(0).toUpperCase() + spec.slice(1)}`, 120, specY);
        specY += 45;
      });

      // QR Code Section at Bottom
      const qrRes = generateQrMatrix(shareUrl);
      const qrSize = qrRes.size;
      const modSize = 6;
      const qrPixelDim = qrSize * modSize;
      const qrX = 540 - qrPixelDim / 2;
      const qrY = 1490;

      ctx.fillStyle = "#121212";
      ctx.fillRect(qrX - 16, qrY - 16, qrPixelDim + 32, qrPixelDim + 32);
      ctx.strokeStyle = "rgb(232, 174, 60)";
      ctx.lineWidth = 2;
      ctx.strokeRect(qrX - 16, qrY - 16, qrPixelDim + 32, qrPixelDim + 32);

      for (let r = 0; r < qrSize; r++) {
        for (let c = 0; c < qrSize; c++) {
          if (qrRes.modules[r][c]) {
            ctx.fillStyle = "rgb(232, 174, 60)";
            ctx.fillRect(qrX + c * modSize, qrY + r * modSize, modSize, modSize);
          }
        }
      }

      ctx.fillStyle = "#A0A0A0";
      ctx.font = "bold 24px 'Courier New', monospace";
      ctx.textAlign = "center";
      ctx.fillText(shareUrl && shareUrl.includes("/via/") ? "SCAN FOR PARTNER PRIORITY DOSSIER" : "SCAN TO VIEW VERIFIED DOSSIER", 540, 1765);

      ctx.fillStyle = "#666666";
      ctx.font = "18px 'Courier New', monospace";
      ctx.fillText("www.scoutit.space", 540, 1805);

      // Trigger download
      const link = document.createElement("a");
      link.download = `${facts.title.replace(/[^a-zA-Z0-9]/g, "_")}_Story_9x16.png`;
      link.href = canvas.toDataURL("image/png");
      link.click();
    } catch (err) {
      console.error("Story Card Generation Error", err);
    } finally {
      setIsGeneratingPng(false);
    }
  };

  return (
    <div className="flex flex-col gap-6 p-4">
      {/* Messaging Dispatches */}
      <div className="flex flex-col gap-3 bg-surface-alt border border-surface-variant p-4 rounded-lg">
        <div className="flex items-center justify-between">
          <span className="text-xs font-label-caps tracking-widest text-gold-accent uppercase">
            1-Click Philippine Messaging Dispatches
          </span>
          <span className="text-xs text-text-secondary font-mono">
            {shareUrl && shareUrl.includes("/via/") ? "VIA Lead Priority Active" : "RESA RA 9646 Compliant"}
          </span>
        </div>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          <button
            type="button"
            onClick={() => handleCopyDispatch("whatsapp")}
            className="flex items-center justify-between px-3 py-2.5 rounded bg-surface border border-surface-variant hover:border-gold-accent transition text-xs font-mono text-on-surface"
          >
            <span>Copy WhatsApp Dispatch</span>
            {copiedMsg === "whatsapp" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
          <button
            type="button"
            onClick={() => handleCopyDispatch("viber")}
            className="flex items-center justify-between px-3 py-2.5 rounded bg-surface border border-surface-variant hover:border-gold-accent transition text-xs font-mono text-on-surface"
          >
            <span>Copy Viber Dispatch</span>
            {copiedMsg === "viber" ? <Check size={14} className="text-success" /> : <Copy size={14} />}
          </button>
        </div>
      </div>

      {/* 9:16 Story Studio & Standee Actions */}
      <div className="flex flex-col sm:flex-row items-center gap-6 bg-surface-alt border border-surface-variant p-4 rounded-lg">
        {/* Visual Mini Preview (9:16) */}
        <div className="w-48 h-80 bg-background border border-gold-accent/40 rounded-lg p-2.5 flex flex-col justify-between shadow-xl shrink-0 relative overflow-hidden">
          <div className="flex items-center justify-between">
            <span className="text-[12px] font-mono text-gold-accent font-bold">SCOUTIT</span>
            <span className="text-[12px] font-mono text-text-secondary uppercase">{facts.category}</span>
          </div>

          <div className="my-auto flex flex-col gap-1 text-center">
            <h4 className="text-xs font-headline-editorial text-on-surface font-bold line-clamp-2">
              {facts.title}
            </h4>
            <p className="text-[12px] text-text-secondary font-mono line-clamp-1">
              {facts.location || "Philippines"}
            </p>
          </div>

          {/* Mini QR Render */}
          <div className="w-20 h-20 mx-auto rounded border border-gold-accent/30 overflow-hidden flex items-center justify-center bg-black/60">
            <div dangerouslySetInnerHTML={{ __html: qrSvg }} className="w-16 h-16" />
          </div>

          <div className="text-center">
            <span className="text-[12px] font-mono text-gold-accent tracking-tighter">
              {shareUrl && shareUrl.includes("/via/") ? "VIA STORY CARD" : "9:16 STORY CARD"}
            </span>
          </div>
        </div>

        {/* Studio Controls */}
        <div className="flex-1 flex flex-col gap-3 w-full">
          <div>
            <h3 className="text-sm font-headline-editorial text-on-surface font-bold">
              9:16 Vertical Story Studio & Showroom Standee
            </h3>
            <p className="text-xs text-text-secondary leading-relaxed mt-1">
              Generate ultra-luxury vertical cards formatted for Instagram Stories, TikTok, Facebook Stories, and WhatsApp Status with verified specifications and a scannable gold QR code.
            </p>
          </div>

          <div className="flex flex-col gap-2 pt-2">
            <button
              type="button"
              disabled={isGeneratingPng}
              onClick={handleDownloadStoryCard}
              className="flex items-center justify-center gap-2 px-4 py-2.5 rounded bg-gold-accent text-background font-label-caps text-xs tracking-wider uppercase font-bold hover:bg-gold-bright transition shadow-md disabled:opacity-50"
            >
              <Download size={14} />
              {isGeneratingPng ? "Generating 1080×1920 PNG..." : "Download 9:16 Luxury Story Card (PNG)"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
