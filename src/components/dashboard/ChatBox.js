import { useState, useEffect, useRef, useCallback } from "react";
import { motion } from "framer-motion";
import BookingModal from "./BookingModal";
import DealFileSlideOver from "./crm/DealFileSlideOver";
import { uploadAttachment } from "../../lib/storage";
import { getSession, getUser } from "../../lib/authClient";
import { readDevelopmentMockUser } from "../../lib/developmentMock";
import { sanitizeError } from "@/lib/sanitizeError";
import { maskContactDetails } from "@/lib/contactLeakFilter";
import { lifecycleNotice } from "@/lib/pendingRequestLifecycle";
import { reportError } from "@/lib/reportError";

// Statuses where the conversation is over. Kept as one constant because it
// was previously duplicated across six inline arrays that had already drifted
// apart -- the composer disabled one set, the header another.
const CLOSED_STATUSES = ["closed", "declined", "expired", "reported"];
const isClosed = (status) => CLOSED_STATUSES.includes(status);

// Safe Link Parser to prevent XSS + Rich Interactive Card Renderer
const renderTextWithLinks = (text, { onAcceptViewing, onRescheduleViewing, onAcceptReschedule } = {}) => {
  if (!text) return null;

  // 1. Initial Viewing Request
  if (text.startsWith("[SYSTEM] I have requested a live viewing for:")) {
    const timeStr = text.replace("[SYSTEM] I have requested a live viewing for:", "").trim();
    return (
      <div className="p-3.5 bg-[#16161b] border border-gold-accent/40 rounded-xl space-y-3 my-1 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-gold-accent/15 border border-gold-accent/40 flex items-center justify-center text-gold-accent shrink-0 text-lg">
            📅
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[12px] font-mono uppercase tracking-widest text-gold-bright font-bold">
                Live Viewing Requested
              </h4>
              <span className="text-[12px] font-mono uppercase bg-gold-accent/20 text-gold-accent px-1.5 py-0.5 rounded">
                Pending Approval
              </span>
            </div>
            <p className="text-xs font-semibold text-on-surface mt-0.5">{timeStr}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button
            onClick={onAcceptViewing}
            disabled={!onAcceptViewing}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[12px] font-mono uppercase tracking-wider hover:bg-emerald-500/30 transition font-bold disabled:opacity-40"
          >
            ✓ Accept Viewing
          </button>
          <button
            onClick={onRescheduleViewing}
            disabled={!onRescheduleViewing}
            className="py-2 px-3 rounded-lg bg-white/5 text-text-secondary border border-white/10 text-[12px] font-mono uppercase tracking-wider hover:bg-white/10 hover:text-white transition disabled:opacity-40"
          >
            Reschedule
          </button>
        </div>
      </div>
    );
  }

  // 2. Reschedule Proposal Request
  if (text.startsWith("[SYSTEM] Reschedule requested for:")) {
    const details = text.replace("[SYSTEM] Reschedule requested for:", "").trim();
    return (
      <div className="p-3.5 bg-[#181822] border border-amber-500/50 rounded-xl space-y-3 my-1 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shrink-0 text-lg">
            🔄
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h4 className="text-[12px] font-mono uppercase tracking-widest text-amber-400 font-bold">
                Reschedule Proposed
              </h4>
              <span className="text-[12px] font-mono uppercase bg-amber-500/20 text-amber-300 px-1.5 py-0.5 rounded">
                Action Required
              </span>
            </div>
            <p className="text-xs font-semibold text-on-surface mt-0.5">{details}</p>
          </div>
        </div>
        <div className="flex gap-2 pt-2 border-t border-white/10">
          <button
            onClick={() => onAcceptReschedule?.(details)}
            className="flex-1 py-2 px-3 rounded-lg bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 text-[12px] font-mono uppercase tracking-wider hover:bg-emerald-500/30 transition font-bold"
          >
            ✓ Accept New Slot
          </button>
          <button
            onClick={onRescheduleViewing}
            className="py-2 px-3 rounded-lg bg-white/5 text-text-secondary border border-white/10 text-[12px] font-mono uppercase tracking-wider hover:bg-white/10 hover:text-white transition"
          >
            Propose Other
          </button>
        </div>
      </div>
    );
  }

  // 3. Viewing Accepted Confirmation
  if (text.startsWith("[SYSTEM] Viewing accepted")) {
    return (
      <div className="p-3.5 bg-[#122018] border border-emerald-500/40 rounded-xl space-y-2 my-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">✅</span>
          <div>
            <h4 className="text-[12px] font-mono uppercase tracking-widest text-emerald-400 font-bold">
              Viewing Confirmed &amp; Calendar Synced
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">{text.replace("[SYSTEM] ", "")}</p>
          </div>
        </div>
      </div>
    );
  }

  // 4. Deal Room Concluded
  if (text.startsWith("[SYSTEM] Deal Room concluded")) {
    return (
      <div className="p-3.5 bg-[#18181c] border border-white/15 rounded-xl space-y-2 my-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🔒</span>
          <div>
            <h4 className="text-[12px] font-mono uppercase tracking-widest text-text-secondary font-bold">
              Deal Room Concluded
            </h4>
            <p className="text-xs text-text-muted mt-0.5">{text.replace("[SYSTEM] ", "")}</p>
          </div>
        </div>
      </div>
    );
  }

  // 5. Staff Incident Escalation Notice
  if (text.startsWith("[SYSTEM] 🛡️ Staff Support Incident")) {
    return (
      <div className="p-3.5 bg-[#121824] border border-blue-500/40 rounded-xl space-y-2 my-1">
        <div className="flex items-center gap-2.5">
          <span className="text-xl">🛡️</span>
          <div>
            <h4 className="text-[12px] font-mono uppercase tracking-widest text-blue-400 font-bold">
              Staff Diagnostic Incident Logged
            </h4>
            <p className="text-xs text-text-secondary mt-0.5">{text.replace("[SYSTEM] ", "")}</p>
          </div>
        </div>
      </div>
    );
  }

  const urlRegex = /(https?:\/\/[^\s]+)/g;
  const parts = text.split(urlRegex);

  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      let safeUrl = "#";
      try {
        const parsed = new URL(part);
        if (["http:", "https:"].includes(parsed.protocol)) {
          safeUrl = parsed.href;
        }
      } catch (e) {}

      return (
        <a
          key={index}
          href={safeUrl}
          target="_blank"
          rel="noopener noreferrer"
          className="text-gold-accent underline hover:text-gold-bright break-all"
        >
          {part}
        </a>
      );
    }
    return <span key={index}>{part}</span>;
  });
};

// Attachment messages are sent through the same plain-text deal_messages.body
// column as regular text (no separate attachments table/column) -- encoded
// as a small JSON envelope with a recognizable prefix so it round-trips
// through the real API instead of only living in local state.
const ATTACHMENT_PREFIX = "__scoutit_attachment__:";
const encodeAttachment = (att) => `${ATTACHMENT_PREFIX}${JSON.stringify(att)}`;
const decodeAttachment = (body) => {
  if (!body || !body.startsWith(ATTACHMENT_PREFIX)) return null;
  try {
    return JSON.parse(body.slice(ATTACHMENT_PREFIX.length));
  } catch {
    return null;
  }
};

// Resolves { token, mockOwnerId, userId } for API calls -- real Supabase
// session first, falling back to the dev toolbox's "master-dev" localStorage
// convention (see FloatingToolbox.js) when there's no real session, matching
// the same pattern InquiryModal/UnitInquiryModal/OperatorRequestModal use.
async function resolveAuth() {
  const [{ data: { user } }, { data: { session } }] = await Promise.all([getUser(), getSession()]);
  if (user && session?.access_token && session.user?.id === user.id) {
    return { token: session.access_token, mockOwnerId: null, userId: user.id };
  }
  const mockUser = readDevelopmentMockUser(localStorage, {
    nodeEnv: process.env.NODE_ENV,
    hostname: window.location.hostname,
  });
  if (mockUser) return { token: null, mockOwnerId: mockUser.id, userId: mockUser.id };
  return { token: null, mockOwnerId: null, userId: null };
}

function authHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

const messageVariants = {
  initial: { opacity: 0, y: 15 },
  animate: { opacity: 1, y: 0 }
};

const messageTransition = { duration: 0.3 };
const loadingLineTransition = { duration: 2, repeat: Infinity, ease: "linear" };

export default function ChatBox({
  deal,
  onCloseDeal,
  onOfferHandshake,
  onAcceptHandshake,
  onAcceptRequest,
  onDeclineRequest,
  onWithdrawRequest,
  onUnarchive,
}) {
  const [messages, setMessages] = useState([]);
  const [loading, setLoading] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [myUserId, setMyUserId] = useState(null);
  const [input, setInput] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);
  const [showConfirmClose, setShowConfirmClose] = useState(false);
  const [closeReason, setCloseReason] = useState("Client selected alternative property");
  const [closeNote, setCloseNote] = useState("");

  const [showConfirmReport, setShowConfirmReport] = useState(false);
  const [showBookingModal, setShowBookingModal] = useState(false);
  
  // Rescheduling state
  const [showRescheduleModal, setShowRescheduleModal] = useState(false);
  const [rescheduleDate, setRescheduleDate] = useState("");
  const [rescheduleTime, setRescheduleTime] = useState("14:00");
  const [rescheduleMode, setRescheduleMode] = useState("Physical On-Site");
  const [rescheduleReason, setRescheduleReason] = useState("Schedule adjustment");

  // Staff Support / Glitch reporting state
  const [showStaffModal, setShowStaffModal] = useState(false);
  const [staffCategory, setStaffCategory] = useState("glitch");
  const [staffMessage, setStaffMessage] = useState("");
  const [staffSubmitting, setStaffSubmitting] = useState(false);
  const [staffSuccess, setStaffSuccess] = useState(false);

  const [showConfirmHandshake, setShowConfirmHandshake] = useState(false);
  const [showDealFile, setShowDealFile] = useState(false);
  const [isPitchExpanded, setIsPitchExpanded] = useState(false);
  const [uploadError, setUploadError] = useState(null);
  const [handshakeBusy, setHandshakeBusy] = useState(false);
  const [pendingBusy, setPendingBusy] = useState(false);

  const messagesEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Contact details stay masked in the transcript until BOTH sides have signed
  // the two-sided handshake (/api/deals/handshake, ACQ-03). `handshakeState`
  // is set to 'linked' only by a successful server response -- never
  // optimistically, or the shield would lift on a request that failed.
  const contactRevealed = deal.handshakeState === "linked" || deal.contactRevealed === true;

  const closed = isClosed(deal.status);
  const isWaiting = deal.status === "pending";
  // The buyer is always the party who spent the Connect to open the thread,
  // so buyer === sender and everyone else === recipient of the request.
  const isRequestSender = (deal.myRole || "buyer") === "buyer";

  const mapMessage = useCallback((m, currentUserId) => {
    const attachment = decodeAttachment(m.body);
    return {
      id: m.id,
      sender: m.sender_id === currentUserId ? "me" : m.sender_role,
      body: attachment ? "" : m.body,
      timestamp: m.created_at,
      attachments: attachment ? [attachment] : [],
    };
  }, []);

  const loadMessages = useCallback(async () => {
    setLoading(true);
    setLoadError(null);
    try {
      const { token, mockOwnerId, userId } = await resolveAuth();
      if (!userId) {
        setLoadError("Please log in to view this conversation.");
        setLoading(false);
        return;
      }
      setMyUserId(userId);
      const qs = mockOwnerId ? `?mockOwnerId=${mockOwnerId}` : "";
      const res = await fetch(`/api/deals/${deal.id}/messages${qs}`, { headers: authHeaders(token) });
      const data = await res.json();
      if (!res.ok) {
        setLoadError(data.error || "Couldn't load this conversation.");
        setLoading(false);
        return;
      }
      setMessages((data.messages || []).map((m) => mapMessage(m, userId)));

      // Mark incoming messages read now that the conversation is open.
      fetch(`/api/deals/${deal.id}/messages${qs}`, {
        method: "PATCH",
        headers: authHeaders(token),
      }).catch(() => {});
    } catch (err) {
      console.error("Failed to load messages", err);
      setLoadError("Couldn't load this conversation — check your connection.");
    } finally {
      setLoading(false);
    }
  }, [deal.id, mapMessage]);

  useEffect(() => {
    loadMessages();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [deal.id]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isUploading]);

  const sendMessageBody = async (body) => {
    const { token, mockOwnerId, userId } = await resolveAuth();
    if (!userId) throw new Error("Please log in to send a message.");
    const res = await fetch(`/api/deals/${deal.id}/messages`, {
      method: "POST",
      headers: { "Content-Type": "application/json", ...authHeaders(token) },
      body: JSON.stringify({ body, role: deal.myRole || "buyer", mockOwnerId }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.error || "Couldn't send your message.");
    setMessages((prev) => [...prev, mapMessage(data.message, userId)]);
  };

  const handleSend = async (e) => {
    if (e) e.preventDefault();
    // Checked every closed status, not just 'closed' -- a declined or expired
    // thread let the message through to the API and got a 4xx back.
    if (!input.trim() || isClosed(deal.status)) return;

    setIsSubmitting(true);
    setUploadError(null);
    try {
      await sendMessageBody(input.trim());
      setInput("");
    } catch (err) {
      setUploadError(sanitizeError(err, "Upload failed. Please try again."));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleFileUpload = async (file) => {
    if (!file) return;
    setUploadError(null);
    setIsUploading(true);

    try {
      const attachment = await uploadAttachment(deal.id, file);
      await sendMessageBody(encodeAttachment(attachment));
    } catch (err) {
      setUploadError(sanitizeError(err, "Upload failed. Please try again."));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setIsUploading(false);
    }
  };

  const onFileChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
    // reset input
    e.target.value = null;
  };

  const onDragOver = (e) => {
    e.preventDefault();
    if (!isClosed(deal.status)) setIsDragging(true);
  };

  const onDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const onDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    if (!isClosed(deal.status) && e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFileUpload(e.dataTransfer.files[0]);
    }
  };

  // Both of these used to fire-and-forget: the response was never inspected,
  // so a rejected close still painted the thread closed in the UI. The user
  // walks away believing they ended a conversation that is still open, and the
  // other party keeps messaging into it.
  const handleEndConversation = async () => {
    try {
      const { token, mockOwnerId } = await resolveAuth();
      const res = await fetch(`/api/deals/${deal.id}/close`, {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ mockOwnerId, reason: closeReason, note: closeNote }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't close this conversation.");
      }
      try {
        await sendMessageBody(`[SYSTEM] Deal Room concluded. Reason: ${closeReason}${closeNote ? ` (${closeNote})` : ""}`);
      } catch {}
      onCloseDeal(deal.id);
      setShowConfirmClose(false);
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't close this conversation."));
      setTimeout(() => setUploadError(null), 5000);
      setShowConfirmClose(false);
    }
  };

  const handleReportConversation = async () => {
    try {
      const { token, mockOwnerId } = await resolveAuth();
      const res = await fetch(`/api/deals/${deal.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ status: "reported", mockOwnerId }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || "Couldn't submit this report.");
      }
      onCloseDeal(deal.id, "reported");
      setShowConfirmReport(false);
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't submit this report."));
      setTimeout(() => setUploadError(null), 5000);
      setShowConfirmReport(false);
    }
  };

  // Two-sided handshake -- the ONLY thing that reveals contact details.
  const signHandshake = async () => {
    setHandshakeBusy(true);
    setUploadError(null);
    try {
      const { token, mockOwnerId } = await resolveAuth();
      const res = await fetch("/api/deals/handshake", {
        method: "POST",
        headers: { "Content-Type": "application/json", ...authHeaders(token) },
        body: JSON.stringify({ dealId: deal.id, action: "sign", mockOwnerId }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Couldn't complete the handshake.");
      if (data.status === "accepted" || data.status === "complete") {
        onAcceptHandshake?.(deal.id, data);
      } else {
        onOfferHandshake?.(deal.id, data);
      }
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't complete the handshake."));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setHandshakeBusy(false);
      setShowConfirmHandshake(false);
    }
  };

  const acceptViewing = async () => {
    try {
      await sendMessageBody("[SYSTEM] Viewing accepted. See you then.");
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't send your reply."));
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const handleAcceptReschedule = async (details) => {
    try {
      await sendMessageBody(`[SYSTEM] Viewing accepted for proposed slot: ${details}. See you then.`);
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't send your confirmation."));
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const rescheduleViewing = () => {
    setShowRescheduleModal(true);
  };

  const submitReschedule = async (e) => {
    if (e) e.preventDefault();
    if (!rescheduleDate) return;
    try {
      const summary = `[SYSTEM] Reschedule requested for: ${rescheduleDate} at ${rescheduleTime} (${rescheduleMode}) — Reason: ${rescheduleReason || "Schedule adjustment"}`;
      await sendMessageBody(summary);
      setShowRescheduleModal(false);
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't send reschedule request."));
      setTimeout(() => setUploadError(null), 5000);
    }
  };

  const submitStaffSupport = async (e) => {
    if (e) e.preventDefault();
    if (!staffMessage.trim()) return;
    setStaffSubmitting(true);
    try {
      const ticketId = Math.random().toString(36).substring(2, 8).toUpperCase();
      await reportError({
        kind: `deal_room_${staffCategory}`,
        message: staffMessage.trim(),
        context: {
          dealId: deal.id,
          propertyTitle: deal.property_title,
          otherParty: deal.other_party,
          ticketId,
          role: deal.myRole || "user"
        }
      });
      await sendMessageBody(`[SYSTEM] 🛡️ Staff Support Incident #SR-${ticketId} logged. Mission Control operators have been alerted to review this room.`);
      setStaffSuccess(true);
      setStaffMessage("");
      setTimeout(() => {
        setStaffSuccess(false);
        setShowStaffModal(false);
      }, 2200);
    } catch (err) {
      setUploadError(sanitizeError(err, "Couldn't submit staff support ticket."));
      setTimeout(() => setUploadError(null), 5000);
    } finally {
      setStaffSubmitting(false);
    }
  };

  // Honest blank: no fabricated 14-day default. A deal with no expires_at
  // simply doesn't get a countdown, because we don't know one.
  const msLeft = deal.expires_at ? new Date(deal.expires_at) - new Date() : null;
  const daysLeft = msLeft === null ? null : Math.max(0, Math.ceil(msLeft / (1000 * 60 * 60 * 24)));

  const renderAttachment = (att) => {
    if (att.type.startsWith('image/')) {
      return (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="block mt-2">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src={att.url} alt={att.name} className="max-w-[200px] max-h-[200px] rounded object-cover border border-white/10 hover:opacity-90 transition-opacity" />
        </a>
      );
    }
    if (att.type.startsWith('video/')) {
      return (
        <video src={att.url} controls className="max-w-[250px] max-h-[250px] rounded mt-2 border border-white/10" />
      );
    }
    if (att.type === 'application/pdf') {
      return (
        <a href={att.url} target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 mt-2 p-2 bg-black/20 rounded border border-white/10 hover:bg-black/40 transition">
          <span className="text-error text-xl">📄</span>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs truncate font-working-title">{att.name}</span>
            <span className="text-[12px] text-text-muted">{(att.size / 1024 / 1024).toFixed(1)} MB</span>
          </div>
        </a>
      );
    }
    return null;
  };

  // ── WAITING GATE (NEW_IDEAS.md §38.3, State 1) ────────────────────────
  //
  // A pending Connect request is NOT a conversation yet, and this component
  // used to render one anyway: full transcript, live composer, file upload,
  // AI counter-offer, booking, and the counterparty's real name in the
  // header. That handed the recipient the sender's identity before they had
  // accepted anything -- the precise thing §35 promises buyers it will not do.
  //
  // Recipient sees intent and role only. Sender sees a locked receipt.
  // Nobody types into a thread the other side hasn't opted into.
  if (isWaiting) {
    const sentAt = deal.created_at || deal.createdAt;
    const sentLabel = sentAt ? new Date(sentAt).toLocaleString() : null;

    return (
      <div className="flex flex-col h-full overflow-y-auto bg-gradient-to-b from-background to-surface p-4 sm:p-6">
        <div className="w-full max-w-md mx-auto my-auto bg-surface border border-gold-accent/30 rounded-xl p-5 sm:p-6">
          <span className="inline-block text-[12px] font-mono uppercase tracking-widest text-gold-bright bg-gold-accent/15 border border-gold-accent/40 px-2 py-1 rounded">
            {isRequestSender ? "Awaiting response" : "Connect request"}
          </span>

          <h3 className="font-headline-editorial text-xl sm:text-2xl text-on-surface mt-4 mb-1 break-words">
            {deal.property_title}
          </h3>

          {/* Identity is withheld from the recipient until they accept. The
              sender already knows who they contacted, so they keep the name. */}
          <p className="text-xs text-text-secondary font-mono uppercase tracking-wider">
            {isRequestSender
              ? deal.other_party
              : `From a verified ${deal.otherPartyRole || "Seeker"} · name revealed on accept`}
          </p>

          {deal.pitch_message && (
            <div className="mt-5 border-l-2 border-gold-accent/30 pl-4">
              <p className="text-[12px] font-mono uppercase tracking-widest text-text-muted mb-1">
                Their message
              </p>
              <p className="text-sm text-text-primary whitespace-pre-wrap break-words">
                {/* Masked: a pre-acceptance intro is the obvious place to
                    smuggle a number and skip the handshake entirely. */}
                {maskContactDetails(deal.pitch_message, false)}
              </p>
            </div>
          )}

          {sentLabel && (
            <p className="text-[12px] font-mono uppercase tracking-widest text-text-muted mt-5">
              Sent {sentLabel}
            </p>
          )}

          {/* §40.15 — the owner's instruction was that users be TOLD the rule,
              not discover it when a request moves or disappears. This states
              the next step and the deadline in plain language, and returns
              null (rendering nothing) when the timing isn't known rather than
              printing a fabricated date. */}
          {(() => {
            const notice = lifecycleNotice({
              archivedAt: deal.archived_at,
              resetAt: deal.pending_clock_reset_at,
            });
            if (!notice) return null;
            return (
              <div className={`mt-4 rounded-lg border px-3 py-2.5 ${
                deal.archived_at
                  ? "bg-white/[0.03] border-white/15"
                  : "bg-gold-accent/5 border-gold-accent/20"
              }`}>
                <p className="text-[12px] leading-relaxed text-text-secondary">
                  {deal.archived_at ? "📥 " : "⏳ "}{notice}
                </p>
              </div>
            );
          })()}

          {/* Reopening resets both clocks. Offered to BOTH sides: the
              recipient reopens because they finally have time, the sender to
              keep a lead alive with someone they know is slow. Neither can
              abuse it — reopening buys attention, not money. */}
          {deal.archived_at && (
            <button
              onClick={async () => {
                setPendingBusy(true);
                await onUnarchive?.(deal.id);
                setPendingBusy(false);
              }}
              disabled={pendingBusy || !onUnarchive}
              className="mt-3 w-full py-2.5 rounded-lg border border-gold-accent/50 text-gold-accent font-mono text-[12px] uppercase tracking-widest hover:bg-gold-accent/10 transition disabled:opacity-50"
            >
              {pendingBusy ? "Working…" : "Reopen — restarts the 30-day clock"}
            </button>
          )}

          <div className="h-px bg-surface-variant my-5" />

          {isRequestSender ? (
            <>
              {/* No countdown, no deadline. Requests do not expire (§40.15) —
                  owners are often genuinely busy and a lead should not be
                  destroyed by a timer. The sender gets a release valve
                  instead. */}
              <p className="text-sm text-text-secondary mb-5">
                Your Connect has been delivered and this request stays open until they
                answer. Connects are spent on sending, and aren&apos;t returned.
              </p>
              <button
                onClick={async () => {
                  setPendingBusy(true);
                  await onWithdrawRequest?.(deal.id);
                  setPendingBusy(false);
                }}
                disabled={pendingBusy || !onWithdrawRequest}
                className="w-full py-3 rounded-lg border border-white/15 text-text-secondary font-mono text-xs uppercase tracking-widest hover:text-on-surface hover:border-white/30 transition disabled:opacity-50"
              >
                {pendingBusy ? "Working…" : "Withdraw this request"}
              </button>
              <p className="text-[12px] text-text-muted mt-2">
                Withdrawing closes the request on both sides. Your Connect is not returned.
              </p>
            </>
          ) : (
            <>
              <p className="text-sm text-text-secondary mb-5">
                Accepting opens the chat for both of you. Declining closes it — they are told,
                and their Connect is not returned. Take the time you need; nothing here
                expires on a short timer.
              </p>
              {/* Stacked on mobile: two side-by-side buttons at 375px put an
                  irreversible Decline a thumb-slip away from Accept. */}
              <div className="flex flex-col sm:flex-row gap-2.5">
                <button
                  onClick={async () => {
                    setPendingBusy(true);
                    await onAcceptRequest?.(deal.id);
                    setPendingBusy(false);
                  }}
                  disabled={pendingBusy}
                  className="flex-1 py-3 rounded-lg bg-gold-accent text-background font-mono text-xs uppercase tracking-widest font-bold hover:bg-gold-bright transition disabled:opacity-50"
                >
                  {pendingBusy ? "Working…" : "Accept"}
                </button>
                <button
                  onClick={async () => {
                    setPendingBusy(true);
                    await onDeclineRequest?.(deal.id);
                    setPendingBusy(false);
                  }}
                  disabled={pendingBusy}
                  className="flex-1 py-3 rounded-lg border border-error/50 text-error font-mono text-xs uppercase tracking-widest hover:bg-error/10 transition disabled:opacity-50"
                >
                  Decline
                </button>
              </div>
            </>
          )}

          {uploadError && (
            <p className="mt-4 text-xs text-error">{uploadError}</p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div
      className="flex flex-col h-full relative"
      data-scoutit-guide="deal-room-negotiation-panel"
      onDragOver={onDragOver}
      onDragEnter={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
    >

      {/* Drag overlay */}
      {isDragging && (
        <div className="absolute inset-0 z-50 bg-background/80 backdrop-blur-sm border-2 border-dashed border-gold-accent flex items-center justify-center pointer-events-none">
          <div className="text-center">
            <div className="text-gold-accent text-4xl mb-2">☁️</div>
            <h3 className="font-headline-editorial text-xl text-gold-accent">Drop file to attach</h3>
            <p className="text-xs text-text-secondary">PDFs, Images, or Videos up to 50MB</p>
          </div>
        </div>
      )}

      {/* Handshake confirmation -- a dismissible banner, not a full-screen
          takeover. The overlay had no close affordance and covered the
          transcript, so on mobile the only escape was leaving the thread.
          Copy corrected too: the chat does NOT close on handshake. */}
      {contactRevealed && (
        <div className="bg-success/10 border-b border-success/30 px-4 py-3 flex items-center gap-3">
          <span className="text-xl shrink-0">🛡️</span>
          <p className="text-xs text-success">
            <strong>Contacts exchanged.</strong> Phone and email are now visible to both of you.
            This conversation stays open.
          </p>
        </div>
      )}

      {/* Handshake Confirmation Modal */}
      {showConfirmHandshake && (
        <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center">
          <div className="bg-surface-alt border border-gold-accent/50 p-6 rounded-lg max-w-sm text-center shadow-[0_0_30px_rgba(232,174,60,0.15)]">
            <div className="text-4xl mb-4">⚠️</div>
            <h3 className="text-xl font-headline-editorial text-gold-accent mb-2">Exchange Contact Info?</h3>
            <p className="text-sm text-text-secondary mb-6">
              This reveals your phone number and email to {deal.other_party}, and theirs to you.
              It takes both sides — nothing is revealed until they agree too. The conversation
              stays open either way.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 justify-center">
              <button
                onClick={() => setShowConfirmHandshake(false)}
                className="px-4 py-2.5 border border-surface-variant text-text-secondary rounded hover:text-white"
              >
                Cancel
              </button>
              <button
                onClick={signHandshake}
                disabled={handshakeBusy}
                data-scoutit-guide="deal-handshake-two-sided-signature"
                className="px-4 py-2.5 bg-gold-accent text-black font-bold rounded hover:bg-gold-bright disabled:opacity-50"
              >
                {handshakeBusy ? "Sending…" : "Offer Handshake"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Secure Connection SVG Line */}
      <div className="w-full h-1 overflow-hidden relative bg-black">
        <motion.div 
          className="absolute inset-0 bg-gradient-to-r from-transparent via-gold-accent to-transparent opacity-50"
          animate={{ x: ["-100%", "100%"] }}
          transition={loadingLineTransition}
        />
        <svg className="absolute inset-0 w-full h-full" preserveAspectRatio="none">
          <line x1="0" y1="2" x2="100%" y2="2" stroke="rgba(232, 174, 60, 0.2)" strokeWidth="1" strokeDasharray="4 4" />
        </svg>
      </div>

      {/* Chat Header */}
      <div className="p-3 sm:p-4 border-b border-surface-variant flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 bg-surface/80 backdrop-blur-md sticky top-0 z-10">
        <div className="min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <h3 className="font-working-title text-md text-on-surface truncate">
              {deal.other_party}
            </h3>
            {/* Was hardcoded "3 Connects Spent" on every deal. The ledger
                spends 1 (see /api/deals/initiate), and 'deals' carries no
                per-deal Connects column at all -- so the only honest options
                were the server's number or nothing. Nothing, until the column
                exists. Inventing a currency figure is the worst outcome. */}
            {Number.isFinite(deal.connects_spent) && (
              <span className="px-2 py-0.5 rounded bg-gold-accent/15 text-gold-accent border border-gold-accent/30 text-[12px] font-mono uppercase tracking-widest whitespace-nowrap">
                {deal.connects_spent} {deal.connects_spent === 1 ? "Connect" : "Connects"} spent
              </span>
            )}
          </div>
          <p className="text-xs text-text-secondary mt-0.5 truncate">
            Inquiry for <strong>{deal.property_title}</strong>
          </p>
        </div>
        {!closed && (
          // Five buttons in a no-wrap row overflowed the viewport at 375px.
          // Wraps now, and scrolls horizontally as a last resort.
          <div className="flex gap-2 items-center flex-wrap sm:flex-nowrap overflow-x-auto -mx-1 px-1 pb-1 sm:pb-0">
            <button
              onClick={() => setShowDealFile(true)}
              className="bg-white/5 text-on-surface border border-white/10 px-3 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-white/10 transition flex items-center gap-1.5 whitespace-nowrap"
              title="Open Private Notes & CRM Timeline"
            >
              <span>📁 Lead File</span>
            </button>

            {contactRevealed ? (
              <span className="px-3 py-2 rounded text-xs font-mono uppercase tracking-widest bg-success/15 text-success border border-success/30 whitespace-nowrap">
                ✓ Contacts exchanged
              </span>
            ) : deal.handshakeState === 'offered' ? (
              <button
                onClick={signHandshake}
                disabled={handshakeBusy}
                className="bg-success text-white px-3.5 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-success/80 transition flex items-center gap-1 disabled:opacity-50 whitespace-nowrap"
                title="Accept Handshake & Reveal Direct Phone / Email"
              >
                <span>{handshakeBusy ? "…" : "✓ Accept Contact Reveal"}</span>
              </button>
            ) : (
              <button
                onClick={() => setShowConfirmHandshake(true)}
                disabled={handshakeBusy}
                className="border border-gold-accent text-gold-accent px-3 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-gold-accent/15 transition flex items-center gap-1.5 disabled:opacity-50 whitespace-nowrap"
                title="Mutually reveal phone number & email with this party"
              >
                <span>📇 Exchange Contacts 🤝</span>
              </button>
            )}

            <button
              onClick={() => setShowBookingModal(true)}
              className="bg-gold-accent text-background px-3 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-gold-bright transition shadow-[0_0_10px_rgba(232,174,60,0.2)] whitespace-nowrap"
            >
              Request Live Viewing
            </button>
            <button
              onClick={() => setShowConfirmClose(true)}
              className="border border-error/50 text-error px-3 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-error/10 transition whitespace-nowrap"
            >
              End Conversation
            </button>
            <button
              onClick={() => setShowStaffModal(true)}
              className="border border-blue-500/40 text-blue-400 px-3 py-2 rounded text-xs font-mono uppercase tracking-widest hover:bg-blue-500/10 transition whitespace-nowrap flex items-center gap-1"
              title="Report Glitch or Request Staff Review"
            >
              <span>🛡️ Staff Support</span>
            </button>
            <button
              onClick={() => setShowConfirmReport(true)}
              className="text-error/70 hover:text-error px-2 py-2 rounded text-xs transition"
              title="Report / Unmatch"
            >
              🚩
            </button>
          </div>
        )}
      </div>

      {/* Pitch Drawer */}
      {deal.pitch_message && (
        <div className="bg-[#1a1a1a] border-b border-surface-variant flex flex-col z-0">
          <button 
            className="w-full flex justify-between items-center px-4 py-2 text-xs font-mono tracking-widest uppercase text-text-secondary hover:text-on-surface hover:bg-white/5 transition"
            onClick={() => setIsPitchExpanded(!isPitchExpanded)}
          >
            <span className="flex items-center gap-2">
              <span className="text-gold-accent">📄</span> Original Pitch Terms
            </span>
            <span>{isPitchExpanded ? '▲' : '▼'}</span>
          </button>
          {isPitchExpanded && (
            <div className="px-6 py-4 border-t border-white/5 text-sm text-text-muted bg-surface animate-[fadeIn_0.2s_ease]">
              <p className="whitespace-pre-wrap font-serif italic border-l-2 border-gold-accent/30 pl-4">{deal.pitch_message}</p>
            </div>
          )}
        </div>
      )}

      {/* Required Legal Disclaimer.
          One retention claim, not four. This screen previously said the chat
          was (a) deleted when closed, (b) archived 7 days, (c) auto-closing in
          14 days, and (d) deleted forever on handshake -- simultaneously.
          Retention now lives in exactly one place: the banner below. */}
      <div className="bg-surface-variant/30 border-b border-surface-variant p-3 text-center">
        <p className="text-xs text-text-muted font-mono">
          <span className="text-gold-accent mr-2">⚠️</span>
          ScoutIt is not a party to any agreement made here.
        </p>
      </div>

      {/* Warnings & Banners */}
      {deal.status === 'accepted' ? (
        <div className="bg-surface border-b border-surface-variant p-6 flex flex-col items-center">
          <div className="max-w-md w-full bg-gradient-to-br from-[#1a1a1a] to-background border border-gold-accent/30 rounded-xl p-6 shadow-[0_10px_40px_rgba(232,174,60,0.05)] flex flex-col items-center animate-[fadeIn_0.5s_ease]">
            <span className="text-3xl mb-3">🛡️</span>
            <span className="font-label-caps text-[12px] tracking-widest uppercase text-success bg-success/10 px-2 py-1 rounded mb-4">Verified Advisor Active</span>
            
            <h3 className="text-2xl font-headline-editorial text-on-surface mb-1">{deal.other_party}</h3>
            {/* deal.other_party_contact has never existed on any deals row or
                API response — the fallback text used to be a fake email/phone
                a user could plausibly try to dial. Honest blank instead: real
                contact details aren't collected yet, so point back at chat. */}
            {deal.other_party_contact?.email || deal.other_party_contact?.phone ? (
              <>
                <p className="text-sm text-text-secondary font-mono mb-4">{deal.other_party_contact?.email}</p>
                {deal.other_party_contact?.phone && (
                  <p className="text-sm text-gold-accent font-data-tabular">{deal.other_party_contact.phone}</p>
                )}
              </>
            ) : (
              <p className="text-sm text-text-secondary">Contact details aren&apos;t shared automatically — coordinate below in chat.</p>
            )}

            <div className="w-full h-px bg-surface-variant my-5"></div>

            <div className="flex flex-wrap gap-2 justify-center w-full">
              {deal.other_party_contact?.phone && (
                <a href={`https://wa.me/${deal.other_party_contact.phone.replace(/[^0-9]/g, '')}`} target="_blank" rel="noreferrer" className="flex-1 min-w-[120px] bg-[#25D366]/20 text-[#25D366] border border-[#25D366]/30 px-3 py-2 rounded text-center text-xs font-working-title hover:bg-[#25D366]/30 transition">
                  WhatsApp
                </a>
              )}
              <button onClick={() => setShowBookingModal(true)} className="flex-1 min-w-[120px] bg-gold-accent/20 text-gold-accent border border-gold-accent/30 px-3 py-2 rounded text-xs font-working-title hover:bg-gold-accent/30 transition">
                Schedule Call
              </button>
              <button className="flex-1 min-w-[120px] bg-surface-variant text-text-secondary border border-white/10 px-3 py-2 rounded text-xs font-working-title hover:text-white transition" onClick={() => alert("Vault access coming soon.")}>
                📂 Open Vault
              </button>
            </div>
          </div>
        </div>
      ) : deal.status === 'reported' ? (
        <div className="bg-error/20 text-error p-4 text-center text-sm font-working-title border-b border-error/30">
          <span className="mr-2">🚩</span> This conversation was reported and permanently closed. Our Trust &amp; Safety team is reviewing the interaction.
        </div>
      ) : closed ? (
        <div className="bg-error/10 text-error p-3 text-center text-xs font-mono tracking-widest uppercase border-b border-error/20">
          This conversation is closed. The history stays here for your records.
        </div>
      ) : daysLeft !== null ? (
        <div className="bg-surface-container-low p-2 text-center text-[12px] uppercase font-mono tracking-widest text-text-secondary border-b border-surface-variant">
          {daysLeft === 0 ? "Closes today" : `Closes in ${daysLeft} ${daysLeft === 1 ? "day" : "days"}`}
        </div>
      ) : null}

      {/* Upload/Send Error Banner */}
      {uploadError && (
        <div className="bg-error/20 border-l-4 border-error p-3 text-xs text-error animate-[fadeIn_0.3s_ease]">
          <strong>Error:</strong> {uploadError}
        </div>
      )}

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-6 space-y-4 custom-scrollbar bg-gradient-to-b from-background to-surface">
        {loading && (
          <p className="text-center text-xs text-text-secondary font-mono uppercase tracking-widest">Loading conversation…</p>
        )}
        {loadError && (
          <p className="text-center text-xs text-error font-mono">{loadError}</p>
        )}
        {!loading && !loadError && messages.map((msg, index) => {
          const isMe = msg.sender === 'me';
          return (
            <motion.div 
              key={msg.id} 
              className={`flex flex-col ${isMe ? 'items-end' : 'items-start'}`}
              initial="initial"
              animate="animate"
              variants={messageVariants}
              transition={messageTransition}
            >
              <div
                className={`max-w-[85%] p-3.5 rounded-xl text-sm shadow-sm ${
                  isMe
                    ? 'bg-gold-accent/90 text-background rounded-tr-sm'
                    : 'bg-surface-variant/80 backdrop-blur-md text-on-surface rounded-tl-sm border border-white/5'
                }`}
              >
                {/* Masked until the handshake is signed. The message is stored
                    and sent intact -- this is a display lens, so the text
                    becomes readable the instant both sides agree, with no
                    backfill or re-fetch. */}
                {renderTextWithLinks(
                  maskContactDetails(msg.body, contactRevealed),
                  { onAcceptViewing: acceptViewing, onRescheduleViewing: rescheduleViewing, onAcceptReschedule: handleAcceptReschedule },
                )}

                {/* Render Attachments */}
                {msg.attachments && msg.attachments.length > 0 && (
                  <div className="mt-2 flex flex-col gap-2">
                    {msg.attachments.map((att, i) => <div key={i}>{renderAttachment(att)}</div>)}
                  </div>
                )}
              </div>
              <span className="text-[12px] text-text-muted mt-1 px-1 font-mono uppercase">
                {new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
              </span>
            </motion.div>
          );
        })}

        {isUploading && (
          <div className="flex flex-col items-end animate-[fadeIn_0.3s_ease]">
            <div className="max-w-[75%] p-3.5 rounded-xl text-sm bg-surface-variant/50 text-text-secondary rounded-tr-sm border border-white/5 flex items-center gap-2">
              <span className="animate-pulse">Uploading file...</span>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Composer Area */}
      <div className="p-3 sm:p-4 border-t border-surface-variant bg-surface/90 backdrop-blur-md relative pb-[max(0.75rem,env(safe-area-inset-bottom))]">
        <form onSubmit={handleSend} className="flex flex-wrap gap-2 items-center">

          <input
            type="file"
            ref={fileInputRef}
            onChange={onFileChange}
            className="hidden"
            accept="image/jpeg,image/png,application/pdf,video/mp4"
          />

          <button
            type="button"
            onClick={async () => {
              try {
                const { token, mockOwnerId } = await resolveAuth();
                const res = await fetch("/api/ai/counter-offer", {
                  method: "POST",
                  headers: { "Content-Type": "application/json", ...authHeaders(token) },
                  body: JSON.stringify({
                    propertyTitle: deal.property_title || "Property",
                    askingPrice: deal.propertyPrice ? `₱ ${deal.propertyPrice.toLocaleString()}` : "asking price",
                    offerType: "lease",
                    mockOwnerId,
                  }),
                });
                const data = await res.json();
                if (data.suggestion) {
                  setInput(data.suggestion);
                }
              } catch (err) {
                console.error("Counter offer generation failed", err);
              }
            }}
            disabled={closed || isSubmitting}
            className="px-3 py-1.5 rounded-full bg-gold-accent/10 border border-gold-accent/40 text-gold-accent hover:bg-gold-accent/20 text-xs font-mono transition disabled:opacity-50 flex items-center gap-1 shrink-0"
            title="Draft RESA-compliant AI Counter-Offer"
          >
            <span>🪄 AI Counter-Offer</span>
          </button>

          <button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            disabled={closed || isUploading}
            className="p-2.5 rounded-full text-text-secondary hover:text-gold-accent hover:bg-gold-accent/10 transition disabled:opacity-50 flex items-center justify-center"
            title="Attach file (Max 10MB Doc/Img, 50MB Video)"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 0 1-8.49-8.49l9.19-9.19a4 4 0 0 1 5.66 5.66l-9.2 9.19a2 2 0 0 1-2.83-2.83l8.49-8.48"/></svg>
          </button>

          <input
            type="text"
            className="order-first w-full sm:order-none sm:w-auto flex-1 min-w-0 bg-surface border border-surface-variant rounded-full px-5 py-2.5 text-base sm:text-sm text-on-surface focus:outline-none focus:border-gold-accent/50 disabled:opacity-50 transition"
            placeholder={closed ? "This chat is closed." : "Type your message or drag a file here..."}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            disabled={closed || isSubmitting}
          />

          <button
            type="submit"
            disabled={closed || isSubmitting || !input.trim()}
            className="ml-auto bg-gold-accent text-background px-6 py-2.5 rounded-full text-sm font-working-title disabled:opacity-50 hover:bg-gold-bright transition shadow-[0_4px_10px_rgba(232,174,60,0.1)]"
          >
            {isSubmitting ? "..." : "Send"}
          </button>
        </form>
      </div>

      {/* ── Structured Conclude / Cancel Deal Room Modal ── */}
      {showConfirmClose && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-[#121216] border border-gold-accent/30 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔒</span>
              <div>
                <h3 className="font-working-title text-lg text-on-surface">Conclude &amp; Close Deal Room</h3>
                <p className="text-xs text-text-secondary">Gracefully close this active transaction channel.</p>
              </div>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-mono uppercase tracking-widest text-gold-accent font-bold">
                Reason for Closing
              </label>
              <select
                value={closeReason}
                onChange={(e) => setCloseReason(e.target.value)}
                className="w-full bg-surface border border-surface-variant rounded-lg p-2.5 text-xs text-on-surface focus:border-gold-accent outline-none"
              >
                <option value="Client selected alternative property">Client selected alternative property</option>
                <option value="Price or commercial terms divergence">Price or commercial terms divergence</option>
                <option value="Listing withdrawn / sold off-platform">Listing withdrawn / sold off-platform</option>
                <option value="Did not proceed after viewing (No-show / Passed)">Did not proceed after viewing (No-show / Passed)</option>
                <option value="Mutual agreement to conclude">Mutual agreement to conclude</option>
                <option value="Other">Other reason</option>
              </select>
            </div>

            <div className="space-y-2">
              <label className="block text-[12px] font-mono uppercase tracking-widest text-text-muted">
                Optional Concluding Note
              </label>
              <input
                type="text"
                value={closeNote}
                onChange={(e) => setCloseNote(e.target.value)}
                placeholder="e.g. Will follow up next quarter..."
                className="w-full bg-surface border border-surface-variant rounded-lg p-2.5 text-xs text-on-surface focus:border-gold-accent outline-none"
              />
            </div>

            <p className="text-[12px] text-text-muted leading-relaxed">
              Closing locks the active composer. All message history, attachments, and timestamps remain accessible in read-only audit mode for both parties.
            </p>

            <div className="flex gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setShowConfirmClose(false)}
                className="flex-1 py-2.5 rounded-lg border border-surface-variant text-xs text-text-secondary hover:text-on-surface transition font-mono uppercase tracking-wider"
              >
                Keep Open
              </button>
              <button
                type="button"
                onClick={handleEndConversation}
                className="flex-1 py-2.5 rounded-lg bg-error/20 text-error border border-error/50 text-xs font-mono uppercase tracking-wider hover:bg-error/30 transition font-bold"
              >
                Conclude Room
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reschedule Viewing Modal ── */}
      {showRescheduleModal && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-[#14141a] border border-amber-500/40 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🔄</span>
              <div>
                <h3 className="font-working-title text-lg text-on-surface">Propose Viewing Reschedule</h3>
                <p className="text-xs text-text-secondary">Propose an updated time slot for this appointment.</p>
              </div>
            </div>

            <form onSubmit={submitReschedule} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-widest text-gold-accent font-bold mb-1">
                    New Date
                  </label>
                  <input
                    type="date"
                    value={rescheduleDate}
                    onChange={(e) => setRescheduleDate(e.target.value)}
                    required
                    className="w-full bg-surface border border-surface-variant rounded-lg p-2 text-xs text-on-surface focus:border-gold-accent outline-none"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-widest text-gold-accent font-bold mb-1">
                    Preferred Time
                  </label>
                  <input
                    type="time"
                    value={rescheduleTime}
                    onChange={(e) => setRescheduleTime(e.target.value)}
                    required
                    className="w-full bg-surface border border-surface-variant rounded-lg p-2 text-xs text-on-surface focus:border-gold-accent outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-mono uppercase tracking-widest text-gold-accent font-bold mb-1">
                  Viewing Format
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {["Physical On-Site", "Virtual Video Tour"].map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setRescheduleMode(m)}
                      className={`py-2 px-3 rounded-lg text-xs font-mono uppercase tracking-wider border transition ${
                        rescheduleMode === m
                          ? "bg-gold-accent/20 border-gold-accent text-gold-accent font-bold"
                          : "bg-surface border-surface-variant text-text-secondary hover:text-on-surface"
                      }`}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-[12px] font-mono uppercase tracking-widest text-text-muted mb-1">
                  Adjustment Reason
                </label>
                <select
                  value={rescheduleReason}
                  onChange={(e) => setRescheduleReason(e.target.value)}
                  className="w-full bg-surface border border-surface-variant rounded-lg p-2 text-xs text-on-surface focus:border-gold-accent outline-none"
                >
                  <option value="Schedule conflict">Schedule conflict</option>
                  <option value="Delayed in transit / traffic">Delayed in transit / traffic</option>
                  <option value="Inclement weather / typhoon advisory">Inclement weather / typhoon advisory</option>
                  <option value="Switched to virtual walkthrough">Switched to virtual walkthrough</option>
                  <option value="Other adjustment">Other adjustment</option>
                </select>
              </div>

              <div className="flex gap-2.5 pt-2">
                <button
                  type="button"
                  onClick={() => setShowRescheduleModal(false)}
                  className="flex-1 py-2.5 rounded-lg border border-surface-variant text-xs text-text-secondary hover:text-on-surface transition font-mono uppercase tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={!rescheduleDate}
                  className="flex-1 py-2.5 rounded-lg bg-amber-500/20 text-amber-400 border border-amber-500/50 text-xs font-mono uppercase tracking-wider hover:bg-amber-500/30 transition font-bold disabled:opacity-40"
                >
                  Send Proposal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── In-Chat Staff Support & Glitch Incident Modal ── */}
      {showStaffModal && (
        <div className="absolute inset-0 bg-background/85 backdrop-blur-md z-[100] flex items-center justify-center p-4 sm:p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-[#101522] border border-blue-500/40 rounded-xl p-5 sm:p-6 max-w-md w-full shadow-2xl space-y-4">
            <div className="flex items-center gap-3">
              <span className="text-2xl">🛡️</span>
              <div>
                <h3 className="font-working-title text-lg text-on-surface">Staff Support &amp; Incident Dispatch</h3>
                <p className="text-xs text-text-secondary">Request assistance from ScoutIt Mission Control operators.</p>
              </div>
            </div>

            {staffSuccess ? (
              <div className="text-center py-6 space-y-2">
                <div className="text-3xl">✅</div>
                <h4 className="font-semibold text-white">Incident Dispatched to Staff</h4>
                <p className="text-xs text-text-secondary">
                  A Mission Control operator has received your telemetry and will inspect this deal room.
                </p>
              </div>
            ) : (
              <form onSubmit={submitStaffSupport} className="space-y-3.5">
                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-widest text-blue-400 font-bold mb-1">
                    Assistance Type
                  </label>
                  <select
                    value={staffCategory}
                    onChange={(e) => setStaffCategory(e.target.value)}
                    className="w-full bg-surface border border-surface-variant rounded-lg p-2 text-xs text-on-surface focus:border-blue-400 outline-none"
                  >
                    <option value="glitch">Technical Glitch / Upload Error</option>
                    <option value="no_show">Client / Broker Viewing No-Show</option>
                    <option value="dispute">Transaction Dispute / Mediation</option>
                    <option value="connects">Connects Wallet Question</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[12px] font-mono uppercase tracking-widest text-text-muted mb-1">
                    Describe the Issue
                  </label>
                  <textarea
                    value={staffMessage}
                    onChange={(e) => setStaffMessage(e.target.value)}
                    placeholder="Provide details so staff can review and fix things..."
                    rows={3}
                    required
                    className="w-full bg-surface border border-surface-variant rounded-lg p-2 text-xs text-on-surface focus:border-blue-400 outline-none"
                  />
                </div>

                <div className="flex gap-2.5 pt-2">
                  <button
                    type="button"
                    onClick={() => setShowStaffModal(false)}
                    className="flex-1 py-2.5 rounded-lg border border-surface-variant text-xs text-text-secondary hover:text-on-surface transition font-mono uppercase tracking-wider"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={staffSubmitting || !staffMessage.trim()}
                    className="flex-1 py-2.5 rounded-lg bg-blue-500/20 text-blue-400 border border-blue-500/50 text-xs font-mono uppercase tracking-wider hover:bg-blue-500/30 transition font-bold disabled:opacity-40"
                  >
                    {staffSubmitting ? "Dispatching..." : "Dispatch to Staff"}
                  </button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {showConfirmReport && (
        <div className="absolute inset-0 bg-background/80 backdrop-blur-sm z-[100] flex items-center justify-center p-6 animate-[fadeIn_0.2s_ease]">
          <div className="bg-surface border border-error/50 rounded-lg p-6 max-w-sm w-full shadow-[0_0_40px_rgba(255,0,0,0.1)]">
            <h3 className="font-working-title text-lg text-error mb-2 flex items-center gap-2">
              <span>🚩</span> Report &amp; Unmatch
            </h3>
            <p className="text-sm text-text-secondary mb-6">
              This will permanently close the chat and flag the user. Connects will be reviewed by our Trust &amp; Safety team. Are you sure?
            </p>
            <div className="flex gap-3 justify-end">
              <button
                onClick={() => setShowConfirmReport(false)}
                className="px-4 py-2 rounded border border-surface-variant text-sm text-text-secondary hover:text-on-surface transition"
              >
                Cancel
              </button>
              <button
                onClick={handleReportConversation}
                className="px-4 py-2 rounded bg-error text-white text-sm font-working-title hover:bg-error/80 transition"
              >
                Report User
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Booking Modal */}
      <BookingModal
        isOpen={showBookingModal}
        onClose={() => setShowBookingModal(false)}
        brokerName={deal.other_party}
        dealId={deal.id}
        onSchedule={(scheduledAt) => {
          sendMessageBody(`[SYSTEM] I have requested a live viewing for: ${new Date(scheduledAt).toLocaleString()}`).catch((err) => {
            setUploadError(sanitizeError(err, "Upload failed. Please try again."));
            setTimeout(() => setUploadError(null), 5000);
          });
          setShowBookingModal(false);
        }}
      />

      {/* Private Notes & CRM Timeline SlideOver */}
      <DealFileSlideOver
        isOpen={showDealFile}
        onClose={() => setShowDealFile(false)}
        deal={deal}
        onDealUpdate={(dealId, updates) => {
          if (deal && deal.id === dealId) {
            Object.assign(deal, updates);
          }
        }}
      />

    </div>
  );
}
