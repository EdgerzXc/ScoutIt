"use client";

import { useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import useModalDialog from "@/components/ui/useModalDialog";
import ConnectionPortal from "../connection/ConnectionPortal";
import ServiceConnectionPortal from "../connection/ServiceConnectionPortal";
import "./ProfileContactModal.css";

function normalizeProviderRole(providerType, roles = [], fromParam = "") {
  const from = String(fromParam || "").trim().toLowerCase();
  if (from === "photographers" || from === "photographer") return "photographer";
  if (from === "event-planners" || from === "event_planner" || from === "designer") return "designer";
  if (from === "researchers" || from === "researcher") return "researcher";

  const prov = String(providerType || "").trim().toLowerCase();
  if (prov === "photographer") return "photographer";
  if (prov === "event_planner" || prov === "designer") return "designer";
  if (prov === "researcher") return "researcher";

  if (roles.includes("photographer")) return "photographer";
  if (roles.includes("designer")) return "designer";
  if (roles.includes("researcher")) return "researcher";
  return "photographer";
}

function formatServiceLabel(roleKey) {
  if (roleKey === "photographer") return "Spatial Photographer";
  if (roleKey === "designer") return "Event & Concept Designer";
  if (roleKey === "researcher") return "Zoning & Land Researcher";
  return "Layer 4 Professional";
}

export default function ProfileContactModal({ isOpen, onClose, profile }) {
  const dialogRef = useRef(null);
  useModalDialog(dialogRef, { active: isOpen && Boolean(profile), onClose });

  const roles = Array.isArray(profile?.active_roles) ? profile.active_roles : [];
  const isBroker = roles.includes("broker");
  const isProvider =
    roles.includes("provider") ||
    roles.includes("photographer") ||
    roles.includes("designer") ||
    roles.includes("researcher") ||
    Boolean(profile?.provider_type);

  const [selectedPortal, setSelectedPortal] = useState("provider");
  const [urlContext, setUrlContext] = useState({ from: "", forSlug: "", forTitle: "" });

  useEffect(() => {
    if (!isOpen || typeof window === "undefined") return;
    const sp = new URLSearchParams(window.location.search);
    const from = sp.get("from") || "";
    const forSlug = sp.get("for") || "";
    const forTitle = sp.get("title") || "";
    setUrlContext({ from, forSlug, forTitle });

    if (from === "brokers" && isBroker) {
      setSelectedPortal("broker");
    } else if (["photographers", "event-planners", "researchers"].includes(from) && isProvider) {
      setSelectedPortal("provider");
    } else if (isProvider && !isBroker) {
      setSelectedPortal("provider");
    } else if (isBroker && !isProvider) {
      setSelectedPortal("broker");
    } else if (isProvider) {
      setSelectedPortal("provider");
    } else {
      setSelectedPortal("broker");
    }
  }, [isOpen, isBroker, isProvider]);

  if (!profile) return null;

  const resolvedProviderRole = normalizeProviderRole(profile.provider_type, roles, urlContext.from);
  const serviceLabel = formatServiceLabel(resolvedProviderRole);
  const canSwitchPortal = isBroker && isProvider;
  const showProviderPortal = isProvider && (selectedPortal === "provider" || !isBroker);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div 
          className="contact-overlay backdrop-blur-sm"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.2, ease: "easeOut" }}
          onClick={onClose}
        >
          <motion.div 
            ref={dialogRef}
            role="dialog"
            aria-modal="true"
            aria-label={`Contact ${profile.display_name || "Profile"}`}
            className="contact-modal"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
            onClick={(e) => e.stopPropagation()}
          >
            <button className="contact-close" onClick={onClose} aria-label="Close">
              ✕
            </button>

            <div className="contact-modal-body">
              {canSwitchPortal && (
                <div
                  role="group"
                  aria-label="Choose which role you are contacting"
                  className="mb-6 flex flex-wrap items-center gap-2 rounded-xl border border-surface-variant bg-surface-alt/70 p-2"
                >
                  <span className="px-2 font-mono text-xs uppercase tracking-wider text-text-secondary">
                    Connecting for:
                  </span>
                  <button
                    type="button"
                    onClick={() => setSelectedPortal("provider")}
                    aria-pressed={showProviderPortal}
                    className={`min-h-11 rounded-lg px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition ${
                      showProviderPortal
                        ? "bg-gold-accent text-background font-bold"
                        : "border border-surface-variant text-text-secondary hover:text-on-surface"
                    }`}
                  >
                    Needs {serviceLabel}
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedPortal("broker")}
                    aria-pressed={!showProviderPortal}
                    className={`min-h-11 rounded-lg px-3.5 py-2 font-mono text-xs uppercase tracking-wider transition ${
                      !showProviderPortal
                        ? "bg-gold-accent text-background font-bold"
                        : "border border-surface-variant text-text-secondary hover:text-on-surface"
                    }`}
                  >
                    Accredited Broker Mandate
                  </button>
                </div>
              )}

              {showProviderPortal ? (
                <ServiceConnectionPortal
                  providerId={profile.id}
                  providerName={profile.display_name}
                  serviceType={serviceLabel}
                  targetRole={resolvedProviderRole}
                  forSlug={urlContext.forSlug}
                  forTitle={urlContext.forTitle}
                  isModal={true}
                />
              ) : (
                <ConnectionPortal
                  brokerName={profile.display_name}
                  brokerId={profile.id}
                  spaces={profile.spaces || []}
                  isModal={true}
                />
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
