"use client";

import dynamic from "next/dynamic";

const FloatingToolbox = dynamic(() => import("@/components/ui/FloatingToolbox"), { ssr: false });
const FirstVisitWarmer = dynamic(() => import("@/components/layout/FirstVisitWarmer"), { ssr: false });
const WaitlistModal = dynamic(() => import("@/components/waitlist/WaitlistModal"), { ssr: false });

export default function DynamicOverlays() {
  return (
    <>
      <FirstVisitWarmer />
      <FloatingToolbox showTrigger={false} />
      <WaitlistModal />
    </>
  );
}
