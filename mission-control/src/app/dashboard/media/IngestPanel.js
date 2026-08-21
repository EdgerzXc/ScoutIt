"use client";

import { useState } from "react";
import { Copy, Check, Sparkles, ExternalLink, Link2 } from "lucide-react";
import { SCOUTIT_SCHEMA_PROMPT } from "@/lib/ingestSchema";
import { saveSynthesis, updateMedia } from "./actions";

export default function IngestPanel({ property }) {
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [json, setJson] = useState("");

  async function copyPrompt() {
    // Prompt + a compact source block so staff paste ONE thing into Claude.
    const source = [
      `--- SOURCE PROPERTY (id ${property.id}) ---`,
      property.title ? `Current title: ${property.title}` : null,
      property.location ? `Current location: ${property.location}` : null,
      property.space_category ? `Current category: ${property.space_category}` : null,
      property.media_link ? `Media / Vault link: ${property.media_link}` : null,
      property.description ? `Existing notes: ${property.description}` : null,
      "",
      "Attach or paste the owner's PDF deck / brochure text below this line, then return the JSON.",
    ]
      .filter(Boolean)
      .join("\n");

    try {
      await navigator.clipboard.writeText(`${SCOUTIT_SCHEMA_PROMPT}\n\n${source}`);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      setError("Couldn't access the clipboard — copy the prompt manually.");
    }
  }

  async function handleSynthesis(formData) {
    setSaving(true);
    setError(null);
    try {
      await saveSynthesis(formData);
      setJson("");
    } catch (e) {
      setError(e?.message || "Something went wrong applying the synthesis.");
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="mt-4 space-y-4">
      {/* Step 1: hand off to AI */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={copyPrompt}
          className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 transition-colors"
        >
          {copied ? <Check className="w-3.5 h-3.5 text-green-400" /> : <Copy className="w-3.5 h-3.5" />}
          {copied ? "Copied prompt + source" : "Copy schema prompt"}
        </button>
        {property.media_link && (
          <a
            href={property.media_link}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center gap-2 px-3 py-2 bg-black/50 hover:bg-white/5 border border-white/10 rounded-lg text-xs text-white/80 transition-colors"
          >
            <ExternalLink className="w-3.5 h-3.5" />
            Open media / Vault
          </a>
        )}
      </div>

      {/* Step 2: paste AI output back */}
      <form action={handleSynthesis} className="space-y-2">
        <input type="hidden" name="propertyId" value={property.id} />
        <textarea
          name="rawJson"
          value={json}
          onChange={(e) => setJson(e.target.value)}
          rows={5}
          placeholder='Paste the AI JSON output here, e.g. { "title": "...", "space_category": "commercial", "price": 45000000, ... }'
          className="w-full bg-black/50 border border-white/10 rounded-lg px-3 py-2 text-xs text-white font-mono placeholder:text-white/70"
        />
        <div className="flex items-center gap-3">
          <button
            disabled={saving}
            className="flex items-center gap-2 px-3 py-2 bg-[#E8AE3C] text-black rounded-lg text-xs font-medium hover:bg-[#F7C64E] transition-colors disabled:opacity-50"
          >
            <Sparkles className="w-3.5 h-3.5" />
            {saving ? "Applying…" : "Apply synthesis"}
          </button>
          <span className="text-[12px] text-white/70">
            Maps fields onto the draft and marks it ready for review. Nothing publishes yet.
          </span>
        </div>
      </form>

      {/* Inline media / Vault link editor */}
      <form action={updateMedia} className="flex items-center gap-2 pt-2 border-t border-white/5">
        <input type="hidden" name="propertyId" value={property.id} />
        <Link2 className="w-3.5 h-3.5 text-white/70 shrink-0" />
        <input
          name="media_link"
          defaultValue={property.media_link || ""}
          placeholder="Media / Spatial Vault URL"
          className="flex-1 bg-black/50 border border-white/10 rounded-lg px-3 py-1.5 text-xs text-white placeholder:text-white/70"
        />
        <button className="px-3 py-1.5 text-xs text-white/70 hover:text-white border border-white/10 rounded-lg hover:bg-white/5 transition-colors whitespace-nowrap">
          Save link
        </button>
      </form>

      {error && (
        <div className="text-xs text-red-400 bg-red-400/10 border border-red-400/20 rounded-lg p-3">
          {error}
        </div>
      )}
    </div>
  );
}
