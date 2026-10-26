"use client";

import { useState } from "react";
import StaffReplyModal from "./StaffReplyModal";
import { COMMUNICATION_TEMPLATES } from "@/lib/staffCommunications.mjs";
import { Send } from "lucide-react";

export default function ContactReplyButton({ message }) {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        className="text-xs px-3 py-1.5 rounded-lg bg-gold text-black font-medium hover:bg-gold/90 transition-colors flex items-center gap-1.5"
      >
        <Send className="w-3 h-3" />
        Console Reply
      </button>

      <StaffReplyModal
        isOpen={isOpen}
        onClose={() => setIsOpen(false)}
        defaultRecipient={{
          email: message.email,
          name: message.name,
        }}
        defaultSubject={`Re: ${message.subject || "Your inquiry to ScoutIt"}`}
        targetTable="contact_messages"
        targetId={message.id}
        initialTemplate={COMMUNICATION_TEMPLATES.CONTACT_REPLY}
      />
    </>
  );
}
