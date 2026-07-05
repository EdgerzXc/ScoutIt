"use client";

import { motion, AnimatePresence } from "framer-motion";
import ConnectionPortal from "../connection/ConnectionPortal";
import ServiceConnectionPortal from "../connection/ServiceConnectionPortal";
import "./ProfileContactModal.css"; // We'll put styles here for cleanliness, similar to InquiryModal.css

export default function ProfileContactModal({ isOpen, onClose, profile }) {
  if (!profile) return null;

  const roles = profile.active_roles || [];
  const isBroker = roles.includes("broker");
  const isProvider = roles.includes("provider");
  const providerType = profile.provider_type;

  // Decide which portal to show
  const showBrokerPortal = isBroker;
  // If they are a provider (photographer, researcher, etc.) and not a broker
  const showProviderPortal = isProvider && !isBroker;

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          className="contact-overlay"
          initial={{ opacity: 0, backdropFilter: "blur(0px)" }}
          animate={{ opacity: 1, backdropFilter: "blur(8px)" }}
          exit={{ opacity: 0, backdropFilter: "blur(0px)" }}
          transition={{ duration: 0.4 }}
        >
          <motion.div
            className="contact-modal"
            initial={{ y: 30, scale: 0.95, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 20, scale: 0.95, opacity: 0 }}
            transition={{ type: "spring", stiffness: 300, damping: 30 }}
          >
            <button className="contact-close" onClick={onClose} aria-label="Close">
              ✕
            </button>

            <div className="contact-modal-body">
              {showBrokerPortal ? (
                <ConnectionPortal brokerName={profile.display_name} isModal={true} />
              ) : showProviderPortal ? (
                <ServiceConnectionPortal providerName={profile.display_name} serviceType={providerType || "Provider"} isModal={true} />
              ) : (
                <ConnectionPortal brokerName={profile.display_name} isModal={true} /> // Fallback generic
              )}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
