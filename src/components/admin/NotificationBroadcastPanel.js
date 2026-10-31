"use client";

import { useState, useEffect, useCallback } from "react";
import { 
  Send, 
  Radio, 
  Users, 
  User, 
  ShieldAlert, 
  Bell, 
  Sparkles, 
  CheckCircle2, 
  AlertTriangle, 
  ExternalLink, 
  Search, 
  RefreshCw,
  Mail,
  HelpCircle,
  MessageSquare
} from "lucide-react";
import { sanitizeError } from "@/lib/sanitizeError";
import InfoTip from "@/components/ui/InfoTip";

const PRESET_TEMPLATES = [
  {
    id: "dispute",
    label: "Dispute / Retention Hold",
    icon: "shield",
    type: "dispute_notice",
    title: "Notice: Transaction thread placed on retention hold",
    message: "A formal dispute notice or inquiry has been received regarding this transaction. All message logs and assets have been placed on retention hold pending review by Trust & Safety.",
    link: "/dashboard/inbox",
    forceEmail: true,
  },
  {
    id: "system",
    label: "Platform Maintenance",
    icon: "radio",
    type: "system_broadcast",
    title: "Scheduled System Maintenance Notice",
    message: "ScoutIt spatial rendering engines will undergo routine security enhancements tonight between 02:00 and 03:00 UTC. The platform remains operational.",
    link: "/dashboard",
    forceEmail: false,
  },
  {
    id: "promo",
    label: "Pioneer Access Bonus",
    icon: "gift",
    type: "promotional",
    title: "Pioneer Access: Free Connects credited to your account",
    message: "Thank you for piloting ScoutIt Space Intelligence. Your account has been credited with complimentary Pioneer Connects to explore high-tier off-market dossiers.",
    link: "/pricing",
    forceEmail: false,
  },
  {
    id: "prc",
    label: "RESA Compliance Notice",
    icon: "alert",
    type: "staff_notice",
    title: "Action Required: Re-confirm your PRC license credentials",
    message: "Under R.A. 9646 statutory requirements, all active listing representations require a valid, non-expired PRC license on file. Please update your verification in Settings.",
    link: "/settings#verification",
    forceEmail: true,
  },
  {
    id: "concierge",
    label: "Direct Concierge Outreach",
    icon: "chat",
    type: "admin_direct",
    title: "ScoutIt Concierge: A note from our advisory team",
    message: "Our specialist team reviewed your portfolio preferences. We have prepared bespoke spatial dossiers matching your requirements in Bonifacio Global City.",
    link: "/dashboard/inbox",
    forceEmail: false,
  },
];

const renderIconBadge = (iconKey) => {
  switch (iconKey) {
    case "shield":
      return <ShieldAlert size={16} className="text-gold-bright" />;
    case "radio":
      return <Radio size={16} className="text-gold-bright" />;
    case "gift":
      return <Sparkles size={16} className="text-gold-bright" />;
    case "alert":
      return <AlertTriangle size={16} className="text-gold-bright" />;
    case "chat":
      return <MessageSquare size={16} className="text-gold-bright" />;
    default:
      return <Bell size={16} className="text-gold-bright" />;
  }
};

export default function NotificationBroadcastPanel({ authHeaders }) {
  const [targetType, setTargetType] = useState("broadcast"); // "broadcast" | "role" | "targeted"
  const [targetRole, setTargetRole] = useState("broker");
  const [targetUserIds, setTargetUserIds] = useState("");
  const [selectedUserObj, setSelectedUserObj] = useState(null);

  // Form state
  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [notificationType, setNotificationType] = useState("staff_notice");
  const [icon, setIcon] = useState("radio");
  const [link, setLink] = useState("/dashboard/inbox");
  const [forceEmail, setForceEmail] = useState(false);

  // Data & loading state
  const [totalUsers, setTotalUsers] = useState(0);
  const [recentBroadcasts, setRecentBroadcasts] = useState([]);
  const [availableUsers, setAvailableUsers] = useState([]);
  const [userSearchQuery, setUserSearchQuery] = useState("");
  const [loading, setLoading] = useState(true);
  const [dispatching, setDispatching] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [statusFeedback, setStatusFeedback] = useState(null); // { type: 'success' | 'error', text: '' }

  const fetchData = useCallback(async () => {
    setLoading(true);
    setStatusFeedback(null);
    try {
      const headers = await authHeaders();
      const res = await fetch(`/api/admin/notifications?q=${encodeURIComponent(userSearchQuery)}`, { headers });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Failed to load broadcast telemetry");
      setTotalUsers(data.totalUsers || 0);
      setRecentBroadcasts(data.recentBroadcasts || []);
      setAvailableUsers(data.availableUsers || []);
    } catch (err) {
      console.error("[NotificationBroadcastPanel] Load error:", err);
      setStatusFeedback({ type: "error", text: sanitizeError(err) });
    } finally {
      setLoading(false);
    }
  }, [authHeaders, userSearchQuery]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const applyPreset = (preset) => {
    setTitle(preset.title);
    setMessage(preset.message);
    setNotificationType(preset.type);
    setIcon(preset.icon);
    setLink(preset.link);
    setForceEmail(preset.forceEmail);
  };

  const handleSelectUser = (user) => {
    setSelectedUserObj(user);
    setTargetUserIds(user.id);
  };

  const handleDispatch = async () => {
    setDispatching(true);
    setStatusFeedback(null);
    setShowConfirmModal(false);

    try {
      const headers = await authHeaders();
      const payload = {
        targetType,
        targetRole: targetType === "role" ? targetRole : undefined,
        targetUserIds: targetType === "targeted" 
          ? targetUserIds.split(",").map(s => s.trim()).filter(Boolean)
          : undefined,
        title,
        message,
        notificationType,
        icon,
        link: link.trim() || undefined,
        forceEmail,
      };

      const res = await fetch("/api/admin/notifications", {
        method: "POST",
        headers,
        body: JSON.stringify(payload),
      });

      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Failed to dispatch notification");

      setStatusFeedback({
        type: "success",
        text: `Successfully dispatched "${title}" to ${result.count} active recipient(s) via ${targetType}.`,
      });

      // Clear message content but retain configuration
      setTitle("");
      setMessage("");
      fetchData();
    } catch (err) {
      console.error("[NotificationBroadcastPanel] Dispatch error:", err);
      setStatusFeedback({ type: "error", text: sanitizeError(err) });
    } finally {
      setDispatching(false);
    }
  };

  return (
    <div className="space-y-8 animate-fadeIn">
      {/* Header telemetry badge */}
      <div className="bg-surface border border-surface-variant rounded-xl p-6 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-gold-accent/5 rounded-full blur-3xl -z-10" />
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <span className="px-2.5 py-0.5 rounded bg-gold-accent/10 border border-gold-accent/30 text-gold-accent font-mono text-[12px] uppercase tracking-widest font-semibold flex items-center gap-1.5">
                <Radio size={13} className="text-gold-bright animate-pulse" />
                Staff Communications Hub
              </span>
              <span className="text-[12px] font-mono text-text-muted">
                Dual-CMS System of Record
              </span>
            </div>
            <h2 className="text-xl md:text-2xl font-display font-medium text-white tracking-tight">
              Broadcast & Direct User Notifications
            </h2>
            <p className="text-sm text-text-secondary mt-1 max-w-2xl leading-relaxed">
              Dispatch priority announcements, dispute holds, promotional Connects bonuses, or targeted concierge alerts directly to active user notification bells.
            </p>
          </div>

          <div className="flex items-center gap-3 shrink-0">
            <div className="px-4 py-3 bg-surface-alt border border-surface-variant rounded-lg text-right">
              <div className="text-[12px] font-mono text-text-muted uppercase tracking-wider">
                Active Profiles
              </div>
              <div className="text-xl font-mono font-bold text-gold-bright">
                {loading ? "..." : totalUsers}
              </div>
            </div>
            <button
              type="button"
              onClick={fetchData}
              disabled={loading}
              className="p-3 bg-surface-alt hover:bg-surface-variant border border-surface-variant rounded-lg text-text-secondary hover:text-white transition-colors"
              title="Refresh telemetry"
              aria-label="Refresh telemetry"
            >
              <RefreshCw size={18} className={loading ? "animate-spin" : ""} />
            </button>
          </div>
        </div>
      </div>

      {/* Status Feedback Banner */}
      {statusFeedback && (
        <div
          className={`p-4 rounded-xl border flex items-center gap-3 animate-fadeIn ${
            statusFeedback.type === "success"
              ? "bg-success/10 border-success/30 text-success"
              : "bg-error/10 border-error/30 text-error"
          }`}
        >
          {statusFeedback.type === "success" ? (
            <CheckCircle2 size={20} className="shrink-0" />
          ) : (
            <AlertTriangle size={20} className="shrink-0" />
          )}
          <span className="text-sm font-medium leading-relaxed">{statusFeedback.text}</span>
        </div>
      )}

      {/* Preset Quick Chips */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <span className="font-mono text-[12px] uppercase tracking-widest text-text-secondary font-semibold">
            Preset Templates
          </span>
          <InfoTip text="Quickly load pre-approved operational templates for disputes, compliance, or announcements." />
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-2.5">
          {PRESET_TEMPLATES.map((tmpl) => (
            <button
              key={tmpl.id}
              type="button"
              onClick={() => applyPreset(tmpl)}
              className="p-3 bg-surface hover:bg-surface-variant/60 border border-surface-variant hover:border-gold-accent/40 rounded-lg text-left transition-all group flex flex-col justify-between"
            >
              <div className="mb-2 p-1.5 w-7 h-7 rounded bg-surface-alt border border-surface-variant flex items-center justify-center">
                {renderIconBadge(tmpl.icon)}
              </div>
              <div className="font-working-title text-xs font-semibold text-on-surface group-hover:text-gold-bright transition-colors truncate">
                {tmpl.label}
              </div>
              <div className="text-[12px] font-mono text-text-muted mt-1 uppercase">
                Load Template
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Main Grid: Composer & Live Preview */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        {/* Composer Form (7 cols) */}
        <div className="lg:col-span-7 bg-surface border border-surface-variant rounded-xl p-6 space-y-6">
          <h3 className="text-base font-working-title font-semibold text-white uppercase tracking-wider flex items-center gap-2">
            <Send size={16} className="text-gold-accent" />
            Dispatch Configuration
          </h3>

          {/* 1. Target Audience Selector */}
          <div>
            <label className="block font-mono text-[12px] uppercase tracking-wider text-text-secondary mb-2">
              Target Audience
            </label>
            <div className="grid grid-cols-3 gap-2">
              <button
                type="button"
                onClick={() => setTargetType("broadcast")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  targetType === "broadcast"
                    ? "bg-gold-accent/15 border-gold-accent text-gold-bright font-bold"
                    : "bg-surface-alt border-surface-variant text-text-secondary hover:text-white"
                }`}
              >
                <Radio size={14} />
                All Users
              </button>
              <button
                type="button"
                onClick={() => setTargetType("role")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  targetType === "role"
                    ? "bg-gold-accent/15 border-gold-accent text-gold-bright font-bold"
                    : "bg-surface-alt border-surface-variant text-text-secondary hover:text-white"
                }`}
              >
                <Users size={14} />
                By Role
              </button>
              <button
                type="button"
                onClick={() => setTargetType("targeted")}
                className={`py-2.5 px-3 rounded-lg border text-xs font-mono uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 ${
                  targetType === "targeted"
                    ? "bg-gold-accent/15 border-gold-accent text-gold-bright font-bold"
                    : "bg-surface-alt border-surface-variant text-text-secondary hover:text-white"
                }`}
              >
                <User size={14} />
                Direct / User ID
              </button>
            </div>
          </div>

          {/* Role Filter Options */}
          {targetType === "role" && (
            <div className="p-4 bg-surface-alt border border-surface-variant rounded-lg space-y-2 animate-fadeIn">
              <label className="block font-mono text-[12px] uppercase tracking-wider text-text-secondary">
                Select Recipient Role
              </label>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                {[
                  { id: "broker", label: "Brokers (PRC)" },
                  { id: "owner", label: "Property Owners" },
                  { id: "buyer", label: "Buyers / Seekers" },
                  { id: "provider", label: "Creative Providers" },
                ].map((r) => (
                  <button
                    key={r.id}
                    type="button"
                    onClick={() => setTargetRole(r.id)}
                    className={`py-2 px-3 rounded border text-xs font-mono uppercase tracking-wider transition-colors ${
                      targetRole === r.id
                        ? "bg-gold-accent/20 border-gold-accent text-gold-bright font-bold"
                        : "bg-surface border-surface-variant text-text-secondary hover:text-white"
                    }`}
                  >
                    {r.label}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Targeted User Search & Selection */}
          {targetType === "targeted" && (
            <div className="p-4 bg-surface-alt border border-surface-variant rounded-lg space-y-3 animate-fadeIn">
              <label className="block font-mono text-[12px] uppercase tracking-wider text-text-secondary">
                Recipient User ID(s)
              </label>
              <input
                type="text"
                value={targetUserIds}
                onChange={(e) => setTargetUserIds(e.target.value)}
                placeholder="Paste UUID or comma-separated user IDs (e.g. 8c1a...)"
                className="w-full bg-surface border border-surface-variant rounded-lg px-3.5 py-2.5 text-sm text-white font-mono focus:outline-none focus:border-gold-accent transition-colors"
              />

              {/* User search bar */}
              <div className="pt-2 border-t border-surface-variant/60">
                <div className="flex items-center gap-2 mb-2">
                  <Search size={14} className="text-text-muted" />
                  <span className="font-mono text-[12px] uppercase tracking-wider text-text-secondary">
                    Search Registered Accounts
                  </span>
                </div>
                <div className="max-h-36 overflow-y-auto space-y-1 divide-y divide-surface-variant/30">
                  {availableUsers.length === 0 ? (
                    <div className="p-2 text-xs text-text-muted italic">No accounts loaded.</div>
                  ) : (
                    availableUsers.map((u) => (
                      <button
                        key={u.id}
                        type="button"
                        onClick={() => handleSelectUser(u)}
                        className={`p-2 text-left w-full rounded flex items-center justify-between text-xs transition-colors hover:bg-surface-variant ${
                          targetUserIds === u.id ? "bg-gold-accent/15 text-gold-bright" : "text-text-secondary"
                        }`}
                      >
                        <div className="truncate mr-2">
                          <span className="font-semibold text-white mr-1.5">{u.display_name || "Unnamed"}</span>
                          <span className="text-[12px] font-mono text-text-muted">({u.role})</span>
                        </div>
                        <span className="font-mono text-[12px] text-text-muted shrink-0">
                          {u.id.substring(0, 8)}...
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Title & Icon Input */}
          <div className="space-y-3">
            <div>
              <label className="block font-mono text-[12px] uppercase tracking-wider text-text-secondary mb-1.5">
                Category Icon
              </label>
              <div className="flex flex-wrap gap-2">
                {[
                  { id: "radio", label: "Broadcast", comp: <Radio size={14} /> },
                  { id: "shield", label: "Dispute", comp: <ShieldAlert size={14} /> },
                  { id: "gift", label: "Bonus", comp: <Sparkles size={14} /> },
                  { id: "alert", label: "Warning", comp: <AlertTriangle size={14} /> },
                  { id: "chat", label: "Direct", comp: <MessageSquare size={14} /> },
                  { id: "bell", label: "Standard", comp: <Bell size={14} /> },
                ].map((ic) => (
                  <button
                    key={ic.id}
                    type="button"
                    onClick={() => setIcon(ic.id)}
                    className={`py-1.5 px-3 rounded border text-xs font-mono uppercase tracking-wider transition-colors flex items-center gap-1.5 ${
                      icon === ic.id
                        ? "bg-gold-accent/20 border-gold-accent text-gold-bright font-bold"
                        : "bg-surface-alt border-surface-variant text-text-secondary hover:text-white"
                    }`}
                  >
                    {ic.comp}
                    <span>{ic.label}</span>
                  </button>
                ))}
              </div>
            </div>

            <div>
              <label className="block font-mono text-[12px] uppercase tracking-wider text-text-secondary mb-1.5">
                Notification Title *
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Schedule of Maintenance Notice"
                maxLength={200}
                className="w-full bg-surface-alt border border-surface-variant rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-accent transition-colors"
              />
            </div>
          </div>

          {/* Message Body */}
          <div>
            <label className="block font-mono text-[12px] uppercase tracking-wider text-text-secondary mb-1.5">
              Message Content *
            </label>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Provide clear, concise details. For disputes, cite transaction ID and required documentation."
              rows={4}
              maxLength={2000}
              className="w-full bg-surface-alt border border-surface-variant rounded-lg px-3.5 py-2.5 text-sm text-white focus:outline-none focus:border-gold-accent transition-colors leading-relaxed resize-none"
            />
          </div>

          {/* Destination Link */}
          <div>
            <div className="flex items-center justify-between mb-1.5">
              <label className="font-mono text-[12px] uppercase tracking-wider text-text-secondary">
                Action Deep Link
              </label>
              <span className="text-[12px] font-mono text-text-muted">
                1-Click Navigation Destination
              </span>
            </div>
            <input
              type="text"
              value={link}
              onChange={(e) => setLink(e.target.value)}
              placeholder="/dashboard/inbox, /pricing, /settings"
              className="w-full bg-surface-alt border border-surface-variant rounded-lg px-3.5 py-2.5 text-sm font-mono text-white focus:outline-none focus:border-gold-accent transition-colors mb-2"
            />
            <div className="flex flex-wrap gap-1.5">
              {["/dashboard/inbox", "/pricing", "/settings#verification", "/off-market", "/dashboard"].map((path) => (
                <button
                  key={path}
                  type="button"
                  onClick={() => setLink(path)}
                  className="px-2 py-1 bg-surface-alt hover:bg-surface-variant border border-surface-variant/80 rounded text-[12px] font-mono text-gold-accent transition-colors"
                >
                  {path}
                </button>
              ))}
            </div>
          </div>

          {/* Urgent Email Fallback Checkbox */}
          <div className="pt-2 border-t border-surface-variant/60">
            <label className="flex items-start gap-3 cursor-pointer group">
              <input
                type="checkbox"
                checked={forceEmail}
                onChange={(e) => setForceEmail(e.target.checked)}
                className="mt-1 w-4 h-4 rounded border-surface-variant text-gold-accent focus:ring-0 bg-surface-alt"
              />
              <div>
                <span className="text-sm font-working-title font-medium text-white group-hover:text-gold-bright transition-colors flex items-center gap-1.5">
                  <Mail size={14} className="text-gold-accent" />
                  Urgent Transactional Email Fallback
                </span>
                <p className="text-xs text-text-secondary mt-0.5">
                  Sends transactional email alert to users who have been away from the platform for &ge;24 hours (or critical dispute holds).
                </p>
              </div>
            </label>
          </div>

          {/* Dispatch CTA Button */}
          <div className="pt-4 border-t border-surface-variant">
            <button
              type="button"
              disabled={!title.trim() || !message.trim() || dispatching}
              onClick={() => setShowConfirmModal(true)}
              className="w-full py-3 px-6 rounded-lg bg-gold-accent hover:bg-gold-bright disabled:opacity-40 disabled:hover:bg-gold-accent text-background font-mono text-xs uppercase tracking-widest font-bold transition-all flex items-center justify-center gap-2 shadow-lg shadow-gold-accent/10 active:scale-[0.98]"
            >
              <Send size={15} />
              {dispatching ? "Dispatching Broadcast..." : `Review & Dispatch ${targetType.toUpperCase()}`}
            </button>
          </div>
        </div>

        {/* Live Preview (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          <div className="bg-surface border border-surface-variant rounded-xl p-5">
            <div className="flex items-center justify-between mb-4 pb-3 border-b border-surface-variant">
              <span className="font-mono text-[12px] uppercase tracking-widest text-text-secondary font-semibold flex items-center gap-1.5">
                <Bell size={14} className="text-gold-accent" />
                Live Bell Dropdown Preview
              </span>
              <span className="text-[12px] font-mono text-gold-accent bg-gold-accent/10 px-2 py-0.5 rounded border border-gold-accent/20">
                CLIENT VIEW
              </span>
            </div>

            {/* Simulated Notification Item */}
            <div className="bg-surface-alt border border-surface-variant rounded-xl overflow-hidden shadow-2xl">
              <div className="p-3 border-b border-surface-variant bg-surface flex justify-between items-center text-xs">
                <span className="font-mono text-[12px] text-text-secondary uppercase tracking-widest">
                  Notifications Dropdown
                </span>
                <span className="text-[12px] font-mono text-gold-accent">1 NEW</span>
              </div>

              <div className="p-4 bg-gold-accent/5 border-l-2 border-gold-accent flex items-start gap-3">
                <div className="shrink-0 mt-0.5 w-8 h-8 rounded-lg bg-surface border border-surface-variant flex items-center justify-center">
                  {renderIconBadge(icon)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-1 mb-1">
                    <div className="font-working-title text-sm font-semibold text-white truncate">
                      {title || "Notification Title Preview"}
                    </div>
                    <span className="text-[12px] font-mono text-text-muted shrink-0">
                      Just now
                    </span>
                  </div>
                  <div className="text-xs text-text-secondary line-clamp-3 leading-relaxed">
                    {message || "Message body will render here. Users will be able to read and click to immediately navigate to the target action link."}
                  </div>
                  <div className="mt-2.5 flex items-center gap-1 text-[12px] font-mono uppercase tracking-wider text-gold-accent font-semibold">
                    <span>Target: {link || "/dashboard"}</span>
                    <ExternalLink size={11} className="ml-1" />
                  </div>
                </div>
              </div>
            </div>

            <div className="mt-4 p-3.5 rounded-lg bg-surface-alt border border-surface-variant text-xs text-text-secondary leading-relaxed">
              <span className="font-semibold text-white block mb-1">Delivery Assurance:</span>
              Persists in canonical <code className="text-gold-accent">user_notifications</code>. Clicking opens <code className="text-gold-accent">{link || "/dashboard"}</code> with zero dead buttons.
            </div>
          </div>

          {/* Recent Broadcast Telemetry */}
          <div className="bg-surface border border-surface-variant rounded-xl p-5">
            <h4 className="font-mono text-[12px] uppercase tracking-widest text-text-secondary font-semibold mb-3">
              Recent Staff Broadcasts
            </h4>
            <div className="space-y-2 max-h-56 overflow-y-auto divide-y divide-surface-variant/40">
              {recentBroadcasts.length === 0 ? (
                <div className="p-4 text-center text-xs text-text-muted italic">
                  No previous staff broadcasts on file.
                </div>
              ) : (
                recentBroadcasts.map((b) => (
                  <div key={b.id} className="pt-2 first:pt-0 flex items-start gap-2.5">
                    <span className="shrink-0 mt-0.5 p-1 rounded bg-surface-alt border border-surface-variant">
                      {renderIconBadge(b.icon)}
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="text-xs font-semibold text-white truncate">{b.title}</div>
                      <div className="text-[12px] text-text-secondary truncate">{b.desc}</div>
                      <div className="text-[12px] font-mono text-text-muted mt-0.5">
                        {b.created_at ? new Date(b.created_at).toLocaleDateString([], { month: "short", day: "numeric", hour: "2-digit", minute: "2-digit" }) : ""}
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Confirmation Safety Modal */}
      {showConfirmModal && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-md z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="bg-surface border border-surface-variant rounded-2xl max-w-lg w-full p-6 shadow-2xl space-y-5">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-gold-accent/15 border border-gold-accent/30 flex items-center justify-center text-gold-accent">
                <Radio size={20} className="text-gold-bright" />
              </div>
              <div>
                <h3 className="text-lg font-working-title font-semibold text-white">
                  Confirm Notification Dispatch
                </h3>
                <p className="text-xs text-text-secondary">
                  Please verify audience parameters before broadcasting.
                </p>
              </div>
            </div>

            <div className="p-4 rounded-xl bg-surface-alt border border-surface-variant space-y-2 text-xs">
              <div className="flex justify-between">
                <span className="text-text-secondary">Audience Mode:</span>
                <span className="font-mono text-gold-bright uppercase font-bold">{targetType}</span>
              </div>
              {targetType === "role" && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Selected Role:</span>
                  <span className="font-mono text-white uppercase">{targetRole}</span>
                </div>
              )}
              {targetType === "broadcast" && (
                <div className="flex justify-between">
                  <span className="text-text-secondary">Estimated Reach:</span>
                  <span className="font-mono text-white">{totalUsers} Active Profiles</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-text-secondary">Title:</span>
                <span className="font-medium text-white truncate max-w-[240px]">{title}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Deep Link:</span>
                <span className="font-mono text-gold-accent">{link}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-text-secondary">Urgent Email Fallback:</span>
                <span className={`font-mono uppercase ${forceEmail ? "text-success font-bold" : "text-text-muted"}`}>
                  {forceEmail ? "Enabled" : "Disabled"}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmModal(false)}
                className="flex-1 py-2.5 px-4 rounded-lg bg-surface-alt hover:bg-surface-variant border border-surface-variant text-xs font-mono uppercase tracking-wider text-text-secondary hover:text-white transition-colors"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleDispatch}
                disabled={dispatching}
                className="flex-1 py-2.5 px-4 rounded-lg bg-gold-accent hover:bg-gold-bright text-background font-mono text-xs uppercase tracking-widest font-bold transition-colors shadow-lg shadow-gold-accent/20"
              >
                {dispatching ? "Sending..." : "Confirm & Send"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
