"use client";

import dynamic from "next/dynamic";

const FloatingToolbox = dynamic(() => import("@/components/ui/FloatingToolbox"), { ssr: false });
const WaitlistModal = dynamic(() => import("@/components/waitlist/WaitlistModal"), { ssr: false });
// Renders the display-settings eye on the 11 pages that do not use Header.
// Self-suppresses wherever a header eye already exists. See §62.
const GlobalDisplayToggle = dynamic(() => import("@/components/layout/GlobalDisplayToggle"), { ssr: false });

export default function DynamicOverlays() {
  return (
    <>
      <FloatingToolbox />
      <GlobalDisplayToggle />
      <WaitlistModal />
    </>
  );
}
