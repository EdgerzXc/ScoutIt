"use client";

import { useState } from "react";
import { sendStaffReplyAction } from "@/app/dashboard/communications/actions";
import {
  COMMUNICATION_TEMPLATES,
  TEMPLATE_METADATA,
} from "@/lib/staffCommunications.mjs";
import { Mail, Send, X, AlertCircle, CheckCircle2 } from "lucide-react";

export default function StaffReplyModal({
  isOpen,
  onClose,
  defaultRecipient = {},
  defaultSubject = "",
  targetTable = "contact_messages",
  targetId,
  initialTemplate = COMMUNICATION_TEMPLATES.CONTACT_REPLY,
}) {
  const [templateKey, setTemplateKey] = useState(initialTemplate);
  const [recipientEmail, setRecipientEmail] = useState(defaultRecipient.email || "");
  const [recipientName] = useState(defaultRecipient.name || "");
  const [subject, setSubject] = useState(
    defaultSubject || TEMPLATE_METADATA[initialTemplate]?.defaultSubject || ""
  );
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  if (!isOpen) return null;

  const handleTemplateChange = (newKey) => {
    setTemplateKey(newKey);
    const meta = TEMPLATE_METADATA[newKey];
    if (meta && (!subject || subject === TEMPLATE_METADATA[templateKey]?.defaultSubject)) {
      setSubject(meta.defaultSubject);
    }
  };

  const handleSend = async (e) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    try {
      const res = await sendStaffReplyAction({
        recipientEmail: recipientEmail.trim(),
        recipientUserId: defaultRecipient.userId || null,
        recipientName: recipientName.trim() || null,
        subject: subject.trim(),
        message: message.trim(),
        templateKey,
        targetTable,
        targetId: targetId || null,
      });

      if (res.error) {
        setError(res.error);
      } else {
        const statusNote = res.delivered
          ? "Email successfully dispatched via provider."
          : `Message processed and logged (provider status: ${res.providerStatus}).`;
        setSuccess(statusNote);
        setTimeout(() => {
          onClose();
        }, 1500);
      }
    } catch (err) {
      setError(err.message || "Failed to send communication.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="w-full max-w-lg p-6 rounded-xl border border-line bg-surface space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-line">
          <div className="flex items-center gap-2">
            <Mail className="w-5 h-5 text-gold" />
            <h3 className="text-base font-medium text-white">Outbound Staff Response</h3>
          </div>
          <button
            onClick={onClose}
            className="p-1 rounded text-white/60 hover:text-white transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSend} className="space-y-4">
          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
              Communication Template
            </label>
            <select
              value={templateKey}
              onChange={(e) => handleTemplateChange(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs font-mono text-white focus:outline-none focus:border-gold"
            >
              {Object.entries(TEMPLATE_METADATA).map(([key, meta]) => (
                <option key={key} value={key}>
                  [{meta.category}] {meta.name}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
              Recipient Email
            </label>
            <input
              type="email"
              value={recipientEmail}
              onChange={(e) => setRecipientEmail(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs font-mono text-white focus:outline-none focus:border-gold"
              required
            />
          </div>

          <div>
            <label className="block text-xs font-mono uppercase tracking-wider text-white/60 mb-1">
              Subject Line
            </label>
            <input
              type="text"
              value={subject}
              onChange={(e) => setSubject(e.target.value)}
              className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs text-white focus:outline-none focus:border-gold"
              required
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1">
              <label className="block text-xs font-mono uppercase tracking-wider text-white/60">
                Staff Message Body
              </label>
              <span className="text-xs font-mono text-white/60">
                {message.length} characters (min 10)
              </span>
            </div>
            <textarea
              value={message}
              onChange={(e) => setMessage(e.target.value)}
              placeholder="Type your official staff response..."
              rows={5}
              className="w-full px-3 py-2 bg-black/60 border border-line rounded-lg text-xs text-white placeholder-white/30 focus:outline-none focus:border-gold"
              required
            />
          </div>

          {error && (
            <div className="p-3 rounded-lg border border-red-500/30 bg-red-500/10 text-red-400 text-xs font-mono flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div className="p-3 rounded-lg border border-emerald-500/30 bg-emerald-500/10 text-emerald-400 text-xs font-mono flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{success}</span>
            </div>
          )}

          <div className="pt-2 flex items-center justify-end gap-3 border-t border-line">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 rounded-lg border border-line text-xs font-mono text-white/70 hover:text-white"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={loading || message.trim().length < 10 || !recipientEmail.trim()}
              className="px-5 py-2 rounded-lg bg-gold text-black font-medium text-xs uppercase tracking-wider hover:bg-gold/90 transition-colors disabled:opacity-50 flex items-center gap-2"
            >
              <Send className="w-3.5 h-3.5" />
              {loading ? "Sending..." : "Send Official Notice"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
