"use client";

import { useState } from "react";
import {
  Phone,
  Mail,
  MessageSquare,
  Sparkles,
  Search,
  CheckCircle2,
  AlertTriangle,
  Copy,
  Check,
  Building,
  Compass,
} from "lucide-react";
import {
  parseRawOutreachSnippet,
  isAgingOverdue,
  OUTREACH_TEMPLATES,
  interpolateTemplate,
} from "@/lib/outreachPolicy.mjs";
import {
  ingestOutreachLead,
  updateOutreachStatus,
  convertToClaimableDraft,
} from "./actions";

export default function OutreachClient({ initialProspects = [], staffEmail = "" }) {
  const [prospects, setProspects] = useState(initialProspects);
  const [filter, setFilter] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");

  // Intake Parser State
  const [rawInput, setRawInput] = useState("");
  const [isParsing, setIsParsing] = useState(false);
  const [parsedPreview, setParsedPreview] = useState(null);

  // Selected Prospect Drawer State
  const [selectedProspect, setSelectedProspect] = useState(null);
  const [selectedTemplateKey, setSelectedTemplateKey] = useState("template_a_owner");
  const [copiedText, setCopiedText] = useState(false);
  const [claimResult, setClaimResult] = useState(null);
  const [isGeneratingClaim, setIsGeneratingClaim] = useState(false);

  // Real-time Counts
  const counts = {
    all: prospects.length,
    discovered: prospects.filter((p) => p.status === "discovered").length,
    awaiting: prospects.filter(
      (p) => p.status === "contacted" && !isAgingOverdue(p.last_contacted_at, p.status)
    ).length,
    overdue: prospects.filter((p) => isAgingOverdue(p.last_contacted_at, p.status)).length,
    replied: prospects.filter(
      (p) => p.status === "replied" || p.status === "interested"
    ).length,
    onboarded: prospects.filter((p) => p.status === "onboarded").length,
  };

  // Filtered List
  const filteredProspects = prospects.filter((p) => {
    // Search query filter
    const matchesSearch =
      !searchQuery ||
      p.property_name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.district_city.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (p.phone_number && p.phone_number.includes(searchQuery));

    if (!matchesSearch) return false;

    if (filter === "all") return true;
    if (filter === "discovered") return p.status === "discovered";
    if (filter === "awaiting")
      return p.status === "contacted" && !isAgingOverdue(p.last_contacted_at, p.status);
    if (filter === "overdue") return isAgingOverdue(p.last_contacted_at, p.status);
    if (filter === "replied") return p.status === "replied" || p.status === "interested";
    if (filter === "onboarded") return p.status === "onboarded";
    return true;
  });

  // Handle Raw Text Parse Preview
  const handleInputPasteChange = (text) => {
    setRawInput(text);
    if (text.trim().length > 10) {
      const parsed = parseRawOutreachSnippet(text);
      setParsedPreview(parsed);
    } else {
      setParsedPreview(null);
    }
  };

  // Submit New Ingested Lead
  const handleIngestLead = async () => {
    if (!parsedPreview || !parsedPreview.propertyName) return;
    setIsParsing(true);
    try {
      const res = await ingestOutreachLead(rawInput);
      if (res.success && res.prospect) {
        setProspects([res.prospect, ...prospects]);
        setRawInput("");
        setParsedPreview(null);
      }
    } catch (err) {
      console.error("Ingest failed:", err);
    } finally {
      setIsParsing(false);
    }
  };

  // Update Status
  const handleStatusChange = async (prospectId, newStatus) => {
    try {
      await updateOutreachStatus(prospectId, newStatus);
      setProspects((prev) =>
        prev.map((p) => {
          if (p.id !== prospectId) return p;
          const updated = { ...p, status: newStatus };
          if (newStatus === "contacted") {
            updated.last_contacted_at = new Date().toISOString();
            updated.touchpoint_count = (updated.touchpoint_count || 0) + 1;
          } else if (newStatus === "replied") {
            updated.replied_at = new Date().toISOString();
          }
          return updated;
        })
      );
      if (selectedProspect && selectedProspect.id === prospectId) {
        setSelectedProspect((prev) => ({
          ...prev,
          status: newStatus,
          last_contacted_at:
            newStatus === "contacted" ? new Date().toISOString() : prev.last_contacted_at,
        }));
      }
    } catch (err) {
      console.error("Status update error:", err);
    }
  };

  // Convert to Claimable Draft Listing
  const handleGenerateClaim = async () => {
    if (!selectedProspect) return;
    setIsGeneratingClaim(true);
    try {
      const res = await convertToClaimableDraft(selectedProspect);
      if (res.success) {
        setClaimResult(res);
        handleStatusChange(selectedProspect.id, "onboarded");
      }
    } catch (err) {
      console.error("Claim draft generation error:", err);
    } finally {
      setIsGeneratingClaim(false);
    }
  };

  // Active Template Interpolation
  const activeTemplate = selectedProspect
    ? interpolateTemplate(selectedTemplateKey, {
        propertyName: selectedProspect.property_name,
        contactName: selectedProspect.contact_name || "Sir/Ma'am",
        district: selectedProspect.district_city || "Metro Manila",
        senderName: staffEmail.split("@")[0] || "ScoutIt Operations",
      })
    : null;

  const handleCopyTemplate = () => {
    if (!activeTemplate) return;
    const textToCopy = `Subject: ${activeTemplate.subject}\n\n${activeTemplate.body}`;
    navigator.clipboard.writeText(textToCopy);
    setCopiedText(true);
    setTimeout(() => setCopiedText(false), 2000);
  };

  return (
    <div className="space-y-6">
      {/* Telemetry Filter Rail */}
      <div className="flex flex-wrap items-center gap-2 border-b border-line pb-4">
        {[
          { key: "all", label: "All Prospects", count: counts.all },
          { key: "discovered", label: "Needs First Touch", count: counts.discovered },
          { key: "awaiting", label: "Awaiting Reply (<72h)", count: counts.awaiting },
          {
            key: "overdue",
            label: "Overdue Follow-up (>72h)",
            count: counts.overdue,
            isAlert: true,
          },
          { key: "replied", label: "Replied / Engaged", count: counts.replied },
          { key: "onboarded", label: "Onboarded", count: counts.onboarded },
        ].map((item) => {
          const isSelected = filter === item.key;
          return (
            <button
              key={item.key}
              type="button"
              onClick={() => setFilter(item.key)}
              className={`flex items-center gap-2 px-3.5 py-1.5 rounded-full text-xs font-mono tracking-wider uppercase transition-all duration-150 ${
                isSelected
                  ? "bg-gold text-black font-bold shadow-[0_0_12px_rgba(232,174,60,0.3)]"
                  : item.isAlert && item.count > 0
                  ? "bg-amber-950/40 border border-amber-600/60 text-amber-300 font-semibold animate-pulse"
                  : "bg-surface border border-line text-white/70 hover:text-white hover:border-white/20"
              }`}
            >
              <span>{item.label}</span>
              <span
                className={`px-1.5 py-0.2 rounded-full text-xs font-mono ${
                  isSelected ? "bg-black/20 text-black" : "bg-black/40 text-gold"
                }`}
              >
                {item.count}
              </span>
            </button>
          );
        })}
      </div>

      {/* 1-Click Smart Intake Parser Banner */}
      <div className="p-5 rounded-xl border border-line bg-surface/60 backdrop-blur-md space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-mono text-gold uppercase tracking-wider font-bold">
            <Sparkles className="w-4 h-4 text-gold" />
            <span>Smart Intake Parser (1-Click Google Maps / Signage Ingestion)</span>
          </div>
          <span className="text-xs font-mono text-white/70 uppercase">
            Auto Regex: Lat/Lng, PH Phone, District
          </span>
        </div>

        <div className="flex flex-col md:flex-row gap-3">
          <textarea
            value={rawInput}
            onChange={(e) => handleInputPasteChange(e.target.value)}
            rows={2}
            placeholder="Paste Google Maps share link or listing text snippet here (e.g. 'One Ayala Corporate Center, Makati 0917-123-4567 https://maps.app.goo.gl/...')"
            className="flex-1 bg-black/50 border border-line rounded-lg p-2.5 text-xs font-mono text-white placeholder-white/30 focus:border-gold focus:outline-none"
          />

          <button
            type="button"
            disabled={!parsedPreview || isParsing}
            onClick={handleIngestLead}
            className="px-5 py-2.5 rounded-lg bg-gold hover:bg-gold/90 disabled:opacity-40 disabled:hover:bg-gold text-black font-mono text-xs font-bold uppercase tracking-wider flex items-center justify-center gap-2 shrink-0 transition-all duration-150"
          >
            {isParsing ? "Ingesting…" : "Add to Queue"}
          </button>
        </div>

        {/* Live Regex Parse Preview */}
        {parsedPreview && (
          <div className="p-3 rounded-lg bg-black/40 border border-gold/30 text-xs font-mono text-white/80 grid grid-cols-2 md:grid-cols-4 gap-2">
            <div>
              <span className="text-white/70 block text-xs">PARSED NAME:</span>
              <span className="text-gold font-semibold truncate block">
                {parsedPreview.propertyName}
              </span>
            </div>
            <div>
              <span className="text-white/70 block text-xs">DISTRICT / CITY:</span>
              <span className="text-white truncate block">{parsedPreview.districtCity}</span>
            </div>
            <div>
              <span className="text-white/70 block text-xs">COORDINATES:</span>
              <span className="text-white truncate block">
                {parsedPreview.coordinates
                  ? `${parsedPreview.coordinates.latitude}, ${parsedPreview.coordinates.longitude}`
                  : "None detected"}
              </span>
            </div>
            <div>
              <span className="text-white/70 block text-xs">CONTACT PHONE:</span>
              <span className="text-emerald-400 truncate block">
                {parsedPreview.phoneNumber || "None detected"}
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Prospect Search & Table Toolbar */}
      <div className="flex items-center justify-between gap-4">
        <div className="relative flex-1 max-w-sm">
          <Search className="absolute left-3 top-2.5 w-4 h-4 text-white/70" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search property, city, or phone…"
            className="w-full bg-surface border border-line rounded-lg pl-9 pr-3 py-2 text-xs font-mono text-white placeholder-white/30 focus:border-gold focus:outline-none"
          />
        </div>
        <div className="text-xs font-mono text-white/70">
          Showing <span className="text-white font-bold">{filteredProspects.length}</span> leads
        </div>
      </div>

      {/* Prospects Table */}
      <div className="rounded-xl border border-line bg-surface overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs font-mono">
            <thead className="bg-black/40 border-b border-line text-white/70 uppercase text-xs tracking-wider">
              <tr>
                <th className="p-3.5">Property / Address</th>
                <th className="p-3.5">District</th>
                <th className="p-3.5">Contact Lead</th>
                <th className="p-3.5">Pipeline Status</th>
                <th className="p-3.5 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-line">
              {filteredProspects.map((prospect) => {
                const isOverdue = isAgingOverdue(prospect.last_contacted_at, prospect.status);
                const isSelected = selectedProspect?.id === prospect.id;

                return (
                  <tr
                    key={prospect.id}
                    onClick={() => {
                      setSelectedProspect(prospect);
                      setClaimResult(null);
                    }}
                    className={`hover:bg-white/[0.03] cursor-pointer transition-colors ${
                      isSelected ? "bg-gold/10" : ""
                    } ${isOverdue ? "bg-amber-950/20" : ""}`}
                  >
                    {/* Property / Address */}
                    <td className="p-3.5">
                      <div className="font-semibold text-white flex items-center gap-1.5">
                        <Building className="w-3.5 h-3.5 text-gold shrink-0" />
                        <span className="truncate max-w-[240px]">{prospect.property_name}</span>
                      </div>
                      <div className="text-xs text-white/70 truncate max-w-[280px]">
                        {prospect.property_address || "No address supplied"}
                      </div>
                    </td>

                    {/* District */}
                    <td className="p-3.5">
                      <span className="px-2 py-0.5 rounded border border-line bg-black/30 text-white/80">
                        {prospect.district_city}
                      </span>
                    </td>

                    {/* Contact Lead */}
                    <td className="p-3.5">
                      <div className="text-white/90">{prospect.contact_name || "Admin"}</div>
                      <div className="text-xs text-emerald-400">
                        {prospect.phone_number || prospect.email || "No direct phone"}
                      </div>
                    </td>

                    {/* Status Badge & Aging */}
                    <td className="p-3.5">
                      <div className="flex items-center gap-1.5 flex-wrap">
                        <span
                          className={`px-2 py-0.5 rounded-full text-xs font-bold uppercase tracking-wider ${
                            prospect.status === "onboarded"
                              ? "bg-emerald-950 text-emerald-400 border border-emerald-800"
                              : prospect.status === "replied"
                              ? "bg-blue-950 text-blue-400 border border-blue-800"
                              : prospect.status === "contacted"
                              ? "bg-amber-950/60 text-amber-400 border border-amber-800"
                              : "bg-neutral-800 text-neutral-300"
                          }`}
                        >
                          {prospect.status}
                        </span>

                        {isOverdue && (
                          <span className="px-2 py-0.5 rounded-full bg-red-950/80 text-red-400 border border-red-700 text-xs font-bold uppercase tracking-wider flex items-center gap-1 animate-pulse">
                            <AlertTriangle className="w-3 h-3" />
                            Overdue (&gt;72h)
                          </span>
                        )}
                      </div>
                      <div className="text-xs text-white/70 mt-1">
                        Touchpoints: {prospect.touchpoint_count || 0}
                      </div>
                    </td>

                    {/* Quick Action */}
                    <td className="p-3.5 text-right">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setSelectedProspect(prospect);
                          setClaimResult(null);
                        }}
                        className="px-3 py-1 rounded border border-line bg-surface hover:border-gold hover:text-gold text-white/70 transition-colors"
                      >
                        Inspect Dossier →
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Outreach Drawer / Detail Modal */}
      {selectedProspect && (
        <div className="p-6 rounded-2xl border border-line bg-surface space-y-6 shadow-2xl">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-line pb-4">
            <div>
              <div className="text-xs font-mono text-gold uppercase tracking-wider font-bold mb-1">
                PROSPECT DOSSIER // {selectedProspect.id}
              </div>
              <h2 className="text-xl font-bold text-white flex items-center gap-2">
                <span>{selectedProspect.property_name}</span>
                <span className="text-xs px-2 py-0.5 rounded border border-line text-white/60 font-mono">
                  {selectedProspect.district_city}
                </span>
              </h2>
              <p className="text-xs text-white/70 font-mono mt-1">
                {selectedProspect.property_address}
              </p>
            </div>

            {/* Quick Multi-Channel Launchers */}
            <div className="flex items-center gap-2">
              {selectedProspect.phone_number && (
                <a
                  href={`https://wa.me/63${selectedProspect.phone_number.replace(/^0/, "")}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={() => handleStatusChange(selectedProspect.id, "contacted")}
                  className="px-3 py-1.5 rounded-lg bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 hover:bg-emerald-600/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <MessageSquare className="w-3.5 h-3.5" />
                  <span>WhatsApp</span>
                </a>
              )}
              {selectedProspect.phone_number && (
                <a
                  href={`viber://chat?number=63${selectedProspect.phone_number.replace(/^0/, "")}`}
                  onClick={() => handleStatusChange(selectedProspect.id, "contacted")}
                  className="px-3 py-1.5 rounded-lg bg-purple-600/20 border border-purple-500/40 text-purple-400 hover:bg-purple-600/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Phone className="w-3.5 h-3.5" />
                  <span>Viber / Call</span>
                </a>
              )}
              {selectedProspect.email && (
                <a
                  href={`mailto:${selectedProspect.email}?subject=${encodeURIComponent(
                    activeTemplate?.subject || ""
                  )}&body=${encodeURIComponent(activeTemplate?.body || "")}`}
                  onClick={() => handleStatusChange(selectedProspect.id, "contacted")}
                  className="px-3 py-1.5 rounded-lg bg-blue-600/20 border border-blue-500/40 text-blue-400 hover:bg-blue-600/30 text-xs font-mono font-bold uppercase tracking-wider flex items-center gap-1.5"
                >
                  <Mail className="w-3.5 h-3.5" />
                  <span>Email</span>
                </a>
              )}
            </div>
          </div>

          {/* Template Sequence Picker & Variable Interpolator */}
          <div className="space-y-3">
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="text-gold uppercase font-bold">
                Pre-Written Philippine Outreach Sequences
              </span>
              <button
                type="button"
                onClick={handleCopyTemplate}
                className="px-3 py-1 rounded bg-black/40 border border-line hover:border-gold text-white text-xs font-mono flex items-center gap-1.5 transition-colors"
              >
                {copiedText ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-400" />
                    <span className="text-emerald-400">Copied to Clipboard!</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5" />
                    <span>Copy Message</span>
                  </>
                )}
              </button>
            </div>

            {/* Template Selector Tabs */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2">
              {Object.entries(OUTREACH_TEMPLATES).map(([key, tpl]) => (
                <button
                  key={key}
                  type="button"
                  onClick={() => setSelectedTemplateKey(key)}
                  className={`p-2.5 rounded-lg border text-left text-xs font-mono transition-all ${
                    selectedTemplateKey === key
                      ? "bg-gold/15 border-gold text-white font-semibold"
                      : "bg-black/30 border-line text-white/60 hover:border-white/20"
                  }`}
                >
                  <div className="truncate">{tpl.name}</div>
                </button>
              ))}
            </div>

            {/* Message Preview Box */}
            {activeTemplate && (
              <div className="p-4 rounded-xl bg-black/60 border border-line text-xs font-mono space-y-2">
                <div className="text-white/70">
                  <strong className="text-white/80">SUBJECT:</strong> {activeTemplate.subject}
                </div>
                <div className="text-white/80 whitespace-pre-line leading-relaxed pt-2 border-t border-line/60">
                  {activeTemplate.body}
                </div>
              </div>
            )}
          </div>

          {/* 1-Click Conversion Bridge (Claimable Draft Listing) */}
          <div className="p-5 rounded-xl border border-line bg-gradient-to-r from-gold/10 to-transparent flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <div className="text-xs font-mono text-gold uppercase font-bold flex items-center gap-1.5">
                <Compass className="w-4 h-4 text-gold" />
                <span>1-Click Conversion Bridge</span>
              </div>
              <p className="text-xs text-white/70 font-mono mt-1">
                Converts this lead into a private claimable draft listing in Supabase with a secure one-time onboarding link.
              </p>
            </div>

            <button
              type="button"
              disabled={isGeneratingClaim || selectedProspect.status === "onboarded"}
              onClick={handleGenerateClaim}
              className="min-h-[44px] px-5 py-2.5 rounded-lg bg-gold hover:bg-gold/90 disabled:opacity-40 text-black font-mono text-xs font-bold uppercase tracking-wider shrink-0 shadow-[0_0_16px_rgba(232,174,60,0.25)] transition-all inline-flex items-center justify-center gap-1.5 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold"
            >
              {isGeneratingClaim ? (
                "Generating…"
              ) : selectedProspect.status === "onboarded" ? (
                "Already Onboarded"
              ) : (
                <>
                  <Sparkles className="w-3.5 h-3.5 text-black" />
                  <span>Generate Claimable Draft</span>
                </>
              )}
            </button>
          </div>

          {/* Claim Link Reveal */}
          {claimResult && (
            <div className="p-4 rounded-xl bg-emerald-950/40 border border-emerald-600/60 text-xs font-mono text-emerald-300 space-y-2">
              <div className="font-bold flex items-center gap-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
                <span>Claimable Listing Generated Successfully!</span>
              </div>
              <div className="p-2.5 rounded bg-black/50 border border-emerald-800/40 select-all font-mono text-white">
                {claimResult.claimUrl}
              </div>
              <p className="text-xs text-emerald-400/80">
                Send this link to the property owner or leasing desk. When opened, they can claim and publish their listing directly.
              </p>
            </div>
          )}

          {/* Pipeline State Actions */}
          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-line pt-4 text-xs font-mono">
            <span className="text-white/70 uppercase">MANUAL STATUS OVERRIDE:</span>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={() => handleStatusChange(selectedProspect.id, "contacted")}
                className="min-h-[44px] px-3.5 py-2 rounded bg-black/30 border border-line hover:border-gold text-white/80 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-gold"
              >
                Mark Contacted
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(selectedProspect.id, "replied")}
                className="min-h-[44px] px-3.5 py-2 rounded bg-black/30 border border-line hover:border-blue-400 text-blue-300 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-blue-400"
              >
                Mark Replied
              </button>
              <button
                type="button"
                onClick={() => handleStatusChange(selectedProspect.id, "onboarded")}
                className="min-h-[44px] px-3.5 py-2 rounded bg-black/30 border border-line hover:border-emerald-400 text-emerald-300 inline-flex items-center justify-center transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-emerald-400"
              >
                Mark Onboarded
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
