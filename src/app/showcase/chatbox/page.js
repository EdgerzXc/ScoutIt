import MockupChatbox from "@/components/chat/MockupChatbox";

export const metadata = {
  title: "Chatbox & Three-State Inbox Mockup · ScoutIt",
  description: "Interactive mockup of ScoutIt's three-state inbox (Waiting, Active, Declined) and Connect spend receipt overlay.",
  robots: { index: false, follow: false },
};

export default function MockupChatboxPage() {
  return <MockupChatbox />;
}
