"use client";

import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { X, CheckCircle2, ShieldCheck, AlertCircle } from "lucide-react";

const ROLE_CONFIGS = {
  owner: {
    title: "Property Owner & Developer",
    badge: "Asset Management",
    desc: "List commercial & residential spaces, review inquiries, and publish to the verified directory.",
    winWinNotice: "Next of Kin / Co-Manager Attestation ensures asset continuity, prevents stranded listings, and provides an authorized escalation contact if you are unreachable.",
    fields: [
      {
        key: "ownerEntityType",
        label: "Ownership Structure",
        type: "select",
        options: [
          { value: "individual", label: "Individual / Family Private Asset" },
          { value: "corporate", label: "Corporate Developer / Asset Management Firm" },
        ],
        required: true,
      },
      {
        key: "nextOfKinName",
        label: "Next of Kin / Co-Manager Full Name",
        type: "text",
        placeholder: "e.g. Maria Santos Guerra",
        required: true,
      },
      {
        key: "nextOfKinRelationship",
        label: "Relationship to Owner",
        type: "text",
        placeholder: "e.g. Co-Owner, Spouse, Managing Partner, Heir, Legal Counsel",
        required: true,
      },
      {
        key: "nextOfKinPhone",
        label: "Emergency Phone / WhatsApp",
        type: "tel",
        placeholder: "+63 9XX XXX XXXX",
        required: true,
      },
    ],
  },
  salesperson: {
    title: "Real Estate Salesperson",
    badge: "R.A. 9646 Compliance",
    desc: "Represent spaces, conduct viewings, and manage buyer inquiries under accredited broker supervision.",
    winWinNotice: "Linking your supervising broker's PRC license unlocks full sales workspace authority while keeping your client representations compliant with Philippine Real Estate Service Act.",
    fields: [
      {
        key: "supervisingBrokerName",
        label: "Supervising Broker Name or Firm",
        type: "text",
        placeholder: "e.g. Arch. Roberto Silva (Prime Realty)",
        required: true,
      },
      {
        key: "supervisingBrokerPrc",
        label: "Supervising Broker PRC License #",
        type: "text",
        placeholder: "e.g. 0012345",
        required: true,
      },
      {
        key: "salespersonAccreditation",
        label: "Salesperson PRC / DTI Accreditation #",
        type: "text",
        placeholder: "e.g. SP-2026-9876",
        required: true,
      },
    ],
  },
  operator: {
    title: "Co-Operator & Facilities",
    badge: "Operations Desk",
    desc: "Manage building operations, access permissions, maintenance requests, and shared facilities.",
    winWinNotice: "Connecting your managed complex and operations desk phone allows tenants and building guests to direct operational requests to your team immediately.",
    fields: [
      {
        key: "operatingEntity",
        label: "Operating Entity / Company Name",
        type: "text",
        placeholder: "e.g. KMC Community / Acceler8 Coworking",
        required: true,
      },
      {
        key: "managedComplex",
        label: "Primary Managed Building / Complex",
        type: "text",
        placeholder: "e.g. High Street South Corporate Plaza",
        required: true,
      },
      {
        key: "escalationPhone",
        label: "Operations Desk / Escalation Phone",
        type: "tel",
        placeholder: "+63 2 8XXX XXXX or +63 9XX XXX XXXX",
        required: true,
      },
    ],
  },
  photographer: {
    title: "Spatial Photographer",
    badge: "Creative Network",
    desc: "Receive client bookings, stage property imagery, and claim QuestIT bounties across the country.",
    winWinNotice: "Showcasing your equipment and verified portfolio lets owners commission high-value photo assignments with transparent escrow payouts.",
    fields: [
      {
        key: "gearDescription",
        label: "Primary Camera & Drone Equipment",
        type: "text",
        placeholder: "e.g. Sony A7IV 16-35mm f/2.8, DJI Mini 4 Pro, Matterport Pro3",
        required: true,
      },
      {
        key: "portfolioUrl",
        label: "Portfolio URL or Instagram Handle",
        type: "text",
        placeholder: "https://instagram.com/yourhandle or portfolio link",
        required: true,
      },
      {
        key: "locationCoverage",
        label: "Primary Geographic Coverage",
        type: "text",
        placeholder: "e.g. Metro Manila, Cebu, Siargao",
        required: true,
      },
    ],
  },
  designer: {
    title: "Event & Concept Designer",
    badge: "Spatial Staging",
    desc: "Design bespoke event pop-ups, retail activations, luxury weddings, and architectural concepts.",
    winWinNotice: "Your design lookbook helps space owners and corporate organizers discover your spatial concepts and book consultations directly.",
    fields: [
      {
        key: "designSpecialty",
        label: "Design Specialty",
        type: "text",
        placeholder: "e.g. Luxury Commercial Pop-ups, Gala Events, Spatial Staging",
        required: true,
      },
      {
        key: "lookbookUrl",
        label: "Lookbook or Digital Portfolio URL",
        type: "text",
        placeholder: "https://yourportfolio.com or Behance link",
        required: true,
      },
      {
        key: "studioName",
        label: "Studio or Brand Name",
        type: "text",
        placeholder: "e.g. Studio Atelier Manila",
        required: true,
      },
    ],
  },
  broker: {
    title: "Accredited Real Estate Broker",
    badge: "PRC Licensed",
    desc: "Direct listing authority, deal room representation, and broker pipeline management.",
    winWinNotice: "Entering your official PRC broker license gives you verified broker status and priority deal room access.",
    fields: [
      {
        key: "prcLicense",
        label: "PRC Broker License Number",
        type: "text",
        placeholder: "7 or 8 digits (e.g. 0012345)",
        required: true,
      },
    ],
  },
};

export default function RoleActivationModal({ role, isOpen, onClose, onSuccess }) {
  const config = ROLE_CONFIGS[role];
  const [formData, setFormData] = useState({});
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  useEffect(() => {
    if (role && config) {
      const initial = {};
      config.fields.forEach((f) => {
        initial[f.key] = f.type === "select" ? f.options[0]?.value : "";
      });
      setFormData(initial);
      setErrorMsg("");
      setSuccessMsg("");
    }
  }, [role, config]);

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape" && isOpen) onClose();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "hidden";
    }
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
      document.body.style.overflow = "";
    };
  }, [isOpen, onClose]);

  if (!isOpen || !config) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMsg("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session?.access_token) {
        throw new Error("Please sign in to activate workspaces.");
      }

      const res = await fetch("/api/user/activate-role", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({
          role,
          data: formData,
        }),
      });

      const json = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(json.error || "Failed to activate workspace.");
      }

      setSuccessMsg(`${config.title} workspace successfully activated!`);
      
      // Dispatch profile update so headers and bottom nav update dynamically
      window.dispatchEvent(new CustomEvent("scoutit:profile-updated"));
      
      setTimeout(() => {
        if (onSuccess) onSuccess(role);
        onClose();
      }, 1200);
    } catch (err) {
      setErrorMsg(err.message || "Failed to activate workspace.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-[9999] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-[fadeIn_0.2s_ease-out]"
      onClick={onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby="role-modal-title"
    >
      <div
        className="relative w-full max-w-lg bg-[#121212] border border-[#2b2b2b] rounded-xl shadow-2xl p-6 md:p-8 overflow-hidden max-h-[90vh] flex flex-col"
        onClick={(e) => e.stopPropagation()}
        style={{
          boxShadow: "0 20px 40px -15px rgba(0, 0, 0, 0.8), 0 0 30px -10px rgba(232, 174, 60, 0.15)",
        }}
      >
        {/* Top Header */}
        <div className="flex items-start justify-between gap-3 pb-4 border-b border-surface-variant">
          <div>
            <div className="flex items-center gap-2 mb-1.5">
              <span className="font-mono text-[11px] uppercase tracking-widest text-gold-accent px-2 py-0.5 rounded border border-gold-accent/40 bg-gold-accent/10">
                {config.badge}
              </span>
              <span className="font-mono text-[11px] uppercase tracking-wider text-text-muted">
                Workspace Setup
              </span>
            </div>
            <h2 id="role-modal-title" className="text-xl md:text-2xl font-working-title text-on-surface">
              {config.title}
            </h2>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="w-11 h-11 rounded-lg flex items-center justify-center text-text-secondary hover:text-on-surface hover:bg-surface transition shrink-0"
            aria-label="Close modal"
          >
            <X size={20} />
          </button>
        </div>

        {/* Content Body */}
        <div className="overflow-y-auto py-4 flex-1 pr-1">
          <p className="text-sm text-text-secondary leading-relaxed mb-4">
            {config.desc}
          </p>

          {/* Win-Win Trust Banner */}
          <div className="p-4 rounded-lg bg-gold-accent/5 border border-gold-accent/25 flex items-start gap-3 mb-6">
            <ShieldCheck className="text-gold-accent shrink-0 mt-0.5" size={18} />
            <div className="text-xs text-text-secondary leading-relaxed">
              <strong className="text-gold-accent block mb-0.5">Trust &amp; Mutual Protection:</strong>
              {config.winWinNotice}
            </div>
          </div>

          {errorMsg && (
            <div className="p-3 rounded bg-red-950/40 border border-red-500/40 text-red-200 text-xs flex items-center gap-2 mb-4">
              <AlertCircle size={16} className="shrink-0 text-red-400" />
              <span>{errorMsg}</span>
            </div>
          )}

          {successMsg && (
            <div className="p-4 rounded bg-emerald-950/40 border border-emerald-500/40 text-emerald-200 text-sm flex items-center gap-2 mb-4">
              <CheckCircle2 size={18} className="shrink-0 text-emerald-400" />
              <span className="font-semibold">{successMsg}</span>
            </div>
          )}

          <form id="role-activation-form" onSubmit={handleSubmit} className="flex flex-col gap-4">
            {config.fields.map((field) => (
              <div key={field.key} className="flex flex-col gap-1.5">
                <label className="text-xs font-mono uppercase tracking-wider text-text-secondary flex items-center justify-between">
                  <span>{field.label}</span>
                  {field.required && <span className="text-gold-accent">*</span>}
                </label>
                {field.type === "select" ? (
                  <select
                    className="w-full bg-[#181818] border border-surface-variant rounded px-3.5 py-3 text-sm text-on-surface focus:outline-none focus:border-gold-accent transition"
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  >
                    {field.options.map((opt) => (
                      <option key={opt.value} value={opt.value}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type}
                    required={field.required}
                    placeholder={field.placeholder}
                    className="w-full bg-[#181818] border border-surface-variant rounded px-3.5 py-3 text-sm text-on-surface placeholder:text-text-muted focus:outline-none focus:border-gold-accent transition"
                    value={formData[field.key] || ""}
                    onChange={(e) => setFormData({ ...formData, [field.key]: e.target.value })}
                  />
                )}
              </div>
            ))}
          </form>
        </div>

        {/* Modal Footer */}
        <div className="pt-4 border-t border-surface-variant flex items-center justify-end gap-3 shrink-0">
          <button
            type="button"
            onClick={onClose}
            className="min-h-[44px] px-4 rounded text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-on-surface hover:bg-surface transition"
            disabled={loading}
          >
            Cancel
          </button>
          <button
            type="submit"
            form="role-activation-form"
            disabled={loading || !!successMsg}
            className="min-h-[44px] px-6 rounded bg-gold-accent hover:bg-gold-bright text-black font-working-title font-bold text-sm uppercase tracking-wider transition disabled:opacity-50 flex items-center gap-2"
          >
            {loading ? "Activating…" : successMsg ? "Activated ✓" : `Activate ${config.title} →`}
          </button>
        </div>
      </div>
    </div>
  );
}
